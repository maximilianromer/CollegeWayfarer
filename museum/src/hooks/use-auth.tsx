import { createContext, ReactNode, useContext, useState, useEffect, useCallback, useMemo } from "react";
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
  const [loginPending, setLoginPending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [registerPending, setRegisterPending] = useState(false);

  // Check for existing user on mount
  useEffect(() => {
    try {
      const existingUser = mockStore.getUser();
      setUser(existingUser);
    } catch (error) {
      console.error("Error checking for existing user:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginData) => {
    setLoginPending(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Perform login
      const loggedInUser = mockStore.login(credentials.username, credentials.password);

      // Update state
      setUser(loggedInUser);

      // Show success toast
      toast({
        title: "Login successful",
        description: `Welcome back, ${loggedInUser.username}!`,
      });

      // Navigate to dashboard after a brief delay to ensure state is set
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setLoginPending(false);
    }
  }, [toast, setLocation]);

  // Register function
  const register = useCallback(async (credentials: LoginData & { onboarding?: any }) => {
    setRegisterPending(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Perform registration
      const newUser = mockStore.register(credentials.username, credentials.password, credentials.onboarding);

      // Update state
      setUser(newUser);

      // Show success toast
      toast({
        title: "Registration successful",
        description: `Welcome to CollegeWayfarer, ${newUser.username}!`,
      });

      // Navigate to dashboard after a brief delay
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setRegisterPending(false);
    }
  }, [toast, setLocation]);

  // Logout function
  const logout = useCallback(async () => {
    setLogoutPending(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Perform logout
      mockStore.logout();

      // Update state
      setUser(null);

      // Show success toast
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });

      // Navigate to home
      setLocation("/home");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    } finally {
      setLogoutPending(false);
    }
  }, [toast, setLocation]);

  // Create mutation objects with useMemo to avoid recreation on every render
  const loginMutation = useMemo(() => ({
    mutate: login,
    isPending: loginPending,
  }), [login, loginPending]);

  const registerMutation = useMemo(() => ({
    mutate: register,
    isPending: registerPending,
  }), [register, registerPending]);

  const logoutMutation = useMemo(() => ({
    mutate: logout,
    isPending: logoutPending,
  }), [logout, logoutPending]);

  const contextValue = useMemo(() => ({
    user,
    isLoading,
    error: null,
    loginMutation,
    logoutMutation,
    registerMutation,
  }), [user, isLoading, loginMutation, logoutMutation, registerMutation]);

  return (
    <AuthContext.Provider value={contextValue}>
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
