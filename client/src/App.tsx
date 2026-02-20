import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ChangePasswordPage from "@/pages/change-password";
import AdminDashboard from "@/pages/admin/dashboard";
import EmployeesPage from "@/pages/admin/employees";
import AdjustmentsPage from "@/pages/admin/adjustments";
import HolidaysPage from "@/pages/admin/holidays";
import SettingsPage from "@/pages/admin/settings";
import ReportsPage from "@/pages/admin/reports";
import EmployeeClockPage from "@/pages/employee/clock";
import EmployeeHistoryPage from "@/pages/employee/history";
import EmployeeAdjustmentsPage from "@/pages/employee/adjustments";
import MasterDashboard from "@/pages/master/dashboard";

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Redirect to="/" />;
  if (user.mustChangePassword) return <Redirect to="/change-password" />;
  if (!roles.includes(user.role)) return <Redirect to="/" />;

  return <Component />;
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (user && !user.mustChangePassword) {
    if (user.role === "admin_master") return <Redirect to="/master" />;
    if (user.role === "admin_company") return <Redirect to="/admin" />;
    return <Redirect to="/employee" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AuthRoute component={LoginPage} />} />
      <Route path="/register" component={() => <AuthRoute component={RegisterPage} />} />
      <Route path="/change-password" component={ChangePasswordPage} />

      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} roles={["admin_company"]} />} />
      <Route path="/admin/employees" component={() => <ProtectedRoute component={EmployeesPage} roles={["admin_company"]} />} />
      <Route path="/admin/adjustments" component={() => <ProtectedRoute component={AdjustmentsPage} roles={["admin_company"]} />} />
      <Route path="/admin/holidays" component={() => <ProtectedRoute component={HolidaysPage} roles={["admin_company"]} />} />
      <Route path="/admin/reports" component={() => <ProtectedRoute component={ReportsPage} roles={["admin_company"]} />} />
      <Route path="/admin/settings" component={() => <ProtectedRoute component={SettingsPage} roles={["admin_company"]} />} />

      <Route path="/employee" component={() => <ProtectedRoute component={EmployeeClockPage} roles={["employee"]} />} />
      <Route path="/employee/history" component={() => <ProtectedRoute component={EmployeeHistoryPage} roles={["employee"]} />} />
      <Route path="/employee/adjustments" component={() => <ProtectedRoute component={EmployeeAdjustmentsPage} roles={["employee"]} />} />

      <Route path="/master" component={() => <ProtectedRoute component={MasterDashboard} roles={["admin_master"]} />} />
      <Route path="/master/companies" component={() => <ProtectedRoute component={MasterDashboard} roles={["admin_master"]} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
