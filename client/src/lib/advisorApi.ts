import { Advisor, InsertAdvisor, CollegeRecommendation, ChatSession } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Get all advisors for the current user
export async function fetchAdvisors() {
  const response = await apiRequest("GET", "/api/advisors");
  const data = await response.json();
  return data as Advisor[];
}

// Create a new advisor
export async function createAdvisor(advisorData: Omit<InsertAdvisor, "userId">) {
  const response = await apiRequest("POST", "/api/advisors", advisorData);
  const data = await response.json();
  return data as Advisor;
}

// Update advisor active status
export async function updateAdvisorStatus(advisorId: number, isActive: boolean) {
  const response = await apiRequest("PATCH", `/api/advisors/${advisorId}/status`, { isActive });
  const data = await response.json();
  return data as Advisor;
}

// Delete an advisor
export async function deleteAdvisor(advisorId: number) {
  const response = await apiRequest("DELETE", `/api/advisors/${advisorId}`);
  return response;
}

// Get the share URL for an advisor
export function getShareUrl(shareToken: string) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${shareToken}`;
}

// Add a college recommendation as an advisor
export async function addRecommendation(shareToken: string, data: { collegeName: string, advisorNotes?: string }) {
  // Transform the data to match what the server expects
  const requestData = {
    name: data.collegeName,
    advisorNotes: data.advisorNotes
  };
  
  const response = await apiRequest("POST", `/api/shared/${shareToken}/recommendations`, requestData);
  const recommendation = await response.json();
  return recommendation as CollegeRecommendation;
}

// Get shared chat sessions for an advisor
export async function getSharedChatSessions(advisorId: number) {
  try {
    const response = await apiRequest("GET", `/api/advisors/${advisorId}/shared-chats`);
    const data = await response.json();
    
    // Make sure we got back an array of numbers
    if (Array.isArray(data)) {
      return data as number[];
    } else {
      console.warn("Unexpected response format from shared-chats endpoint:", data);
      return [];
    }
  } catch (error: any) {
    // Check if it's an authentication error (401)
    if (error.message && error.message.startsWith('401:')) {
      console.error('Authentication required for getSharedChatSessions');
      return [];
    }
    // If it's a 502 error (Bad Gateway), it's likely an issue with the server
    if (error.message && error.message.startsWith('502:')) {
      console.error('Server communication error in getSharedChatSessions');
      return [];
    }
    console.error("Error fetching shared chat sessions:", error);
    return [];
  }
}

// Share chat sessions with an advisor
export async function shareChatsWithAdvisor(advisorId: number, sessionIds: number[]) {
  try {
    // First, validate input data before sending to server
    if (!advisorId || !Number.isInteger(advisorId) || advisorId <= 0) {
      console.error('Invalid advisorId in shareChatsWithAdvisor:', advisorId);
      return { 
        success: false, 
        sharedSessionIds: [], 
        error: 'Invalid advisor ID. Please try again or contact support.' 
      };
    }
    
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      console.error('Invalid sessionIds in shareChatsWithAdvisor:', sessionIds);
      return { 
        success: false, 
        sharedSessionIds: [], 
        error: 'No sessions selected. Please select at least one chat to share.' 
      };
    }

    console.log('Making API request to share chats:', { advisorId, sessionIds });
    const response = await apiRequest("POST", `/api/advisors/${advisorId}/share-chats`, { sessionIds });
    const data = await response.json();
    console.log('Share chats API response:', data);
    return data as { success: boolean, sharedSessionIds: number[] };
  } catch (error: any) {
    // Check if it's an authentication error (401)
    if (error.message && error.message.includes('401:')) {
      console.error('Authentication error in shareChatsWithAdvisor:', error);
      return { success: false, sharedSessionIds: [], error: 'Authentication required. Please log in and try again.' };
    }
    // If it's a 502 error (Bad Gateway), it's likely an issue with the server
    if (error.message && error.message.includes('502:')) {
      console.error('Server communication error in shareChatsWithAdvisor:', error);
      return { success: false, sharedSessionIds: [], error: 'Server communication error. Please refresh the page and try again.' };
    }
    // Handle other status code errors
    if (error.message && /^\d{3}:/.test(error.message)) {
      const statusCode = error.message.split(':')[0];
      console.error(`Server returned ${statusCode} in shareChatsWithAdvisor:`, error);
      return { 
        success: false, 
        sharedSessionIds: [], 
        error: `Server returned error ${statusCode}. Please try again later.` 
      };
    }
    console.error('Unexpected error in shareChatsWithAdvisor:', error);
    return { success: false, sharedSessionIds: [], error: 'An unexpected error occurred. Please try again.' };
  }
}

// Unshare chat sessions with an advisor
export async function unshareChatsWithAdvisor(advisorId: number, sessionIds: number[]) {
  try {
    // First, validate input data before sending to server
    if (!advisorId || !Number.isInteger(advisorId) || advisorId <= 0) {
      console.error('Invalid advisorId in unshareChatsWithAdvisor:', advisorId);
      return { 
        success: false, 
        error: 'Invalid advisor ID. Please try again or contact support.' 
      };
    }
    
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      console.error('Invalid sessionIds in unshareChatsWithAdvisor:', sessionIds);
      return { 
        success: false, 
        error: 'No sessions selected. Please select at least one chat to unshare.' 
      };
    }

    console.log('Making API request to unshare chats:', { advisorId, sessionIds });
    const response = await apiRequest("POST", `/api/advisors/${advisorId}/unshare-chats`, { sessionIds });
    const data = await response.json();
    console.log('Unshare chats API response:', data);
    return data as { success: boolean, sharedSessionIds: number[] };
  } catch (error: any) {
    // Check if it's an authentication error (401)
    if (error.message && error.message.includes('401:')) {
      console.error('Authentication error in unshareChatsWithAdvisor:', error);
      return { success: false, error: 'Authentication required. Please log in and try again.' };
    }
    // If it's a 502 error (Bad Gateway), it's likely an issue with the server
    if (error.message && error.message.includes('502:')) {
      console.error('Server communication error in unshareChatsWithAdvisor:', error);
      return { success: false, error: 'Server communication error. Please refresh the page and try again.' };
    }
    // Handle other status code errors
    if (error.message && /^\d{3}:/.test(error.message)) {
      const statusCode = error.message.split(':')[0];
      console.error(`Server returned ${statusCode} in unshareChatsWithAdvisor:`, error);
      return { 
        success: false, 
        error: `Server returned error ${statusCode}. Please try again later.` 
      };
    }
    console.error('Unexpected error in unshareChatsWithAdvisor:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}