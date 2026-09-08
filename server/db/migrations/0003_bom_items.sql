CREATE TABLE IF NOT EXISTS "bom_items" (
  "id" text PRIMARY KEY NOT NULL,
  "bom_key" text NOT NULL,
  "line_no" text NOT NULL,
  "quantity" integer DEFAULT 0 NOT NULL,
  "description" text NOT NULL,
  "designators" text DEFAULT '' NOT NULL,
  "package" text DEFAULT '' NOT NULL,
  "value" text DEFAULT '' NOT NULL,
  "manufacturer_part" text DEFAULT '' NOT NULL,
  "manufacturer" text DEFAULT '' NOT NULL,
  "supplier_part" text DEFAULT '' NOT NULL,
  "supplier" text DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS "bom_item_marks" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bom_item_id" text NOT NULL REFERENCES "bom_items"("id") ON DELETE CASCADE,
  "marked_at" text NOT NULL,
  PRIMARY KEY ("user_id", "bom_item_id")
);
CREATE INDEX IF NOT EXISTS "bom_items_bom_key_idx" ON "bom_items" ("bom_key");
