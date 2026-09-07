CREATE TYPE "public"."relation_kind" AS ENUM('subtask', 'parenttask', 'related', 'blocking', 'blocked');--> statement-breakpoint
CREATE TABLE "buckets" (
	"id" text PRIMARY KEY NOT NULL,
	"project_view_id" text NOT NULL,
	"title" text NOT NULL,
	"limit" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_users" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"permission" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_views" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"view_kind" integer DEFAULT 0 NOT NULL,
	"filter" text,
	"position" integer DEFAULT 0 NOT NULL,
	"bucket_config_mode" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_buckets" (
	"task_id" text NOT NULL,
	"project_view_id" text NOT NULL,
	"bucket_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_positions" (
	"task_id" text NOT NULL,
	"project_view_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_relations" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"other_task_id" text NOT NULL,
	"relation_kind" "relation_kind" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"due_date" text NOT NULL,
	"triggered_at" text
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"is_admin" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"project_id" text NOT NULL,
	"permission" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "parent_project_id" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "percent_done" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "repeat_after" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "repeat_mode" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "start_date" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "hex_color" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_project_view_id_project_views_id_fk" FOREIGN KEY ("project_view_id") REFERENCES "public"."project_views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_views" ADD CONSTRAINT "project_views_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_todos_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_buckets" ADD CONSTRAINT "task_buckets_task_id_todos_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_buckets" ADD CONSTRAINT "task_buckets_project_view_id_project_views_id_fk" FOREIGN KEY ("project_view_id") REFERENCES "public"."project_views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_buckets" ADD CONSTRAINT "task_buckets_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_todos_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_positions" ADD CONSTRAINT "task_positions_task_id_todos_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_positions" ADD CONSTRAINT "task_positions_project_view_id_project_views_id_fk" FOREIGN KEY ("project_view_id") REFERENCES "public"."project_views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_relations" ADD CONSTRAINT "task_relations_task_id_todos_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_relations" ADD CONSTRAINT "task_relations_other_task_id_todos_id_fk" FOREIGN KEY ("other_task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reminders" ADD CONSTRAINT "task_reminders_task_id_todos_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_projects" ADD CONSTRAINT "team_projects_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_projects" ADD CONSTRAINT "team_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_parent_project_id_projects_id_fk" FOREIGN KEY ("parent_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;