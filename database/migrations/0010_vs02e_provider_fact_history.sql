DROP INDEX "provider_fact_receipts_resource_unique";
--> statement-breakpoint
CREATE INDEX "provider_fact_receipts_resource_sequence_idx" ON "provider_fact_receipts" USING btree ("provider_id","resource_type","internal_reference","sequence");
