import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Clock, Sun, Moon, LogOut, MapPin, Timer, History, FileText, Loader2, PlayCircle, StopCircle, AlertCircle, ChevronRight } from "lucide-react";

function formatMinutes(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";
  return `${sign}${h}h${m.toString().padStart(2, "0")}`;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-center">
      <p className="text-5xl sm:text-6xl font-bold tracking-tight tabular-nums" data-testid="text-live-clock">
        {time.toLocaleTimeString("pt-BR")}
      </p>
      <p className="text-muted-foreground mt-1">
        {time.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}

function WorkTimer({ todayRecords, workHoursMinutes }: { todayRecords: any[]; workHoursMinutes: number }) {
  const [elapsed, setElapsed] = useState(0);

  const calculateElapsed = useCallback(() => {
    if (!todayRecords || todayRecords.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < todayRecords.length; i += 2) {
      const entry = new Date(todayRecords[i].timestamp).getTime();
      const exit = todayRecords[i + 1]
        ? new Date(todayRecords[i + 1].timestamp).getTime()
        : Date.now();
      total += exit - entry;
    }
    return Math.floor(total / 60000);
  }, [todayRecords]);

  useEffect(() => {
    setElapsed(calculateElapsed());
    const interval = setInterval(() => setElapsed(calculateElapsed()), 1000);
    return () => clearInterval(interval);
  }, [calculateElapsed]);

  const remaining = Math.max(0, workHoursMinutes - elapsed);
  const progress = Math.min(100, (elapsed / workHoursMinutes) * 100);
  const overtime = Math.max(0, elapsed - workHoursMinutes);

  const now = new Date();
  const exitTime = new Date(now.getTime() + remaining * 60000);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Trabalhado</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-worked-time">{formatMinutes(elapsed)}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Restante</p>
          <p className="text-lg font-bold" data-testid="text-remaining-time">{formatMinutes(remaining)}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Saida Prevista</p>
          <p className="text-lg font-bold" data-testid="text-exit-time">
            {remaining > 0 ? exitTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Hora Extra</p>
          <p className={`text-lg font-bold ${overtime > 0 ? "text-amber-600 dark:text-amber-400" : ""}`} data-testid="text-overtime">
            {formatMinutes(overtime)}
          </p>
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 bg-primary"
          style={{ width: `${progress}%` }}
          data-testid="progress-work"
        />
      </div>
    </div>
  );
}

export default function EmployeeClockPage() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data: todayData, isLoading } = useQuery({
    queryKey: ["/api/employee/today"],
    queryFn: async () => {
      const res = await fetch("/api/employee/today", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const punchMutation = useMutation({
    mutationFn: async (data: { latitude?: number; longitude?: number }) => {
      const res = await fetch("/api/employee/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/history"] });
      toast({
        title: data.type === "entry" ? "Entrada Registrada" : "Saida Registrada",
        description: `Ponto registrado as ${new Date(data.timestamp).toLocaleTimeString("pt-BR")}`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handlePunch = () => {
    setGeoStatus("loading");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setGeoStatus("success");
          punchMutation.mutate({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        () => {
          setGeoStatus("error");
          punchMutation.mutate({});
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoStatus("error");
      punchMutation.mutate({});
    }
  };

  const isWorking = todayData?.records?.length % 2 === 1;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg" data-testid="text-emp-brand">PontoMax</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-emp-theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2" data-testid="button-emp-user-menu">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Funcionario</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} data-testid="button-emp-logout" className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
        <LiveClock />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handlePunch}
                disabled={punchMutation.isPending || geoStatus === "loading"}
                className={`w-full max-w-xs h-16 text-lg gap-3 ${isWorking ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800" : ""}`}
                data-testid="button-punch"
              >
                {punchMutation.isPending || geoStatus === "loading" ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isWorking ? (
                  <StopCircle className="w-6 h-6" />
                ) : (
                  <PlayCircle className="w-6 h-6" />
                )}
                {punchMutation.isPending ? "Registrando..." : isWorking ? "Registrar Saida" : "Registrar Entrada"}
              </Button>
            </div>

            {isWorking && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-600 dark:text-green-400 font-medium">Trabalhando</span>
              </div>
            )}

            <WorkTimer
              todayRecords={todayData?.records || []}
              workHoursMinutes={todayData?.workHoursMinutes || 528}
            />

            {todayData?.records?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">Registros de Hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {todayData.records.map((record: any, idx: number) => (
                      <div key={record.id} className="flex items-center justify-between py-1.5 border-b last:border-0" data-testid={`today-record-${record.id}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${record.type === "entry" ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-sm font-medium">{record.type === "entry" ? "Entrada" : "Saida"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.latitude && (
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className="text-sm tabular-nums">
                            {new Date(record.timestamp).toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {todayData?.bankHours !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Banco de Horas (Mes)</p>
                      <p className={`text-2xl font-bold ${todayData.bankHours >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} data-testid="text-bank-hours">
                        {todayData.bankHours >= 0 ? "+" : ""}{formatMinutes(todayData.bankHours)}
                      </p>
                    </div>
                    <Timer className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-50">
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
          <Link href="/employee">
            <button type="button" className="flex flex-col items-center gap-1 text-primary" data-testid="nav-clock">
              <Clock className="w-5 h-5" />
              <span className="text-[10px] font-medium">Ponto</span>
            </button>
          </Link>
          <Link href="/employee/history">
            <button type="button" className="flex flex-col items-center gap-1 text-muted-foreground" data-testid="nav-history">
              <History className="w-5 h-5" />
              <span className="text-[10px] font-medium">Historico</span>
            </button>
          </Link>
          <Link href="/employee/adjustments">
            <button type="button" className="flex flex-col items-center gap-1 text-muted-foreground" data-testid="nav-adjustments">
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-medium">Ajustes</span>
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
