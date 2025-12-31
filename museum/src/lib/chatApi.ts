// Museum Mode Chat API - Mock Implementation with Simulated Streaming
import { ChatMessage, ChatSession } from "@shared/schema";
import * as mockStore from "./mockStore";
import { getChatResponse } from "./mockData";

// Fetch all chat sessions
export const fetchChatSessions = async (): Promise<ChatSession[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockStore.getChatSessions();
};

// Fetch messages for a specific chat session
export const fetchChatMessages = async (sessionId: number): Promise<ChatMessage[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockStore.getChatMessages(sessionId);
};

// Create a new chat session
export const createChatSession = async (title?: string): Promise<ChatSession> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockStore.createChatSession(title || "New Chat");
};

// Update a chat session title
export const updateChatSessionTitle = async (sessionId: number, title: string): Promise<ChatSession> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const session = mockStore.updateChatSessionTitle(sessionId, title);
  if (!session) {
    throw new Error("Session not found");
  }
  return session;
};

// Delete a chat session and its messages
export const deleteChatSession = async (sessionId: number): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  mockStore.deleteChatSession(sessionId);
  return { success: true };
};

// Send a message to a chat session or create a new session if needed
// This simulates the AI response with a realistic delay
export const sendChatMessage = async (
  sessionId: number | null,
  content: string,
  attachments?: { filename: string; url: string; contentType: string; size: number }[],
  shareWithAdvisorIds?: number[],
  useWebSearch?: boolean,
  extendThinking?: boolean
): Promise<{
  sessionId: number;
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  profileUpdated?: boolean;
  searchQueries?: string[];
}> => {
  // Create session if needed
  let currentSessionId = sessionId;
  if (!currentSessionId) {
    // Generate title from first few words of content
    const title = content.slice(0, 40) + (content.length > 40 ? "..." : "");
    const session = mockStore.createChatSession(title);
    currentSessionId = session.id;
  }

  // Add user message
  const userMessage = mockStore.addChatMessage(currentSessionId, content, "user");

  // Simulate AI "thinking" time (longer for extended thinking mode)
  const thinkingTime = extendThinking ? 2000 : 1000;
  await new Promise(resolve => setTimeout(resolve, thinkingTime));

  // Get AI response based on user message
  const aiContent = getChatResponse(content);

  // Add AI message
  const aiMessage = mockStore.addChatMessage(currentSessionId, aiContent, "ai");

  return {
    sessionId: currentSessionId,
    userMessage,
    aiMessage,
    profileUpdated: false,
    searchQueries: useWebSearch ? ["simulated search query"] : undefined
  };
};

// Submit feedback for a chat message (just logs in museum mode)
export const submitMessageFeedback = async (
  messageId: number,
  messageContent: string,
  isPositive: boolean
): Promise<{ success: boolean }> => {
  console.log(`Museum mode: Feedback ${isPositive ? 'positive' : 'negative'} for message ${messageId}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  return { success: true };
};
