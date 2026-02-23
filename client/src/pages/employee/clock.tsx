import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Clock, Sun, Moon, LogOut, MapPin, Timer, History, FileText, Loader2, PlayCircle, StopCircle, AlertTriangle } from "lucide-react";

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
      <p className="text-sm text-muted-foreground mt-2">
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
        <Card className="border-0 bg-muted/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Trabalhado</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5" data-testid="text-worked-time">{formatMinutes(elapsed)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Restante</p>
            <p className="text-lg font-bold mt-0.5" data-testid="text-remaining-time">{formatMinutes(remaining)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Saida Prevista</p>
            <p className="text-lg font-bold mt-0.5" data-testid="text-exit-time">
              {remaining > 0 ? exitTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Hora Extra</p>
            <p className={`text-lg font-bold mt-0.5 ${overtime > 0 ? "text-amber-600 dark:text-amber-400" : ""}`} data-testid="text-overtime">
              {formatMinutes(overtime)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
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
  const [location] = useLocation();
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; lastPunchTime: string; lastPunchType: string; minutesSince: number } | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ latitude?: number; longitude?: number } | null>(null);

  const { data: todayData, isLoading } = useQuery({
    queryKey: ["/api/employee/today"],
    queryFn: async () => {
      const res = await fetch("/api/employee/today", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const doPunch = async (data: { latitude?: number; longitude?: number; force?: boolean }) => {
    const res = await fetch("/api/employee/punch", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 409 && json.recentPunch) {
      throw { recentPunch: true, ...json };
    }
    if (!res.ok) {
      throw new Error(json.message);
    }
    return json;
  };

  const punchMutation = useMutation({
    mutationFn: doPunch,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/history"] });
      setConfirmDialog(null);
      setPendingCoords(null);
      toast({
        title: data.type === "entry" ? "Entrada Registrada" : "Saida Registrada",
        description: `Ponto registrado as ${new Date(data.timestamp).toLocaleTimeString("pt-BR")}`,
      });
    },
    onError: (err: any) => {
      if (err.recentPunch) {
        setConfirmDialog({
          message: err.message,
          lastPunchTime: err.lastPunchTime,
          lastPunchType: err.lastPunchType,
          minutesSince: err.minutesSince,
        });
      } else {
        toast({ title: "Erro", description: err.message || "Erro ao registrar ponto", variant: "destructive" });
      }
    },
  });

  const handlePunch = () => {
    setGeoStatus("loading");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const c = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setGeoStatus("success");
          setPendingCoords(c);
          punchMutation.mutate(c);
        },
        () => {
          setGeoStatus("error");
          setPendingCoords({});
          punchMutation.mutate({});
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoStatus("error");
      setPendingCoords({});
      punchMutation.mutate({});
    }
  };

  const handleForceConfirm = () => {
    punchMutation.mutate({ ...(pendingCoords || {}), force: true });
  };

  const isWorking = todayData?.records?.length % 2 === 1;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const bottomNavItems = [
    { path: "/employee", label: "Ponto", icon: Clock },
    { path: "/employee/history", label: "Historico", icon: History },
    { path: "/employee/adjustments", label: "Ajustes", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg" data-testid="text-emp-brand">Saturno</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-emp-theme" className="h-8 w-8">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2" data-testid="button-emp-user-menu">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-2">
                  <p className="text-sm font-semibold">{user?.name}</p>
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
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={handlePunch}
                disabled={punchMutation.isPending || geoStatus === "loading"}
                className={`w-full max-w-xs h-16 text-lg gap-3 rounded-xl shadow-sm ${isWorking ? "bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800" : ""}`}
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

              {isWorking && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Trabalhando</span>
                </div>
              )}
            </div>

            <WorkTimer
              todayRecords={todayData?.records || []}
              workHoursMinutes={todayData?.workHoursMinutes || 528}
            />

            {todayData?.records?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registros de Hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {todayData.records.map((record: any, idx: number) => (
                      <div key={record.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`today-record-${record.id}`}>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${record.type === "entry" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          <span className="text-sm font-medium">{record.type === "entry" ? "Entrada" : "Saida"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.latitude && (
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className="text-sm tabular-nums font-medium text-muted-foreground">
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
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Banco de Horas (Mes)</p>
                      <p className={`text-2xl font-bold mt-1 ${todayData.bankHours >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`} data-testid="text-bank-hours">
                        {todayData.bankHours >= 0 ? "+" : ""}{formatMinutes(todayData.bankHours)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted">
                      <Timer className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <Dialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Registro Recente Detectado
            </DialogTitle>
          </DialogHeader>
          {confirmDialog && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  Voce ja tem um registro recente:
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-amber-900 dark:text-amber-200">{confirmDialog.lastPunchType} as {confirmDialog.lastPunchTime}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">ha {confirmDialog.minutesSince} minuto{confirmDialog.minutesSince !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja registrar um novo ponto? Isso pode gerar registros duplicados.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDialog(null)}
                  data-testid="button-cancel-punch"
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleForceConfirm}
                  disabled={punchMutation.isPending}
                  data-testid="button-force-punch"
                >
                  {punchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Sim, Registrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-50">
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
          {bottomNavItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  type="button"
                  className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
