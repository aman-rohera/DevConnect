import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { Profile } from "@/pages/Profile";
import { ResetPassword } from "@/pages/ResetPassword";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { ConnectionsPage } from "@/pages/ConnectionsPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { JobsPage } from "@/pages/JobsPage";
import { CreateCompanyPage } from "@/pages/CreateCompanyPage";
import { CompanyPage } from "@/pages/CompanyPage";
import { CompanyDashboardPage } from "@/pages/CompanyDashboardPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { AppShell } from "@/components/layout/AppShell";
import { AppDataProvider } from "@/lib/app-data";
import { ChatDataProvider } from "@/lib/chat-data";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import "@/styles.css";

/**
 * Profile Route Wrapper
 * Uses the route parameter `id` as a key to force React to unmount
 * and remount the Profile component when navigating between different profiles.
 */
const ProfileRouteWrapper = () => {
  const { username } = useParams<{ username: string }>();
  return <Profile key={username || "me"} />;
};

/**
 * Protected Route Wrapper
 * Intercepts routing, displays loading indicator during session verification,
 * and guards resources by enforcing login authentication.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Guest Route Wrapper
 * Prevents authenticated users from seeing Login or Register pages.
 */
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * App Layout Wrapper
 * Nesting route outlet inside AppShell.
 */
const AppShellLayout = () => {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppDataProvider>
            <ChatDataProvider>
              <Routes>
                {/* Guest Auth Routes */}
                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <Login />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <GuestRoute>
                      <Register />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <GuestRoute>
                      <ForgotPasswordPage />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/reset-password"
                  element={<ResetPassword />}
                />

                {/* Secure Internal Routes */}
                <Route element={<ProtectedRoute><AppShellLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<ProfileRouteWrapper />} />
                  <Route path="/profile/:username" element={<ProfileRouteWrapper />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/recommendations" element={<Navigate to="/connections" replace />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/connections" element={<ConnectionsPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/companies/create" element={<CreateCompanyPage />} />
                  <Route path="/companies/manage" element={<CompanyDashboardPage />} />
                  <Route path="/companies/:id/manage" element={<CompanyDashboardPage />} />
                  <Route path="/company/:slug" element={<CompanyPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                </Route>

                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster position="bottom-right" theme="dark" />
            </ChatDataProvider>
          </AppDataProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
