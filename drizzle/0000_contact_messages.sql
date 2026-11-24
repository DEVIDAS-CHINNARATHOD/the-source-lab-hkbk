CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY NOT NULL,
  received_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX contact_messages_email_time ON contact_messages (email, received_at);
