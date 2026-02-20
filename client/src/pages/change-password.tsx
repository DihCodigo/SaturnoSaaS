import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, Clock } from "lucide-react";

const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatoria"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme a nova senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas nao coincidem",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>;

export default function ChangePasswordPage() {
  const { token, logout, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
        return;
      }
      logout();
      toast({ title: "Sucesso", description: "Senha alterada com sucesso! Faca login com a nova senha." });
      navigate("/");
    } catch {
      toast({ title: "Erro", description: "Erro ao alterar senha", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg mb-4">
            <Clock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Saturno</h1>
          <p className="text-muted-foreground mt-1">Alteracao de senha obrigatoria</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Alterar Senha</CardTitle>
                <p className="text-sm text-muted-foreground">Crie uma nova senha para continuar</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input id="currentPassword" data-testid="input-current-password" type="password" {...form.register("currentPassword")} />
                {form.formState.errors.currentPassword && <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input id="newPassword" data-testid="input-new-password" type="password" {...form.register("newPassword")} />
                {form.formState.errors.newPassword && <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input id="confirmPassword" data-testid="input-confirm-password" type="password" {...form.register("confirmPassword")} />
                {form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-change-password">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSubmitting ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
