import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

/**
 * HomeRedirect component
 * Redirects from home page (/) to appropriate page based on authentication state
 * - If user is authenticated, redirect to dashboard
 * - If user is not authenticated, redirect to homepage
 */
export default function HomeRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // If user is logged in, redirect to dashboard
        setLocation("/dashboard");
      } else {
        // If user is not logged in, redirect to homepage
        setLocation("/home");
      }
    }
  }, [user, isLoading, setLocation]);

  // Show loading spinner while checking auth state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Redirecting...</span>
    </div>
  );
}
