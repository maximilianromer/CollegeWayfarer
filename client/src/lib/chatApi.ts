// Chat-related API functions

import { ChatMessage, ChatSession, MessageFeedback } from "@shared/schema";

// Fetch all chat sessions
export const fetchChatSessions = async () => {
  const response = await fetch("/api/chat/sessions");
  
  if (!response.ok) {
    throw new Error("Failed to fetch chat sessions");
  }
  
  return response.json() as Promise<ChatSession[]>;
};

// Fetch messages for a specific chat session
export const fetchChatMessages = async (sessionId: number) => {
  const response = await fetch(`/api/chat/sessions/${sessionId}/messages`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch chat messages");
  }
  
  return response.json() as Promise<ChatMessage[]>;
};

// Create a new chat session
export const createChatSession = async (title?: string) => {
  const response = await fetch("/api/chat/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to create chat session");
  }
  
  return response.json() as Promise<ChatSession>;
};

// Update a chat session title
export const updateChatSessionTitle = async (sessionId: number, title: string) => {
  const response = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to update chat session title");
  }
  
  return response.json() as Promise<ChatSession>;
};

// Delete a chat session and its messages
export const deleteChatSession = async (sessionId: number) => {
  const response = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to delete chat session");
  }
  
  return response.json() as Promise<{ success: boolean }>;
};

// Send a message to a chat session or create a new session if needed
// This is a single request that sends the user message and returns both the user message and AI response
export const sendChatMessage = async (
  sessionId: number | null, 
  content: string, 
  attachments?: { filename: string; url: string; contentType: string; size: number }[],
  shareWithAdvisorIds?: number[],
  useWebSearch?: boolean,
  extendThinking?: boolean
) => {
  let url = sessionId 
    ? `/api/chat/sessions/${sessionId}/messages` 
    : `/api/chat/messages`;  // New endpoint for sessionless messages
  
  console.log(`Sending message to ${sessionId ? `session ${sessionId}` : 'new session'}: ${content}`);
  
  if (attachments && attachments.length > 0) {
    console.log("Submitting attachments:", JSON.stringify(attachments, null, 2));
  }
  
  if (useWebSearch) {
    console.log("Using web search for this message");
  }
  
  // For new chats, we can include the advisorIds to share with
  const payload = sessionId 
    ? { content, attachments, useWebSearch, extendThinking } 
    : { content, attachments, shareWithAdvisorIds, useWebSearch, extendThinking };
    
  console.log("Message payload:", payload);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    console.error("Server error response:", response);
    throw new Error("Failed to send message");
  }
  
  const result = await response.json();
  console.log("Response from server:", result);
  
  // If the response includes sharedAdvisorIds, that means the server successfully
  // shared the chat with the specified advisors
  if (result.sharedAdvisorIds) {
    console.log("Server reports chat shared with advisors:", result.sharedAdvisorIds);
  }
  
  return result;
};

// Submit feedback for a chat message (thumbs up/down)
export const submitMessageFeedback = async (
  messageId: number,
  messageContent: string,
  isPositive: boolean
) => {
  console.log(`Submitting ${isPositive ? 'positive' : 'negative'} feedback for message ${messageId}`);
  
  const response = await fetch('/api/message-feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messageId,
      messageContent,
      isPositive
    }),
  });
  
  if (!response.ok) {
    console.error('Server error response:', response);
    throw new Error('Failed to submit message feedback');
  }
  
  return response.json();
};