import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User as SelectUser } from "@shared/schema";

export default function ProfileTab() {
  const [user, setUser] = useState<SelectUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchLatestUserData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch fresh user data from server
        const response = await apiRequest("GET", "/api/me");
        const userData = await response.json() as SelectUser;
        
        // Update state and cache
        setUser(userData);
        queryClient.setQueryData(["/api/user"], userData);
        queryClient.setQueryData(["/api/me"], userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        
        // Fallback to cached data if fetch fails
        const cachedUser = queryClient.getQueryData<SelectUser | null>(["/api/user"]);
        if (cachedUser) {
          setUser(cachedUser);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLatestUserData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          {/* AI-Generated Profile Description */}
          <div className="bg-card rounded-lg border border-border/40 p-6">
            <h3 className="text-lg font-medium mb-4">Your College Application Profile</h3>
            
            {isLoading ? (
              <div className="py-4">
                <div className="h-4 bg-muted animate-pulse rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded mb-4 w-full"></div>
                <div className="h-4 bg-muted animate-pulse rounded mb-4 w-5/6"></div>
                <div className="h-4 bg-muted animate-pulse rounded mb-4 w-2/3"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-4/5"></div>
              </div>
            ) : user?.profileDescription ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-line text-foreground font-medium leading-relaxed">{user.profileDescription}</p>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-4">Your profile description is being generated...</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}