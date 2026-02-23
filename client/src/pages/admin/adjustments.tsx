import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Check, X, FileText, Clock, AlertTriangle, Send, ChevronDown, ChevronUp, User, Calendar } from "lucide-react";

export default function AdjustmentsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"irregularities" | "adjustments">("irregularities");
  const [sendDialog, setSendDialog] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [expandedIrregularities, setExpandedIrregularities] = useState<Set<string>>(new Set());

  const { data: irregularities, isLoading: isLoadingIrr } = useQuery({
    queryKey: ["/api/admin/irregularities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/irregularities", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: adjustments, isLoading: isLoadingAdj } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/irregularities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "Sucesso", description: "Solicitacao revisada!" });
    },
  });

  const sendAdjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/irregularities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "Sucesso", description: "Solicitacao de ajuste enviada ao funcionario!" });
      setSendDialog(null);
      setAdminNote("");
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao enviar solicitacao", variant: "destructive" });
    },
  });

  const statusLabels: Record<string, string> = {
    awaiting_employee: "Aguardando Funcionario",
    pending: "Pendente Revisao",
    approved: "Aprovado",
    rejected: "Rejeitado",
  };
  const statusColors: Record<string, string> = {
    awaiting_employee: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const irregularityTypeLabels: Record<string, string> = {
    missing_exit: "Saida nao registrada",
    missing_lunch: "Almoco nao registrado",
  };

  const toggleIrregularity = (id: string) => {
    setExpandedIrregularities(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendAdjustment = (irr: any) => {
    setSendDialog(irr);
    setAdminNote(`Irregularidade detectada no dia ${irr.dateFormatted}: ${irregularityTypeLabels[irr.type] || irr.type}. Por favor, informe o horario correto e o motivo.`);
  };

  const confirmSend = () => {
    if (!sendDialog) return;
    sendAdjustmentMutation.mutate({
      userId: sendDialog.userId,
      date: sendDialog.date,
      type: sendDialog.type,
      adminNote,
      irregularityType: sendDialog.type,
    });
  };

  const pendingCount = adjustments?.filter((a: any) => a.status === "pending").length || 0;
  const awaitingCount = adjustments?.filter((a: any) => a.status === "awaiting_employee").length || 0;
  const irregularityCount = irregularities?.length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-adjustments-title">Ajustes de Ponto</h1>
          <p className="text-muted-foreground">Irregularidades e solicitacoes de ajuste</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeTab === "irregularities" ? "default" : "outline"}
            onClick={() => setActiveTab("irregularities")}
            className="gap-2"
            data-testid="tab-irregularities"
          >
            <AlertTriangle className="w-4 h-4" />
            Irregularidades
            {irregularityCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {irregularityCount}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "adjustments" ? "default" : "outline"}
            onClick={() => setActiveTab("adjustments")}
            className="gap-2"
            data-testid="tab-adjustments"
          >
            <FileText className="w-4 h-4" />
            Solicitacoes
            {(pendingCount + awaitingCount) > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount + awaitingCount}
              </span>
            )}
          </Button>
        </div>

        {activeTab === "irregularities" && (
          <>
            {irregularityCount > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    {irregularityCount} irregularidade{irregularityCount > 1 ? "s" : ""} detectada{irregularityCount > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400/80">
                    Pontos incompletos nos ultimos 30 dias. Envie solicitacao de ajuste para os funcionarios corrigirem.
                  </p>
                </div>
              </div>
            )}

            {isLoadingIrr ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : irregularityCount > 0 ? (
              <div className="space-y-3">
                {irregularities.map((irr: any) => (
                  <Card key={irr.id} className="border-amber-200/50 dark:border-amber-800/30" data-testid={`card-irregularity-${irr.id}`}>
                    <CardContent className="py-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm">{irr.userName}</p>
                                <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                                  {irregularityTypeLabels[irr.type] || irr.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>{irr.dateFormatted}</span>
                                {irr.department && (
                                  <>
                                    <span>·</span>
                                    <span>{irr.department}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{irr.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleSendAdjustment(irr)}
                              className="gap-1.5 text-xs"
                              data-testid={`button-send-adjustment-${irr.id}`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              Solicitar Ajuste
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => toggleIrregularity(irr.id)}
                            >
                              {expandedIrregularities.has(irr.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {expandedIrregularities.has(irr.id) && (
                          <div className="ml-11 pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Registros do dia:</p>
                            <div className="flex gap-2 flex-wrap">
                              {irr.punches.map((p: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                    p.type === "entry"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  }`}
                                >
                                  {p.type === "entry" ? "Entrada" : "Saida"}: {p.time}
                                </div>
                              ))}
                              {irr.type === "missing_exit" && (
                                <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-dashed border-amber-400">
                                  ? Saida nao registrada
                                </div>
                              )}
                              {irr.type === "missing_lunch" && (
                                <>
                                  <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-dashed border-amber-400">
                                    ? Almoco nao registrado
                                  </div>
                                </>
                              )}
                            </div>
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
                  <Check className="w-12 h-12 mx-auto mb-3 text-emerald-500/30" />
                  <p className="text-muted-foreground font-medium">Nenhuma irregularidade detectada</p>
                  <p className="text-sm text-muted-foreground mt-1">Todos os pontos dos ultimos 30 dias estao completos</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === "adjustments" && (
          <>
            {isLoadingAdj ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))}
              </div>
            ) : adjustments?.length > 0 ? (
              <div className="space-y-3">
                {adjustments.map((adj: any) => (
                  <Card key={adj.id} data-testid={`card-adjustment-${adj.id}`}>
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="font-semibold text-sm">{adj.userName}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[adj.status] || "bg-gray-100 text-gray-800"}`}>
                              {statusLabels[adj.status] || adj.status}
                            </span>
                            {adj.createdBy === "admin" && (
                              <Badge variant="outline" className="text-[10px]">Criado pelo Admin</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Data: {adj.date}</span>
                            {adj.requestedTime && (
                              <>
                                <span>·</span>
                                <Clock className="w-3 h-3" />
                                <span>Horario: {adj.requestedTime}</span>
                              </>
                            )}
                            <span>·</span>
                            <span>Tipo: {irregularityTypeLabels[adj.type] || (adj.type === "entry" ? "Entrada" : "Saida")}</span>
                          </div>
                          {adj.adminNote && (
                            <div className="text-xs bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                              <span className="font-medium text-amber-700 dark:text-amber-400">Nota do Admin: </span>
                              <span className="text-amber-800 dark:text-amber-300">{adj.adminNote}</span>
                            </div>
                          )}
                          {adj.reason && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Motivo: </span>{adj.reason}
                            </p>
                          )}
                        </div>
                        {adj.status === "pending" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => reviewMutation.mutate({ id: adj.id, status: "approved" })}
                              data-testid={`button-approve-${adj.id}`}
                              className="gap-1 text-xs"
                              disabled={reviewMutation.isPending}
                            >
                              <Check className="w-3.5 h-3.5" /> Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => reviewMutation.mutate({ id: adj.id, status: "rejected" })}
                              data-testid={`button-reject-${adj.id}`}
                              className="gap-1 text-xs"
                              disabled={reviewMutation.isPending}
                            >
                              <X className="w-3.5 h-3.5" /> Rejeitar
                            </Button>
                          </div>
                        )}
                        {adj.status === "awaiting_employee" && (
                          <div className="shrink-0">
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
                              <Clock className="w-3 h-3" />
                              Aguardando resposta
                            </Badge>
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
          </>
        )}
      </div>

      <Dialog open={!!sendDialog} onOpenChange={(open) => { if (!open) setSendDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Ajuste de Ponto</DialogTitle>
          </DialogHeader>
          {sendDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{sendDialog.userName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{sendDialog.dateFormatted}</span>
                  <span>·</span>
                  <span>{irregularityTypeLabels[sendDialog.type]}</span>
                </div>
                <p className="text-xs text-muted-foreground">{sendDialog.description}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mensagem para o funcionario</label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  data-testid="input-admin-note"
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={confirmSend}
                disabled={sendAdjustmentMutation.isPending}
                data-testid="button-confirm-send"
              >
                <Send className="w-4 h-4" />
                Enviar Solicitacao ao Funcionario
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
