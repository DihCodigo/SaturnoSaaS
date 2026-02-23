import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Clock, History, FileText, Plus, Sun, Moon, LogOut, Loader2, AlertTriangle, Send, Calendar } from "lucide-react";

export default function EmployeeAdjustmentsPage() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ date: "", requestedTime: "", type: "entry", reason: "" });
  const [respondDialog, setRespondDialog] = useState<any>(null);
  const [respondData, setRespondData] = useState({ requestedTime: "", reason: "" });

  const { data: adjustments, isLoading } = useQuery({
    queryKey: ["/api/employee/adjustments"],
    queryFn: async () => {
      const res = await fetch("/api/employee/adjustments", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/employee/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/adjustments"] });
      toast({ title: "Sucesso", description: "Solicitacao enviada!" });
      setDialogOpen(false);
      setFormData({ date: "", requestedTime: "", type: "entry", reason: "" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao enviar", variant: "destructive" });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/employee/adjustments/${id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/adjustments"] });
      toast({ title: "Sucesso", description: "Resposta enviada para aprovacao!" });
      setRespondDialog(null);
      setRespondData({ requestedTime: "", reason: "" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao enviar resposta", variant: "destructive" });
    },
  });

  const statusLabels: Record<string, string> = {
    awaiting_employee: "Acao Necessaria",
    pending: "Pendente",
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
    entry: "Entrada",
    exit: "Saida",
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const awaitingActions = adjustments?.filter((a: any) => a.status === "awaiting_employee") || [];
  const otherAdjustments = adjustments?.filter((a: any) => a.status !== "awaiting_employee") || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Saturno</span>
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-emp-adjustments-title">Ajustes</h1>
            <p className="text-muted-foreground">Suas solicitacoes de ajuste</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-request-adjustment"><Plus className="w-4 h-4" /> Solicitar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Solicitar Ajuste de Ponto</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input data-testid="input-adj-date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Horario</Label>
                    <Input data-testid="input-adj-time" type="time" value={formData.requestedTime} onChange={(e) => setFormData({ ...formData, requestedTime: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger data-testid="select-adj-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entrada</SelectItem>
                        <SelectItem value="exit">Saida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Motivo</Label>
                  <Textarea data-testid="input-adj-reason" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required placeholder="Descreva o motivo do ajuste..." />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-send-adjustment">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enviar Solicitacao
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {awaitingActions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {awaitingActions.length} ajuste{awaitingActions.length > 1 ? "s" : ""} aguardando sua resposta
              </p>
            </div>

            {awaitingActions.map((adj: any) => (
              <Card key={adj.id} className="border-amber-200 dark:border-amber-800/50" data-testid={`card-emp-adj-awaiting-${adj.id}`}>
                <CardContent className="py-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[adj.status]}`}>
                            {statusLabels[adj.status]}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {irregularityTypeLabels[adj.irregularityType || adj.type]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{adj.dateFormatted || adj.date}</span>
                        </div>
                        {adj.adminNote && (
                          <div className="text-xs bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200 dark:border-amber-800">
                            <span className="font-medium text-amber-700 dark:text-amber-400">Mensagem do Admin: </span>
                            <span className="text-amber-800 dark:text-amber-300">{adj.adminNote}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5 shrink-0"
                        onClick={() => {
                          setRespondDialog(adj);
                          setRespondData({ requestedTime: "", reason: "" });
                        }}
                        data-testid={`button-respond-${adj.id}`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Responder
                      </Button>
                    </div>

                    {adj.timeline && (
                      <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                        <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Registros do dia</p>
                        <div className="grid grid-cols-2 gap-2">
                          {adj.timeline.map((step: any, idx: number) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                                step.missing
                                  ? "bg-red-50 dark:bg-red-950/20 border border-dashed border-red-300 dark:border-red-800 text-red-700 dark:text-red-400"
                                  : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                              }`}
                            >
                              {step.missing ? (
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                              ) : (
                                <Clock className="w-3 h-3 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="block text-[10px] opacity-70">{step.label}</span>
                                <span className="font-semibold">{step.missing ? "Nao registrado" : step.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : otherAdjustments.length > 0 ? (
          <div className="space-y-3">
            {otherAdjustments.map((adj: any) => (
              <Card key={adj.id} data-testid={`card-emp-adj-${adj.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {adj.date} {adj.requestedTime ? `- ${adj.requestedTime}` : ""}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[adj.status] || "bg-gray-100 text-gray-800"}`}>
                          {statusLabels[adj.status] || adj.status}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {irregularityTypeLabels[adj.irregularityType || adj.type]}
                        </Badge>
                        {adj.createdBy === "admin" && (
                          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">Solicitado pelo Admin</Badge>
                        )}
                      </div>
                      {adj.adminNote && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">Admin: {adj.adminNote}</p>
                      )}
                      {adj.reason && (
                        <p className="text-xs text-muted-foreground">Motivo: {adj.reason}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : awaitingActions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhuma solicitacao de ajuste</p>
            </CardContent>
          </Card>
        ) : null}
      </main>

      <Dialog open={!!respondDialog} onOpenChange={(open) => { if (!open) setRespondDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Solicitacao de Ajuste</DialogTitle>
          </DialogHeader>
          {respondDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{respondDialog.dateFormatted || respondDialog.date}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {irregularityTypeLabels[respondDialog.irregularityType || respondDialog.type]}
                </Badge>
                {respondDialog.adminNote && (
                  <div className="text-xs bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800 mt-1">
                    <span className="font-medium text-amber-700 dark:text-amber-400">Admin: </span>
                    <span className="text-amber-800 dark:text-amber-300">{respondDialog.adminNote}</span>
                  </div>
                )}
              </div>

              {respondDialog.timeline && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seus registros neste dia</p>
                  <div className="grid grid-cols-2 gap-2">
                    {respondDialog.timeline.map((step: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium ${
                          step.missing
                            ? "bg-red-50 dark:bg-red-950/20 border border-dashed border-red-300 dark:border-red-800 text-red-700 dark:text-red-400"
                            : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {step.missing ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="block text-[10px] opacity-70">{step.label}</span>
                          <span className="font-bold text-sm">{step.missing ? "Faltando" : step.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {respondDialog.punchCount === 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Nenhum registro encontrado neste dia.</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Informe o horario correto</Label>
                <Input
                  type="time"
                  value={respondData.requestedTime}
                  onChange={(e) => setRespondData({ ...respondData, requestedTime: e.target.value })}
                  data-testid="input-respond-time"
                  className="text-lg h-12"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Informe o horario que deveria ter sido registrado
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Motivo / Justificativa</Label>
                <Textarea
                  value={respondData.reason}
                  onChange={(e) => setRespondData({ ...respondData, reason: e.target.value })}
                  placeholder="Ex: Esqueci de registrar a saida. Sai do trabalho as 18:00."
                  data-testid="input-respond-reason"
                  required
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => {
                  if (!respondData.requestedTime || !respondData.reason) {
                    toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
                    return;
                  }
                  respondMutation.mutate({ id: respondDialog.id, data: respondData });
                }}
                disabled={respondMutation.isPending}
                data-testid="button-confirm-respond"
              >
                {respondMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar para Aprovacao
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-50">
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
          <Link href="/employee">
            <button type="button" className="flex flex-col items-center gap-1 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span className="text-[10px] font-medium">Ponto</span>
            </button>
          </Link>
          <Link href="/employee/history">
            <button type="button" className="flex flex-col items-center gap-1 text-muted-foreground">
              <History className="w-5 h-5" />
              <span className="text-[10px] font-medium">Historico</span>
            </button>
          </Link>
          <Link href="/employee/adjustments">
            <button type="button" className="flex flex-col items-center gap-1 text-primary relative">
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-medium">Ajustes</span>
              {awaitingActions.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {awaitingActions.length}
                </span>
              )}
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
