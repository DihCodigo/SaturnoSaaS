import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Clock, TrendingUp, TrendingDown, AlertTriangle, Users, Calendar, Filter } from "lucide-react";

function formatMinutes(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";
  return `${sign}${h}h${m.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-");
  return `${d}/${mo}/${y}`;
}

export default function ReportsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstDay.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  const { data: employees } = useQuery({
    queryKey: ["/api/admin/employees"],
    queryFn: async () => {
      const res = await fetch("/api/admin/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const queryParams = new URLSearchParams({ startDate, endDate });
  if (selectedEmployee !== "all") queryParams.set("employeeId", selectedEmployee);

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/reports", startDate, endDate, selectedEmployee],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const exportCSV = () => {
    if (!reportData?.report?.length) {
      toast({ title: "Sem dados", description: "Nenhum dado para exportar", variant: "destructive" });
      return;
    }

    const rows: string[] = [];
    rows.push("Empresa:;" + (reportData.company?.name || ""));
    rows.push("CNPJ:;" + (reportData.company?.cnpj || ""));
    rows.push("Periodo:;" + formatDate(startDate) + " a " + formatDate(endDate));
    rows.push("");

    for (const emp of reportData.report) {
      rows.push("Funcionario:;" + emp.employee.name);
      rows.push("Departamento:;" + (emp.employee.department || "-"));
      rows.push("Cargo:;" + (emp.employee.position || "-"));
      rows.push("");
      rows.push("Resumo:");
      rows.push("Dias Trabalhados;" + emp.summary.daysWorked);
      rows.push("Horas Trabalhadas;" + formatMinutes(emp.summary.totalWorkedMinutes));
      rows.push("Horas Esperadas;" + formatMinutes(emp.summary.totalExpectedMinutes));
      rows.push("Banco de Horas;" + formatMinutes(emp.summary.totalBankMinutes));
      rows.push("Atrasos;" + emp.summary.lateCount);
      rows.push("");
      rows.push("Data;Entrada;Saida;Trabalhado;Esperado;Saldo;Obs");

      for (const d of emp.dailyDetails) {
        const obs = d.isHoliday ? "Feriado" : d.isWeekend ? "Fim de Semana" : "";
        rows.push(
          `${formatDate(d.date)};${d.firstEntry};${d.lastExit};${formatMinutes(d.workedMinutes)};${formatMinutes(d.expectedMinutes)};${formatMinutes(d.balance)};${obs}`
        );
      }
      rows.push("");
      rows.push("---");
      rows.push("");
    }

    const bom = "\uFEFF";
    const blob = new Blob([bom + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_ponto_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exportado!", description: "Relatorio CSV baixado com sucesso" });
  };

  const totalWorked = reportData?.report?.reduce((s: number, e: any) => s + e.summary.totalWorkedMinutes, 0) || 0;
  const totalExpected = reportData?.report?.reduce((s: number, e: any) => s + e.summary.totalExpectedMinutes, 0) || 0;
  const totalBank = reportData?.report?.reduce((s: number, e: any) => s + e.summary.totalBankMinutes, 0) || 0;
  const totalLate = reportData?.report?.reduce((s: number, e: any) => s + e.summary.lateCount, 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-reports-title">Relatorios</h1>
            <p className="text-muted-foreground">Exporte e analise os dados de ponto</p>
          </div>
          <Button onClick={exportCSV} className="gap-2" data-testid="button-export-csv">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data Inicio</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Funcionario</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger data-testid="select-employee">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Funcionarios</SelectItem>
                    {employees?.filter((e: any) => e.role === "employee").map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? <Skeleton className="h-16 w-full" /> : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Horas Trabalhadas</p>
                    <p className="text-2xl font-bold mt-1" data-testid="stat-total-worked">{formatMinutes(totalWorked)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted text-blue-600 dark:text-blue-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              {isLoading ? <Skeleton className="h-16 w-full" /> : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Horas Esperadas</p>
                    <p className="text-2xl font-bold mt-1" data-testid="stat-total-expected">{formatMinutes(totalExpected)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted text-green-600 dark:text-green-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              {isLoading ? <Skeleton className="h-16 w-full" /> : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Banco de Horas</p>
                    <p className={`text-2xl font-bold mt-1 ${totalBank >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} data-testid="stat-total-bank">
                      {formatMinutes(totalBank)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg bg-muted ${totalBank >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {totalBank >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              {isLoading ? <Skeleton className="h-16 w-full" /> : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Atrasos</p>
                    <p className="text-2xl font-bold mt-1" data-testid="stat-total-late">{totalLate}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            </CardContent>
          </Card>
        ) : reportData?.report?.length > 0 ? (
          reportData.report.map((emp: any) => (
            <Card key={emp.employee.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {emp.employee.name}
                    {emp.employee.department && (
                      <Badge variant="outline" className="font-normal">{emp.employee.department}</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>Trabalhado: <strong className="text-foreground">{formatMinutes(emp.summary.totalWorkedMinutes)}</strong></span>
                    <span>Banco: <strong className={emp.summary.totalBankMinutes >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      {formatMinutes(emp.summary.totalBankMinutes)}
                    </strong></span>
                    {emp.summary.lateCount > 0 && (
                      <Badge variant="destructive" className="text-xs">{emp.summary.lateCount} atraso(s)</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Data</th>
                        <th className="py-2 pr-4 font-medium">Entrada</th>
                        <th className="py-2 pr-4 font-medium">Saida</th>
                        <th className="py-2 pr-4 font-medium">Trabalhado</th>
                        <th className="py-2 pr-4 font-medium">Esperado</th>
                        <th className="py-2 pr-4 font-medium">Saldo</th>
                        <th className="py-2 font-medium">Obs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emp.dailyDetails.map((d: any) => (
                        <tr key={d.date} className={`border-b last:border-0 ${d.isWeekend || d.isHoliday ? "bg-muted/30" : ""}`}>
                          <td className="py-2 pr-4 font-medium">{formatDate(d.date)}</td>
                          <td className="py-2 pr-4">{d.firstEntry}</td>
                          <td className="py-2 pr-4">{d.lastExit}</td>
                          <td className="py-2 pr-4">{formatMinutes(d.workedMinutes)}</td>
                          <td className="py-2 pr-4">{formatMinutes(d.expectedMinutes)}</td>
                          <td className={`py-2 pr-4 font-medium ${d.balance > 0 ? "text-green-600 dark:text-green-400" : d.balance < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                            {d.balance > 0 ? "+" : ""}{formatMinutes(d.balance)}
                          </td>
                          <td className="py-2">
                            {d.isHoliday && <Badge variant="secondary" className="text-xs">Feriado</Badge>}
                            {d.isWeekend && <Badge variant="outline" className="text-xs">Fim de Semana</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum registro encontrado no periodo selecionado</p>
              <p className="text-sm text-muted-foreground mt-1">Ajuste os filtros e tente novamente</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
