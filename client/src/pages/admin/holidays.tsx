import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Trash2, Loader2, Download, Flag } from "lucide-react";

export default function HolidaysPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [national, setNational] = useState(false);
  const currentYear = new Date().getFullYear();
  const [seedYear, setSeedYear] = useState(String(currentYear));

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["/api/admin/holidays"],
    queryFn: async () => {
      const res = await fetch("/api/admin/holidays", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/holidays"] });
      toast({ title: "Sucesso", description: "Feriado adicionado!" });
      setDialogOpen(false);
      setName("");
      setDate("");
      setNational(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/holidays/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/holidays"] });
      toast({ title: "Sucesso", description: "Feriado removido!" });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async (year: number) => {
      const res = await fetch("/api/admin/holidays/seed-national", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/holidays"] });
      if (data.added > 0) {
        toast({ title: "Sucesso", description: `${data.added} feriados nacionais adicionados para ${seedYear}!` });
      } else {
        toast({ title: "Info", description: `Todos os feriados nacionais de ${seedYear} ja estao cadastrados.` });
      }
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-holidays-title">Feriados</h1>
            <p className="text-muted-foreground">Gerencie os feriados da empresa</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-add-holiday"><Plus className="w-4 h-4" /> Novo Feriado</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Feriado</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name, date, national }); }} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Nome</Label>
                    <Input data-testid="input-holiday-name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Data</Label>
                    <Input data-testid="input-holiday-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={national} onCheckedChange={setNational} data-testid="switch-national" />
                    <Label>Feriado Nacional</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-holiday">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Adicionar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <div className="flex items-center gap-1.5">
              <Select value={seedYear} onValueChange={setSeedYear}>
                <SelectTrigger className="w-[100px] h-9" data-testid="select-seed-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 2050 - currentYear + 2 }, (_, i) => currentYear - 1 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="gap-2"
                onClick={() => seedMutation.mutate(Number(seedYear))}
                disabled={seedMutation.isPending}
                data-testid="button-seed-national"
              >
                {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                Carregar Nacionais
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : holidays?.length > 0 ? (
          <div className="space-y-3">
            {holidays.map((h: any) => {
              const [y, m, d] = (h.date || "").split("-");
              const formatted = d && m && y ? `${d}/${m}/${y}` : h.date;
              const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
              const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
              return (
                <Card key={h.id} data-testid={`card-holiday-${h.id}`}>
                  <CardContent className="py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${h.national ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"}`}>
                        {h.national ? <Flag className="w-5 h-5 text-green-600 dark:text-green-400" /> : <Calendar className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium">{h.name}</p>
                        <p className="text-sm text-muted-foreground">{formatted} - {dayName}</p>
                      </div>
                      {h.national && <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Nacional</Badge>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(h.id)} data-testid={`button-delete-holiday-${h.id}`}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum feriado cadastrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
