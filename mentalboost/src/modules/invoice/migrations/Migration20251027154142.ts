import { Migration } from '@mikro-orm/migrations';

export class Migration20251027154142 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "invoice" ("id" text not null, "order_id" text not null, "superfaktura_id" text null, "pdf_url" text null, "status" text check ("status" in ('pending', 'generated', 'failed', 'sent')) not null default 'pending', "error_message" text null, "invoice_data" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_deleted_at" ON "invoice" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "invoice" cascade;`);
  }

}
