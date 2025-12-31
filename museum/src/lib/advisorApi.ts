// Museum Mode Advisor API - Mock Implementation
import { Advisor, InsertAdvisor, CollegeRecommendation } from "@shared/schema";
import * as mockStore from "./mockStore";

// Get all advisors for the current user
export async function fetchAdvisors(): Promise<Advisor[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockStore.getAdvisors();
}

// Create a new advisor
export async function createAdvisor(advisorData: Omit<InsertAdvisor, "userId">): Promise<Advisor> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockStore.createAdvisor(advisorData.name, advisorData.type as string);
}

// Update advisor active status
export async function updateAdvisorStatus(advisorId: number, isActive: boolean): Promise<Advisor> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const advisor = mockStore.updateAdvisorStatus(advisorId, isActive);
  if (!advisor) {
    throw new Error("Advisor not found");
  }
  return advisor;
}

// Delete an advisor
export async function deleteAdvisor(advisorId: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  mockStore.deleteAdvisor(advisorId);
}

// Get the share URL for an advisor (demo mode uses a fixed example)
export function getShareUrl(shareToken: string): string {
  const baseUrl = window.location.origin + (window.location.pathname.includes('/CollegeWayfarer') ? '/CollegeWayfarer' : '');
  // In museum mode, always point to the demo showcase
  return `${baseUrl}/#/shared/demo-showcase`;
}

// Add a college recommendation as an advisor (demo - just logs)
export async function addRecommendation(shareToken: string, data: { collegeName: string, advisorNotes?: string }): Promise<CollegeRecommendation> {
  console.log("Museum mode: Would add recommendation", data);
  await new Promise(resolve => setTimeout(resolve, 200));

  // Return a mock recommendation
  return {
    id: Math.floor(Math.random() * 1000),
    userId: 1,
    name: data.collegeName,
    description: "A great college recommended by your advisor.",
    reason: "Your advisor believes this school would be a good fit for you.",
    acceptanceRate: null,
    recommendedBy: "Advisor",
    advisorNotes: data.advisorNotes || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Get shared chat sessions for an advisor (demo - returns empty)
export async function getSharedChatSessions(advisorId: number): Promise<number[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return [];
}

// Share chat sessions with an advisor (demo - just logs)
export async function shareChatsWithAdvisor(advisorId: number, sessionIds: number[]): Promise<{ success: boolean; sharedSessionIds: number[] }> {
  console.log("Museum mode: Would share chats", { advisorId, sessionIds });
  await new Promise(resolve => setTimeout(resolve, 200));
  return { success: true, sharedSessionIds: sessionIds };
}

// Unshare chat sessions with an advisor (demo - just logs)
export async function unshareChatsWithAdvisor(advisorId: number, sessionIds: number[]): Promise<{ success: boolean }> {
  console.log("Museum mode: Would unshare chats", { advisorId, sessionIds });
  await new Promise(resolve => setTimeout(resolve, 200));
  return { success: true };
}
