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

// User type
export interface User {
  id: number;
  username: string;
  password: string;
  profileDescription: string | null;
  onboarding: OnboardingResponses | null;
}

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  onboarding: onboardingSchema.optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// College status types
export const CollegeStatus = {
  APPLYING: "applying",
  RESEARCHING: "researching",
  NOT_APPLYING: "not_applying"
} as const;

export type CollegeStatusType = typeof CollegeStatus[keyof typeof CollegeStatus];

// College type
export interface College {
  id: number;
  userId: number;
  name: string;
  status: CollegeStatusType;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export const insertCollegeSchema = z.object({
  userId: z.number(),
  name: z.string(),
  status: z.string().optional(),
  position: z.number().optional(),
});

export type InsertCollege = z.infer<typeof insertCollegeSchema>;

// Chat session type
export interface ChatSession {
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// File attachment schema for chat messages
export const fileAttachmentSchema = z.object({
  filename: z.string(),
  url: z.string(),
  contentType: z.string(),
  size: z.number(),
});

export type FileAttachment = z.infer<typeof fileAttachmentSchema>;

// Chat message type
export interface ChatMessage {
  id: number;
  sessionId: number;
  content: string;
  sender: string;
  attachments: FileAttachment[];
  createdAt: Date;
}

export const insertChatSessionSchema = z.object({
  userId: z.number(),
  title: z.string(),
});

export const insertChatMessageSchema = z.object({
  sessionId: z.number(),
  content: z.string(),
  sender: z.string(),
  attachments: z.array(fileAttachmentSchema).optional(),
  useWebSearch: z.boolean().optional().default(false),
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Advisor type
export interface Advisor {
  id: number;
  userId: number;
  name: string;
  type: AdvisorTypeValue;
  shareToken: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const insertAdvisorSchema = z.object({
  userId: z.number(),
  name: z.string(),
  type: z.string(),
  isActive: z.boolean().optional(),
});

export type InsertAdvisor = z.infer<typeof insertAdvisorSchema>;

// College recommendation type
export interface CollegeRecommendation {
  id: number;
  userId: number;
  name: string;
  description: string;
  reason: string;
  acceptanceRate: number | null;
  recommendedBy: string | null;
  advisorNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const insertCollegeRecommendationSchema = z.object({
  userId: z.number(),
  name: z.string(),
  description: z.string(),
  reason: z.string(),
  acceptanceRate: z.number().nullable().optional(),
  recommendedBy: z.string().nullable().optional(),
  advisorNotes: z.string().nullable().optional(),
});

export type InsertCollegeRecommendation = z.infer<typeof insertCollegeRecommendationSchema>;

// Shared chat session type
export interface SharedChatSession {
  id: number;
  advisorId: number;
  sessionId: number;
  createdAt: Date;
}

export const insertSharedChatSessionSchema = z.object({
  advisorId: z.number(),
  sessionId: z.number(),
});

export type InsertSharedChatSession = z.infer<typeof insertSharedChatSessionSchema>;

// Message feedback type
export interface MessageFeedback {
  id: number;
  userId: number;
  messageId: number;
  messageContent: string;
  isPositive: boolean;
  createdAt: Date;
}

export const insertMessageFeedbackSchema = z.object({
  userId: z.number(),
  messageId: z.number(),
  messageContent: z.string(),
  isPositive: z.boolean(),
});

export type InsertMessageFeedback = z.infer<typeof insertMessageFeedbackSchema>;
