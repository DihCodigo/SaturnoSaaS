import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Clock, History, FileText, Calendar, Sun, Moon, LogOut, MapPin } from "lucide-react";

function formatMinutes(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";
  return `${sign}${h}h${m.toString().padStart(2, "0")}`;
}

export default function EmployeeHistoryPage() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { data: history, isLoading } = useQuery({
    queryKey: ["/api/employee/history"],
    queryFn: async () => {
      const res = await fetch("/api/employee/history", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">PontoMax</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Funcionario</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-history-title">Historico</h1>
          <p className="text-muted-foreground">Seus registros de ponto</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : history?.length > 0 ? (
          <div className="space-y-4">
            {history.map((day: any) => (
              <Card key={day.date} data-testid={`card-history-${day.date}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{day.dateFormatted}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{formatMinutes(day.totalMinutes)}</Badge>
                      {day.overtime > 0 && (
                        <Badge variant="default">+{formatMinutes(day.overtime)} extra</Badge>
                      )}
                      {day.deficit > 0 && (
                        <Badge variant="destructive">-{formatMinutes(day.deficit)}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {day.records.map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between py-1 text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${record.type === "entry" ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-muted-foreground">{record.type === "entry" ? "Entrada" : "Saida"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.latitude && <MapPin className="w-3 h-3 text-muted-foreground" />}
                          <span className="tabular-nums font-medium">{new Date(record.timestamp).toLocaleTimeString("pt-BR")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum registro encontrado</p>
            </CardContent>
          </Card>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-50">
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
          <Link href="/employee">
            <button type="button" className="flex flex-col items-center gap-1 text-muted-foreground" data-testid="nav-clock-2">
              <Clock className="w-5 h-5" />
              <span className="text-[10px] font-medium">Ponto</span>
            </button>
          </Link>
          <Link href="/employee/history">
            <button type="button" className="flex flex-col items-center gap-1 text-primary" data-testid="nav-history-2">
              <History className="w-5 h-5" />
              <span className="text-[10px] font-medium">Historico</span>
            </button>
          </Link>
          <Link href="/employee/adjustments">
            <button type="button" className="flex flex-col items-center gap-1 text-muted-foreground" data-testid="nav-adjustments-2">
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-medium">Ajustes</span>
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
