import { useState, useEffect, useRef } from "react";
import { Building2, Plus, MoreVertical, Sparkles, Check, FastForward } from "lucide-react"; // Added FastForward import
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { sendChatMessage, createChatSession } from "@/lib/chatApi";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Define the college type
interface College {
  id: number;
  name: string;
  status: "applying" | "researching" | "not_applying";
  position: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

// Define the college recommendation type
interface CollegeRecommendation {
  id: number;
  name: string;
  description: string;
  reason: string;
  acceptanceRate: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  advisorNotes?: string;
  recommendedBy?: string;
}

export default function CollegesTab() {
  const [, setLocation] = useLocation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState("");
  const [generateRecommendationsOpen, setGenerateRecommendationsOpen] = useState(false);
  const [preference, setPreference] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dragItem = useRef<{ id: number; status: string } | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  // Fetch colleges from the API
  const { data: colleges = [] as College[], isLoading } = useQuery<College[]>({
    queryKey: ['/api/colleges'],
    // We're using the default queryFn which already handles GET requests
  });

  // Fetch college recommendations from the API
  const { 
    data: recommendations = [] as CollegeRecommendation[], 
    isLoading: recommendationsLoading,
    refetch: refetchRecommendations
  } = useQuery<CollegeRecommendation[]>({
    queryKey: ['/api/recommendations'],
    // Using default queryFn for GET requests
  });

  // Generate recommendations mutation
  const generateRecommendationsMutation = useMutation({
    mutationFn: async (preference: string) => {
      const res = await apiRequest('POST', '/api/recommendations/generate', { preference });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      toast({
        title: "Recommendations generated",
        description: "Check out your personalized college recommendations below.",
      });
      setPreference("");
      setGenerateRecommendationsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete recommendation mutation
  const deleteRecommendationMutation = useMutation({
    mutationFn: async (recommendationId: number) => {
      return await apiRequest('DELETE', `/api/recommendations/${recommendationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      toast({
        title: "Recommendation removed",
        description: "The recommendation has been removed from your list.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove recommendation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Convert recommendation to college mutation
  const convertRecommendationMutation = useMutation({
    mutationFn: async ({ recommendationId, status }: { recommendationId: number; status: string }) => {
      const res = await apiRequest('POST', `/api/recommendations/${recommendationId}/convert`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/colleges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      toast({
        title: "College added",
        description: "The recommendation has been added to your college board.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add college from recommendation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add a new college mutation
  const addCollegeMutation = useMutation({
    mutationFn: async (name: string) => {
      try {
        // Default status is "researching" and position is 1 for new entries
        const res = await apiRequest('POST', '/api/colleges', { 
          name,
          status: "researching",
          position: 1
        });
        
        if (!res.ok) {
          throw new Error("Failed to add college");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error adding college:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/colleges'] });
      toast({
        title: "College added",
        description: "Your college has been added to your board.",
      });
      setNewCollegeName("");
      setAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add college. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update college status mutation
  const updateCollegeStatusMutation = useMutation({
    mutationFn: async ({ collegeId, status }: { collegeId: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/colleges/${collegeId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/colleges'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update college status. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete college mutation
  const deleteCollegeMutation = useMutation({
    mutationFn: async (collegeId: number) => {
      return await apiRequest('DELETE', `/api/colleges/${collegeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/colleges'] });
      toast({
        title: "College deleted",
        description: "The college has been removed from your board.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete college. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle add college form submission
  const handleAddCollege = () => {
    if (newCollegeName.trim()) {
      addCollegeMutation.mutate(newCollegeName.trim());
    }
  };

  // Handle generate recommendations form submission
  const handleGenerateRecommendations = () => {
    // If preference is empty, pass an empty string (API will handle this gracefully)
    generateRecommendationsMutation.mutate(preference.trim());
  };

  // Group colleges by status
  const applyingColleges = colleges.filter((college: College) => college.status === "applying")
    .sort((a: College, b: College) => a.position - b.position);

  const researchingColleges = colleges.filter((college: College) => college.status === "researching")
    .sort((a: College, b: College) => a.position - b.position);

  const notApplyingColleges = colleges.filter((college: College) => college.status === "not_applying")
    .sort((a: College, b: College) => a.position - b.position);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, college: College) => {
    console.log('Drag started:', college.name);
    dragItem.current = { id: college.id, status: college.status };
    dragNode.current = e.target as HTMLDivElement;

    dragNode.current.addEventListener('dragend', handleDragEnd);

    // Add a small delay to set opacity - helps with drag image
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = '0.5';
      }
    }, 0);
  };

  // Handle drag over a column
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
  };

  // Handle dropping a college into a column
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    console.log('Drop in column:', status);

    // Update college status if different from current
    if (dragItem.current && dragItem.current.status !== status) {
      updateCollegeStatusMutation.mutate({
        collegeId: dragItem.current.id,
        status
      });
    }
  };

  // Handle ending the drag
  const handleDragEnd = () => {
    if (dragNode.current) {
      dragNode.current.removeEventListener('dragend', handleDragEnd);
      dragNode.current.style.opacity = '1';
      dragNode.current = null;
    }
    dragItem.current = null;
  };

  // We'll now always show the college board, even when empty

  // Main board view with colleges
  return (
    <div className="min-h-screen flex flex-col max-w-full">
      <header className="bg-card border-b border-border/40 py-4 px-4 sm:px-6 flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-xl font-bold">My Colleges</h1>
        <Button 
          onClick={() => setAddDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add College
        </Button>
      </header>

      <div className="flex-1 p-4 sm:p-6 overflow-x-hidden">
        <div className="mx-auto w-full">
          {/* College Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Applying Column */}
            <div 
              className="border border-border/40 rounded-lg bg-card/90"
              onDragOver={(e) => handleDragOver(e, "applying")}
              onDrop={(e) => handleDrop(e, "applying")}
            >
              <div className="p-4 border-b border-border/40">
                <h2 className="text-xl font-bold text-green-600">Applying</h2>
              </div>
              <div className="p-4 space-y-3 min-h-[200px]">
                {applyingColleges.length > 0 ? (
                  applyingColleges.map((college: College) => (
                    <CollegeCard 
                      key={college.id} 
                      college={college} 
                      onMove={updateCollegeStatusMutation.mutate}
                      onDelete={deleteCollegeMutation.mutate}
                      onDragStart={handleDragStart}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    You have not added any colleges to Applying yet.
                  </div>
                )}
              </div>
            </div>

            {/* Researching Column */}
            <div 
              className="border border-border/40 rounded-lg bg-card/90"
              onDragOver={(e) => handleDragOver(e, "researching")}
              onDrop={(e) => handleDrop(e, "researching")}
            >
              <div className="p-4 border-b border-border/40">
                <h2 className="text-xl font-bold text-amber-600">Researching</h2>
              </div>
              <div className="p-4 space-y-3 min-h-[200px]">
                {researchingColleges.length > 0 ? (
                  researchingColleges.map((college: College) => (
                    <CollegeCard 
                      key={college.id} 
                      college={college}
                      onMove={updateCollegeStatusMutation.mutate}
                      onDelete={deleteCollegeMutation.mutate}
                      onDragStart={handleDragStart}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    You have not added any colleges to Researching yet.
                  </div>
                )}
              </div>
            </div>

            {/* Not Applying Column */}
            <div 
              className="border border-border/40 rounded-lg bg-card/90"
              onDragOver={(e) => handleDragOver(e, "not_applying")}
              onDrop={(e) => handleDrop(e, "not_applying")}
            >
              <div className="p-4 border-b border-border/40">
                <h2 className="text-xl font-bold text-red-600">Not Applying</h2>
              </div>
              <div className="p-4 space-y-3 min-h-[200px]">
                {notApplyingColleges.length > 0 ? (
                  notApplyingColleges.map((college: College) => (
                    <CollegeCard 
                      key={college.id} 
                      college={college}
                      onMove={updateCollegeStatusMutation.mutate}
                      onDelete={deleteCollegeMutation.mutate}
                      onDragStart={handleDragStart}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    You have not added any colleges to Not Applying yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="mt-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">Recommendations</h2>
              <Button
                onClick={() => setGenerateRecommendationsOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Recommendations
              </Button>
            </div>

            {recommendationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading recommendations...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onDelete={deleteRecommendationMutation.mutate}
                    onConvert={convertRecommendationMutation.mutate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-card/50 rounded-lg border border-border/40">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Get personalized college recommendations based on your profile and interests.
                </p>
                <Button
                  onClick={() => setGenerateRecommendationsOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Recommendations
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add College Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add College</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="college-name" className="block text-sm font-medium mb-2">
              College Name
            </label>
            <Input
              id="college-name"
              placeholder="Enter college name"
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCollegeName.trim() && !addCollegeMutation.isPending) {
                  e.preventDefault();
                  handleAddCollege();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCollege}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!newCollegeName.trim() || addCollegeMutation.isPending}
            >
              {addCollegeMutation.isPending ? "Adding..." : "Add College"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Recommendations Dialog */}
      <Dialog open={generateRecommendationsOpen} onOpenChange={setGenerateRecommendationsOpen}>
        <DialogContent className="sm:max-w-xl max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Generate College Recommendations
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Our AI will analyze your profile and current college list to suggest schools that might be a good match for you.
            </p>

            <div className="space-y-2">
              <label htmlFor="preference" className="block text-sm font-medium">
                Any specific preferences? (optional)
              </label>
              <Textarea
                id="preference"
                placeholder="E.g., 'I'm interested in strong engineering programs' or 'Looking for colleges on the West Coast'"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-4">
            <div>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setPreference("");
                  setGenerateRecommendationsOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  setPreference("");
                  handleGenerateRecommendations();
                }}
                disabled={generateRecommendationsMutation.isPending}
              >
                <FastForward className="h-4 w-4 mr-2" />
                Skip
              </Button>
              <Button
                onClick={handleGenerateRecommendations}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={generateRecommendationsMutation.isPending}
              >
                {generateRecommendationsMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Recommendations
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// College Card Component
interface CollegeCardProps {
  college: College;
  onMove: (params: { collegeId: number; status: string }) => void;
  onDelete: (collegeId: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, college: College) => void;
}

function CollegeCard({ college, onMove, onDelete, onDragStart }: CollegeCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Function to create a new chat session and send a message about a college
  const handleAskInChat = async (collegeName: string) => {
    try {
      // Create the message and encode it for the URL
      const message = `Tell me more about ${collegeName}`;
      const encodedMessage = encodeURIComponent(message);

      // Navigate to the chat tab with the message as a query parameter
      // This will allow the chat page to automatically start a new chat with this message
      setLocation(`/dashboard?message=${encodedMessage}`);

      // Add a toast notification
      toast({
        title: "Opening chat",
        description: `Starting conversation about ${collegeName}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start a chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="p-3 bg-card/80 border border-border/40 rounded-md flex justify-between items-center cursor-move max-w-full overflow-hidden"
      draggable
      onDragStart={(e) => onDragStart(e, college)}
    >
      <div className="font-medium text-foreground truncate mr-2">{college.name}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground flex-shrink-0 touch-manipulation">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={() => handleAskInChat(college.name)}
            className="py-2 cursor-pointer focus:bg-accent"
          >
            Ask in chat
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onMove({ collegeId: college.id, status: "applying" })}
            disabled={college.status === "applying"}
            className="py-2 cursor-pointer focus:bg-accent"
          >
            Move to Applying
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onMove({ collegeId: college.id, status: "researching" })}
            disabled={college.status === "researching"}
            className="py-2 cursor-pointer focus:bg-accent"
          >
            Move to Researching
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onMove({ collegeId: college.id, status: "not_applying" })}
            disabled={college.status === "not_applying"}
            className="py-2 cursor-pointer focus:bg-accent"
          >
            Move to Not Applying
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDelete(college.id)}
            className="text-red-500 py-2 cursor-pointer focus:bg-accent"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Recommendation Card Component
interface RecommendationCardProps {
  recommendation: CollegeRecommendation;
  onDelete: (recommendationId: number) => void;
  onConvert: (params: { recommendationId: number; status: string }) => void;
}

function RecommendationCard({ recommendation, onDelete, onConvert }: RecommendationCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get acceptance rate color based on percentage
  const getAcceptanceRateColor = (rate: number | null) => {
    if (rate === null) return "bg-gray-200 text-gray-800"; // Default for unknown
    if (rate <= 15) return "bg-red-200 text-red-800"; // Highly selective
    if (rate <= 50) return "bg-amber-200 text-amber-800"; // Selective
    return "bg-blue-200 text-blue-800"; // Less selective
  };

  // Function to create a new chat session and send a message about a college
  const handleAskInChat = async (collegeName: string) => {
    try {
      const message = `Tell me more about ${collegeName}`;
      const encodedMessage = encodeURIComponent(message);
      setLocation(`/dashboard?message=${encodedMessage}`);

      toast({
        title: "Opening chat",
        description: `Starting conversation about ${collegeName}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start a chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card/80 border border-border/40 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border/40">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{recommendation.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleAskInChat(recommendation.name)}
              >
                Ask in chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onConvert({ recommendationId: recommendation.id, status: "applying" })}>
                Add to Applying
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConvert({ recommendationId: recommendation.id, status: "researching" })}>
                Add to Researching
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConvert({ recommendationId: recommendation.id, status: "not_applying" })}>
                Add to Not Applying
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(recommendation.id)}
                className="text-red-500"
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {recommendation.acceptanceRate !== null && (
            <Badge className={getAcceptanceRateColor(recommendation.acceptanceRate)}>
              {recommendation.acceptanceRate}% acceptance rate
            </Badge>
          )}
          {recommendation.recommendedBy && (
            <Badge variant="outline">
              Recommended by {recommendation.recommendedBy}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 md:flex md:space-x-6">
        <div className="mb-3 md:mb-0 md:flex-1">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">What it is</h4>
          <p className="text-sm">{recommendation.description}</p>
        </div>

        <div className="md:flex-1">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Why you might like it</h4>
          <p className="text-sm">{recommendation.reason}</p>
        </div>
      </div>

      {recommendation.advisorNotes && (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Advisor notes</h4>
          <p className="text-sm italic">{recommendation.advisorNotes}</p>
        </div>
      )}
    </div>
  );
}