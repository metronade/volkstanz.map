import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('superadmin', 'admin', 'moderator', 'translator');
  CREATE TYPE "public"."enum_groups_translations_lang" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum_groups_contacts_type" AS ENUM('website', 'facebook', 'instagram', 'youtube', 'mastodon', 'other');
  CREATE TYPE "public"."enum_groups_images_kind" AS ENUM('hero', 'logo', 'team', 'gallery');
  CREATE TYPE "public"."enum_groups_privacy_level" AS ENUM('exact', 'neighborhood', 'city', 'region');
  CREATE TYPE "public"."enum_groups_status" AS ENUM('draft', 'pending', 'published', 'rejected', 'archived');
  CREATE TYPE "public"."enum__groups_v_version_translations_lang" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum__groups_v_version_contacts_type" AS ENUM('website', 'facebook', 'instagram', 'youtube', 'mastodon', 'other');
  CREATE TYPE "public"."enum__groups_v_version_images_kind" AS ENUM('hero', 'logo', 'team', 'gallery');
  CREATE TYPE "public"."enum__groups_v_version_privacy_level" AS ENUM('exact', 'neighborhood', 'city', 'region');
  CREATE TYPE "public"."enum__groups_v_version_status" AS ENUM('draft', 'pending', 'published', 'rejected', 'archived');
  CREATE TYPE "public"."enum_content_translations_lang" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum_content_category" AS ENUM('general', 'legal', 'home', 'submit', 'about', 'group', 'footer', 'nav');
  CREATE TYPE "public"."enum_consent_versions_type" AS ENUM('tos', 'privacy', 'kug', 'branding', 'submission');
  CREATE TYPE "public"."enum_audit_logs_actor_type" AS ENUM('system', 'admin', 'submitter', 'public');
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('login_ok', 'login_fail', 'login_locked', 'create', 'update', 'delete', 'publish', 'reject', 'consent_given', 'export');
  CREATE TYPE "public"."enum_seo_settings_default_locale" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum_media_category" AS ENUM('group', 'logo', 'favicon', 'og', 'misc');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'translator' NOT NULL,
  	"totp_secret" varchar,
  	"totp_enabled" boolean DEFAULT false,
  	"failed_logins" numeric DEFAULT 0,
  	"locked_until" timestamp(3) with time zone,
  	"last_login_at" timestamp(3) with time zone,
  	"last_login_ip" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "groups_translations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"lang" "enum_groups_translations_lang" NOT NULL,
  	"description_md" varchar,
  	"rehearsal_times" varchar
  );
  
  CREATE TABLE "groups_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_groups_contacts_type" NOT NULL,
  	"label" varchar,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "groups_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"asset_id" integer NOT NULL,
  	"kind" "enum_groups_images_kind" DEFAULT 'gallery',
  	"alt_text_de" varchar,
  	"alt_text_en" varchar,
  	"is_primary" boolean DEFAULT false
  );
  
  CREATE TABLE "groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"founded_year" numeric,
  	"email" varchar,
  	"phone" varchar,
  	"city" varchar,
  	"region" varchar,
  	"country" varchar DEFAULT 'DE' NOT NULL,
  	"lat" numeric NOT NULL,
  	"lng" numeric NOT NULL,
  	"privacy_level" "enum_groups_privacy_level" DEFAULT 'neighborhood' NOT NULL,
  	"status" "enum_groups_status" DEFAULT 'pending' NOT NULL,
  	"moderated_by_id" integer,
  	"moderated_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"rejection_reason" varchar,
  	"consent_tos_id" integer NOT NULL,
  	"consent_privacy_id" integer NOT NULL,
  	"consent_kug_id" integer NOT NULL,
  	"consent_branding" boolean DEFAULT false,
  	"submitted_ip_hash" varchar,
  	"submitted_ip_prefix" varchar,
  	"submitted_ua_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_groups_v_version_translations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"lang" "enum__groups_v_version_translations_lang" NOT NULL,
  	"description_md" varchar,
  	"rehearsal_times" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_groups_v_version_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__groups_v_version_contacts_type" NOT NULL,
  	"label" varchar,
  	"value" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_groups_v_version_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"asset_id" integer NOT NULL,
  	"kind" "enum__groups_v_version_images_kind" DEFAULT 'gallery',
  	"alt_text_de" varchar,
  	"alt_text_en" varchar,
  	"is_primary" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_groups_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_founded_year" numeric,
  	"version_email" varchar,
  	"version_phone" varchar,
  	"version_city" varchar,
  	"version_region" varchar,
  	"version_country" varchar DEFAULT 'DE' NOT NULL,
  	"version_lat" numeric NOT NULL,
  	"version_lng" numeric NOT NULL,
  	"version_privacy_level" "enum__groups_v_version_privacy_level" DEFAULT 'neighborhood' NOT NULL,
  	"version_status" "enum__groups_v_version_status" DEFAULT 'pending' NOT NULL,
  	"version_moderated_by_id" integer,
  	"version_moderated_at" timestamp(3) with time zone,
  	"version_published_at" timestamp(3) with time zone,
  	"version_rejection_reason" varchar,
  	"version_consent_tos_id" integer NOT NULL,
  	"version_consent_privacy_id" integer NOT NULL,
  	"version_consent_kug_id" integer NOT NULL,
  	"version_consent_branding" boolean DEFAULT false,
  	"version_submitted_ip_hash" varchar,
  	"version_submitted_ip_prefix" varchar,
  	"version_submitted_ua_hash" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "content_translations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"lang" "enum_content_translations_lang" NOT NULL,
  	"body" jsonb
  );
  
  CREATE TABLE "content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"category" "enum_content_category" DEFAULT 'general',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "consent_versions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_consent_versions_type" NOT NULL,
  	"version" numeric DEFAULT 1 NOT NULL,
  	"body_md_de" varchar NOT NULL,
  	"body_md_en" varchar,
  	"valid_from" timestamp(3) with time zone,
  	"valid_until" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ts" timestamp(3) with time zone NOT NULL,
  	"actor_type" "enum_audit_logs_actor_type" NOT NULL,
  	"actor_id" varchar,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"entity_type" varchar,
  	"entity_id" varchar,
  	"ip_hash" varchar,
  	"ip_prefix" varchar,
  	"ua_hash" varchar,
  	"consent_version_id" varchar,
  	"diff" jsonb,
  	"reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "seo_settings" (
  	"id" numeric PRIMARY KEY NOT NULL,
  	"robots_txt" varchar DEFAULT 'User-agent: *
  Disallow: /admin
  Disallow: /*/admin
  
  Sitemap: /sitemap.xml',
  	"sitemap_include_all" boolean DEFAULT true,
  	"favicon_id" integer,
  	"default_og_image_id" integer,
  	"default_locale" "enum_seo_settings_default_locale" DEFAULT 'de',
  	"site_title_de" varchar DEFAULT 'Volkstanz-Karte',
  	"site_title_en" varchar DEFAULT 'Folk Dance Map',
  	"site_description_de" varchar,
  	"site_description_en" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt_text_de" varchar,
  	"alt_text_en" varchar,
  	"category" "enum_media_category" DEFAULT 'misc',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"groups_id" integer,
  	"content_id" integer,
  	"consent_versions_id" integer,
  	"audit_logs_id" integer,
  	"seo_settings_id" numeric,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "groups_translations" ADD CONSTRAINT "groups_translations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "groups_contacts" ADD CONSTRAINT "groups_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "groups_images" ADD CONSTRAINT "groups_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups_images" ADD CONSTRAINT "groups_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "groups" ADD CONSTRAINT "groups_moderated_by_id_users_id_fk" FOREIGN KEY ("moderated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups" ADD CONSTRAINT "groups_consent_tos_id_consent_versions_id_fk" FOREIGN KEY ("consent_tos_id") REFERENCES "public"."consent_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups" ADD CONSTRAINT "groups_consent_privacy_id_consent_versions_id_fk" FOREIGN KEY ("consent_privacy_id") REFERENCES "public"."consent_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups" ADD CONSTRAINT "groups_consent_kug_id_consent_versions_id_fk" FOREIGN KEY ("consent_kug_id") REFERENCES "public"."consent_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_groups_v_version_translations" ADD CONSTRAINT "_groups_v_version_translations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_groups_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_groups_v_version_contacts" ADD CONSTRAINT "_groups_v_version_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_groups_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_groups_v_version_images" ADD CONSTRAINT "_groups_v_version_images_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_groups_v_version_images" ADD CONSTRAINT "_groups_v_version_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_groups_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_groups_v" ADD CONSTRAINT "_groups_v_parent_id_groups_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_groups_v" ADD CONSTRAINT "_groups_v_version_moderated_by_id_users_id_fk" FOREIGN KEY ("version_moderated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_groups_v" ADD CONSTRAINT "_groups_v_version_consent_tos_id_consent_versions_id_fk" FOREIGN KEY ("version_consent_tos_id") REFERENCES "public"."consent_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_groups_v" ADD CONSTRAINT "_groups_v_version_consent_privacy_id_consent_versions_id_fk" FOREIGN KEY ("version_consent_privacy_id") REFERENCES "public"."consent_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_groups_v" ADD CONSTRAINT "_groups_v_version_consent_kug_id_consent_versions_id_fk" FOREIGN KEY ("version_consent_kug_id") REFERENCES "public"."consent_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "content_translations" ADD CONSTRAINT "content_translations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_groups_fk" FOREIGN KEY ("groups_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consent_versions_fk" FOREIGN KEY ("consent_versions_id") REFERENCES "public"."consent_versions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seo_settings_fk" FOREIGN KEY ("seo_settings_id") REFERENCES "public"."seo_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "groups_translations_order_idx" ON "groups_translations" USING btree ("_order");
  CREATE INDEX "groups_translations_parent_id_idx" ON "groups_translations" USING btree ("_parent_id");
  CREATE INDEX "groups_contacts_order_idx" ON "groups_contacts" USING btree ("_order");
  CREATE INDEX "groups_contacts_parent_id_idx" ON "groups_contacts" USING btree ("_parent_id");
  CREATE INDEX "groups_images_order_idx" ON "groups_images" USING btree ("_order");
  CREATE INDEX "groups_images_parent_id_idx" ON "groups_images" USING btree ("_parent_id");
  CREATE INDEX "groups_images_asset_idx" ON "groups_images" USING btree ("asset_id");
  CREATE UNIQUE INDEX "groups_slug_idx" ON "groups" USING btree ("slug");
  CREATE INDEX "groups_city_idx" ON "groups" USING btree ("city");
  CREATE INDEX "groups_moderated_by_idx" ON "groups" USING btree ("moderated_by_id");
  CREATE INDEX "groups_consent_tos_idx" ON "groups" USING btree ("consent_tos_id");
  CREATE INDEX "groups_consent_privacy_idx" ON "groups" USING btree ("consent_privacy_id");
  CREATE INDEX "groups_consent_kug_idx" ON "groups" USING btree ("consent_kug_id");
  CREATE INDEX "groups_updated_at_idx" ON "groups" USING btree ("updated_at");
  CREATE INDEX "groups_created_at_idx" ON "groups" USING btree ("created_at");
  CREATE INDEX "_groups_v_version_translations_order_idx" ON "_groups_v_version_translations" USING btree ("_order");
  CREATE INDEX "_groups_v_version_translations_parent_id_idx" ON "_groups_v_version_translations" USING btree ("_parent_id");
  CREATE INDEX "_groups_v_version_contacts_order_idx" ON "_groups_v_version_contacts" USING btree ("_order");
  CREATE INDEX "_groups_v_version_contacts_parent_id_idx" ON "_groups_v_version_contacts" USING btree ("_parent_id");
  CREATE INDEX "_groups_v_version_images_order_idx" ON "_groups_v_version_images" USING btree ("_order");
  CREATE INDEX "_groups_v_version_images_parent_id_idx" ON "_groups_v_version_images" USING btree ("_parent_id");
  CREATE INDEX "_groups_v_version_images_asset_idx" ON "_groups_v_version_images" USING btree ("asset_id");
  CREATE INDEX "_groups_v_parent_idx" ON "_groups_v" USING btree ("parent_id");
  CREATE INDEX "_groups_v_version_version_slug_idx" ON "_groups_v" USING btree ("version_slug");
  CREATE INDEX "_groups_v_version_version_city_idx" ON "_groups_v" USING btree ("version_city");
  CREATE INDEX "_groups_v_version_version_moderated_by_idx" ON "_groups_v" USING btree ("version_moderated_by_id");
  CREATE INDEX "_groups_v_version_version_consent_tos_idx" ON "_groups_v" USING btree ("version_consent_tos_id");
  CREATE INDEX "_groups_v_version_version_consent_privacy_idx" ON "_groups_v" USING btree ("version_consent_privacy_id");
  CREATE INDEX "_groups_v_version_version_consent_kug_idx" ON "_groups_v" USING btree ("version_consent_kug_id");
  CREATE INDEX "_groups_v_version_version_updated_at_idx" ON "_groups_v" USING btree ("version_updated_at");
  CREATE INDEX "_groups_v_version_version_created_at_idx" ON "_groups_v" USING btree ("version_created_at");
  CREATE INDEX "_groups_v_created_at_idx" ON "_groups_v" USING btree ("created_at");
  CREATE INDEX "_groups_v_updated_at_idx" ON "_groups_v" USING btree ("updated_at");
  CREATE INDEX "content_translations_order_idx" ON "content_translations" USING btree ("_order");
  CREATE INDEX "content_translations_parent_id_idx" ON "content_translations" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "content_key_idx" ON "content" USING btree ("key");
  CREATE INDEX "content_updated_at_idx" ON "content" USING btree ("updated_at");
  CREATE INDEX "content_created_at_idx" ON "content" USING btree ("created_at");
  CREATE INDEX "consent_versions_updated_at_idx" ON "consent_versions" USING btree ("updated_at");
  CREATE INDEX "consent_versions_created_at_idx" ON "consent_versions" USING btree ("created_at");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "seo_settings_favicon_idx" ON "seo_settings" USING btree ("favicon_id");
  CREATE INDEX "seo_settings_default_og_image_idx" ON "seo_settings" USING btree ("default_og_image_id");
  CREATE INDEX "seo_settings_updated_at_idx" ON "seo_settings" USING btree ("updated_at");
  CREATE INDEX "seo_settings_created_at_idx" ON "seo_settings" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("groups_id");
  CREATE INDEX "payload_locked_documents_rels_content_id_idx" ON "payload_locked_documents_rels" USING btree ("content_id");
  CREATE INDEX "payload_locked_documents_rels_consent_versions_id_idx" ON "payload_locked_documents_rels" USING btree ("consent_versions_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_locked_documents_rels_seo_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("seo_settings_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "groups_translations" CASCADE;
  DROP TABLE "groups_contacts" CASCADE;
  DROP TABLE "groups_images" CASCADE;
  DROP TABLE "groups" CASCADE;
  DROP TABLE "_groups_v_version_translations" CASCADE;
  DROP TABLE "_groups_v_version_contacts" CASCADE;
  DROP TABLE "_groups_v_version_images" CASCADE;
  DROP TABLE "_groups_v" CASCADE;
  DROP TABLE "content_translations" CASCADE;
  DROP TABLE "content" CASCADE;
  DROP TABLE "consent_versions" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "seo_settings" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_groups_translations_lang";
  DROP TYPE "public"."enum_groups_contacts_type";
  DROP TYPE "public"."enum_groups_images_kind";
  DROP TYPE "public"."enum_groups_privacy_level";
  DROP TYPE "public"."enum_groups_status";
  DROP TYPE "public"."enum__groups_v_version_translations_lang";
  DROP TYPE "public"."enum__groups_v_version_contacts_type";
  DROP TYPE "public"."enum__groups_v_version_images_kind";
  DROP TYPE "public"."enum__groups_v_version_privacy_level";
  DROP TYPE "public"."enum__groups_v_version_status";
  DROP TYPE "public"."enum_content_translations_lang";
  DROP TYPE "public"."enum_content_category";
  DROP TYPE "public"."enum_consent_versions_type";
  DROP TYPE "public"."enum_audit_logs_actor_type";
  DROP TYPE "public"."enum_audit_logs_action";
  DROP TYPE "public"."enum_seo_settings_default_locale";
  DROP TYPE "public"."enum_media_category";`)
}
