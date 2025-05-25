import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdvisorType, AdvisorTypeValue } from "@shared/schema";
import { fetchAdvisors, createAdvisor, updateAdvisorStatus, deleteAdvisor, getShareUrl } from "@/lib/advisorApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialog } from "@/components/ui/alert-dialog";
import { ShareChatsDialog } from "@/components/ShareChatsDialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2, UserPlus, Link, Mail, Share2, MessageSquare } from "lucide-react";

export default function AdvisorsTab() {
  const [name, setName] = useState("");
  const [type, setType] = useState<AdvisorTypeValue>(AdvisorType.SCHOOL_COUNSELOR);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [shareDialogAdvisor, setShareDialogAdvisor] = useState<any>(null);
  const [deleteDialogAdvisor, setDeleteDialogAdvisor] = useState<any>(null);
  const [shareChatDialogOpen, setShareChatDialogOpen] = useState(false);
  const [selectedAdvisorForChats, setSelectedAdvisorForChats] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch advisors
  const { data: advisors = [], isLoading } = useQuery({
    queryKey: ["/api/advisors"],
    queryFn: async () => {
      const response = await fetchAdvisors();
      return Array.isArray(response) ? response : [];
    },
  });

  // Create advisor mutation
  const createAdvisorMutation = useMutation({
    mutationFn: (data: Omit<{ name: string; type: AdvisorTypeValue }, "userId">) => 
      createAdvisor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      setIsAddDialogOpen(false);
      setName("");
      setType(AdvisorType.SCHOOL_COUNSELOR);
      toast({
        title: "Advisor added",
        description: "The advisor has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating advisor:", error);
      toast({
        title: "Error",
        description: "Failed to add advisor. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update advisor status mutation
  const updateAdvisorStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      updateAdvisorStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      toast({
        title: "Status updated",
        description: "The advisor's status has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating advisor status:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete advisor mutation
  const deleteAdvisorMutation = useMutation({
    mutationFn: (id: number) => deleteAdvisor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      setDeleteDialogAdvisor(null);
      toast({
        title: "Advisor deleted",
        description: "The advisor has been removed.",
      });
    },
    onError: (error) => {
      console.error("Error deleting advisor:", error);
      toast({
        title: "Error",
        description: "Failed to delete advisor. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle adding a new advisor
  const handleAddAdvisor = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the advisor.",
        variant: "destructive",
      });
      return;
    }

    createAdvisorMutation.mutate({ name, type });
  };

  // Handle toggling advisor status
  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    updateAdvisorStatusMutation.mutate({
      id,
      isActive: !currentStatus,
    });
  };

  // Handle copying share link
  const handleCopyShareLink = (shareToken: string) => {
    const shareUrl = getShareUrl(shareToken);
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard.",
    });
  };

  // Handle sharing via email
  const handleEmailShare = (advisor: any) => {
    const shareUrl = getShareUrl(advisor.shareToken);
    const subject = encodeURIComponent(`${advisor.name} has shared a college application profile with you`);
    const body = encodeURIComponent(`Hello,\n\n${advisor.name} has shared a college application profile with you. You can view it at:\n\n${shareUrl}\n\nRegards,\nCollegeWayfarer`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Open the share chats dialog
  const handleOpenShareChatsDialog = (advisor: any) => {
    setSelectedAdvisorForChats(advisor);
    setShareChatDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Advisors</h1>
          <p className="text-muted-foreground">
            Share your college application progress with counselors, family members, and other advisors
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Advisor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Advisor</DialogTitle>
              <DialogDescription>
                Add someone who helps you with your college applications. They'll receive a link to view your profile and college list.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter advisor's name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Advisor Type</Label>
                <Select 
                  value={type} 
                  onValueChange={(value) => setType(value as AdvisorTypeValue)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AdvisorType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAdvisor} disabled={createAdvisorMutation.isPending}>
                {createAdvisorMutation.isPending ? "Adding..." : "Add Advisor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Share Chats Dialog */}
      <ShareChatsDialog 
        open={shareChatDialogOpen}
        onOpenChange={setShareChatDialogOpen}
        advisor={selectedAdvisorForChats}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : advisors.length === 0 ? (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>No advisors added yet</CardTitle>
            <CardDescription>
              Add an advisor to share your college application progress with them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <UserPlus className="h-16 w-16 text-muted-foreground mb-6" />
              <p className="text-center text-muted-foreground max-w-md mb-6">
                Add counselors, family members, or other advisors who help you with your college applications.
                They'll receive a link to view your profile and college lists.
              </p>
              <Button 
                variant="default" 
                onClick={() => setIsAddDialogOpen(true)}
                className="mt-2"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Advisor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {advisors.map((advisor) => (
            <Card key={advisor.id} className={`${advisor.isActive ? "" : "opacity-70"} overflow-hidden`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{advisor.name}</CardTitle>
                    <CardDescription>{advisor.type}</CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeleteDialogAdvisor(advisor)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    {deleteDialogAdvisor && (
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete advisor</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {deleteDialogAdvisor.name} as an advisor? 
                            Their share link will no longer work.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setDeleteDialogAdvisor(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => deleteAdvisorMutation.mutate(deleteDialogAdvisor.id)}
                            disabled={deleteAdvisorMutation.isPending}
                          >
                            {deleteAdvisorMutation.isPending ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    )}
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={advisor.isActive}
                      onCheckedChange={() => handleToggleStatus(advisor.id, advisor.isActive)}
                      disabled={updateAdvisorStatusMutation.isPending}
                    />
                    <Label>
                      {advisor.isActive ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 justify-between pt-1">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenShareChatsDialog(advisor)}
                  disabled={!advisor.isActive}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Share Chats
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShareDialogAdvisor(advisor)}
                      disabled={!advisor.isActive}
                      className="flex-shrink-0"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Send Invite
                    </Button>
                  </DialogTrigger>
                  {shareDialogAdvisor && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share with {shareDialogAdvisor.name}</DialogTitle>
                        <DialogDescription>
                          Send this link to {shareDialogAdvisor.name} so they can view your college application progress
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center space-x-2 mt-2">
                        <Input 
                          readOnly 
                          value={getShareUrl(shareDialogAdvisor.shareToken)}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyShareLink(shareDialogAdvisor.shareToken)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <DialogFooter className="mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => handleEmailShare(shareDialogAdvisor)}
                          className="w-full"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send via Email
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  )}
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}