import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import Logo from "@/components/logo";
import { MessageSquare, Building2, User, Menu, X, Users } from "lucide-react";
import ChatTab from "./chat";
import CollegesTab from "./colleges";
import ProfileTab from "./profile";
import AdvisorsTab from "./advisors";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User as SelectUser } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("chat");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SelectUser | null>(null);
  const { toast } = useToast();

  const [location] = useLocation();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check if we have user in cache
        const cachedUser = queryClient.getQueryData<SelectUser | null>(["/api/user"]);
        
        if (cachedUser) {
          setUser(cachedUser);
          return;
        }
        
        // If not in cache, fetch from API
        const response = await apiRequest("GET", "/api/user").catch(() => null);

        if (response && response.ok) {
          const userData = await response.json() as SelectUser;
          if (userData) {
            setUser(userData);
            // Update cache
            queryClient.setQueryData(["/api/user"], userData);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    // Extract the tab from the URL
    const path = location.split("/").pop();
    
    if (path === "dashboard" || !path) {
      setActiveTab("chat");
    } else if (["chat", "colleges", "profile", "advisors"].includes(path)) {
      setActiveTab(path);
    }
  }, [location]);

  function handleTabClick(tab: string) {
    setActiveTab(tab);
    setLocation(`/dashboard/${tab === "chat" ? "" : tab}`);
    setMobileMenuOpen(false);
  }

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/logout");
      
      // Clear user from cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Show success message
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      
      // Redirect to home
      setLocation("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  }

  // User initials for avatar
  const userInitials = user?.username.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Mobile header */}
      <header className="flex lg:hidden items-center justify-between p-4 border-b border-border/40 bg-card sticky top-0 z-50">
        <Logo className="text-xl" />
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </header>
      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border/80 bg-sidebar fixed h-screen">
          <div className="p-4 border-b border-border/40">
            <Logo />
          </div>

          <nav className="flex-1 p-4 overflow-y-auto flex flex-col">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleTabClick("chat")}
                  className={`w-full flex items-center text-left px-3 py-2 rounded-md ${
                    activeTab === "chat"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Chat
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick("colleges")}
                  className={`w-full flex items-center text-left px-3 py-2 rounded-md ${
                    activeTab === "colleges"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Building2 className="h-5 w-5 mr-2" />
                  Colleges
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick("profile")}
                  className={`w-full flex items-center text-left px-3 py-2 rounded-md ${
                    activeTab === "profile"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <User className="h-5 w-5 mr-2" />
                  My Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick("advisors")}
                  className={`w-full flex items-center text-left px-3 py-2 rounded-md ${
                    activeTab === "advisors"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Advisors
                </button>
              </li>
            </ul>
            
            <div className="mt-auto pt-6">
              <a 
                href="/privacy" 
                target="_blank" 
                className="text-xs text-muted-foreground hover:text-foreground hover:underline block px-3"
              >Privacy</a>
            </div>
          </nav>

          <div className="p-4 border-t border-border/40">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-2">
                    <span className="text-primary text-sm font-medium">
                      {userInitials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {user?.username}
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleTabClick("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background pt-16">
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleTabClick("chat")}
                    className={`w-full flex items-center text-left px-3 py-3 rounded-md ${
                      activeTab === "chat"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 mr-3" />
                    Chat
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleTabClick("colleges")}
                    className={`w-full flex items-center text-left px-3 py-3 rounded-md ${
                      activeTab === "colleges"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Building2 className="h-5 w-5 mr-3" />
                    Colleges
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleTabClick("profile")}
                    className={`w-full flex items-center text-left px-3 py-3 rounded-md ${
                      activeTab === "profile"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <User className="h-5 w-5 mr-3" />
                    My Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleTabClick("advisors")}
                    className={`w-full flex items-center text-left px-3 py-3 rounded-md ${
                      activeTab === "advisors"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Users className="h-5 w-5 mr-3" />
                    Advisors
                  </button>
                </li>
              </ul>
              <div className="pt-4 mt-4 border-t border-border/40">
                <div className="flex items-center mb-3 px-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary font-medium">{userInitials}</span>
                  </div>
                  <div>
                    <p className="font-medium">{user?.username}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-foreground/70"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
                <div className="mt-6 px-3">
                  <a 
                    href="/privacy" 
                    target="_blank" 
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-64">
          {activeTab === "chat" && <ChatTab />}
          {activeTab === "colleges" && <CollegesTab />}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "advisors" && <AdvisorsTab />}
        </main>
      </div>
    </div>
  );
}
