CREATE TABLE "checks" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"mode" text NOT NULL,
	"job_title" text,
	"company_name" text,
	"job_text" text NOT NULL,
	"result" json,
	"error_code" text
);
--> statement-breakpoint
CREATE INDEX "device_created_idx" ON "checks" USING btree ("device_id","created_at");