import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Users, Clock, AlertTriangle, TrendingUp, CheckCircle, XCircle, Wifi, WifiOff, FileWarning } from "lucide-react";
import { Link } from "wouter";
import { OnboardingGuide } from "@/components/onboarding-guide";

const adminOnboardingSteps = [
  {
    title: "Bem-vindo ao Saturno!",
    description: "Este e o seu painel de controle. Aqui voce acompanha tudo sobre a jornada de trabalho dos seus funcionarios em tempo real.",
    position: "center" as const,
  },
  {
    title: "Resumo do Dia",
    description: "Estes cards mostram o total de funcionarios, quantos estao trabalhando agora, ausentes e horas extras do mes.",
    targetSelector: "[data-testid='stats-grid']",
    position: "bottom" as const,
  },
  {
    title: "Alertas e Irregularidades",
    description: "Aqui aparecem alertas automaticos: irregularidades de ponto, ajustes pendentes e jornadas estendidas. Clique para ver detalhes.",
    targetSelector: "[data-testid='alerts-section']",
    position: "top" as const,
  },
  {
    title: "Menu de Navegacao",
    description: "Use o menu lateral para acessar: Funcionarios (cadastrar/gerenciar), Ajustes de Ponto, Feriados, Relatorios e Configuracoes da empresa.",
    targetSelector: "[data-testid='nav-sidebar']",
    position: "right" as const,
  },
  {
    title: "Gerenciando Funcionarios",
    description: "Em 'Funcionarios' voce cadastra novos colaboradores. Eles recebem usuario e senha para bater ponto pelo celular ou computador.",
    position: "center" as const,
  },
  {
    title: "Tudo Pronto!",
    description: "O sistema detecta irregularidades automaticamente e voce pode enviar solicitacoes de ajuste para os funcionarios corrigirem. Bom trabalho!",
    position: "center" as const,
  },
];

export default function AdminDashboard() {
  const { token } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/admin/employees"],
    queryFn: async () => {
      const res = await fetch("/api/admin/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const statCards = [
    { label: "Total Funcionarios", value: stats?.totalEmployees ?? 0, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
    { label: "Trabalhando Agora", value: stats?.workingNow ?? 0, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Ausentes Hoje", value: stats?.absentToday ?? 0, icon: XCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40" },
    { label: "Horas Extras (Mes)", value: stats?.overtimeHours ?? "0h", icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  ];

  const activeEmployees = employees?.filter((e: any) => e.active) || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">Painel de Controle</h1>
          <p className="text-muted-foreground mt-1">Visao geral da empresa</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-grid">
          {statCards.map((stat) => (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-14" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <p className="text-3xl font-bold" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Equipe
                </CardTitle>
                {!isLoadingEmployees && (
                  <Badge variant="secondary" className="font-normal">
                    {activeEmployees.filter((e: any) => e.isWorking).length} online
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEmployees ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : activeEmployees.length > 0 ? (
                <div className="space-y-1">
                  {activeEmployees.map((emp: any) => {
                    const initials = emp.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                    return (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`employee-status-${emp.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className={`text-xs font-semibold ${emp.isWorking ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${emp.isWorking ? "bg-emerald-500" : "bg-gray-400 dark:bg-gray-600"}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{emp.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {emp.position || emp.department || `@${emp.username}`}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={emp.isWorking ? "default" : "secondary"}
                          className={`shrink-0 text-[10px] font-medium gap-1 ${emp.isWorking ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" : ""}`}
                          data-testid={`badge-status-${emp.id}`}
                        >
                          {emp.isWorking ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                              Offline
                            </>
                          )}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum funcionario cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="alerts-section">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : stats?.alerts?.length > 0 ? (
                <div className="space-y-2">
                  {stats.alerts.map((alert: any, idx: number) => {
                    const isIrregularity = alert.type === "irregularity";
                    const isPending = alert.type === "pending_adjustment";
                    const isClickable = isIrregularity || isPending;
                    const content = (
                      <div className={`flex items-start gap-3 p-3 rounded-lg ${
                        isIrregularity ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" :
                        isPending ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800" :
                        "bg-muted/50"
                      } ${isClickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}>
                        <div className={`p-1 rounded-md ${
                          isIrregularity ? "bg-red-100 dark:bg-red-900/30" :
                          isPending ? "bg-blue-100 dark:bg-blue-900/30" :
                          "bg-amber-100 dark:bg-amber-900/30"
                        }`}>
                          {isIrregularity ? (
                            <FileWarning className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                        </div>
                      </div>
                    );
                    return isClickable ? (
                      <Link key={idx} href="/admin/adjustments">{content}</Link>
                    ) : (
                      <div key={idx}>{content}</div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum alerta no momento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <OnboardingGuide storageKey="saturno_onboarding_admin" steps={adminOnboardingSteps} />
    </AppLayout>
  );
}
