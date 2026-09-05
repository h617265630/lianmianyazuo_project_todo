CREATE TYPE "public"."todo_horizon" AS ENUM('today', 'week', 'month', 'long');--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "horizon" "todo_horizon" DEFAULT 'week' NOT NULL;--> statement-breakpoint
-- 一次性回填：horizon 之后由用户手动选择，这里只是给存量数据一个合理起点。
-- 有 due_date 的按到期距离归档，无 due_date 的保留默认值 'week'。
UPDATE "todos" SET "horizon" = (CASE
  WHEN "due_date"::date <= CURRENT_DATE THEN 'today'
  WHEN "due_date"::date <= CURRENT_DATE + 7 THEN 'week'
  WHEN "due_date"::date <= CURRENT_DATE + 31 THEN 'month'
  ELSE 'long'
END)::"public"."todo_horizon"
WHERE "due_date" ~ '^\d{4}-\d{2}-\d{2}$';
