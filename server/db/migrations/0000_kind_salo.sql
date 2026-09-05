CREATE TYPE "public"."accent" AS ENUM('amber', 'stone', 'emerald');--> statement-breakpoint
CREATE TYPE "public"."insight_kind" AS ENUM('method', 'insight');--> statement-breakpoint
CREATE TYPE "public"."project_phase" AS ENUM('started', 'exploring');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'in-progress', 'blocked', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."research_stage" AS ENUM('seedling', 'growing', 'mature', 'archived');--> statement-breakpoint
CREATE TYPE "public"."resource_kind" AS ENUM('article', 'video', 'doc', 'repo', 'paper', 'tool', 'note', 'book');--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('unread', 'reading', 'read', 'archived');--> statement-breakpoint
CREATE TYPE "public"."todo_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."todo_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."todo_status" AS ENUM('todo', 'doing', 'done');--> statement-breakpoint
CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text,
	"kind" "insight_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"tags" text[] NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"date" text NOT NULL,
	"note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_key_results" (
	"id" text PRIMARY KEY NOT NULL,
	"objective_id" text NOT NULL,
	"title" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"done_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_objectives" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"status" "project_status" DEFAULT 'planning' NOT NULL,
	"phase" "project_phase" DEFAULT 'exploring' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"start_date" text NOT NULL,
	"local_path" text NOT NULL,
	"repo_url" text,
	"live_url" text,
	"conditions" text[] NOT NULL,
	"bottlenecks" text[] NOT NULL,
	"reference_links" text[] NOT NULL,
	"learning" text[] NOT NULL,
	"tags" text[] NOT NULL,
	"accent" "accent" DEFAULT 'stone' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_note_projects" (
	"research_note_id" text NOT NULL,
	"project_id" text NOT NULL,
	CONSTRAINT "research_note_projects_research_note_id_project_id_pk" PRIMARY KEY("research_note_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "research_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"teaser" text NOT NULL,
	"body" text NOT NULL,
	"stage" "research_stage" DEFAULT 'seedling' NOT NULL,
	"tags" text[] NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"kind" "resource_kind" NOT NULL,
	"project_id" text,
	"url" text,
	"author" text,
	"tags" text[] NOT NULL,
	"summary" text,
	"added_at" text NOT NULL,
	"status" "resource_status" DEFAULT 'unread' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"detail" text,
	"project_id" text,
	"parent_id" text,
	"priority" "todo_priority" DEFAULT 'medium' NOT NULL,
	"difficulty" "todo_difficulty" DEFAULT 'medium' NOT NULL,
	"status" "todo_status" DEFAULT 'todo' NOT NULL,
	"due_date" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_checkins" ADD CONSTRAINT "project_checkins_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_key_results" ADD CONSTRAINT "project_key_results_objective_id_project_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."project_objectives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_objectives" ADD CONSTRAINT "project_objectives_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_note_projects" ADD CONSTRAINT "research_note_projects_research_note_id_research_notes_id_fk" FOREIGN KEY ("research_note_id") REFERENCES "public"."research_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_note_projects" ADD CONSTRAINT "research_note_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_notes" ADD CONSTRAINT "research_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_parent_id_todos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;