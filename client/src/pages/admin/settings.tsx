import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Settings, MapPin, Clock, Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["/api/admin/company"],
    queryFn: async () => {
      const res = await fetch("/api/admin/company", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const [formData, setFormData] = useState({
    name: "", address: "", phone: "", email: "",
    geoLat: "", geoLng: "", geoRadius: "100",
    workHoursMinutes: "528", toleranceMinutes: "10",
    closingDayStart: "1", closingDayEnd: "1",
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
        geoLat: company.geoLat?.toString() || "",
        geoLng: company.geoLng?.toString() || "",
        geoRadius: company.geoRadius?.toString() || "100",
        workHoursMinutes: company.workHoursMinutes?.toString() || "528",
        toleranceMinutes: company.toleranceMinutes?.toString() || "10",
        closingDayStart: company.closingDayStart?.toString() || "1",
        closingDayEnd: company.closingDayEnd?.toString() || "1",
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company"] });
      toast({ title: "Sucesso", description: "Configuracoes atualizadas!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      geoLat: formData.geoLat ? parseFloat(formData.geoLat) : null,
      geoLng: formData.geoLng ? parseFloat(formData.geoLng) : null,
      geoRadius: parseInt(formData.geoRadius),
      workHoursMinutes: parseInt(formData.workHoursMinutes),
      toleranceMinutes: parseInt(formData.toleranceMinutes),
      closingDayStart: parseInt(formData.closingDayStart),
      closingDayEnd: parseInt(formData.closingDayEnd),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">Configuracoes</h1>
          <p className="text-muted-foreground">Configure as regras da empresa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" /> Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input data-testid="input-settings-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input data-testid="input-settings-email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input data-testid="input-settings-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Endereco</Label>
                  <Input data-testid="input-settings-address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" /> Jornada de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Carga Horaria Padrao</Label>
                  <Select value={formData.workHoursMinutes} onValueChange={(v) => setFormData({ ...formData, workHoursMinutes: v })}>
                    <SelectTrigger data-testid="select-default-hours">
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
                <div className="space-y-1">
                  <Label>Tolerancia (minutos)</Label>
                  <Input data-testid="input-tolerance" type="number" value={formData.toleranceMinutes} onChange={(e) => setFormData({ ...formData, toleranceMinutes: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Dia Inicio Fechamento</Label>
                  <Input data-testid="input-closing-start" type="number" min="1" max="31" value={formData.closingDayStart} onChange={(e) => setFormData({ ...formData, closingDayStart: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Dia Fim Fechamento</Label>
                  <Input data-testid="input-closing-end" type="number" min="1" max="31" value={formData.closingDayEnd} onChange={(e) => setFormData({ ...formData, closingDayEnd: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Geolocalizacao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Latitude</Label>
                  <Input data-testid="input-geo-lat" value={formData.geoLat} onChange={(e) => setFormData({ ...formData, geoLat: e.target.value })} placeholder="-23.5505" />
                </div>
                <div className="space-y-1">
                  <Label>Longitude</Label>
                  <Input data-testid="input-geo-lng" value={formData.geoLng} onChange={(e) => setFormData({ ...formData, geoLng: e.target.value })} placeholder="-46.6333" />
                </div>
                <div className="space-y-1">
                  <Label>Raio (metros)</Label>
                  <Input data-testid="input-geo-radius" type="number" value={formData.geoRadius} onChange={(e) => setFormData({ ...formData, geoRadius: e.target.value })} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Defina as coordenadas do local de trabalho e o raio permitido para registro de ponto.
              </p>
            </CardContent>
          </Card>

          <Button type="submit" className="gap-2" disabled={updateMutation.isPending} data-testid="button-save-settings">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Configuracoes
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
