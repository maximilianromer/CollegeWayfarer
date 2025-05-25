import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import Logo from "@/components/logo";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User as SelectUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Schemas for form validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Login handler
  const handleLogin = async (data: LoginFormValues) => {
    try {
      setIsLoggingIn(true);
      const res = await apiRequest("POST", "/api/login", data);
      const user = await res.json();
      
      // Update both cache entries
      queryClient.setQueryData(["/api/me"], user);
      queryClient.setQueryData(["/api/user"], user);
      
      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
      
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Register handler
  const handleRegister = async (data: RegisterFormValues) => {
    try {
      setIsRegistering(true);
      const res = await apiRequest("POST", "/api/register", data);
      const user: SelectUser = await res.json();
      
      // Update both cache entries
      queryClient.setQueryData(["/api/me"], user);
      queryClient.setQueryData(["/api/user"], user);
      
      // Show success message
      toast({
        title: "Registration successful",
        description: `Welcome to CollegeWayfarer, ${user.username}!`,
      });
      
      // Redirect to dashboard using window.location for a full reload
      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Auth Form Section */}
      <div className="flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block cursor-pointer mb-6" onClick={() => setLocation("/")}>
              <Logo />
            </div>
            <h1 className="text-2xl font-bold mb-1">Welcome to CollegeWayfarer</h1>
            <p className="text-muted-foreground">Your personal college counselor</p>
          </div>

          <Tabs 
            defaultValue={window.location.search.includes('tab=signup') ? 'signup' : 'login'} 
            className="w-full"
            onValueChange={(value) => {
              if (value === 'signup') {
                setLocation('/onboarding');
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <div className="bg-card p-6 rounded-lg border border-border/40">
                <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        placeholder="Enter your username"
                        {...loginForm.register("username")}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Log in"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            {/* Sign Up Tab - Left empty as we redirect to onboarding */}
            <TabsContent value="signup">
              <div className="bg-card p-6 rounded-lg border border-border/40 text-center">
                <p className="mb-4">You'll be redirected to our onboarding process...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-card/50 border-l border-border/40">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6 tracking-tighter">
            AI-Powered College <span className="text-primary">Counseling</span>
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Personalized College Recommendations</h3>
                <p className="text-muted-foreground text-sm">Get recommendations based on your unique academic profile and interests</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Share with Advisors</h3>
                <p className="text-muted-foreground text-sm">Collaborate with counselors and mentors who can guide your college journey</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">24/7 Support</h3>
                <p className="text-muted-foreground text-sm">Chat with your AI counselor anytime, get answers to all your college questions</p>
              </div>
            </li>
          </ul>

          {/* Testimonial removed */}
        </div>
      </div>
    </div>
  );
}