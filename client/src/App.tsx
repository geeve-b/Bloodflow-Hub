import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import StaffRegisterPage from "@/pages/StaffRegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import HospitalStaffDashboard from "@/pages/HospitalStaffDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import NotFound from "@/pages/not-found";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import VerifyResetOtpPage from "@/pages/VerifyResetOtpPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DonorDashboard from "@/pages/DonorDashboard";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/staff-register" component={StaffRegisterPage} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/verify-reset-otp" component={VerifyResetOtpPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/donor-dashboard" component={DonorDashboard} />
          <Route path="/hospital-dashboard" component={HospitalStaffDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contact" component={ContactPage} />
          <Route component={NotFound} />
        </Switch>
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
          <DataProvider>
            <Router />
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
