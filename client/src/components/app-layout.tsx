import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, LayoutDashboard, Users, Settings, Calendar, FileText, Sun, Moon, LogOut, Menu, X, Building2, BarChart3 } from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminNavItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/employees", label: "Funcionarios", icon: Users },
    { path: "/admin/adjustments", label: "Ajustes", icon: FileText },
    { path: "/admin/holidays", label: "Feriados", icon: Calendar },
    { path: "/admin/reports", label: "Relatorios", icon: BarChart3 },
    { path: "/admin/settings", label: "Configuracoes", icon: Settings },
  ];

  const masterNavItems = [
    { path: "/master", label: "Dashboard", icon: LayoutDashboard },
    { path: "/master/companies", label: "Empresas", icon: Building2 },
  ];

  const navItems = user?.role === "admin_master" ? masterNavItems : adminNavItems;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href={user?.role === "admin_master" ? "/master" : "/admin"} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg hidden sm:inline" data-testid="text-brand">Saturno</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 text-sm ${isActive ? "font-semibold" : "font-normal"}`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle" className="h-8 w-8">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2" data-testid="button-user-menu">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-2">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.role === "admin_master" ? "Admin Master" : "Admin Empresa"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} data-testid="button-logout" className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background p-2">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={isActive ? "secondary" : "ghost"} className={`w-full justify-start gap-2 ${isActive ? "font-semibold" : ""}`} size="sm">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      <main className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
