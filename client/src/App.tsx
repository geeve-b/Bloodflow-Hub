import { lazy, Suspense, type ComponentType } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, homePathFor, useAuth, type AuthUser } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import LandingPage from "@/pages/LandingPage";

// Everything except the landing page is split into its own chunk
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const StaffRegisterPage = lazy(() => import("@/pages/StaffRegisterPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const HospitalStaffDashboard = lazy(() => import("@/pages/HospitalStaffDashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const NotFound = lazy(() => import("@/pages/not-found"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const VerifyResetOtpPage = lazy(() => import("@/pages/VerifyResetOtpPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const DonorDashboard = lazy(() => import("@/pages/DonorDashboard"));

type Role = AuthUser["role"];

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function Protected({ component: Component, roles }: { component: ComponentType; roles: Role[] }) {
  const { user, isLoading } = useAuth();
  if (!user) {
    return isLoading ? <PageLoader /> : <Redirect to="/login" />;
  }
  if (!roles.includes(user.role)) {
    return <Redirect to={homePathFor(user.role)} />;
  }
  return <Component />;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/staff-register" component={StaffRegisterPage} />
            <Route path="/verify-email" component={VerifyEmailPage} />
            <Route path="/forgot-password" component={ForgotPasswordPage} />
            <Route path="/verify-reset-otp" component={VerifyResetOtpPage} />
            <Route path="/reset-password" component={ResetPasswordPage} />
            <Route path="/dashboard">
              <Protected component={DashboardPage} roles={["donor", "receiver"]} />
            </Route>
            <Route path="/donor-dashboard">
              <Protected component={DonorDashboard} roles={["donor", "receiver"]} />
            </Route>
            <Route path="/hospital-dashboard">
              <Protected component={HospitalStaffDashboard} roles={["hospital"]} />
            </Route>
            <Route path="/admin">
              <Protected component={AdminDashboard} roles={["admin"]} />
            </Route>
            <Route path="/about" component={AboutPage} />
            <Route path="/contact" component={ContactPage} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
