import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import * as mockStore from "@/lib/mockStore";

export default function ProfileTab() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const userData = mockStore.getUser();
      setUser(userData);
      setIsLoading(false);
    }, 300);
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
                <p className="text-muted-foreground mb-4">No profile description available.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh
                </Button>
              </div>
            )}
          </div>

          {/* Demo mode notice */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Demo mode: This is a prerecorded profile description.
          </div>
        </div>
      </div>
    </div>
  );
}
