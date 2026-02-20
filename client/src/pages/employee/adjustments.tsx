import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Clock, History, FileText, Plus, Sun, Moon, LogOut, Loader2 } from "lucide-react";

export default function EmployeeAdjustmentsPage() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ date: "", requestedTime: "", type: "entry", reason: "" });

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

  const statusLabels: Record<string, string> = { pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado" };
  const statusVariants: Record<string, "default" | "secondary" | "destructive"> = { pending: "secondary", approved: "default", rejected: "destructive" };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

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

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : adjustments?.length > 0 ? (
          <div className="space-y-3">
            {adjustments.map((adj: any) => (
              <Card key={adj.id} data-testid={`card-emp-adj-${adj.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {adj.date} - {adj.requestedTime}
                        </p>
                        <Badge variant={statusVariants[adj.status]}>{statusLabels[adj.status]}</Badge>
                        <Badge variant="outline">{adj.type === "entry" ? "Entrada" : "Saida"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{adj.reason}</p>
                    </div>
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
      </main>

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
            <button type="button" className="flex flex-col items-center gap-1 text-primary">
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-medium">Ajustes</span>
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
