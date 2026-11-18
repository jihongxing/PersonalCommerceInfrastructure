import type { Sql, TransactionSql } from 'postgres';
import type {
  Membership,
  MembershipApplication,
  MembershipFact,
  MembershipOffering,
  MembershipStore,
  MembershipTransaction,
} from '../../../applications/membership/membership-service.js';

export const membershipIntakeLock = 71017213;

export async function verifyMembershipPersistence(sql: Sql): Promise<void> {
  const [result] = await sql<{ ready: boolean }[]>`
    SELECT bool_and(has_table_privilege(current_user, relation, 'SELECT')
      AND has_table_privilege(current_user, relation, 'INSERT'))
      AND has_column_privilege(current_user, 'public.membership_offerings', 'data', 'UPDATE') AS ready
    FROM unnest(ARRAY['public.membership_offerings'::regclass, 'public.membership_applications'::regclass,
      'public.commercial_memberships'::regclass, 'public.membership_facts'::regclass]) AS tables(relation)`;
  if (!result?.ready) throw new Error('Membership persistence grants are required.');
}

interface DataRow<Data> {
  data: Data;
}

function transactionPort(sql: TransactionSql): MembershipTransaction {
  return {
    async intakeOpen() {
      const [revision] = await sql<{ state: { open?: unknown } }[]>`
        SELECT after_state AS state FROM public.operations_action_audits
        WHERE target_type='commercial_scenario' AND target_id='Membership' AND action='change_scenario_intake'
        ORDER BY id DESC LIMIT 1`;
      return revision?.state.open === true;
    },
    async now() {
      const [time] = await sql<{ epoch_milliseconds: string }[]>`
        SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::text AS epoch_milliseconds`;
      if (!time) throw new Error('Database clock unavailable');
      return new Date(Number(time.epoch_milliseconds)).toISOString();
    },
    async offering(id) {
      const [row] = await sql<
        DataRow<MembershipOffering>[]
      >`SELECT data FROM public.membership_offerings WHERE id=${id}`;
      return row?.data;
    },
    async offerings(providerId) {
      return (
        await sql<
          DataRow<MembershipOffering>[]
        >`SELECT data FROM public.membership_offerings WHERE provider_id=${providerId} ORDER BY id`
      ).map((row) => row.data);
    },
    async saveOffering(offering) {
      await sql`INSERT INTO public.membership_offerings (id, provider_id, data)
        VALUES (${offering.id}, ${offering.providerId}, ${JSON.stringify(offering)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data=excluded.data`;
    },
    async applications(scope) {
      const records =
        'offeringId' in scope
          ? await sql<
              DataRow<MembershipApplication>[]
            >`SELECT data FROM public.membership_applications WHERE offering_id=${scope.offeringId} ORDER BY id`
          : await sql<
              DataRow<MembershipApplication>[]
            >`SELECT data FROM public.membership_applications WHERE account_id=${scope.accountId} ORDER BY id`;
      return records.map((row) => row.data);
    },
    async findApplication(offeringId, accountId) {
      const [row] = await sql<
        DataRow<MembershipApplication>[]
      >`SELECT data FROM public.membership_applications WHERE offering_id=${offeringId} AND account_id=${accountId}`;
      return row?.data;
    },
    async application(id) {
      const [row] = await sql<
        DataRow<MembershipApplication>[]
      >`SELECT data FROM public.membership_applications WHERE id=${id}`;
      return row?.data;
    },
    async addApplication(application) {
      await sql`INSERT INTO public.membership_applications (id, offering_id, account_id, data)
        VALUES (${application.id}, ${application.offeringId}, ${application.accountId}, ${JSON.stringify(application)}::jsonb)`;
    },
    async memberByApplication(applicationId) {
      const [row] = await sql<
        DataRow<Membership>[]
      >`SELECT data FROM public.commercial_memberships WHERE application_id=${applicationId}`;
      return row?.data;
    },
    async membership(id) {
      const [row] = await sql<
        DataRow<Membership>[]
      >`SELECT data FROM public.commercial_memberships WHERE id=${id}`;
      return row?.data;
    },
    async addMembership(membership) {
      await sql`INSERT INTO public.commercial_memberships (id, application_id, data) VALUES
        (${membership.id}, ${membership.applicationId}, ${JSON.stringify(membership)}::jsonb)`;
    },
    async facts(membershipId) {
      return (
        await sql<
          DataRow<MembershipFact>[]
        >`SELECT data FROM public.membership_facts WHERE membership_id=${membershipId} ORDER BY occurred_at, id`
      ).map((row) => row.data);
    },
    async addFact(fact) {
      const reference =
        fact.kind === 'admission'
          ? fact.verificationId
          : fact.kind === 'admission_correction'
            ? fact.admissionId
            : null;
      await sql`INSERT INTO public.membership_facts (id, membership_id, kind, reference_id, occurred_at, data) VALUES
        (${fact.id}, ${fact.membershipId}, ${fact.kind}, ${reference}, ${fact.occurredAt}, ${JSON.stringify(fact)}::jsonb)`;
    },
  };
}

export function createPostgresMembershipStore(sql: Sql): MembershipStore {
  return {
    async transact<Result>(
      work: (transaction: MembershipTransaction) => Promise<Result>,
    ): Promise<Result> {
      const result = await sql.begin('isolation level read committed', async (transaction) => {
        await transaction`SELECT pg_advisory_xact_lock(${membershipIntakeLock}::bigint)`;
        return { value: await work(transactionPort(transaction)) };
      });
      return result.value;
    },
  };
}
