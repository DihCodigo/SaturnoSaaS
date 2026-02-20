import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Users, Clock, AlertTriangle, TrendingUp, CheckCircle, XCircle } from "lucide-react";

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

  const { data: recentRecords, isLoading: isLoadingRecords } = useQuery({
    queryKey: ["/api/admin/recent-records"],
    queryFn: async () => {
      const res = await fetch("/api/admin/recent-records", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const statCards = [
    { label: "Total Funcionarios", value: stats?.totalEmployees ?? 0, icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { label: "Trabalhando Agora", value: stats?.workingNow ?? 0, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
    { label: "Ausentes Hoje", value: stats?.absentToday ?? 0, icon: XCircle, color: "text-red-600 dark:text-red-400" },
    { label: "Horas Extras (Mes)", value: stats?.overtimeHours ?? "0h", icon: TrendingUp, color: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">Painel de Controle</h1>
          <p className="text-muted-foreground">Visao geral da empresa</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Registros Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRecords ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              ) : recentRecords?.length > 0 ? (
                <div className="space-y-3">
                  {recentRecords.map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0" data-testid={`record-${record.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${record.type === "entry" ? "bg-green-500" : "bg-red-500"}`} />
                        <div>
                          <p className="text-sm font-medium">{record.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.timestamp).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={record.type === "entry" ? "default" : "secondary"}>
                        {record.type === "entry" ? "Entrada" : "Saida"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum registro hoje</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.alerts?.length > 0 ? (
                <div className="space-y-3">
                  {stats.alerts.map((alert: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum alerta no momento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
