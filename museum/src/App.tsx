import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
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
import { AuthProvider } from "@/hooks/use-auth";
import { MuseumBanner, MUSEUM_BANNER_HEIGHT } from "@/components/MuseumBanner";

function Router() {
  return (
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
  );
}

function App() {
  return (
    <WouterRouter hook={useHashLocation}>
      <AuthProvider>
        <MuseumBanner />
        <div style={{ paddingTop: MUSEUM_BANNER_HEIGHT }}>
          <Router />
        </div>
        <Toaster />
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
