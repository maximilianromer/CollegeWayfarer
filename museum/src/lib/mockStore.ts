// Museum Mode Mock Store
// Manages all application state in memory for the demo version

import { User, College, ChatSession, ChatMessage, Advisor, CollegeRecommendation, AdvisorType, CollegeStatusType } from "@shared/schema";
import { DEMO_PROFILE_DESCRIPTION, DEMO_ONBOARDING, DEMO_COLLEGES, DEMO_ADVISOR, DEMO_CHAT_SESSIONS, PRERECORDED_RECOMMENDATIONS, getChatResponse } from "./mockData";

// Generate unique IDs
let nextId = 100;
const generateId = () => nextId++;

// In-memory stores
let currentUser: User | null = null;
let colleges: College[] = [];
let chatSessions: ChatSession[] = [];
let chatMessages: ChatMessage[] = [];
let advisors: Advisor[] = [];
let recommendations: CollegeRecommendation[] = [];

// Initialize demo data
export function initializeDemoData() {
  // Create demo user
  currentUser = {
    id: 1,
    username: "demo_user",
    password: "demo_password",
    profileDescription: DEMO_PROFILE_DESCRIPTION,
    onboarding: DEMO_ONBOARDING
  };

  // Create demo colleges
  colleges = DEMO_COLLEGES.map((c, index) => ({
    ...c,
    id: generateId(),
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  // Create demo advisor
  advisors = [{
    ...DEMO_ADVISOR,
    id: generateId(),
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }];

  // Create demo chat sessions
  chatSessions = DEMO_CHAT_SESSIONS.map((s, index) => ({
    ...s,
    id: generateId(),
    userId: 1,
    createdAt: new Date(Date.now() - (index + 1) * 86400000),
    updatedAt: new Date(Date.now() - (index + 1) * 86400000)
  }));

  // Create some demo chat messages
  const session1Id = chatSessions[0].id;
  chatMessages = [
    {
      id: generateId(),
      sessionId: session1Id,
      content: "What colleges would you recommend for me?",
      sender: "user",
      attachments: [],
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      id: generateId(),
      sessionId: session1Id,
      content: getChatResponse("college recommendations"),
      sender: "ai",
      attachments: [],
      createdAt: new Date(Date.now() - 86400000 + 1000)
    }
  ];
}

// User operations
export function getUser(): User | null {
  return currentUser;
}

export function login(username: string, password: string): User {
  // In demo mode, any login works
  if (!currentUser) {
    initializeDemoData();
  }
  currentUser = {
    ...currentUser!,
    username
  };
  return currentUser;
}

export function register(username: string, password: string, onboarding?: any): User {
  currentUser = {
    id: 1,
    username,
    password,
    profileDescription: DEMO_PROFILE_DESCRIPTION,
    onboarding: onboarding || DEMO_ONBOARDING
  };

  // Initialize demo data after registration
  colleges = DEMO_COLLEGES.map((c) => ({
    ...c,
    id: generateId(),
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  advisors = [{
    ...DEMO_ADVISOR,
    id: generateId(),
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }];

  chatSessions = [];
  chatMessages = [];
  recommendations = [];

  return currentUser;
}

export function logout(): void {
  currentUser = null;
  colleges = [];
  chatSessions = [];
  chatMessages = [];
  advisors = [];
  recommendations = [];
}

export function updateUserProfile(profileDescription: string): User {
  if (currentUser) {
    currentUser = { ...currentUser, profileDescription };
  }
  return currentUser!;
}

// College operations
export function getColleges(): College[] {
  return colleges;
}

export function addCollege(name: string, status: CollegeStatusType = "researching"): College {
  const newCollege: College = {
    id: generateId(),
    userId: 1,
    name,
    status,
    position: colleges.filter(c => c.status === status).length + 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  colleges.push(newCollege);
  return newCollege;
}

export function updateCollegeStatus(collegeId: number, status: CollegeStatusType): College | null {
  const college = colleges.find(c => c.id === collegeId);
  if (college) {
    college.status = status;
    college.updatedAt = new Date();
    return college;
  }
  return null;
}

export function deleteCollege(collegeId: number): boolean {
  const index = colleges.findIndex(c => c.id === collegeId);
  if (index !== -1) {
    colleges.splice(index, 1);
    return true;
  }
  return false;
}

// Chat operations
export function getChatSessions(): ChatSession[] {
  return chatSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getChatMessages(sessionId: number): ChatMessage[] {
  return chatMessages.filter(m => m.sessionId === sessionId);
}

export function createChatSession(title: string): ChatSession {
  const newSession: ChatSession = {
    id: generateId(),
    userId: 1,
    title,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  chatSessions.push(newSession);
  return newSession;
}

export function addChatMessage(sessionId: number, content: string, sender: "user" | "ai"): ChatMessage {
  const message: ChatMessage = {
    id: generateId(),
    sessionId,
    content,
    sender,
    attachments: [],
    createdAt: new Date()
  };
  chatMessages.push(message);

  // Update session's updatedAt
  const session = chatSessions.find(s => s.id === sessionId);
  if (session) {
    session.updatedAt = new Date();
  }

  return message;
}

export function updateChatSessionTitle(sessionId: number, title: string): ChatSession | null {
  const session = chatSessions.find(s => s.id === sessionId);
  if (session) {
    session.title = title;
    session.updatedAt = new Date();
    return session;
  }
  return null;
}

export function deleteChatSession(sessionId: number): boolean {
  const index = chatSessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    chatSessions.splice(index, 1);
    chatMessages = chatMessages.filter(m => m.sessionId !== sessionId);
    return true;
  }
  return false;
}

// Advisor operations
export function getAdvisors(): Advisor[] {
  return advisors;
}

export function createAdvisor(name: string, type: string): Advisor {
  const newAdvisor: Advisor = {
    id: generateId(),
    userId: 1,
    name,
    type: type as any,
    shareToken: `demo-${Math.random().toString(36).substring(7)}`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  advisors.push(newAdvisor);
  return newAdvisor;
}

export function updateAdvisorStatus(advisorId: number, isActive: boolean): Advisor | null {
  const advisor = advisors.find(a => a.id === advisorId);
  if (advisor) {
    advisor.isActive = isActive;
    advisor.updatedAt = new Date();
    return advisor;
  }
  return null;
}

export function deleteAdvisor(advisorId: number): boolean {
  const index = advisors.findIndex(a => a.id === advisorId);
  if (index !== -1) {
    advisors.splice(index, 1);
    return true;
  }
  return false;
}

// Recommendation operations
export function getRecommendations(): CollegeRecommendation[] {
  return recommendations;
}

export function generateRecommendations(): CollegeRecommendation[] {
  // Add prerecorded recommendations
  const newRecs = PRERECORDED_RECOMMENDATIONS.map(r => ({
    ...r,
    id: generateId(),
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  recommendations = newRecs;
  return recommendations;
}

export function deleteRecommendation(recommendationId: number): boolean {
  const index = recommendations.findIndex(r => r.id === recommendationId);
  if (index !== -1) {
    recommendations.splice(index, 1);
    return true;
  }
  return false;
}

export function convertRecommendationToCollege(recommendationId: number, status: CollegeStatusType): College | null {
  const recommendation = recommendations.find(r => r.id === recommendationId);
  if (recommendation) {
    const newCollege = addCollege(recommendation.name, status);
    deleteRecommendation(recommendationId);
    return newCollege;
  }
  return null;
}

// Get share URL for advisor
export function getShareUrl(shareToken: string): string {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  return `${baseUrl}/#/shared/${shareToken}`;
}

// Get shared profile data (for advisor view)
export function getSharedProfileData(shareToken: string): {
  advisor: { name: string; type: string; id: number };
  user: Pick<User, "username" | "profileDescription">;
  colleges: College[];
  recommendations: CollegeRecommendation[];
  sharedChatSessions: ChatSession[];
} | null {
  const advisor = advisors.find(a => a.shareToken === shareToken && a.isActive);

  // Always return demo data for the showcase (museum mode)
  if (!advisor || !currentUser || shareToken === "demo-showcase") {
    return {
      advisor: {
        name: DEMO_ADVISOR.name,
        type: DEMO_ADVISOR.type,
        id: 1
      },
      user: {
        username: "Alex",
        profileDescription: DEMO_PROFILE_DESCRIPTION
      },
      colleges: DEMO_COLLEGES.map((c, i) => ({
        ...c,
        id: i + 1,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      recommendations: PRERECORDED_RECOMMENDATIONS.map((r, i) => ({
        ...r,
        id: i + 1,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      sharedChatSessions: DEMO_CHAT_SESSIONS.map((s, i) => ({
        ...s,
        id: i + 1,
        userId: 1,
        createdAt: new Date(Date.now() - (i + 1) * 86400000),
        updatedAt: new Date(Date.now() - (i + 1) * 86400000)
      }))
    };
  }

  return {
    advisor: {
      name: advisor.name,
      type: advisor.type,
      id: advisor.id
    },
    user: {
      username: currentUser.username,
      profileDescription: currentUser.profileDescription
    },
    colleges,
    recommendations,
    sharedChatSessions: chatSessions
  };
}
