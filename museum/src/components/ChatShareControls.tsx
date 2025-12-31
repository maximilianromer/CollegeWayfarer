import { useState, useCallback, useEffect, MouseEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Share2, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { fetchAdvisors, shareChatsWithAdvisor, getSharedChatSessions, unshareChatsWithAdvisor } from "@/lib/advisorApi";
import { useToast } from "@/hooks/use-toast";

interface ChatShareControlsProps {
  sessionId: number | null;
  onNewChatSharingChange?: (advisorIds: number[]) => void;
}

export function ChatShareControls({ sessionId, onNewChatSharingChange }: ChatShareControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sharedWithAdvisors, setSharedWithAdvisors] = useState<Record<number, boolean>>({});
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({});
  const [sharedCount, setSharedCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [initializedForNewChat, setInitializedForNewChat] = useState(false);

  // Fetch advisors
  const { data: advisors = [], isLoading: isLoadingAdvisors } = useQuery({
    queryKey: ["/api/advisors"],
    queryFn: async () => {
      const response = await fetchAdvisors();
      return Array.isArray(response) ? response.filter(advisor => advisor.isActive) : [];
    },
  });

  // Keep track of previously shared advisors to maintain state during transition
  const [previousNewChatShared, setPreviousNewChatShared] = useState<Record<number, boolean>>({});
  
  // Initialize all advisors as shared for new chats
  useEffect(() => {
    if (!sessionId && advisors.length > 0 && !initializedForNewChat) {
      const initialSharedStatus: Record<number, boolean> = {};
      
      // For new chats, set all advisors as shared by default
      advisors.forEach(advisor => {
        initialSharedStatus[advisor.id] = true;
      });
      
      setSharedWithAdvisors(initialSharedStatus);
      setPreviousNewChatShared(initialSharedStatus);
      setSharedCount(advisors.length);
      setInitializedForNewChat(true);
      
      // Notify parent component about initial advisor IDs to share with
      if (onNewChatSharingChange) {
        onNewChatSharingChange(advisors.map(advisor => advisor.id));
      }
    }
  }, [sessionId, advisors, initializedForNewChat, onNewChatSharingChange]);
  
  // When user toggles advisor sharing for a new chat, preserve that state
  useEffect(() => {
    if (!sessionId && Object.keys(sharedWithAdvisors).length > 0) {
      setPreviousNewChatShared(sharedWithAdvisors);
    }
  }, [sessionId, sharedWithAdvisors]);
  
  // Handle transition from new chat to existing session
  useEffect(() => {
    // If we just got a sessionId (transition from new chat to existing session)
    // And we have previous new chat shared state, use that until the real data loads
    if (sessionId && previousNewChatShared && Object.keys(previousNewChatShared).length > 0) {
      console.log("Transitioning from new chat to existing session, preserving shared state:", previousNewChatShared);
      
      // The following line forces an immediate update to the shared status before the query runs
      setSharedWithAdvisors(previousNewChatShared);
      setSharedCount(Object.values(previousNewChatShared).filter(Boolean).length);
      
      // Also update the shared status on the server immediately
      Object.entries(previousNewChatShared).forEach(([advisorId, isShared]) => {
        if (isShared) {
          console.log(`Maintaining share state for advisor ${advisorId} with session ${sessionId}`);
          shareChatMutation.mutate({ advisorId: parseInt(advisorId), sessionId });
        }
      });
    }
  }, [sessionId, previousNewChatShared]);

  // Direct API approach - uses the session data directly from the server
  const { data: sharedStatus = {}, isLoading: isLoadingSharedStatus } = useQuery({
    queryKey: ["/api/chat/shared-status", sessionId],
    queryFn: async () => {
      if (!sessionId || advisors.length === 0) return {};
      
      // For server-based approach (simplified)
      const sharedStatus: Record<number, boolean> = {};
      
      // First, initialize all advisors as not shared
      for (const advisor of advisors) {
        sharedStatus[advisor.id] = false;
      }
      
      try {
        console.log("Fetching shared status for session:", sessionId);
        
        // For each advisor, check if they have access to this session
        const promises = advisors.map(async (advisor) => {
          try {
            const sharedSessions = await getSharedChatSessions(advisor.id);
            console.log(`Advisor ${advisor.id} shared sessions:`, sharedSessions);
            sharedStatus[advisor.id] = sharedSessions.includes(sessionId);
          } catch (error) {
            console.error(`Error checking shared status for advisor ${advisor.id}:`, error);
            sharedStatus[advisor.id] = false;
          }
        });
        
        // Wait for all checks to complete
        await Promise.all(promises);
        
        // Calculate the count of shared advisors
        const count = Object.values(sharedStatus).filter(Boolean).length;
        console.log("Final shared status:", sharedStatus, "Count:", count);
        setSharedCount(count);
        return sharedStatus;
      } catch (error) {
        console.error("Error fetching shared status:", error);
        return {};
      }
    },
    enabled: !!sessionId && advisors.length > 0,
    refetchInterval: 2000, // Poll every 2 seconds to ensure we have latest data
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  
  // Update shared status when data changes
  useEffect(() => {
    if (sessionId && sharedStatus && Object.keys(sharedStatus).length > 0) {
      setSharedWithAdvisors(sharedStatus);
      setSharedCount(Object.values(sharedStatus).filter(Boolean).length);
    }
  }, [sessionId, sharedStatus]);

  // Mutation for sharing the current chat with an advisor
  const shareChatMutation = useMutation({
    mutationFn: async ({ advisorId, sessionId }: { advisorId: number, sessionId: number }) => {
      return await shareChatsWithAdvisor(advisorId, [sessionId]);
    },
    onSuccess: (result, variables) => {
      if (result && 'error' in result && result.error) {
        toast({
          title: "Error",
          description: String(result.error),
          variant: "destructive",
        });
        return;
      }
      
      // Invalidate the shared chats query
      queryClient.invalidateQueries({ 
        queryKey: ["/api/advisors", variables.advisorId, "shared-chats"] 
      });
      
      if (sessionId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/chat/shared-status", sessionId] 
        });
      }
      
      // Update local shared status
      setSharedWithAdvisors(prev => {
        const updated = { ...prev, [variables.advisorId]: true };
        // Update shared count
        setSharedCount(Object.values(updated).filter(Boolean).length);
        return updated;
      });
      
      // Remove processing state
      setIsProcessing(prev => ({
        ...prev,
        [variables.advisorId]: false
      }));
    },
    onError: (error) => {
      console.error("Error sharing chat:", error);
      toast({
        title: "Error",
        description: "Failed to share chat. Please try again.",
        variant: "destructive"
      });
      
      // Remove processing state for all advisors on error
      setIsProcessing({});
    }
  });

  // Mutation for unsharing the current chat with an advisor
  const unshareChatMutation = useMutation({
    mutationFn: async ({ advisorId, sessionId }: { advisorId: number, sessionId: number }) => {
      return await unshareChatsWithAdvisor(advisorId, [sessionId]);
    },
    onSuccess: (result, variables) => {
      if (result && 'error' in result && result.error) {
        toast({
          title: "Error",
          description: String(result.error),
          variant: "destructive",
        });
        return;
      }
      
      // Invalidate the shared chats query
      queryClient.invalidateQueries({ 
        queryKey: ["/api/advisors", variables.advisorId, "shared-chats"] 
      });
      
      if (sessionId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/chat/shared-status", sessionId] 
        });
      }
      
      // Update local shared status
      setSharedWithAdvisors(prev => {
        const updated = { ...prev, [variables.advisorId]: false };
        // Update shared count
        setSharedCount(Object.values(updated).filter(Boolean).length);
        return updated;
      });
      
      // Remove processing state
      setIsProcessing(prev => ({
        ...prev,
        [variables.advisorId]: false
      }));
    },
    onError: (error) => {
      console.error("Error unsharing chat:", error);
      toast({
        title: "Error",
        description: "Failed to unshare chat. Please try again.",
        variant: "destructive"
      });
      
      // Remove processing state for all advisors on error
      setIsProcessing({});
    }
  });

  // Handle toggling share status with an advisor without closing the dropdown
  const handleToggleShare = useCallback((advisor: { id: number; name: string }, e: MouseEvent) => {
    // Prevent the dropdown from closing
    e.preventDefault();
    e.stopPropagation();
    
    // Mark as processing
    setIsProcessing(prev => ({
      ...prev,
      [advisor.id]: true
    }));
    
    // Check if it's already shared
    const isShared = sharedWithAdvisors[advisor.id];
    
    if (sessionId) {
      // For existing chat sessions: use the API
      if (isShared) {
        // Unshare if already shared
        unshareChatMutation.mutate({ 
          advisorId: advisor.id, 
          sessionId 
        });
      } else {
        // Share if not shared yet
        shareChatMutation.mutate({ 
          advisorId: advisor.id, 
          sessionId 
        });
      }
    } else {
      // For new chat sessions: just update the local state
      const updatedStatus = { ...sharedWithAdvisors, [advisor.id]: !isShared };
      setSharedWithAdvisors(updatedStatus);
      
      const sharedCount = Object.values(updatedStatus).filter(Boolean).length;
      setSharedCount(sharedCount);
      
      // Notify parent component about changes
      if (onNewChatSharingChange) {
        const advisorIds = Object.entries(updatedStatus)
          .filter(([_, isShared]) => isShared)
          .map(([id]) => parseInt(id, 10));
        onNewChatSharingChange(advisorIds);
      }
      
      // Remove processing state
      setIsProcessing(prev => ({
        ...prev,
        [advisor.id]: false
      }));
    }
  }, [sessionId, sharedWithAdvisors, shareChatMutation, unshareChatMutation, onNewChatSharingChange]);

  // If no advisors are available, don't render the control
  if (advisors.length === 0 && !isLoadingAdvisors) {
    return null;
  }

  const isLoading = isLoadingAdvisors || (!!sessionId && isLoadingSharedStatus);
  const isAnyProcessing = Object.values(isProcessing).some(Boolean);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 pl-2 pr-3 h-8"
          disabled={isLoading || advisors.length === 0 || isAnyProcessing}
        >
          <Share2 className="h-4 w-4 mr-1" />
          {isAnyProcessing 
            ? "Processing..." 
            : sharedCount > 0 
              ? `Shared with Advisors (${sharedCount})` 
              : "Private"
          }
          <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Toggle chat sharing</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>
            Loading advisors...
          </DropdownMenuItem>
        ) : advisors.length === 0 ? (
          <DropdownMenuItem disabled>
            No active advisors
          </DropdownMenuItem>
        ) : (
          advisors.map(advisor => (
            <div 
              key={advisor.id}
              className={`${
                isProcessing[advisor.id] ? 'opacity-70' : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
              } flex items-center px-2 py-1.5 text-sm rounded-sm select-none relative`}
              onClick={(e) => !isProcessing[advisor.id] && handleToggleShare(advisor, e)}
            >
              {isProcessing[advisor.id] ? (
                <div className="w-4 h-4 mr-2 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : sharedWithAdvisors[advisor.id] ? (
                <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
              ) : (
                <div className="w-4 mr-2 flex-shrink-0" />
              )}
              <span>
                {advisor.name}
                {isProcessing[advisor.id] ? 
                  (sharedWithAdvisors[advisor.id] ? " (unsharing...)" : " (sharing...)") 
                  : ""
                }
              </span>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}