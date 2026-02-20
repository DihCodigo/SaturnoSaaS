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
import { Lock, Loader2 } from "lucide-react";

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
  const { token, updateUser, user } = useAuth();
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
      if (user) {
        updateUser({ ...user, mustChangePassword: false });
      }
      toast({ title: "Sucesso", description: "Senha alterada com sucesso!" });
      if (user?.role === "employee") {
        navigate("/employee");
      } else if (user?.role === "admin_company") {
        navigate("/admin");
      } else {
        navigate("/master");
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao alterar senha", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Alterar Senha</CardTitle>
                <p className="text-sm text-muted-foreground">Voce precisa criar uma nova senha para continuar</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input id="currentPassword" data-testid="input-current-password" type="password" {...form.register("currentPassword")} />
                {form.formState.errors.currentPassword && <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input id="newPassword" data-testid="input-new-password" type="password" {...form.register("newPassword")} />
                {form.formState.errors.newPassword && <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>}
              </div>
              <div className="space-y-1">
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
