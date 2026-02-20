import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

const registerSchema = z.object({
  companyName: z.string().min(2, "Nome da empresa obrigatorio"),
  cnpj: z.string().min(11, "CNPJ obrigatorio"),
  email: z.string().email("Email invalido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  adminName: z.string().min(2, "Nome do administrador obrigatorio"),
  adminUsername: z.string().min(3, "Usuario deve ter pelo menos 3 caracteres"),
  adminPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "", cnpj: "", email: "", phone: "", address: "",
      adminName: "", adminUsername: "", adminPassword: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Sucesso", description: "Empresa cadastrada com sucesso! Faca login." });
      navigate("/");
    } catch {
      toast({ title: "Erro", description: "Erro ao conectar ao servidor", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground mb-6 text-sm"
          data-testid="button-back-login"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao login
        </button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Cadastro de Empresa</CardTitle>
                <p className="text-sm text-muted-foreground">Preencha os dados para criar sua conta</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados da Empresa</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input id="companyName" data-testid="input-company-name" {...form.register("companyName")} />
                    {form.formState.errors.companyName && <p className="text-xs text-destructive">{form.formState.errors.companyName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" data-testid="input-cnpj" placeholder="00.000.000/0001-00" {...form.register("cnpj")} />
                    {form.formState.errors.cnpj && <p className="text-xs text-destructive">{form.formState.errors.cnpj.message}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" data-testid="input-email" type="email" {...form.register("email")} />
                  {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" data-testid="input-phone" {...form.register("phone")} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="address">Endereco</Label>
                    <Input id="address" data-testid="input-address" {...form.register("address")} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados do Administrador</h3>
                <div className="space-y-1">
                  <Label htmlFor="adminName">Nome Completo</Label>
                  <Input id="adminName" data-testid="input-admin-name" {...form.register("adminName")} />
                  {form.formState.errors.adminName && <p className="text-xs text-destructive">{form.formState.errors.adminName.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="adminUsername">Usuario</Label>
                    <Input id="adminUsername" data-testid="input-admin-username" {...form.register("adminUsername")} />
                    {form.formState.errors.adminUsername && <p className="text-xs text-destructive">{form.formState.errors.adminUsername.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adminPassword">Senha</Label>
                    <Input id="adminPassword" data-testid="input-admin-password" type="password" {...form.register("adminPassword")} />
                    {form.formState.errors.adminPassword && <p className="text-xs text-destructive">{form.formState.errors.adminPassword.message}</p>}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-register">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSubmitting ? "Cadastrando..." : "Cadastrar Empresa"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
