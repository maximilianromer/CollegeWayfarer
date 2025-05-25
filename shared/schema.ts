import { pgTable, text, serial, integer, boolean, json, timestamp, varchar, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User onboarding questions and responses
export const onboardingSchema = z.object({
  programs: z.string().optional().default("User skipped this question."),
  academicEnv: z.string().optional().default("User skipped this question."),
  location: z.string().optional().default("User skipped this question."),
  culture: z.string().optional().default("User skipped this question."),
  academicStats: z.string().optional().default("User skipped this question."),
  financialAid: z.string().optional().default("User skipped this question."),
  other: z.string().optional().default("User skipped this question."),
});

export type OnboardingResponses = z.infer<typeof onboardingSchema>;

// Advisor types
export const AdvisorType = {
  SCHOOL_COUNSELOR: "School counselor",
  PRIVATE_COUNSELOR: "Private counselor",
  PARENT: "Parent",
  SIBLING: "Sibling",
  OTHER: "Other"
} as const;

export type AdvisorTypeValue = typeof AdvisorType[keyof typeof AdvisorType];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  profileDescription: text("profile_description"),
  onboarding: json("onboarding").$type<OnboardingResponses>().default({
    programs: "User skipped this question.",
    academicEnv: "User skipped this question.",
    location: "User skipped this question.",
    culture: "User skipped this question.",
    academicStats: "User skipped this question.",
    financialAid: "User skipped this question.",
    other: "User skipped this question."
  }),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  onboarding: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// College status types
export const CollegeStatus = {
  APPLYING: "applying",
  RESEARCHING: "researching",
  NOT_APPLYING: "not_applying"
} as const;

export type CollegeStatusType = typeof CollegeStatus[keyof typeof CollegeStatus];

// Colleges schema
export const colleges = pgTable("colleges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().$type<CollegeStatusType>().default(CollegeStatus.RESEARCHING),
  position: integer("position").notNull(), // For ordering within a status column
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCollegeSchema = createInsertSchema(colleges)
  .omit({
    id: true,
    createdAt: true, 
    updatedAt: true
  })
  .extend({
    position: z.number().optional() // Make position optional
  });

export type InsertCollege = z.infer<typeof insertCollegeSchema>;
export type College = typeof colleges.$inferSelect;

// Chat schemas
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// File attachment schema for chat messages
export const fileAttachmentSchema = z.object({
  filename: z.string(),
  url: z.string(),
  contentType: z.string(),
  size: z.number(),
});

export type FileAttachment = z.infer<typeof fileAttachmentSchema>;

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  content: text("content").notNull(),
  sender: varchar("sender", { length: 10 }).notNull(), // "user" or "ai"
  attachments: json("attachments").$type<FileAttachment[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  useWebSearch: z.boolean().optional().default(false),
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Advisors schema
export const advisors = pgTable("advisors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().$type<AdvisorTypeValue>(),
  shareToken: uuid("share_token").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdvisorSchema = createInsertSchema(advisors)
  .omit({
    id: true,
    shareToken: true, // This will be generated server-side
    createdAt: true,
    updatedAt: true,
  });

export type InsertAdvisor = z.infer<typeof insertAdvisorSchema>;
export type Advisor = typeof advisors.$inferSelect;

// College recommendations schema
export const collegeRecommendations = pgTable("college_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(), // "What it is" section
  reason: text("reason").notNull(), // "Why you might like it" section
  acceptanceRate: real("acceptance_rate"), // As percentage (0-100)
  recommendedBy: text("recommended_by"), // Name of the advisor who recommended it
  advisorNotes: text("advisor_notes"), // Optional notes from the advisor
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCollegeRecommendationSchema = createInsertSchema(collegeRecommendations)
  .omit({
    id: true,
    createdAt: true, 
    updatedAt: true
  });

export type InsertCollegeRecommendation = z.infer<typeof insertCollegeRecommendationSchema>;
export type CollegeRecommendation = typeof collegeRecommendations.$inferSelect;

// Shared Chat Sessions schema - junction table for many-to-many relationship between advisors and chat sessions
export const sharedChatSessions = pgTable("shared_chat_sessions", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id").notNull(),
  sessionId: integer("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSharedChatSessionSchema = createInsertSchema(sharedChatSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertSharedChatSession = z.infer<typeof insertSharedChatSessionSchema>;
export type SharedChatSession = typeof sharedChatSessions.$inferSelect;

// Message feedback schema
export const messageFeedback = pgTable("message_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  messageId: integer("message_id").notNull(),
  messageContent: text("message_content").notNull(),
  isPositive: boolean("is_positive").notNull(), // true for thumbs up, false for thumbs down
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageFeedbackSchema = createInsertSchema(messageFeedback).omit({
  id: true,
  createdAt: true,
});

export type InsertMessageFeedback = z.infer<typeof insertMessageFeedbackSchema>;
export type MessageFeedback = typeof messageFeedback.$inferSelect;
