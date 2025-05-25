import { useEffect, useState, FormEvent, useRef } from "react";
import { SendHorizontal, History, PlusCircle, X, Search, Clock, Edit2, Trash2, Brain, Sparkles, ThumbsUp, ThumbsDown, File as FileIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { createChatSession, sendChatMessage, fetchChatSessions, fetchChatMessages, updateChatSessionTitle, deleteChatSession, submitMessageFeedback } from "@/lib/chatApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatSession, FileAttachment } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChatShareControls } from "@/components/ChatShareControls";
import { FileAttachmentButton, AttachmentPreview } from "@/components/FileAttachment";

// Citation interface for web search results
type Citation = {
  title: string;
  uri: string;
  snippet?: string | null;
};

// Basic message type
type Message = {
  id: number;
  content: string;
  sender: "user" | "ai";
  attachments?: FileAttachment[];
  // Citations are now embedded directly in the content
  // We still keep searchQueries for potential debugging or metadata
  searchQueries?: string[] | null;
};

// Memory Update Notification Component
const MemoryUpdateNotification = () => {
  return (
    <div className="mb-4 flex">
      <div className="flex items-center bg-primary/10 border border-primary/30 text-primary rounded-md px-3 py-1.5 text-sm memory-notification">
        <svg 
          viewBox="0 0 24 24" 
          className="h-4 w-4 mr-2 stroke-primary" 
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        Memory updated
      </div>
    </div>
  );
};

import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// No longer need the Citations component as citations are now embedded in the response text

// Simple message component
const ChatMessage = ({ message }: { message: Message }) => {
  const isAI = message.sender === "ai";
  const { toast } = useToast();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<'positive' | 'negative' | null>(null);
  
  // Handle feedback submission
  const handleFeedback = async (isPositive: boolean) => {
    try {
      if (feedbackSubmitted) return; // Prevent multiple submissions
      
      await submitMessageFeedback(
        message.id,
        message.content,
        isPositive
      );
      
      setFeedbackSubmitted(isPositive ? 'positive' : 'negative');
      
      toast({
        title: "Feedback submitted",
        description: `Thank you for your ${isPositive ? 'positive' : 'negative'} feedback!`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className={`${isAI ? "mb-6" : "mb-4"} ${isAI ? "" : "flex justify-end"}`}>
      <div className={`${isAI ? "max-w-[90%] bg-secondary/60 rounded-lg p-4" : "max-w-[80%] bg-primary rounded-lg p-4"}`}>
        {isAI ? (
          <div className="markdown-content text-foreground">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Override styling for specific markdown elements
                a: ({ node, ...props }) => <a className="text-primary hover:underline" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc ml-4 my-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 my-2" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-md font-bold my-2" {...props} />,
                p: ({ node, ...props }) => <p className="my-2" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2" {...props} />,
                code: (props) => {
                  // Check if it's a code block (has children with language class) or inline code
                  const isCodeBlock = 
                    props.node?.properties?.className && 
                    typeof props.node.properties.className === 'object' &&
                    Array.isArray(props.node.properties.className) &&
                    props.node.properties.className.some((cls) => 
                      typeof cls === 'string' && cls.startsWith('language-')
                    );
                  
                  return !isCodeBlock
                    ? <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />
                    : <code className="block bg-muted p-2 rounded text-sm my-2 overflow-x-auto" {...props} />;
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
            
            {/* No need to display citations separately as they're now embedded in the response text */}
            
            {/* Feedback buttons for AI messages */}
            {isAI && (
              <div className="flex items-center gap-2 mt-4 pt-2 border-t border-primary/10">
                <p className="text-xs text-muted-foreground mr-2">Was this response helpful?</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full p-0 h-8 w-8 ${feedbackSubmitted === 'positive' ? 'bg-green-100 text-green-600' : ''}`}
                        onClick={() => handleFeedback(true)}
                        disabled={feedbackSubmitted !== null}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This was helpful</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full p-0 h-8 w-8 ${feedbackSubmitted === 'negative' ? 'bg-red-100 text-red-600' : ''}`}
                        onClick={() => handleFeedback(false)}
                        disabled={feedbackSubmitted !== null}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This was not helpful</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        ) : (
          <div className="text-primary-foreground whitespace-pre-wrap">
            {message.content}
          </div>
        )}
        
        {/* Display attachments if present */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`mt-2 ${isAI ? "text-foreground" : "text-primary-foreground"}`}>
            <AttachmentPreview attachments={message.attachments} />
          </div>
        )}
      </div>
    </div>
  );
};

// Chat History Dialog Component
function ChatHistoryDialog({
  isOpen,
  onClose,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: number) => void;
  onDeleteSession: (sessionId: number) => void;
  onRenameSession: (sessionId: number, newTitle: string) => void;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format for comparison
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    let groupKey;
    
    if (dateStr === todayStr) {
      groupKey = "Today";
    } else if (dateStr === yesterdayStr) {
      groupKey = "Yesterday";
    } else {
      // Check if date is within the last 7 days
      const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 3600 * 24));
      if (daysDiff < 7) {
        groupKey = "Last 7 Days";
      } else {
        groupKey = "Older";
      }
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);
  
  // Order of groups to display
  const groupOrder = ["Today", "Yesterday", "Last 7 Days", "Older"];
  
  // Load chat sessions
  useEffect(() => {
    if (isOpen) {
      const loadSessions = async () => {
        try {
          setIsLoading(true);
          const data = await fetchChatSessions();
          // Sort by updatedAt in descending order (newest first)
          const sortedSessions = [...data].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setSessions(sortedSessions);
        } catch (error) {
          console.error("Failed to load chat sessions:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadSessions();
    }
  }, [isOpen]);
  
  // Filter sessions based on search query
  const filteredSessions = searchQuery.trim() === "" 
    ? sessions 
    : sessions.filter(session => 
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
  // Format the relative time (e.g., "10 minutes ago", "2 days ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };
  
  // Handle renaming a session
  const handleRename = async (sessionId: number) => {
    if (!editTitle.trim() || editTitle.trim() === "") return;
    
    try {
      await onRenameSession(sessionId, editTitle.trim());
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionId ? { ...session, title: editTitle.trim() } : session
        )
      );
      setIsEditing(null);
      setEditTitle("");
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat History</DialogTitle>
        </DialogHeader>
        
        {/* Search Box */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search chats..." 
            className="pl-9 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Sessions List */}
        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No chats found matching your search" : "No chat history yet"}
            </div>
          ) : (
            searchQuery ? (
              <div className="space-y-2">
                {filteredSessions.map(session => (
                  <div 
                    key={session.id} 
                    className="group flex items-center justify-between p-2 rounded-md hover:bg-card/80 cursor-pointer"
                    onClick={() => {
                      if (isEditing !== session.id) {
                        onSelectSession(session.id);
                        onClose();
                      }
                    }}
                  >
                    {isEditing === session.id ? (
                      <div className="flex-1 flex items-center">
                        <Input 
                          value={editTitle} 
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRename(session.id);
                            } else if (e.key === 'Escape') {
                              setIsEditing(null);
                              setEditTitle("");
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRename(session.id);
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 truncate mr-2">{session.title}</div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditing(session.id);
                              setEditTitle(session.title);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:text-destructive/90" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground ml-2 hidden sm:block">
                          {formatRelativeTime(new Date(session.updatedAt))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {groupOrder.map(group => {
                  const sessionsInGroup = groupedSessions[group];
                  if (!sessionsInGroup || sessionsInGroup.length === 0) return null;
                  
                  return (
                    <div key={group}>
                      <h3 className="text-sm font-semibold mb-2">{group}</h3>
                      <div className="space-y-2">
                        {sessionsInGroup.map(session => (
                          <div 
                            key={session.id} 
                            className="group flex items-center justify-between p-2 rounded-md hover:bg-card/80 cursor-pointer"
                            onClick={() => {
                              if (isEditing !== session.id) {
                                onSelectSession(session.id);
                                onClose();
                              }
                            }}
                          >
                            {isEditing === session.id ? (
                              <div className="flex-1 flex items-center">
                                <Input 
                                  value={editTitle} 
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRename(session.id);
                                    } else if (e.key === 'Escape') {
                                      setIsEditing(null);
                                      setEditTitle("");
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="ml-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRename(session.id);
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 truncate mr-2">{session.title}</div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsEditing(session.id);
                                      setEditTitle(session.title);
                                    }}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-destructive hover:text-destructive/90" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSession(session.id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground ml-2 hidden sm:block">
                                  {formatRelativeTime(new Date(session.updatedAt))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Chat component
export default function ChatTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Basic state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showMemoryUpdate, setShowMemoryUpdate] = useState(false);
  const [advisorsToShareWith, setAdvisorsToShareWith] = useState<number[]>([]);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [extendThinking, setExtendThinking] = useState(false);
  
  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check URL query parameter for automatic message on component mount
  useEffect(() => {
    const checkForMessageParam = () => {
      try {
        // Parse the URL to check for message parameter
        const url = new URL(window.location.href);
        const messageParam = url.searchParams.get('message');
        
        if (messageParam) {
          // If we have a message parameter, decode it and send it
          const decodedMessage = decodeURIComponent(messageParam);
          
          // Clear the parameter from the URL to prevent re-sending on refresh
          setLocation('/dashboard', { replace: true });
          
          // Submit the message automatically WITHOUT setting the input value
          // This way the message gets sent but doesn't remain in the input field
          handleSubmitMessage(decodedMessage);
        }
      } catch (error) {
        console.error("Error processing URL parameters:", error);
      }
    };
    
    checkForMessageParam();
    // Only run this effect once on mount
  }, []);
  
  // Function to handle submitting a message (separated for reuse)
  const handleSubmitMessage = async (message: string) => {
    if (!message.trim() || isLoading) {
      return;
    }
    
    setIsLoading(true);
    
    // Add user message to the UI immediately
    const userMessageObj: Message = {
      id: Date.now(),  // Temporary ID
      content: message,
      sender: "user",
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    
    try {
      // For new chats, include advisor IDs to share with
      // Send the message to the API - it will handle session creation if needed
      let advisorIds = undefined;
      if (!sessionId && advisorsToShareWith && advisorsToShareWith.length > 0) {
        advisorIds = advisorsToShareWith;
      }
      
      const response = await sendChatMessage(
        sessionId, 
        message,
        attachments.length > 0 ? attachments : undefined,
        advisorIds, // Only send advisorIds for new chats
        useWebSearch, // Include web search flag
        extendThinking // Include extend thinking flag for advanced model
      );
      
      // If we didn't have a session ID yet, set it now
      if (!sessionId && response.sessionId) {
        setSessionId(response.sessionId);
        
        // If the response has sharing information, update our state to match
        // This helps maintain sharing status during the transition
        if (response.shared !== undefined && advisorsToShareWith && advisorsToShareWith.length > 0) {
          console.log("New chat was created with shared status:", response.shared);
          console.log("Shared with advisor count:", response.sharedWithCount);
          
          // We don't need to update advisorsToShareWith since our ChatShareControls component
          // will handle this with its own state and effect
        }
      }
      
      // Add AI response to the UI when it comes back
      // Citations are now embedded in the content directly
      const aiMessageObj: Message = {
        id: response.aiMessage.id,
        content: response.aiMessage.content,
        sender: "ai",
        searchQueries: response.searchQueries || null
      };
      
      // Check if profile was updated
      const profileUpdated = response.profileUpdated === true;
      
      // Update the messages array with the real user message ID and add the AI response
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove the temporary user message
        {
          id: response.userMessage.id,
          content: response.userMessage.content,
          sender: "user"
        },
        aiMessageObj
      ]);
      
      // Show memory update notification if profile was updated
      if (profileUpdated) {
        setTimeout(() => {
          setShowMemoryUpdate(true);
          setTimeout(() => {
            setShowMemoryUpdate(false);
          }, 5000);
        }, 500);
      }
    } catch (error) {
      console.error("Chat error:", error);
      
      // Create a more descriptive error message
      let errorMessage = "Failed to send message or receive response";
      
      // If it's a JSON parsing error from the API, provide helpful info
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "API key issue: Please check Gemini API key configuration";
        } else if (error.message.includes("JSON")) {
          errorMessage = "Error processing response";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error: Please check your connection";
        }
      }
      
      // Show a formatted toast message with the error
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Reset web search on error
      setUseWebSearch(false);
      
      // Remove the temporary user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  
  // Reset to a new chat input without creating a session
  const createNewSession = () => {
    setSessionId(null);
    setMessages([]);
    setAttachments([]);
    setInputValue("");
  };
  
  // Load messages for a specific session
  const loadChatSession = async (chatSessionId: number) => {
    try {
      setIsLoading(true);
      const messages = await fetchChatMessages(chatSessionId);
      
      // Transform the messages to our local format
      const formattedMessages: Message[] = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender as "user" | "ai",
        attachments: msg.attachments?.length ? msg.attachments : undefined,
        // Citations are now embedded in the content directly
        searchQueries: (msg.sender === "ai" && (msg as any).searchQueries) ? (msg as any).searchQueries : null
      }));
      
      setSessionId(chatSessionId);
      setMessages(formattedMessages);
      
      // Reset attachments when switching to a different chat
      setAttachments([]);
      setInputValue("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle selecting a session from history
  const handleSelectSession = (chatSessionId: number) => {
    if (chatSessionId === -1) {
      // Create new session
      createNewSession();
    } else {
      // Load existing session
      loadChatSession(chatSessionId);
    }
  };
  
  // Handle deleting a session
  const handleDeleteSession = async (chatSessionId: number) => {
    try {
      setIsLoading(true);
      await deleteChatSession(chatSessionId);
      
      // If the current session was deleted, create a new session
      if (sessionId === chatSessionId) {
        createNewSession();
      }
      
      toast({
        title: "Success",
        description: "Chat session deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle renaming a session
  const handleRenameSession = async (chatSessionId: number, newTitle: string) => {
    try {
      await updateChatSessionTitle(chatSessionId, newTitle);
      
      // If this is the current session and we're renaming it, we don't need to update anything locally
      
      toast({
        title: "Success",
        description: "Chat session renamed successfully."
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename chat session",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Handle sending a message from the form
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) {
      return;
    }
    
    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Use the shared submit message function
    await handleSubmitMessage(userMessage);
    
    // Reset attachments after sending
    setAttachments([]);
  };
  
  // Welcome message component
  const WelcomeMessage = () => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Welcome to CollegeWayfarer!</h2>
      <p className="text-muted-foreground mb-4">
        I'm your AI college counselor. How can I help you today?
      </p>
      <ul className="space-y-2">
        <li className="flex gap-2 text-sm">
          <div className="text-primary">•</div>
          <div>Get college recommendations based on your preferences</div>
        </li>
        <li className="flex gap-2 text-sm">
          <div className="text-primary">•</div>
          <div>Learn about the application process</div>
        </li>
        <li className="flex gap-2 text-sm">
          <div className="text-primary">•</div>
          <div>Find scholarships that match your background</div>
        </li>
      </ul>
    </div>
  );
  
  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Chat Control Buttons */}
      <div className="p-4 flex items-center gap-2 flex-wrap sticky top-0 z-10 bg-background border-b">
        <Button 
          variant="outline" 
          size="sm"
          onClick={createNewSession}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <History className="h-4 w-4" />
          History
        </Button>
        
        {/* Share controls for advisors */}
        <ChatShareControls 
          sessionId={sessionId}
          onNewChatSharingChange={setAdvisorsToShareWith}
        />
      </div>
      
      {/* Chat History Dialog */}
      <ChatHistoryDialog 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
        <div className="max-w-3xl mx-auto">
          {/* Show welcome message if no messages */}
          {messages.length === 0 && <WelcomeMessage />}
          
          {/* Chat messages */}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {/* Memory update notification */}
          {showMemoryUpdate && <MemoryUpdateNotification />}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="animate-fadeIn mb-6">
              <div className="max-w-[90%]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll target */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area - ChatGPT style input */}
      <div className="p-3 md:p-4 border-t sticky bottom-0 z-10 bg-background shadow-md">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex flex-col gap-2">
            {/* Hidden file input for attachments */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const files = Array.from(e.target.files);
                  // Handle file uploads
                  const formData = new FormData();
                  files.forEach(file => formData.append('files', file));
                  
                  fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                  })
                  .then(response => response.json())
                  .then(newFiles => {
                    setAttachments([...attachments, ...newFiles]);
                    // Reset the file input
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  })
                  .catch(error => console.error('Error uploading files:', error));
                }
              }}
              className="hidden"
              multiple
              accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            
            {/* ChatGPT-style input with controls inside */}
            <div className="relative bg-background rounded-2xl border shadow-sm overflow-hidden flex flex-col">
              <Textarea
                placeholder="Ask anything"
                className="min-h-[56px] max-h-[200px] pt-4 pb-14 px-4 resize-none border-0 rounded-none bg-transparent text-base leading-normal"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputValue.trim()) {
                      handleSendMessage(e);
                    }
                  }
                }}
              />
              
              {/* Bottom control bar with buttons - exactly like ChatGPT */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 border-t bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 rounded-full p-0 border border-border/40 flex items-center justify-center bg-transparent"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    type="button"
                    variant={useWebSearch ? "default" : "outline"}
                    size="sm"
                    className={`h-9 px-3 rounded-full flex items-center gap-1.5 border ${useWebSearch ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border/40"}`}
                    onClick={() => setUseWebSearch(!useWebSearch)}
                  >
                    <Search className="h-4 w-4" />
                    <span className="text-sm">Search</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={extendThinking ? "default" : "outline"}
                    size="sm"
                    className={`h-9 px-3 rounded-full flex items-center gap-1.5 border ${extendThinking ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border/40"}`}
                    onClick={() => setExtendThinking(!extendThinking)}
                  >
                    <Brain className="h-4 w-4" />
                    <span className="text-sm">Extend Thinking</span>
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full h-9 w-9 flex items-center justify-center bg-primary text-primary-foreground"
                  disabled={!inputValue.trim() || isLoading}
                >
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Display attachment preview */}
            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((file, index) => {
                  const isImage = file.contentType.startsWith("image/");
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-secondary/80 p-2 pr-1 rounded-md max-w-[300px]"
                    >
                      {isImage ? (
                        <div className="h-8 w-8 overflow-hidden rounded">
                          <img src={file.url} alt={file.filename} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0">
                          <FileIcon className="h-8 w-8" />
                        </div>
                      )}
                      <span className="text-sm flex-1 truncate">{file.filename}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedAttachments = [...attachments];
                          updatedAttachments.splice(index, 1);
                          setAttachments(updatedAttachments);
                        }}
                        className="h-6 w-6 p-0 ml-1"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Disclaimer text */}
            <div className="mt-1 mb-0 text-xs text-muted-foreground text-center">
              CollegeWayfarer uses Google Gemini models. Check important info.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}