import { 
  users, 
  colleges,
  chatSessions, 
  chatMessages,
  advisors,
  collegeRecommendations,
  sharedChatSessions,
  messageFeedback,
  type User, 
  type InsertUser, 
  type OnboardingResponses,
  type College,
  type InsertCollege,
  type CollegeStatusType,
  type InsertChatSession,
  type ChatSession,
  type InsertSharedChatSession,
  type InsertChatMessage,
  type ChatMessage,
  type Advisor,
  type InsertAdvisor,
  type CollegeRecommendation,
  type InsertCollegeRecommendation,
  type InsertMessageFeedback,
  type MessageFeedback
} from "@shared/schema";
import crypto from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, and, sql, asc, inArray } from "drizzle-orm";
import ConnectPgSimple from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PgStore = ConnectPgSimple(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnboarding(userId: number, onboarding: OnboardingResponses): Promise<User | undefined>;
  updateUserProfileDescription(userId: number, profileDescription: string): Promise<User | undefined>;
  
  // College operations
  getColleges(userId: number): Promise<College[]>;
  getCollegesByStatus(userId: number, status: CollegeStatusType): Promise<College[]>;
  createCollege(college: InsertCollege): Promise<College>;
  updateCollegeStatus(collegeId: number, status: CollegeStatusType): Promise<College | undefined>;
  updateCollegePosition(collegeId: number, position: number): Promise<College | undefined>;
  deleteCollege(collegeId: number): Promise<boolean>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSessions(userId: number): Promise<ChatSession[]>;
  getChatSession(sessionId: number): Promise<ChatSession | undefined>;
  updateChatSessionTitle(sessionId: number, title: string): Promise<ChatSession | undefined>;
  deleteChatSession(sessionId: number): Promise<boolean>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: number): Promise<ChatMessage[]>;
  
  // Advisor operations
  getAdvisors(userId: number): Promise<Advisor[]>;
  createAdvisor(advisor: InsertAdvisor): Promise<Advisor>;
  getAdvisorByShareToken(shareToken: string): Promise<Advisor | undefined>;
  updateAdvisorActiveStatus(advisorId: number, isActive: boolean): Promise<Advisor | undefined>;
  deleteAdvisor(advisorId: number): Promise<boolean>;
  
  // Shared Chat operations
  shareChatsWithAdvisor(advisorId: number, sessionIds: number[]): Promise<void>;
  getSharedChatSessions(advisorId: number): Promise<number[]>;
  getSharedChatSessionsForAdvisor(shareToken: string): Promise<ChatSession[]>;
  getSharedChatMessagesForAdvisor(shareToken: string, sessionId: number): Promise<ChatMessage[]>;
  unshareChatsWithAdvisor(advisorId: number, sessionIds: number[]): Promise<void>;
  
  // College recommendation operations
  getCollegeRecommendations(userId: number): Promise<CollegeRecommendation[]>;
  createCollegeRecommendation(recommendation: InsertCollegeRecommendation): Promise<CollegeRecommendation>;
  deleteCollegeRecommendation(recommendationId: number): Promise<boolean>;
  
  // Message feedback operations
  createMessageFeedback(feedback: InsertMessageFeedback): Promise<MessageFeedback>;
  getMessageFeedbackByMessageId(messageId: number): Promise<MessageFeedback[]>;
  
  // Express session store
  sessionStore: session.Store;
}

// PostgreSQL storage implementation
export class PostgresStorage implements IStorage {
  private db;
  sessionStore: session.Store;

  constructor() {
    try {
      // Initialize postgres client
      const queryClient = postgres(process.env.DATABASE_URL!, { 
        max: 10,
        ssl: 'require'
      });
      
      // Initialize drizzle with postgres client
      this.db = drizzle(queryClient);
      
      // Use Postgres for session storage to make sessions persist
      // even when the server restarts
      this.sessionStore = new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: 'session', // Table name for sessions
        createTableIfMissing: true,
        pruneSessionInterval: 24 * 60 * 60 * 1000, // 24 hours
      });
    } catch (error) {
      console.error("Error initializing Postgres client:", error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Create default onboarding data if not provided
    const defaultOnboarding = {
      programs: "User skipped this question.",
      academicEnv: "User skipped this question.",
      location: "User skipped this question.",
      culture: "User skipped this question.",
      academicStats: "User skipped this question.",
      financialAid: "User skipped this question.",
      other: "User skipped this question."
    };
    
    // Ensure onboarding data is included
    const userData = {
      ...insertUser,
      profileDescription: null,
      onboarding: insertUser.onboarding || defaultOnboarding
    };
    
    const result = await this.db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUserOnboarding(userId: number, onboarding: OnboardingResponses): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({ onboarding })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserProfileDescription(userId: number, profileDescription: string): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({ profileDescription })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }
  
  // Chat operations
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const result = await this.db
      .insert(chatSessions)
      .values({
        ...session,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return await this.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
  }
  
  async getChatSession(sessionId: number): Promise<ChatSession | undefined> {
    const result = await this.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    return result[0];
  }
  
  async updateChatSessionTitle(sessionId: number, title: string): Promise<ChatSession | undefined> {
    const now = new Date();
    const result = await this.db
      .update(chatSessions)
      .set({ 
        title, 
        updatedAt: now 
      })
      .where(eq(chatSessions.id, sessionId))
      .returning();
    return result[0];
  }
  
  async deleteChatSession(sessionId: number): Promise<boolean> {
    try {
      // First delete all messages for this session
      await this.db
        .delete(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId));
      
      // Then delete the session itself
      const result = await this.db
        .delete(chatSessions)
        .where(eq(chatSessions.id, sessionId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting chat session:", error);
      return false;
    }
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    // Update the session's updatedAt timestamp
    await this.db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, message.sessionId));
    
    // Insert the message
    const result = await this.db
      .insert(chatMessages)
      .values({
        ...message,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    return await this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  // College operations
  async getColleges(userId: number): Promise<College[]> {
    const result = await this.db
      .select()
      .from(colleges)
      .where(eq(colleges.userId, userId));
    
    // Sort by status and position
    return result.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status.localeCompare(b.status);
      }
      return a.position - b.position;
    });
  }

  async getCollegesByStatus(userId: number, status: CollegeStatusType): Promise<College[]> {
    const result = await this.db
      .select()
      .from(colleges)
      .where(
        and(
          eq(colleges.userId, userId),
          eq(colleges.status, status)
        )
      );
    
    // Sort by position
    return result.sort((a, b) => a.position - b.position);
  }

  async createCollege(college: InsertCollege): Promise<College> {
    // Use provided position or calculate a new one
    let position = college.position;
    
    // If position isn't provided, calculate it
    if (position === undefined) {
      // Get colleges with the same status and user to find highest position
      const existingColleges = await this.db
        .select()
        .from(colleges)
        .where(
          and(
            eq(colleges.userId, college.userId),
            eq(colleges.status, college.status)
          )
        );
      
      // Find the maximum position
      let nextPosition = 1;
      if (existingColleges.length > 0) {
        const positions = existingColleges.map(c => c.position);
        nextPosition = Math.max(...positions) + 1;
      }
      
      position = nextPosition;
    }
    
    // Insert the new college
    const insertResult = await this.db
      .insert(colleges)
      .values({
        name: college.name,
        userId: college.userId,
        status: college.status,
        position: position,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return insertResult[0];
  }

  async updateCollegeStatus(collegeId: number, status: CollegeStatusType): Promise<College | undefined> {
    // Get the college to update
    const collegeResult = await this.db
      .select()
      .from(colleges)
      .where(eq(colleges.id, collegeId));
    
    if (collegeResult.length === 0) return undefined;
    const college = collegeResult[0];
    
    // Get colleges in the target status to find highest position
    const existingColleges = await this.db
      .select()
      .from(colleges)
      .where(
        and(
          eq(colleges.userId, college.userId),
          eq(colleges.status, status)
        )
      );
    
    // Find the maximum position
    let nextPosition = 1;
    if (existingColleges.length > 0) {
      const positions = existingColleges.map(c => c.position);
      nextPosition = Math.max(...positions) + 1;
    }
    
    // Update the college with new status and position
    const result = await this.db
      .update(colleges)
      .set({ 
        status, 
        position: nextPosition,
        updatedAt: new Date() 
      })
      .where(eq(colleges.id, collegeId))
      .returning();
    
    return result[0];
  }

  async updateCollegePosition(collegeId: number, position: number): Promise<College | undefined> {
    const result = await this.db
      .update(colleges)
      .set({ 
        position,
        updatedAt: new Date() 
      })
      .where(eq(colleges.id, collegeId))
      .returning();
    
    return result[0];
  }

  async deleteCollege(collegeId: number): Promise<boolean> {
    try {
      const result = await this.db
        .delete(colleges)
        .where(eq(colleges.id, collegeId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting college:", error);
      return false;
    }
  }

  // Advisor operations
  async getAdvisors(userId: number): Promise<Advisor[]> {
    return this.db
      .select()
      .from(advisors)
      .where(eq(advisors.userId, userId))
      .orderBy(desc(advisors.createdAt));
  }

  async createAdvisor(advisor: InsertAdvisor): Promise<Advisor> {
    const shareToken = crypto.randomUUID();
    
    const result = await this.db
      .insert(advisors)
      .values({
        ...advisor,
        shareToken,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return result[0];
  }

  async getAdvisorByShareToken(shareToken: string): Promise<Advisor | undefined> {
    const result = await this.db
      .select()
      .from(advisors)
      .where(eq(advisors.shareToken, shareToken));
      
    return result[0];
  }

  async updateAdvisorActiveStatus(advisorId: number, isActive: boolean): Promise<Advisor | undefined> {
    const result = await this.db
      .update(advisors)
      .set({ 
        isActive,
        updatedAt: new Date() 
      })
      .where(eq(advisors.id, advisorId))
      .returning();
      
    return result[0];
  }

  async deleteAdvisor(advisorId: number): Promise<boolean> {
    try {
      const result = await this.db
        .delete(advisors)
        .where(eq(advisors.id, advisorId))
        .returning();
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting advisor:", error);
      return false;
    }
  }
  
  // College recommendation operations
  async getCollegeRecommendations(userId: number): Promise<CollegeRecommendation[]> {
    return this.db
      .select()
      .from(collegeRecommendations)
      .where(eq(collegeRecommendations.userId, userId))
      .orderBy(desc(collegeRecommendations.createdAt));
  }
  
  async createCollegeRecommendation(recommendation: InsertCollegeRecommendation): Promise<CollegeRecommendation> {
    const result = await this.db
      .insert(collegeRecommendations)
      .values({
        ...recommendation,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return result[0];
  }
  
  async deleteCollegeRecommendation(recommendationId: number): Promise<boolean> {
    try {
      const result = await this.db
        .delete(collegeRecommendations)
        .where(eq(collegeRecommendations.id, recommendationId))
        .returning();
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting college recommendation:", error);
      return false;
    }
  }
  

  
  // Shared Chat operations
  async shareChatsWithAdvisor(advisorId: number, sessionIds: number[]): Promise<void> {
    try {
      // Get existing shared sessions to avoid duplicates
      const existingSharedSessions = await this.getSharedChatSessions(advisorId);
      const newSessionIds = sessionIds.filter(id => !existingSharedSessions.includes(id));
      
      // Insert new shared chat sessions
      if (newSessionIds.length > 0) {
        const values = newSessionIds.map(sessionId => ({
          advisorId,
          sessionId,
          createdAt: new Date()
        }));
        
        await this.db.insert(sharedChatSessions).values(values);
      }
    } catch (error) {
      console.error("Error sharing chats with advisor:", error);
      throw error;
    }
  }
  
  async getSharedChatSessions(advisorId: number): Promise<number[]> {
    try {
      const result = await this.db
        .select({ sessionId: sharedChatSessions.sessionId })
        .from(sharedChatSessions)
        .where(eq(sharedChatSessions.advisorId, advisorId));
      
      return result.map(row => row.sessionId);
    } catch (error) {
      console.error("Error getting shared chat sessions:", error);
      return [];
    }
  }
  
  async getSharedChatSessionsForAdvisor(shareToken: string): Promise<ChatSession[]> {
    try {
      // Find the advisor by share token
      const advisor = await this.getAdvisorByShareToken(shareToken);
      if (!advisor) {
        return [];
      }
      
      // Get shared chat sessions
      const sharedSessions = await this.db
        .select({ session: chatSessions })
        .from(chatSessions)
        .innerJoin(
          sharedChatSessions,
          eq(chatSessions.id, sharedChatSessions.sessionId)
        )
        .where(eq(sharedChatSessions.advisorId, advisor.id));
      
      return sharedSessions.map(row => row.session);
    } catch (error) {
      console.error("Error getting shared chat sessions for advisor:", error);
      return [];
    }
  }
  
  async getSharedChatMessagesForAdvisor(shareToken: string, sessionId: number): Promise<ChatMessage[]> {
    try {
      // Find the advisor by share token
      const advisor = await this.getAdvisorByShareToken(shareToken);
      if (!advisor) {
        return [];
      }
      
      // Check if this advisor has access to this session
      const sharedSession = await this.db
        .select()
        .from(sharedChatSessions)
        .where(
          and(
            eq(sharedChatSessions.advisorId, advisor.id),
            eq(sharedChatSessions.sessionId, sessionId)
          )
        );
      
      if (sharedSession.length === 0) {
        return [];
      }
      
      // Get messages for this session
      return await this.getChatMessages(sessionId);
    } catch (error) {
      console.error("Error getting shared chat messages for advisor:", error);
      return [];
    }
  }
  
  async unshareChatsWithAdvisor(advisorId: number, sessionIds: number[]): Promise<void> {
    try {
      await this.db
        .delete(sharedChatSessions)
        .where(
          and(
            eq(sharedChatSessions.advisorId, advisorId),
            inArray(sharedChatSessions.sessionId, sessionIds)
          )
        );
    } catch (error) {
      console.error("Error unsharing chats with advisor:", error);
      throw error;
    }
  }
  
  // Message feedback operations
  async createMessageFeedback(feedback: InsertMessageFeedback): Promise<MessageFeedback> {
    try {
      const [result] = await this.db
        .insert(messageFeedback)
        .values(feedback)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating message feedback:", error);
      throw error;
    }
  }
  
  async getMessageFeedbackByMessageId(messageId: number): Promise<MessageFeedback[]> {
    try {
      return await this.db
        .select()
        .from(messageFeedback)
        .where(eq(messageFeedback.messageId, messageId));
    } catch (error) {
      console.error("Error getting message feedback:", error);
      return [];
    }
  }
}

// Fallback to MemStorage if DATABASE_URL is not available (for development/testing)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private colleges: Map<number, College> = new Map();
  private chatSessions: Map<number, ChatSession> = new Map();
  private chatMessages: Map<number, ChatMessage[]> = new Map();
  private sharedChatSessions: Map<number, number[]> = new Map(); // Map advisorId to array of sessionIds
  private chatSessionId: number = 1;
  private chatMessageId: number = 1;
  private collegeId: number = 1;
  currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.chatSessions = new Map();
    this.chatMessages = new Map();
    this.chatSessionId = 1;
    this.chatMessageId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    
    // Create default onboarding data if not provided
    const defaultOnboarding = {
      programs: "User skipped this question.",
      academicEnv: "User skipped this question.",
      location: "User skipped this question.",
      culture: "User skipped this question.",
      academicStats: "User skipped this question.",
      financialAid: "User skipped this question.",
      other: "User skipped this question."
    };
    
    // Create the user with onboarding data
    const user: User = { 
      ...insertUser, 
      id,
      profileDescription: null,
      onboarding: insertUser.onboarding || defaultOnboarding 
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUserOnboarding(userId: number, onboarding: OnboardingResponses): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, onboarding };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserProfileDescription(userId: number, profileDescription: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, profileDescription };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Chat operations with in-memory implementation
  
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const id = this.chatSessionId++;
    const now = new Date();
    
    const newSession: ChatSession = {
      ...session,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.chatSessions.set(id, newSession);
    this.chatMessages.set(id, []); // Initialize empty message array for this session
    
    return newSession;
  }
  
  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getChatSession(sessionId: number): Promise<ChatSession | undefined> {
    return this.chatSessions.get(sessionId);
  }
  
  async updateChatSessionTitle(sessionId: number, title: string): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession: ChatSession = {
      ...session,
      title,
      updatedAt: new Date()
    };
    
    this.chatSessions.set(sessionId, updatedSession);
    return updatedSession;
  }
  
  async deleteChatSession(sessionId: number): Promise<boolean> {
    try {
      // Check if the session exists
      if (!this.chatSessions.has(sessionId)) {
        return false;
      }
      
      // Delete the session messages
      this.chatMessages.delete(sessionId);
      
      // Delete the session
      return this.chatSessions.delete(sessionId);
    } catch (error) {
      console.error("Error deleting chat session:", error);
      return false;
    }
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const now = new Date();
    
    // Update session's updatedAt
    const session = this.chatSessions.get(message.sessionId);
    if (session) {
      this.chatSessions.set(message.sessionId, {
        ...session,
        updatedAt: now
      });
    }
    
    // Create new message
    const newMessage: ChatMessage = {
      ...message,
      id,
      createdAt: now
    };
    
    // Add to message collection for this session
    const sessionMessages = this.chatMessages.get(message.sessionId) || [];
    this.chatMessages.set(message.sessionId, [...sessionMessages, newMessage]);
    
    return newMessage;
  }
  
  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    return this.chatMessages.get(sessionId) || [];
  }
  
  // College operations
  async getColleges(userId: number): Promise<College[]> {
    // Filter colleges by userId and sort by status and position
    return Array.from(this.colleges.values())
      .filter(college => college.userId === userId)
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status.localeCompare(b.status);
        }
        return a.position - b.position;
      });
  }
  
  async getCollegesByStatus(userId: number, status: CollegeStatusType): Promise<College[]> {
    // Filter colleges by userId and status, then sort by position
    return Array.from(this.colleges.values())
      .filter(college => college.userId === userId && college.status === status)
      .sort((a, b) => a.position - b.position);
  }
  
  async createCollege(college: InsertCollege): Promise<College> {
    const id = this.collegeId++;
    const now = new Date();
    
    // Use provided position or calculate a new one
    let position = college.position;
    
    // If position isn't provided, calculate it
    if (position === undefined) {
      // Find max position for this status
      const collegesInStatus = Array.from(this.colleges.values())
        .filter((c: College) => c.userId === college.userId && c.status === college.status);
      
      const maxPosition = collegesInStatus.reduce((max: number, c: College) => Math.max(max, c.position), 0);
      position = maxPosition + 1;
    }
    
    // Create the college
    const newCollege: College = {
      id,
      name: college.name,
      userId: college.userId,
      status: college.status as CollegeStatusType, // Explicit casting to ensure type safety
      position: position,
      createdAt: now,
      updatedAt: now
    };
    
    this.colleges.set(id, newCollege);
    return newCollege;
  }
  
  async updateCollegeStatus(collegeId: number, status: CollegeStatusType): Promise<College | undefined> {
    const college = this.colleges.get(collegeId);
    if (!college) return undefined;
    
    // Find max position for the target status
    const collegesInTargetStatus = Array.from(this.colleges.values())
      .filter((c: College) => c.userId === college.userId && c.status === status);
    
    const maxPosition = collegesInTargetStatus.reduce((max: number, c: College) => Math.max(max, c.position), 0);
    const nextPosition = maxPosition + 1;
    
    // Update the college
    const updatedCollege: College = {
      ...college,
      status,
      position: nextPosition,
      updatedAt: new Date()
    };
    
    this.colleges.set(collegeId, updatedCollege);
    return updatedCollege;
  }
  
  async updateCollegePosition(collegeId: number, position: number): Promise<College | undefined> {
    const college = this.colleges.get(collegeId);
    if (!college) return undefined;
    
    const updatedCollege: College = {
      ...college,
      position,
      updatedAt: new Date()
    };
    
    this.colleges.set(collegeId, updatedCollege);
    return updatedCollege;
  }
  
  async deleteCollege(collegeId: number): Promise<boolean> {
    return this.colleges.delete(collegeId);
  }

  // Advisor operations
  private advisors: Map<number, Advisor> = new Map();
  private advisorId: number = 1;

  async getAdvisors(userId: number): Promise<Advisor[]> {
    return Array.from(this.advisors.values())
      .filter(advisor => advisor.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAdvisor(advisor: InsertAdvisor): Promise<Advisor> {
    const id = this.advisorId++;
    const shareToken = crypto.randomUUID();
    const now = new Date();
    
    const newAdvisor: Advisor = {
      ...advisor,
      id,
      shareToken,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    
    this.advisors.set(id, newAdvisor);
    return newAdvisor;
  }

  async getAdvisorByShareToken(shareToken: string): Promise<Advisor | undefined> {
    return Array.from(this.advisors.values()).find(
      advisor => advisor.shareToken === shareToken && advisor.isActive === true
    );
  }

  async updateAdvisorActiveStatus(advisorId: number, isActive: boolean): Promise<Advisor | undefined> {
    const advisor = this.advisors.get(advisorId);
    if (!advisor) return undefined;
    
    const updatedAdvisor: Advisor = {
      ...advisor,
      isActive,
      updatedAt: new Date()
    };
    
    this.advisors.set(advisorId, updatedAdvisor);
    return updatedAdvisor;
  }

  async deleteAdvisor(advisorId: number): Promise<boolean> {
    return this.advisors.delete(advisorId);
  }
  
  // College recommendation operations
  private collegeRecommendations: Map<number, CollegeRecommendation> = new Map();
  private messageFeedback: Map<number, MessageFeedback> = new Map();
  private recommendationId: number = 1;
  private messageFeedbackId: number = 1;
  
  async getCollegeRecommendations(userId: number): Promise<CollegeRecommendation[]> {
    return Array.from(this.collegeRecommendations.values())
      .filter(recommendation => recommendation.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createCollegeRecommendation(recommendation: InsertCollegeRecommendation): Promise<CollegeRecommendation> {
    const id = this.recommendationId++;
    const now = new Date();
    
    const newRecommendation: CollegeRecommendation = {
      ...recommendation,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.collegeRecommendations.set(id, newRecommendation);
    return newRecommendation;
  }
  
  async deleteCollegeRecommendation(recommendationId: number): Promise<boolean> {
    return this.collegeRecommendations.delete(recommendationId);
  }
  
  // Shared Chat operations
  async shareChatsWithAdvisor(advisorId: number, sessionIds: number[]): Promise<void> {
    // Get current shared sessions for this advisor
    const currentSharedSessions = this.sharedChatSessions.get(advisorId) || [];
    
    // Add new session IDs (avoiding duplicates)
    const newSessionIds = sessionIds.filter(id => !currentSharedSessions.includes(id));
    const updatedSharedSessions = [...currentSharedSessions, ...newSessionIds];
    
    // Update shared sessions map
    this.sharedChatSessions.set(advisorId, updatedSharedSessions);
  }
  
  async shareChatSessionWithAdvisor(advisorId: number, sessionId: number): Promise<void> {
    // Get current shared sessions for this advisor
    const currentSharedSessions = this.sharedChatSessions.get(advisorId) || [];
    
    // If this session is already shared, do nothing
    if (currentSharedSessions.includes(sessionId)) {
      return;
    }
    
    // Add the new session ID
    const updatedSharedSessions = [...currentSharedSessions, sessionId];
    
    // Update shared sessions map
    this.sharedChatSessions.set(advisorId, updatedSharedSessions);
    
    console.log(`Shared chat session ${sessionId} with advisor ${advisorId}`);
  }
  
  async getSharedChatSessions(advisorId: number): Promise<number[]> {
    // Return the list of session IDs shared with this advisor
    return this.sharedChatSessions.get(advisorId) || [];
  }
  
  async getSharedChatSessionsForAdvisor(shareToken: string): Promise<ChatSession[]> {
    // Find the advisor by share token
    const advisor = Array.from(this.advisors.values()).find(
      advisor => advisor.shareToken === shareToken && advisor.isActive === true
    );
    
    if (!advisor) {
      return [];
    }
    
    // Get the list of session IDs shared with this advisor
    const sharedSessionIds = this.sharedChatSessions.get(advisor.id) || [];
    
    // Get the actual chat sessions from the shared session IDs
    const sharedSessions = sharedSessionIds
      .map(id => this.chatSessions.get(id))
      .filter(session => session !== undefined) as ChatSession[];
    
    return sharedSessions;
  }
  
  async getSharedChatMessagesForAdvisor(shareToken: string, sessionId: number): Promise<ChatMessage[]> {
    // Find the advisor by share token
    const advisor = Array.from(this.advisors.values()).find(
      advisor => advisor.shareToken === shareToken && advisor.isActive === true
    );
    
    if (!advisor) {
      return [];
    }
    
    // Check if this session is shared with this advisor
    const sharedSessionIds = this.sharedChatSessions.get(advisor.id) || [];
    if (!sharedSessionIds.includes(sessionId)) {
      return [];
    }
    
    // Return the messages for this session
    return this.chatMessages.get(sessionId) || [];
  }
  
  async unshareChatsWithAdvisor(advisorId: number, sessionIds: number[]): Promise<void> {
    // Get current shared sessions for this advisor
    const currentSharedSessions = this.sharedChatSessions.get(advisorId) || [];
    
    // Remove the specified session IDs
    const updatedSharedSessions = currentSharedSessions.filter(id => !sessionIds.includes(id));
    
    // Update shared sessions map
    this.sharedChatSessions.set(advisorId, updatedSharedSessions);
  }
  
  // Message feedback operations
  async createMessageFeedback(feedback: InsertMessageFeedback): Promise<MessageFeedback> {
    const newFeedback: MessageFeedback = {
      id: this.messageFeedbackId++,
      userId: feedback.userId,
      messageId: feedback.messageId,
      messageContent: feedback.messageContent,
      isPositive: feedback.isPositive,
      createdAt: new Date()
    };
    
    this.messageFeedback.set(newFeedback.id, newFeedback);
    return newFeedback;
  }
  
  async getMessageFeedbackByMessageId(messageId: number): Promise<MessageFeedback[]> {
    return Array.from(this.messageFeedback.values())
      .filter(feedback => feedback.messageId === messageId);
  }
}

// Use PostgreSQL storage if DATABASE_URL is available, otherwise fallback to in-memory
export const storage = process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
