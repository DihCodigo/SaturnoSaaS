import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Clock, TrendingUp, TrendingDown, AlertTriangle, Calendar, Filter,
  UserCheck, UserX, Timer, ChevronDown, ChevronUp, MapPin, Loader2, BarChart3
} from "lucide-react";

function formatMinutes(minutes: number): string {
  if (minutes === 0) return "0h00";
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";
  return `${sign}${h}h${m.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-");
  return `${d}/${mo}/${y}`;
}

function getDayName(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  return days[d.getDay()];
}

function EmployeeReport({ emp, expanded, onToggle }: { emp: any; expanded: boolean; onToggle: () => void }) {
  const initials = emp.employee.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const bankPositive = emp.summary.totalBankMinutes >= 0;
  const completionPct = emp.summary.totalExpectedMinutes > 0
    ? Math.round((emp.summary.totalWorkedMinutes / emp.summary.totalExpectedMinutes) * 100)
    : 0;

  return (
    <Card data-testid={`report-employee-${emp.employee.id}`}>
      <div
        className="p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
        data-testid={`toggle-employee-${emp.employee.id}`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{emp.employee.name}</h3>
              {emp.employee.department && <Badge variant="secondary" className="text-[10px]">{emp.employee.department}</Badge>}
              {emp.employee.position && <Badge variant="outline" className="text-[10px]">{emp.employee.position}</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatMinutes(emp.summary.totalWorkedMinutes)} / {formatMinutes(emp.summary.totalExpectedMinutes)}
              </span>
              <span className={`flex items-center gap-1 font-medium ${bankPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {bankPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {bankPositive ? "+" : ""}{formatMinutes(emp.summary.totalBankMinutes)}
              </span>
              <span>{emp.summary.daysWorked} dias trabalhados</span>
              {emp.summary.lateCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5">{emp.summary.lateCount} atraso(s)</Badge>
              )}
              {emp.summary.absentCount > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 border-amber-500 text-amber-600 dark:text-amber-400">{emp.summary.absentCount} falta(s)</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-muted-foreground">Cumprimento</p>
              <p className={`text-sm font-bold ${completionPct >= 95 ? "text-emerald-600 dark:text-emerald-400" : completionPct >= 80 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                {completionPct}%
              </p>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 border-t">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Trabalhado</p>
              <p className="text-sm font-bold mt-0.5">{formatMinutes(emp.summary.totalWorkedMinutes)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Esperado</p>
              <p className="text-sm font-bold mt-0.5">{formatMinutes(emp.summary.totalExpectedMinutes)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Banco</p>
              <p className={`text-sm font-bold mt-0.5 ${bankPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {bankPositive ? "+" : ""}{formatMinutes(emp.summary.totalBankMinutes)}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Dias Uteis</p>
              <p className="text-sm font-bold mt-0.5">{emp.summary.daysWorked} / {emp.summary.workDays}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Atrasos</p>
              <p className={`text-sm font-bold mt-0.5 ${emp.summary.lateCount > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{emp.summary.lateCount}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid={`table-details-${emp.employee.id}`}>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Data</th>
                  <th className="py-2 pr-3 font-semibold">Dia</th>
                  <th className="py-2 pr-3 font-semibold">Registros</th>
                  <th className="py-2 pr-3 font-semibold text-right">Trabalhado</th>
                  <th className="py-2 pr-3 font-semibold text-right">Esperado</th>
                  <th className="py-2 pr-3 font-semibold text-right">Saldo</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {emp.dailyDetails.map((d: any) => {
                  const hasIssue = d.isAbsent || d.isLate;
                  return (
                    <tr
                      key={d.date}
                      className={`border-b last:border-0 transition-colors ${
                        d.isWeekend || d.isHoliday
                          ? "bg-muted/20 text-muted-foreground"
                          : d.isAbsent
                          ? "bg-rose-50/50 dark:bg-rose-950/10"
                          : d.isLate
                          ? "bg-amber-50/50 dark:bg-amber-950/10"
                          : ""
                      }`}
                      data-testid={`row-day-${d.date}`}
                    >
                      <td className="py-2.5 pr-3 font-medium whitespace-nowrap">{formatDate(d.date)}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">{getDayName(d.date)}</td>
                      <td className="py-2.5 pr-3">
                        {d.punches && d.punches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {d.punches.map((p: any, idx: number) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  p.type === "entry"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                }`}
                              >
                                {p.latitude && <MapPin className="w-2.5 h-2.5" />}
                                {p.time}
                              </span>
                            ))}
                            {d.isStillWorking && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse">
                                <Timer className="w-2.5 h-2.5" /> em andamento
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-medium tabular-nums whitespace-nowrap">
                        {d.workedMinutes > 0 ? formatMinutes(d.workedMinutes) : "-"}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                        {d.expectedMinutes > 0 ? formatMinutes(d.expectedMinutes) : "-"}
                      </td>
                      <td className={`py-2.5 pr-3 text-right font-semibold tabular-nums whitespace-nowrap ${
                        d.balance > 0 ? "text-emerald-600 dark:text-emerald-400" : d.balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                      }`}>
                        {d.expectedMinutes === 0 && d.workedMinutes === 0
                          ? "-"
                          : `${d.balance > 0 ? "+" : ""}${formatMinutes(d.balance)}`}
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {d.isHoliday && <Badge variant="secondary" className="text-[10px] px-1.5">Feriado</Badge>}
                          {d.isWeekend && <Badge variant="outline" className="text-[10px] px-1.5">FDS</Badge>}
                          {d.isAbsent && <Badge variant="destructive" className="text-[10px] px-1.5">Falta</Badge>}
                          {d.isLate && <Badge className="text-[10px] px-1.5 bg-amber-500 hover:bg-amber-600">Atraso</Badge>}
                          {d.isStillWorking && <Badge className="text-[10px] px-1.5 bg-blue-500 hover:bg-blue-600">Trabalhando</Badge>}
                          {d.hasIrregularity && (
                            <Badge className="text-[10px] px-1.5 bg-red-500 hover:bg-red-600 gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Irregular
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ReportsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstDay.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

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

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/admin/reports", startDate, endDate, selectedEmployee],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const toggleEmployee = (id: string) => {
    setExpandedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (reportData?.report) {
      setExpandedEmployees(new Set(reportData.report.map((e: any) => e.employee.id)));
    }
  };

  const collapseAll = () => setExpandedEmployees(new Set());

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
      rows.push("Usuario:;" + (emp.employee.username || ""));
      rows.push("Departamento:;" + (emp.employee.department || "-"));
      rows.push("Cargo:;" + (emp.employee.position || "-"));
      rows.push("Carga Horaria Diaria:;" + formatMinutes(emp.employee.workHoursMinutes || 528));
      rows.push("");
      rows.push("Resumo:");
      rows.push("Dias Trabalhados;" + emp.summary.daysWorked + " de " + emp.summary.workDays + " dias uteis");
      rows.push("Horas Trabalhadas;" + formatMinutes(emp.summary.totalWorkedMinutes));
      rows.push("Horas Esperadas;" + formatMinutes(emp.summary.totalExpectedMinutes));
      rows.push("Banco de Horas;" + formatMinutes(emp.summary.totalBankMinutes));
      rows.push("Atrasos;" + emp.summary.lateCount);
      rows.push("Faltas;" + emp.summary.absentCount);
      rows.push("");
      rows.push("Data;Dia;Registros;Trabalhado;Esperado;Saldo;Status");

      for (const d of emp.dailyDetails) {
        const punchesStr = d.punches?.map((p: any) => `${p.type === "entry" ? "E" : "S"}:${p.time.slice(0, 5)}`).join(" ") || "-";
        const status = [];
        if (d.isHoliday) status.push("Feriado");
        if (d.isWeekend) status.push("FDS");
        if (d.isAbsent) status.push("Falta");
        if (d.isLate) status.push("Atraso");
        if (d.isStillWorking) status.push("Em andamento");
        rows.push(
          `${formatDate(d.date)};${getDayName(d.date)};${punchesStr};${formatMinutes(d.workedMinutes)};${formatMinutes(d.expectedMinutes)};${d.balance > 0 ? "+" : ""}${formatMinutes(d.balance)};${status.join(", ")}`
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
  const totalAbsent = reportData?.report?.reduce((s: number, e: any) => s + e.summary.absentCount, 0) || 0;
  const employeeCount = reportData?.report?.length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-reports-title">Relatorios</h1>
            <p className="text-muted-foreground mt-1">Acompanhamento detalhado de ponto para RH</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={expandAll} className="gap-2 text-sm" data-testid="button-expand-all">
              <ChevronDown className="w-4 h-4" /> Expandir Todos
            </Button>
            <Button onClick={exportCSV} className="gap-2" data-testid="button-export-csv">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Inicio</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Funcionario</Label>
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
              <div className="flex items-end">
                <Button variant="secondary" className="w-full gap-2" onClick={() => {}} data-testid="button-filter">
                  <Filter className="w-4 h-4" /> Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-0 bg-muted/50">
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Funcionarios</p>
                  <p className="text-xl font-bold mt-0.5" data-testid="stat-employee-count">{employeeCount}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/50">
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Trabalhado</p>
                  <p className="text-xl font-bold mt-0.5 text-blue-600 dark:text-blue-400" data-testid="stat-total-worked">{formatMinutes(totalWorked)}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/50">
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Esperado</p>
                  <p className="text-xl font-bold mt-0.5" data-testid="stat-total-expected">{formatMinutes(totalExpected)}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/50">
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Banco Horas</p>
                  <p className={`text-xl font-bold mt-0.5 ${totalBank >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`} data-testid="stat-total-bank">
                    {totalBank >= 0 ? "+" : ""}{formatMinutes(totalBank)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/50">
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Atrasos</p>
                  <p className={`text-xl font-bold mt-0.5 ${totalLate > 0 ? "text-amber-600 dark:text-amber-400" : ""}`} data-testid="stat-total-late">{totalLate}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/50">
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Faltas</p>
                  <p className={`text-xl font-bold mt-0.5 ${totalAbsent > 0 ? "text-rose-600 dark:text-rose-400" : ""}`} data-testid="stat-total-absent">{totalAbsent}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reportData?.report?.length > 0 ? (
          <div className="space-y-3">
            {reportData.report.map((emp: any) => (
              <EmployeeReport
                key={emp.employee.id}
                emp={emp}
                expanded={expandedEmployees.has(emp.employee.id)}
                onToggle={() => toggleEmployee(emp.employee.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
              <p className="font-medium text-muted-foreground">Nenhum registro encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Ajuste os filtros e tente novamente</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
