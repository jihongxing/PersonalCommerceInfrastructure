import { createHash } from 'node:crypto';
import type { InstallationSql } from './operations-migration-permissions.js';
import { deploymentRoles } from './production-migration-policy.js';

export async function deploymentFingerprint(connection: InstallationSql): Promise<string> {
  const rows = await connection<{ snapshot: string }[]>`
    WITH schemas AS (
      SELECT oid, nspname, nspowner, nspacl FROM pg_namespace
      WHERE nspname !~ '^pg_' AND nspname <> 'information_schema'
    ), relations AS (
      SELECT c.oid, c.relname, c.relnamespace, c.relowner, c.relkind, c.relpersistence,
        c.relacl, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c JOIN schemas s ON s.oid=c.relnamespace
    ), roles AS (
      SELECT oid, rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin,
        rolreplication, rolbypassrls, rolvaliduntil, rolconfig
      FROM pg_roles WHERE rolname IN ${connection(Object.values(deploymentRoles))}
    )
    SELECT jsonb_build_object(
      'databases', (SELECT jsonb_agg(jsonb_build_array(datname, datdba, datacl, datallowconn) ORDER BY datname)
        FROM pg_database WHERE datname IN (current_database(), 'postgres', 'template0', 'template1')),
      'schemas', (SELECT jsonb_agg(s ORDER BY oid) FROM schemas s),
      'roles', (SELECT jsonb_agg(r ORDER BY oid) FROM roles r),
      'memberships', (SELECT jsonb_agg(m ORDER BY roleid, member, grantor) FROM pg_auth_members m
        WHERE m.roleid IN (SELECT oid FROM roles) OR m.member IN (SELECT oid FROM roles)),
      'defaults', (SELECT jsonb_agg(d ORDER BY oid) FROM pg_default_acl d),
      'settings', (SELECT jsonb_agg(s ORDER BY setdatabase, setrole) FROM pg_db_role_setting s
        WHERE setdatabase IN (0, (SELECT oid FROM pg_database WHERE datname=current_database()))),
      'relations', (SELECT jsonb_agg(r ORDER BY oid) FROM relations r),
      'columns', (SELECT jsonb_agg(jsonb_build_array(a.attrelid, a.attnum, a.attname, a.atttypid, a.atttypmod, a.attnotnull, a.attacl, pg_get_expr(d.adbin, d.adrelid)) ORDER BY a.attrelid,a.attnum)
        FROM pg_attribute a LEFT JOIN pg_attrdef d ON (d.adrelid,d.adnum)=(a.attrelid,a.attnum)
        WHERE a.attnum>0 AND NOT a.attisdropped AND a.attrelid IN (SELECT oid FROM relations)),
      'functions', (SELECT jsonb_agg(jsonb_build_array(p.oid,p.proname,p.pronamespace,p.proowner,p.prosecdef,p.proconfig,p.proacl,md5(p.prosrc),p.probin) ORDER BY p.oid)
        FROM pg_proc p WHERE p.pronamespace IN (SELECT oid FROM schemas)),
      'constraints', (SELECT jsonb_agg(jsonb_build_array(c.oid,c.convalidated,pg_get_constraintdef(c.oid)) ORDER BY c.oid)
        FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM relations)),
      'policies', (SELECT jsonb_agg(p ORDER BY p.oid) FROM pg_policy p
        WHERE p.polrelid IN (SELECT oid FROM relations)),
      'triggers', (SELECT jsonb_agg(jsonb_build_array(t.oid,t.tgenabled,pg_get_triggerdef(t.oid)) ORDER BY t.oid)
        FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM relations)),
      'indexes', (SELECT jsonb_agg(jsonb_build_array(i.indexrelid,i.indisvalid,pg_get_indexdef(i.indexrelid)) ORDER BY i.indexrelid)
        FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM relations)),
      'extensions', (SELECT jsonb_agg(e ORDER BY oid) FROM pg_extension e)
    )::text AS snapshot`;
  return createHash('sha256').update(rows[0]!.snapshot).digest('hex');
}
