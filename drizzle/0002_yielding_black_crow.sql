ALTER TABLE "sessions" DROP CONSTRAINT "sessions_session_token_pk";--> statement-breakpoint
ALTER TABLE "sessions" ADD PRIMARY KEY ("session_token");