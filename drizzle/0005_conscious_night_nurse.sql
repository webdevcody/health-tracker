CREATE TYPE "public"."entry_type" AS ENUM('medicine', 'temperature');--> statement-breakpoint
CREATE TABLE "gf_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" serial NOT NULL,
	"type" "entry_type" NOT NULL,
	"temperature" integer,
	"medicine" text,
	"recordedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gf_entries" ADD CONSTRAINT "gf_entries_patientId_gf_patients_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."gf_patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_patient_id_idx" ON "gf_entries" USING btree ("patientId");