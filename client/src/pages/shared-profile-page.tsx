import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { addRecommendation } from "@/lib/advisorApi";
import { College, CollegeRecommendation, ChatSession, ChatMessage } from "@shared/schema";
import { Building2, User, ExternalLink, ArrowLeft, GraduationCap, Sparkles, Plus, MessageCircle, MessageSquare, Clock } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { ScrollArea } from "@/components/ui/scroll-area";

// Interface for shared profile data

interface SharedProfile {
  advisor: {
    name: string;
    type: string;
    id: number;
  };
  user: {
    username: string;
    profileDescription: string | null;
  };
  colleges: College[];
  recommendations: CollegeRecommendation[];
  sharedChatSessions: ChatSession[];
}

export default function SharedProfilePage() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addRecommendationOpen, setAddRecommendationOpen] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [advisorNotes, setAdvisorNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messagesViewingSessionId, setMessagesViewingSessionId] = useState<number | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const { toast } = useToast();
  
  // Get acceptance rate color based on percentage
  const getAcceptanceRateColor = (rate: number | null) => {
    if (rate === null) return "bg-gray-200 text-gray-800"; // Default for unknown
    if (rate <= 15) return "bg-red-200 text-red-800"; // Highly selective
    if (rate <= 50) return "bg-amber-200 text-amber-800"; // Selective
    return "bg-blue-200 text-blue-800"; // Less selective
  };
  
  const shareToken = window.location.pathname.split('/shared/')[1];
  
  // Get the current viewing session
  const currentViewingSession = profile?.sharedChatSessions.find(
    session => session.id === messagesViewingSessionId
  );
  
  // Handle selecting a chat session
  const handleSelectChatSession = async (sessionId: number) => {
    if (messagesViewingSessionId === sessionId) return;
    
    setMessagesViewingSessionId(sessionId);
    setCurrentMessages([]);
    setMessagesLoading(true);
    
    try {
      const response = await apiRequest("GET", `/api/shared/${shareToken}/chat/${sessionId}/messages`);
      const data = await response.json();
      setCurrentMessages(data);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages.",
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    async function fetchSharedProfile() {
      try {
        setLoading(true);
        const response = await apiRequest("GET", `/api/shared/${shareToken}`);
        const data = await response.json();
        setProfile(data as SharedProfile);
        setError(null);
      } catch (err) {
        console.error("Error fetching shared profile:", err);
        setError("This shared profile link is invalid or has been deactivated");
      } finally {
        setLoading(false);
      }
    }

    if (shareToken) {
      fetchSharedProfile();
    } else {
      setError("Invalid shared profile link");
      setLoading(false);
    }
  }, [shareToken]);
  
  // Handle adding a new recommendation
  const handleAddRecommendation = async () => {
    if (!collegeName.trim()) {
      toast({
        title: "College name required",
        description: "Please enter a name for the college you want to recommend.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newRecommendation = await addRecommendation(shareToken, {
        collegeName: collegeName.trim(),
        advisorNotes: advisorNotes.trim() || undefined
      });
      
      // Update the profile with the new recommendation
      if (profile) {
        setProfile({
          ...profile,
          recommendations: [...profile.recommendations, newRecommendation]
        });
      }
      
      // Reset form and close dialog
      setCollegeName("");
      setAdvisorNotes("");
      setAddRecommendationOpen(false);
      
      toast({
        title: "Recommendation added",
        description: `You've recommended ${collegeName} to ${profile?.user.username}.`,
      });
    } catch (err) {
      console.error("Error adding recommendation:", err);
      toast({
        title: "Error",
        description: "Failed to add your recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group colleges by status
  const collegesByStatus = profile?.colleges.reduce((acc, college) => {
    if (!acc[college.status]) {
      acc[college.status] = [];
    }
    acc[college.status].push(college);
    return acc;
  }, {} as Record<string, College[]>) || {};

  // Get status names and emoji for each
  const statusLabels = {
    applying: {
      label: "Applying",
      emoji: "📝"
    },
    researching: {
      label: "Researching",
      emoji: "🔍"
    },
    not_applying: {
      label: "Not Applying",
      emoji: "❌"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Logo className="h-8 w-auto" />
          </div>
          <Button variant="ghost" onClick={() => window.location.href = "/"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-lg font-medium">Loading shared profile...</p>
          </div>
        ) : error ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>There was a problem loading this shared profile</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{error}</p>
              <Button 
                className="mt-4" 
                onClick={() => window.location.href = "/"}
              >
                Return to home
              </Button>
            </CardContent>
          </Card>
        ) : profile && (
          <>
            <div className="grid gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {profile.user.username}'s CollegeWayfarer Profile
                  </CardTitle>
                </CardHeader>
              </Card>

              {profile.user.profileDescription && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none text-foreground">
                      {profile.user.profileDescription.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="text-foreground">{paragraph}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Shared Chat Sessions Card */}
              {profile.sharedChatSessions && profile.sharedChatSessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Shared Chat Sessions
                    </CardTitle>
                    <CardDescription>
                      Chat sessions that have been shared with you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex h-[500px] border-t border-border/40">
                      {/* Chat Sessions Sidebar */}
                      <div className="w-1/3 border-r border-border/40 overflow-y-auto">
                        {profile.sharedChatSessions.map((session, index) => {
                          const formattedDate = new Date(session.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          });
                          
                          return (
                            <div 
                              key={session.id}
                              className={`
                                p-4 cursor-pointer transition-colors duration-200
                                ${messagesViewingSessionId === session.id 
                                  ? 'bg-primary/10' 
                                  : 'hover:bg-muted/50'
                                }
                                ${index !== profile.sharedChatSessions.length - 1 ? 'border-b border-border/40' : ''}
                              `}
                              onClick={() => handleSelectChatSession(session.id)}
                            >
                              <h3 className="font-medium truncate">
                                {session.title || `Chat Session from ${formattedDate}`}
                              </h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formattedDate}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Chat Messages Panel */}
                      <div className="w-2/3 flex flex-col">
                        {messagesViewingSessionId ? (
                          <>
                            <div className="flex-1 overflow-y-auto p-4">
                              {messagesLoading ? (
                                <div className="flex justify-center items-center h-full">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                                </div>
                              ) : currentMessages.length === 0 ? (
                                <div className="flex justify-center items-center h-full text-muted-foreground">
                                  <p>No messages found in this chat session.</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {currentMessages.map((message) => (
                                    <div 
                                      key={message.id} 
                                      className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                      <div 
                                        className={`
                                          max-w-[80%] px-4 py-2 rounded-lg text-sm
                                          ${message.sender === 'user' 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-muted text-muted-foreground'}
                                        `}
                                      >
                                        {message.sender === 'user' ? (
                                          <div className="whitespace-pre-wrap">{message.content}</div>
                                        ) : (
                                          <div className="markdown-content">
                                            <ReactMarkdown 
                                              remarkPlugins={[remarkGfm]}
                                              components={{
                                                a: ({ node, ...props }) => <a className="text-primary hover:underline" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 my-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 my-2" {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-2" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-md font-bold my-2" {...props} />,
                                                p: ({ node, ...props }) => <p className="my-2" {...props} />,
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2" {...props} />,
                                                code: (props) => {
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
                                          </div>
                                        )}
                                      </div>
                                      {/* Removed sender and timestamp labels */}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col justify-center items-center h-full text-muted-foreground p-6">
                            <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground/50" />
                            <p>Select a chat session to view messages</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    College Lists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(collegesByStatus).length === 0 ? (
                    <p className="text-foreground">No colleges have been added yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Applying Column */}
                      {collegesByStatus["applying"] && (
                        <div className="border border-border/40 rounded-lg bg-card/90">
                          <div className="p-4 border-b border-border/40">
                            <h2 className="text-xl font-bold text-green-600">Applying</h2>
                          </div>
                          <div className="p-4 space-y-3 min-h-[100px]">
                            {collegesByStatus["applying"]?.map((college) => (
                              <div 
                                key={college.id} 
                                className="p-3 bg-card/80 border border-border/40 rounded-md flex justify-between items-center"
                              >
                                <div className="font-medium text-foreground">{college.name}</div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(college.name)} college`, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Info
                                </Button>
                              </div>
                            ))}
                            {collegesByStatus["applying"]?.length === 0 && (
                              <div className="text-center p-2 text-muted-foreground text-sm">
                                No colleges in this category
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Researching Column */}
                      {collegesByStatus["researching"] && (
                        <div className="border border-border/40 rounded-lg bg-card/90">
                          <div className="p-4 border-b border-border/40">
                            <h2 className="text-xl font-bold text-amber-600">Researching</h2>
                          </div>
                          <div className="p-4 space-y-3 min-h-[100px]">
                            {collegesByStatus["researching"]?.map((college) => (
                              <div 
                                key={college.id} 
                                className="p-3 bg-card/80 border border-border/40 rounded-md flex justify-between items-center"
                              >
                                <div className="font-medium text-foreground">{college.name}</div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(college.name)} college`, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Info
                                </Button>
                              </div>
                            ))}
                            {collegesByStatus["researching"]?.length === 0 && (
                              <div className="text-center p-2 text-muted-foreground text-sm">
                                No colleges in this category
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Not Applying Column */}
                      {collegesByStatus["not_applying"] && (
                        <div className="border border-border/40 rounded-lg bg-card/90">
                          <div className="p-4 border-b border-border/40">
                            <h2 className="text-xl font-bold text-red-600">Not Applying</h2>
                          </div>
                          <div className="p-4 space-y-3 min-h-[100px]">
                            {collegesByStatus["not_applying"]?.map((college) => (
                              <div 
                                key={college.id} 
                                className="p-3 bg-card/80 border border-border/40 rounded-md flex justify-between items-center"
                              >
                                <div className="font-medium text-foreground">{college.name}</div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(college.name)} college`, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Info
                                </Button>
                              </div>
                            ))}
                            {collegesByStatus["not_applying"]?.length === 0 && (
                              <div className="text-center p-2 text-muted-foreground text-sm">
                                No colleges in this category
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* College Recommendations Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Recommended Colleges
                    </CardTitle>
                    <CardDescription>
                      AI-generated college recommendations based on student profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {profile.recommendations && profile.recommendations.length > 0 ? (
                        profile.recommendations.map((recommendation) => (
                          <div 
                            key={recommendation.id}
                            className="bg-card/80 border border-border/40 rounded-lg overflow-hidden"
                          >
                            <div className="p-4 border-b border-border/40">
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg">{recommendation.name}</h3>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(recommendation.name)} college`, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Info
                                </Button>
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
                              {recommendation.description && (
                                <div className="mb-3 md:mb-0 md:flex-1">
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">What it is</h4>
                                  <p className="text-sm">{recommendation.description}</p>
                                </div>
                              )}
                              
                              {recommendation.reason && (
                                <div className="md:flex-1">
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Why you might like it</h4>
                                  <p className="text-sm">{recommendation.reason}</p>
                                </div>
                              )}
                            </div>
                            
                            {recommendation.advisorNotes && (
                              <div className="px-4 pb-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Advisor notes</h4>
                                <p className="text-sm italic">{recommendation.advisorNotes}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No recommendations yet</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center pt-2 pb-6">
                    <Button
                      onClick={() => setAddRecommendationOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add a Recommendation
                    </Button>
                  </CardFooter>
                </Card>
              
              {/* Add College Recommendation Dialog */}
              <Dialog open={addRecommendationOpen} onOpenChange={setAddRecommendationOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add College Recommendation</DialogTitle>
                    <DialogDescription>
                      Recommend a college for {profile?.user.username} based on your knowledge of them.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="college-name" className="text-sm font-medium">
                        College Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="college-name"
                        placeholder="Enter college name"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="advisor-notes" className="text-sm font-medium">
                        Why do you recommend this school? (optional)
                      </Label>
                      <Textarea
                        id="advisor-notes"
                        placeholder="Share your thoughts on why this would be a good fit..."
                        value={advisorNotes}
                        onChange={(e) => setAdvisorNotes(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => setAddRecommendationOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddRecommendation}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                      disabled={isSubmitting || !collegeName.trim()}
                    >
                      {isSubmitting ? "Adding..." : "Add Recommendation"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </div>
    </div>
  );
}