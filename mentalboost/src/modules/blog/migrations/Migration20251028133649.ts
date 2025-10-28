import { Migration } from '@mikro-orm/migrations';

export class Migration20251028133649 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "blog_post" ("id" text not null, "title" text not null, "slug" text not null, "excerpt" text null, "content" text not null, "featured_image" text null, "status" text check ("status" in ('draft', 'published', 'archived')) not null default 'draft', "author" text null, "meta_title" text null, "meta_description" text null, "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "blog_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_BLOG_POST_SLUG" ON "blog_post" (slug) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_deleted_at" ON "blog_post" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "blog_post" cascade;`);
  }

}
