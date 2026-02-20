import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, TrendingUp, Activity } from "lucide-react";

export default function MasterDashboard() {
  const { token } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/master/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/master/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const statCards = [
    { label: "Total Empresas", value: stats?.totalCompanies ?? 0, icon: Building2, color: "text-blue-600 dark:text-blue-400" },
    { label: "Total Usuarios", value: stats?.totalUsers ?? 0, icon: Users, color: "text-green-600 dark:text-green-400" },
    { label: "Registros Hoje", value: stats?.todayRecords ?? 0, icon: Activity, color: "text-amber-600 dark:text-amber-400" },
    { label: "Empresas Ativas", value: stats?.activeCompanies ?? 0, icon: TrendingUp, color: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-master-title">Painel Master</h1>
          <p className="text-muted-foreground">Visao geral do sistema</p>
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
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
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

        {!isLoading && stats?.companies && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Empresas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.companies.map((company: any) => (
                  <div key={company.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`master-company-${company.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">{company.cnpj}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{company.employeeCount} funcionarios</Badge>
                      <Badge variant={company.active ? "default" : "destructive"}>
                        {company.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
