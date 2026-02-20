import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, UserPlus, Loader2, MoreVertical, Pencil, Ban, CheckCircle, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function EmployeesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "", username: "", email: "", password: "", department: "", position: "", workHoursMinutes: "528",
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ["/api/admin/employees"],
    queryFn: async () => {
      const res = await fetch("/api/admin/employees", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingEmployee ? `/api/admin/employees/${editingEmployee.id}` : "/api/admin/employees";
      const method = editingEmployee ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "Sucesso", description: editingEmployee ? "Funcionario atualizado!" : "Funcionario criado!" });
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/admin/employees/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "Sucesso", description: "Status atualizado!" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", username: "", email: "", password: "", department: "", position: "", workHoursMinutes: "528" });
    setEditingEmployee(null);
    setDialogOpen(false);
  };

  const openEdit = (emp: any) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name, username: emp.username, email: emp.email, password: "",
      department: emp.department || "", position: emp.position || "",
      workHoursMinutes: String(emp.workHoursMinutes || "528"),
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...formData, workHoursMinutes: parseInt(formData.workHoursMinutes) };
    if (editingEmployee && !data.password) delete data.password;
    createMutation.mutate(data);
  };

  const filteredEmployees = employees?.filter((e: any) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-employees-title">Funcionarios</h1>
            <p className="text-muted-foreground">Gerencie os funcionarios da empresa</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-employee">
                <UserPlus className="w-4 h-4" />
                Novo Funcionario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingEmployee ? "Editar Funcionario" : "Novo Funcionario"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nome Completo</Label>
                    <Input data-testid="input-emp-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Usuario</Label>
                    <Input data-testid="input-emp-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required disabled={!!editingEmployee} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input data-testid="input-emp-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                    <Label>{editingEmployee ? "Nova Senha (deixe vazio para manter)" : "Senha Inicial"}</Label>
                    <Input data-testid="input-emp-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingEmployee} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Setor</Label>
                    <Input data-testid="input-emp-department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Cargo</Label>
                    <Input data-testid="input-emp-position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Carga Horaria Diaria</Label>
                  <Select value={formData.workHoursMinutes} onValueChange={(v) => setFormData({ ...formData, workHoursMinutes: v })}>
                    <SelectTrigger data-testid="select-work-hours">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="360">6 horas</SelectItem>
                      <SelectItem value="420">7 horas</SelectItem>
                      <SelectItem value="480">8 horas</SelectItem>
                      <SelectItem value="528">8h48 (CLT)</SelectItem>
                      <SelectItem value="540">9 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-employee">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingEmployee ? "Atualizar" : "Criar Funcionario"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionarios..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-employees"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((emp: any) => (
              <Card key={emp.id} className={`${!emp.active ? "opacity-60" : ""}`} data-testid={`card-employee-${emp.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">@{emp.username}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {emp.department && <Badge variant="secondary">{emp.department}</Badge>}
                        {emp.position && <Badge variant="outline">{emp.position}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${emp.isWorking ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                        <span className="text-xs text-muted-foreground">
                          {emp.isWorking ? "Trabalhando" : emp.active ? "Offline" : "Inativo"}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" data-testid={`button-emp-menu-${emp.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(emp)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleMutation.mutate({ id: emp.id, active: !emp.active })}>
                          {emp.active ? (
                            <><Ban className="w-4 h-4 mr-2" /> Desativar</>
                          ) : (
                            <><CheckCircle className="w-4 h-4 mr-2" /> Ativar</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum funcionario encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Funcionario" para adicionar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
