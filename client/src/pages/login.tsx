import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Clock, Building2, User, Shield, Loader2 } from "lucide-react";

const loginFormSchema = z.object({
  username: z.string().min(1, "Usuario obrigatorio"),
  password: z.string().min(1, "Senha obrigatoria"),
});

type LoginForm = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "employee">("admin");

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, loginType }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Erro", description: result.message || "Credenciais invalidas", variant: "destructive" });
        return;
      }
      login(result.token, result.user);
      if (result.user.mustChangePassword) {
        navigate("/change-password");
      } else if (result.user.role === "admin_master") {
        navigate("/master");
      } else if (result.user.role === "admin_company") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao conectar ao servidor", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Clock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-app-title">PontoMax</h1>
          <p className="text-muted-foreground mt-1">Sistema de Controle de Ponto Eletronico</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <Tabs value={loginType} onValueChange={(v) => setLoginType(v as "admin" | "employee")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin" data-testid="tab-admin-login" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Administrador
                </TabsTrigger>
                <TabsTrigger value="employee" data-testid="tab-employee-login" className="gap-2">
                  <User className="w-4 h-4" />
                  Funcionario
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  {loginType === "admin" ? "Usuario Administrador" : "Usuario Funcionario"}
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    data-testid="input-username"
                    placeholder={loginType === "admin" ? "admin@empresa" : "funcionario.nome"}
                    {...form.register("username")}
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {loginType === "admin" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                </div>
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  placeholder="Digite sua senha"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-login">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            {loginType === "admin" && (
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Ainda nao tem conta?{" "}
                  <button
                    type="button"
                    className="text-primary font-medium"
                    data-testid="link-register"
                    onClick={() => navigate("/register")}
                  >
                    Cadastre sua empresa
                  </button>
                </p>
              </div>
            )}

            {loginType === "employee" && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Seu acesso e criado pelo administrador da sua empresa.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
