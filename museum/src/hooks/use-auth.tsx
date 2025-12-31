import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { User } from "@shared/schema";
import * as mockStore from "@/lib/mockStore";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type LoginData = { username: string; password: string };

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: {
    mutate: (data: LoginData) => void;
    isPending: boolean;
  };
  logoutMutation: {
    mutate: () => void;
    isPending: boolean;
  };
  registerMutation: {
    mutate: (data: LoginData & { onboarding?: any }) => void;
    isPending: boolean;
  };
};

// Create a context
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  // Check for existing user on mount
  useEffect(() => {
    const existingUser = mockStore.getUser();
    setUser(existingUser);
    setIsLoading(false);
  }, []);

  // Login mutation
  const loginMutation = {
    mutate: async (credentials: LoginData) => {
      setIsPending(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const loggedInUser = mockStore.login(credentials.username, credentials.password);
        setUser(loggedInUser);
        toast({
          title: "Login successful",
          description: `Welcome back, ${loggedInUser.username}!`,
        });
        setLocation("/dashboard");
      } catch (error) {
        toast({
          title: "Login failed",
          description: "An error occurred during login.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    isPending,
  };

  // Register mutation
  const registerMutation = {
    mutate: async (credentials: LoginData & { onboarding?: any }) => {
      setIsPending(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newUser = mockStore.register(credentials.username, credentials.password, credentials.onboarding);
        setUser(newUser);
        toast({
          title: "Registration successful",
          description: `Welcome to CollegeWayfarer, ${newUser.username}!`,
        });
        setLocation("/dashboard");
      } catch (error) {
        toast({
          title: "Registration failed",
          description: "An error occurred during registration.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    isPending,
  };

  // Logout mutation
  const logoutMutation = {
    mutate: async () => {
      setIsPending(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        mockStore.logout();
        setUser(null);
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        setLocation("/home");
      } catch (error) {
        toast({
          title: "Logout failed",
          description: "An error occurred during logout.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    },
    isPending,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: null,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
