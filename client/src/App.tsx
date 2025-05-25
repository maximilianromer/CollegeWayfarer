
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import HomeRedirect from "@/pages/home-redirect";
import AuthPage from "@/pages/auth-page";
import OnboardingPage from "@/pages/onboarding-page";
import DashboardLayout from "@/pages/dashboard/layout";
import SharedProfilePage from "@/pages/shared-profile-page";
import PrivacyPage from "@/pages/privacy-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { ErrorBoundary } from "@/lib/error-boundary";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <ErrorBoundary fallback={<div className="p-8">Sorry, there was an error loading this page.</div>}>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/home" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <ProtectedRoute path="/dashboard" component={DashboardLayout} />
        <ProtectedRoute path="/dashboard/chat" component={DashboardLayout} />
        <ProtectedRoute path="/dashboard/colleges" component={DashboardLayout} />
        <ProtectedRoute path="/dashboard/profile" component={DashboardLayout} />
        <ProtectedRoute path="/dashboard/advisors" component={DashboardLayout} />
        <Route path="/shared/:shareToken" component={SharedProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
