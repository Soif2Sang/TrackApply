import { pgTable, text, timestamp, uuid, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const applicationStatusEnum = [
  "applied",      // Initial application sent
  "acknowledged", // Acknowledgment email received
  "screening",    // Phone screen / recruiter call
  "interview",    // Interview scheduled
  "technical",    // Coding challenge / technical assessment
  "offer",        // Offer received
  "rejected",     // Rejected
  "withdrawn",    // User withdrew application
] as const;

// The subset of statuses that an email event can carry.
// "applied" and "withdrawn" are user-initiated and can never come from an email.
export const eventClassificationEnum = [
  "acknowledged",
  "screening",
  "interview",
  "technical",
  "offer",
  "rejected",
] as const;

// Main job applications table
export const jobApplications = pgTable("job_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  position: text("position").notNull(),
  jobId: text("job_id"),
  currentStatus: text("current_status").notNull().$type<typeof applicationStatusEnum[number]>(),
  source: text("source").default("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Timeline of all events/emails received
export const applicationEvents = pgTable("application_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => jobApplications.id, { onDelete: "cascade" }),
  classification: text("classification").notNull().$type<typeof eventClassificationEnum[number]>(),

  // Email metadata
  emailId: text("email_id").notNull(),
  threadId: text("thread_id"),
  messageId: text("message_id"),
  subject: text("subject").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  date: text("date").notNull(),

  // Classification confidence
  confidence: text("confidence"),

  // Raw payload for debugging
  rawPayload: jsonb("raw_payload"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User notes on applications
export const applicationNotes = pgTable("application_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => jobApplications.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email IDs to ignore when processing new emails
export const ignoredEmails = pgTable("ignored_emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  emailId: text("email_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueEmailPerUser: uniqueIndex("ignored_emails_user_email_idx").on(table.userId, table.emailId),
}));

// Relations
export const jobApplicationsRelations = relations(jobApplications, ({ one, many }) => ({
  user: one(user, {
    fields: [jobApplications.userId],
    references: [user.id],
  }),
  events: many(applicationEvents),
  notes: many(applicationNotes),
}));

export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({
  application: one(jobApplications, {
    fields: [applicationEvents.applicationId],
    references: [jobApplications.id],
  }),
}));

export const applicationNotesRelations = relations(applicationNotes, ({ one }) => ({
  application: one(jobApplications, {
    fields: [applicationNotes.applicationId],
    references: [jobApplications.id],
  }),
}));

export const ignoredEmailsRelations = relations(ignoredEmails, ({ one }) => ({
  user: one(user, {
    fields: [ignoredEmails.userId],
    references: [user.id],
  }),
}));