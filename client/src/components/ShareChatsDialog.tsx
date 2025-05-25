import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatSession } from "@shared/schema";
import { fetchChatSessions } from "@/lib/chatApi";
import { shareChatsWithAdvisor, getSharedChatSessions, unshareChatsWithAdvisor } from "@/lib/advisorApi";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare } from "lucide-react";

interface ShareChatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advisor: {
    id: number;
    name: string;
  } | null;
}

export function ShareChatsDialog({ open, onOpenChange, advisor }: ShareChatsDialogProps) {
  const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all chat sessions
  const { data: chatSessions = [], isLoading: isLoadingChats } = useQuery({
    queryKey: ["/api/chat/sessions"],
    queryFn: async () => {
      const sessions = await fetchChatSessions();
      return sessions;
    },
  });

  // Fetch currently shared chat sessions for this advisor
  const { data: sharedSessionIds = [], isLoading: isLoadingShared } = useQuery({
    queryKey: ["/api/advisors", advisor?.id, "shared-chats"],
    queryFn: async () => {
      if (!advisor) return [];
      return await getSharedChatSessions(advisor.id);
    },
    enabled: !!advisor,
  });

  // Set initial selection when dialog opens or shared sessions data loads
  useEffect(() => {
    if (open && sharedSessionIds) {
      setSelectedSessionIds(sharedSessionIds);
    }
  }, [open, sharedSessionIds]);

  // Share chats mutation
  const shareChatsMutation = useMutation({
    mutationFn: async () => {
      if (!advisor) return null;
      try {
        // Check if we're logged in first
        const meResponse = await fetch('/api/me', { credentials: 'include' });
        if (meResponse.status === 401) {
          console.warn("User not logged in, returning error object instead of throwing");
          return { 
            success: false, 
            sharedSessionIds: [], 
            error: "You must be logged in to share chats. Please refresh the page and try again." 
          };
        }
        
        return await shareChatsWithAdvisor(advisor.id, selectedSessionIds);
      } catch (err) {
        console.error("Error in shareChatsMutation:", err);
        return { 
          success: false, 
          sharedSessionIds: [], 
          error: "An unexpected error occurred. Please try again." 
        };
      }
    },
    onSuccess: (result) => {
      // Check if the result contains an error message
      if (result && 'error' in result && result.error) {
        // The mutation "succeeded" but returned an error object - don't do anything here
        // The handleSave function will deal with this
        return;
      }
      
      // Only invalidate queries if there was no error
      queryClient.invalidateQueries({ queryKey: ["/api/advisors", advisor?.id, "shared-chats"] });
      
      // Note: Toast is now handled in handleSave to avoid duplicate messages
    },
    onError: (error: any) => {
      console.error("Error sharing chats:", error);
      // We now handle errors in handleSave, so we don't need to show toasts here
    },
  });

  // Unshare chats mutation
  const unshareChatsMutation = useMutation({
    mutationFn: async () => {
      if (!advisor) return null;
      // Find sessions to unshare - ones that were shared but are no longer selected
      const sessionsToUnshare = sharedSessionIds.filter(id => !selectedSessionIds.includes(id));
      if (sessionsToUnshare.length === 0) return null;
      
      try {
        // Check if we're logged in first
        const meResponse = await fetch('/api/me', { credentials: 'include' });
        if (meResponse.status === 401) {
          console.warn("User not logged in, returning error object instead of throwing");
          return { 
            success: false, 
            error: "You must be logged in to unshare chats. Please refresh the page and try again." 
          };
        }
        
        return await unshareChatsWithAdvisor(advisor.id, sessionsToUnshare);
      } catch (err) {
        console.error("Error in unshareChatsMutation:", err);
        return { 
          success: false, 
          error: "An unexpected error occurred. Please try again." 
        };
      }
    },
    onSuccess: (result) => {
      // Check if the result contains an error message
      if (result && 'error' in result && result.error) {
        // The mutation "succeeded" but returned an error object - don't do anything here
        // The handleSave function will deal with this
        return;
      }
      
      // Only invalidate queries if there was no error
      queryClient.invalidateQueries({ queryKey: ["/api/advisors", advisor?.id, "shared-chats"] });
    },
    onError: (error: any) => {
      console.error("Error unsharing chats:", error);
      // We now handle errors in handleSave, so we don't need to show toasts here
    },
  });

  // Handle save button click
  const handleSave = async () => {
    try {
      // Check for unshared sessions
      const sessionsToUnshare = sharedSessionIds.filter(id => !selectedSessionIds.includes(id));
      
      // If we have sessions to unshare, call unshare mutation
      if (sessionsToUnshare.length > 0) {
        console.log('Unsharing sessions:', sessionsToUnshare);
        const unshareResult = await unshareChatsMutation.mutateAsync();
        
        // Check if there was an error
        if (unshareResult && 'error' in unshareResult && unshareResult.error) {
          toast({
            title: "Error Unsharing",
            description: String(unshareResult.error), // Convert to string to ensure safe rendering
            variant: "destructive",
          });
          return; // Stop if there was an error
        }
      }
      
      // Share the selected sessions if any are selected
      if (selectedSessionIds.length > 0) {
        console.log('Sharing sessions:', selectedSessionIds);
        const shareResult = await shareChatsMutation.mutateAsync();
        
        // Check if there was an error
        if (shareResult && 'error' in shareResult && shareResult.error) {
          toast({
            title: "Error Sharing",
            description: String(shareResult.error), // Convert to string to ensure safe rendering
            variant: "destructive",
          });
          return; // Don't close the dialog if there was an error
        }
      }
      
      // Only close and show success message if both operations succeeded
      toast({
        title: "Chats saved",
        description: `Chat sharing preferences have been updated for ${advisor?.name}`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Unexpected error in handleSave:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle checkbox change
  const handleSessionToggle = (sessionId: number) => {
    setSelectedSessionIds(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else {
        return [...prev, sessionId];
      }
    });
  };

  if (!advisor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Chat Sessions with {advisor.name}</DialogTitle>
          <DialogDescription>
            Select which chat conversations you want to share with this advisor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[300px] overflow-y-auto">
          {isLoadingChats || isLoadingShared ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>You have no chat sessions yet.</p>
            </div>
          ) : (
            <div className="space-y-4 my-4">
              {chatSessions.map((session: ChatSession) => (
                <div key={session.id} className="flex items-start space-x-3 py-2">
                  <Checkbox 
                    id={`session-${session.id}`}
                    checked={selectedSessionIds.includes(session.id)}
                    onCheckedChange={() => handleSessionToggle(session.id)}
                  />
                  <div className="grid gap-1.5">
                    <label
                      htmlFor={`session-${session.id}`}
                      className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {session.title || `Chat Session ${session.id}`}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoadingChats || isLoadingShared || shareChatsMutation.isPending}
          >
            {shareChatsMutation.isPending 
              ? "Saving..." 
              : selectedSessionIds.length === 0 
                ? "No Sessions Selected" 
                : `Share ${selectedSessionIds.length} Session${selectedSessionIds.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}