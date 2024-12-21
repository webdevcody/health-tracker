CREATE TABLE "gf_patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"name" text NOT NULL,
	"avatarId" text
);
--> statement-breakpoint
ALTER TABLE "gf_patients" ADD CONSTRAINT "gf_patients_userId_gf_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."gf_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patients_user_id_idx" ON "gf_patients" USING btree ("userId");