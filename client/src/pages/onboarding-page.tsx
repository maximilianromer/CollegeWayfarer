import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, onboardingSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  GraduationCap, 
  Building2, 
  MapPin, 
  Users, 
  CheckSquare 
} from "lucide-react";

// Schema for onboarding responses
const onboardingResponseSchema = onboardingSchema;

// Schema for signup form
const registerSchema = insertUserSchema.pick({
  username: true,
  password: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type OnboardingFormValues = z.infer<typeof onboardingResponseSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Onboarding questions with icons and descriptions
const questions = [
  {
    key: "programs",
    question: "What programs and majors interest you?",
    description: "Tell us about your academic interests such as engineering, arts, business, etc.",
    placeholder: "I'm interested in studying...",
    icon: GraduationCap,
  },
  {
    key: "academicEnv",
    question: "What's your ideal academic environment?",
    description: "Consider class sizes, professor accessibility, research opportunities, etc.",
    placeholder: "I prefer learning environments that are...",
    icon: Building2,
  },
  {
    key: "location",
    question: "Do you have location preferences?",
    description: "Urban or rural campus? Specific region or climate? Distance from home?",
    placeholder: "My ideal location would be...",
    icon: MapPin,
  },
  {
    key: "culture",
    question: "What campus culture are you looking for?",
    description: "Consider social scene, sports, diversity, political climate, etc.",
    placeholder: "I'm looking for a campus where...",
    icon: Users,
  },
  {
    key: "academicStats",
    question: "What are your academic achievements?",
    description: "Provide your GPA, standardized test scores, and other academic achievements to help us provide relevant information",
    placeholder: "My academic achievements include...",
    icon: GraduationCap,
  },
  {
    key: "financialAid",
    question: "How do you plan to pay for college?",
    description: "Tell us about your need for financial aid, scholarships, etc.",
    placeholder: "My financial situation and needs include...",
    icon: CheckSquare,
  },
  {
    key: "other",
    question: "What other factors are important to you?",
    description: "Consider support services, accommodations, special programs like women's colleges or HBCUs, etc.",
    placeholder: "Other important factors for me include...",
    icon: CheckSquare,
  },
];

export default function OnboardingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingResponses, setOnboardingResponses] = useState<Partial<OnboardingFormValues>>({});
  
  // Progress percentage calculation
  const progress = (currentStep / (questions.length + 1)) * 100;
  
  // Form for onboarding questions
  const onboardingForm = useForm<Partial<OnboardingFormValues>>({
    defaultValues: onboardingResponses,
  });
  
  // Watch the current question input to enable/disable the next button
  const currentKey = currentStep < questions.length ? questions[currentStep].key as keyof OnboardingFormValues : null;
  const currentInput = currentKey ? onboardingForm.watch(currentKey) : null;
  
  // Effect to update the form with saved responses when step changes
  useEffect(() => {
    if (currentKey) {
      // Reset the form value for the current field to ensure no carryover
      // Then set it to the saved value if one exists
      onboardingForm.setValue(currentKey, onboardingResponses[currentKey] || '');
    }
  }, [currentStep, currentKey]);

  // Form for signup (username/password)
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle next button in the onboarding flow
  const handleNext = () => {
    const currentKey = questions[currentStep].key as keyof OnboardingFormValues;
    const value = onboardingForm.watch(currentKey);
    
    // Always save the current response, even if empty
    setOnboardingResponses(prev => ({
      ...prev,
      [currentKey]: value || '',
    }));
    
    // Move to the next step
    setCurrentStep(currentStep + 1);
  };

  // Handle back button in the onboarding flow
  const handleBack = () => {
    if (currentStep > 0) {
      // Save the current question's response before moving back
      const currentKey = questions[currentStep].key as keyof OnboardingFormValues;
      const value = onboardingForm.watch(currentKey);
      
      // Always save the current response, even if empty
      setOnboardingResponses(prev => ({
        ...prev,
        [currentKey]: value || '',
      }));
      
      // Move to the previous step
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle final signup submission
  const handleSignup = async (data: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Combine user registration data with onboarding responses
      const userData = {
        username: data.username,
        password: data.password,
        onboarding: onboardingResponses,
      };
      
      // Register the user with onboarding data
      const res = await apiRequest("POST", "/api/register", userData);
      const user = await res.json();
      
      // Update the user cache
      queryClient.setQueryData(["/api/user"], user);
      
      // After registration, log in the user
      try {
        // Perform login with the same credentials
        const loginRes = await apiRequest("POST", "/api/login", {
          username: data.username,
          password: data.password,
        });
        
        const loggedInUser = await loginRes.json();
        
        // Update cache again with the logged-in user
        queryClient.setQueryData(["/api/user"], loggedInUser);
        
        // Generate profile immediately
        try {
          // Show initial success message
          toast({
            title: "Registration successful",
            description: `Welcome to CollegeWayfarer, ${user.username}! Creating your profile...`,
          });
          
          // Make an API call to generate the profile - ensure we wait for this to complete
          console.log("Sending profile generation request with data:", {
            username: user.username,
            onboarding: JSON.stringify(onboardingResponses)
          });
          
          const profileResponse = await apiRequest("POST", "/api/generate-profile", {
            username: user.username,
            onboarding: onboardingResponses,
          });
          
          console.log("Profile generation response status:", profileResponse.status);
          
          if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            console.error("Profile generation failed. Server response:", errorText);
            throw new Error("Failed to generate profile: " + errorText);
          }
          
          const profileData = await profileResponse.json();
          console.log("Profile data received:", profileData);
          
          // Update the user object with the profile description
          if (profileData && profileData.profileDescription) {
            // Update the cached user data with the new profile
            const updatedUser = {
              ...loggedInUser,
              profileDescription: profileData.profileDescription
            };
            queryClient.setQueryData(["/api/user"], updatedUser);
            queryClient.setQueryData(["/api/me"], updatedUser);
            
            console.log("Profile generated successfully:", profileData.profileDescription.substring(0, 50) + "...");
            
            // Show confirmation message
            toast({
              title: "Profile created",
              description: "Your student profile has been created successfully!",
            });
          }
          
          // Redirect to dashboard
          window.location.href = "/dashboard";
        } catch (profileError) {
          console.error("Profile generation error:", profileError);
          // Log the full error details for debugging
          if (profileError instanceof Error) {
            console.error("Error message:", profileError.message);
            console.error("Error stack:", profileError.stack);
          } else {
            console.error("Unknown error type:", typeof profileError);
          }
          
          // Even if profile generation fails, still redirect to dashboard
          toast({
            title: "Registration successful",
            description: `Welcome to CollegeWayfarer, ${user.username}! We'll prepare your profile soon.`,
            variant: "default"
          });
          
          // Add a delay before redirecting to ensure toast is seen
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        }
      } catch (loginError) {
        console.error("Auto login failed:", loginError);
        // If auto-login fails, redirect to auth page
        toast({
          title: "Registration successful",
          description: "Your account was created successfully. Please log in.",
        });
        window.location.href = "/auth";
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Current question data
  const currentQuestion = currentStep < questions.length 
    ? questions[currentStep] 
    : null;
  
  // Current icon component
  const IconComponent = currentQuestion?.icon;

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Header */}
      <header className="py-4 bg-background border-b border-border/40 sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => window.location.href = "/"}>
            <Logo />
          </div>
          <div>
            <span className="mr-2 text-muted-foreground hidden sm:inline-block">Already have an account?</span>
            <Button variant="outline" onClick={() => window.location.href = "/auth"}>
              Log in
            </Button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="container max-w-6xl mx-auto px-4 mt-2">
        <Progress value={progress} className="h-1" />
        <p className="text-sm text-muted-foreground my-2 font-medium">
          Step {currentStep + 1} of {questions.length + 1}
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 w-full py-6 md:py-12 flex items-center justify-center">
        <div className="w-full max-w-3xl mx-auto px-4">
          {currentStep < questions.length ? (
            /* Onboarding Questions */
            <Card className="border-border/30 shadow-md w-full">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-3">
                  {IconComponent && (
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-xl md:text-2xl">{currentQuestion?.question}</CardTitle>
                    <CardDescription className="text-sm md:text-base mt-1">
                      {currentQuestion?.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-6">
                <Textarea 
                  placeholder={currentQuestion?.placeholder}
                  className="h-40 resize-none focus-visible:ring-primary/70 text-base"
                  {...onboardingForm.register(currentQuestion?.key as any)}
                  value={onboardingForm.watch(currentQuestion?.key as keyof OnboardingFormValues) || ''}
                  onChange={(e) => onboardingForm.setValue(currentQuestion?.key as keyof OnboardingFormValues, e.target.value)}
                />
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border/30 pt-6 pb-4">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  size="default"
                  className="gap-1.5 px-4"
                >
                  <ArrowLeft className="h-4 w-4" /> 
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div className="flex-1"></div>
                <Button 
                  onClick={handleNext}
                  size="default"
                  className="gap-1.5 bg-primary hover:bg-primary/90 px-5"
                  disabled={!currentInput}
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            /* Final step: Create account */
            <Card className="border-border/30 shadow-md w-full">
              <CardHeader className="text-center border-b border-border/10 pb-6">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <GraduationCap className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl">Create Your Account</CardTitle>
                <CardDescription className="text-base max-w-md mx-auto mt-2">
                  Almost done! Set up your credentials to access your personalized college counseling.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={registerForm.handleSubmit(handleSignup)} className="space-y-6 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="text-sm font-medium">Username</Label>
                    <Input
                      id="signup-username"
                      placeholder="Choose a username"
                      className="focus-visible:ring-primary/70"
                      {...registerForm.register("username")}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      className="focus-visible:ring-primary/70"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="text-center text-xs text-muted-foreground mt-4 mb-2">
                    By signing up, you affirm that you are above 13 years of age, and agree to our{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </div>

                  <div className="flex justify-between gap-4 pt-6">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={handleBack}
                      className="gap-1.5 px-4 border-border/50"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90 py-2.5"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step indicators */}
          <div className="flex justify-center mt-8 gap-2.5">
            {questions.map((_, index) => (
              <div 
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep 
                    ? 'bg-primary' 
                    : index < currentStep 
                      ? 'bg-primary/50' 
                      : 'bg-muted-foreground/20'
                }`}
              />
            ))}
            <div 
              className={`h-2 w-2 rounded-full ${
                currentStep === questions.length 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/20'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}