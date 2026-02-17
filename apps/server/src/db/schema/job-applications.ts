import { pgTable, text, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const applicationStatusEnum = [
  "applied",           // Initial application sent
  "acknowledged",      // RECRUITMENT_ACK received
  "screening",         // NEXT_STEP - screening/phone call
  "interview",         // NEXT_STEP - interview scheduled
  "technical",         // NEXT_STEP - coding challenge/technical assessment
  "offer",             // NEXT_STEP - offer received
  "rejected",          // DISAPPROVAL
  "withdrawn",         // User withdrew application
] as const;

export const eventTypeEnum = [
  "application_sent",     // User initiated
  "recruitment_ack",      // RECRUITMENT_ACK
  "next_step",            // NEXT_STEP
  "disapproval",          // DISAPPROVAL
] as const;

export const classificationEnum = [
  "RECRUITMENT_ACK",
  "NEXT_STEP", 
  "DISAPPROVAL",
] as const;

// Main job applications table
export const jobApplications = pgTable("job_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  position: text("position").notNull(),
  jobId: text("job_id"), // Optional - not all emails include this
  currentStatus: text("current_status").notNull().$type<typeof applicationStatusEnum[number]>(),
  source: text("source").default("email"), // email, manual, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Timeline of all events/emails received
export const applicationEvents = pgTable("application_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => jobApplications.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull().$type<typeof eventTypeEnum[number]>(),
  classification: text("classification").notNull().$type<typeof classificationEnum[number]>(),
  
  // Email metadata from n8n
  emailId: text("email_id").notNull(),
  threadId: text("thread_id"),
  messageId: text("message_id"),
  subject: text("subject").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  date: text("date").notNull(),
  
  // Classification results
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
  emailId: uuid("email_id")
    .notNull()
    .references(() => applicationEvents.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
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
  event: one(applicationEvents, {
    fields: [ignoredEmails.emailId],
    references: [applicationEvents.id],
  }),
}));
