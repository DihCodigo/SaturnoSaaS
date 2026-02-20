import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Check, X, FileText, Clock } from "lucide-react";

export default function AdjustmentsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adjustments, isLoading } = useQuery({
    queryKey: ["/api/admin/adjustments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/adjustments", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/adjustments/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/adjustments"] });
      toast({ title: "Sucesso", description: "Solicitacao revisada!" });
    },
  });

  const statusLabels: Record<string, string> = { pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado" };
  const statusVariants: Record<string, "default" | "secondary" | "destructive"> = { pending: "secondary", approved: "default", rejected: "destructive" };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-adjustments-title">Solicitacoes de Ajuste</h1>
          <p className="text-muted-foreground">Gerencie as solicitacoes de ajuste de ponto</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : adjustments?.length > 0 ? (
          <div className="space-y-4">
            {adjustments.map((adj: any) => (
              <Card key={adj.id} data-testid={`card-adjustment-${adj.id}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{adj.userName}</p>
                        <Badge variant={statusVariants[adj.status]}>{statusLabels[adj.status]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Data: {adj.date} - Horario: {adj.requestedTime} - Tipo: {adj.type === "entry" ? "Entrada" : "Saida"}
                      </p>
                      <p className="text-sm">{adj.reason}</p>
                    </div>
                    {adj.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => reviewMutation.mutate({ id: adj.id, status: "approved" })}
                          data-testid={`button-approve-${adj.id}`}
                          className="gap-1"
                        >
                          <Check className="w-4 h-4" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => reviewMutation.mutate({ id: adj.id, status: "rejected" })}
                          data-testid={`button-reject-${adj.id}`}
                          className="gap-1"
                        >
                          <X className="w-4 h-4" /> Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhuma solicitacao de ajuste</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
