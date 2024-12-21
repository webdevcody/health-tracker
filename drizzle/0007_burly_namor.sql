ALTER TABLE "gf_invites" ALTER COLUMN "tokenExpiresAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "gf_entries" ADD COLUMN "wasGiven" boolean DEFAULT false NOT NULL;