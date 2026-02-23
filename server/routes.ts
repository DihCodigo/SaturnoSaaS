import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateToken, authMiddleware, type AuthRequest } from "./auth";
import bcrypt from "bcrypt";
import { z } from "zod";

function safeUser(user: any) {
  const { password, ...safe } = user;
  return safe;
}

const registerBodySchema = z.object({
  companyName: z.string().min(2),
  cnpj: z.string().min(11),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  adminName: z.string().min(2),
  adminUsername: z.string().min(3),
  adminPassword: z.string().min(6),
});

const loginBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  loginType: z.enum(["admin", "employee"]),
});

const createEmployeeSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(4),
  department: z.string().optional(),
  position: z.string().optional(),
  workHoursMinutes: z.number().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados invalidos" });
      }
      const { companyName, cnpj, email, phone, address, adminName, adminUsername, adminPassword } = parsed.data;

      const existingUser = await storage.getUserByUsername(adminUsername);
      if (existingUser) {
        return res.status(400).json({ message: "Usuario ja existe" });
      }

      const company = await storage.createCompany({
        name: companyName,
        cnpj,
        email,
        phone: phone || null,
        address: address || null,
        geoLat: null,
        geoLng: null,
        geoRadius: 100,
        workHoursMinutes: 528,
        closingDayStart: 1,
        closingDayEnd: 1,
        toleranceMinutes: 10,
        active: true,
      });

      await storage.createUser({
        username: adminUsername,
        password: adminPassword,
        name: adminName,
        email,
        role: "admin_company",
        companyId: company.id,
        department: null,
        position: "Administrador",
        workHoursMinutes: null,
        mustChangePassword: false,
        active: true,
      });

      res.json({ message: "Empresa cadastrada com sucesso" });
    } catch (err: any) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Erro ao cadastrar empresa" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados invalidos" });
      }
      const { username, password, loginType } = parsed.data;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Credenciais invalidas" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciais invalidas" });
      }

      if (!user.active) {
        return res.status(401).json({ message: "Conta desativada" });
      }

      if (loginType === "admin" && user.role === "employee") {
        return res.status(401).json({ message: "Acesso de administrador nao permitido para funcionarios" });
      }

      if (loginType === "employee" && user.role !== "employee") {
        return res.status(401).json({ message: "Use a aba de administrador para fazer login" });
      }

      const token = generateToken({ id: user.id, role: user.role, companyId: user.companyId });
      const { password: _, ...safeUser } = user;

      res.json({ token, user: safeUser });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/change-password", authMiddleware(), async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "Usuario nao encontrado" });

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ message: "Senha atual incorreta" });

      await storage.updateUser(user.id, { password: newPassword, mustChangePassword: false });
      res.json({ message: "Senha alterada com sucesso" });
    } catch (err) {
      console.error("Change password error:", err);
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // Admin Company routes
  app.get("/api/admin/dashboard", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId!;
      const employees = await storage.getEmployeesByCompany(companyId);
      const todayRecords = await storage.getTimeRecordsByCompany(companyId);

      const workingNow = new Set<string>();
      const employeeRecords: Record<string, any[]> = {};
      for (const record of todayRecords) {
        if (!employeeRecords[record.userId]) employeeRecords[record.userId] = [];
        employeeRecords[record.userId].push(record);
      }
      for (const [userId, records] of Object.entries(employeeRecords)) {
        if (records.length % 2 === 1) workingNow.add(userId);
      }

      const activeEmployees = employees.filter(e => e.active);
      const absentToday = activeEmployees.filter(e => !employeeRecords[e.id] || employeeRecords[e.id].length === 0).length;

      const alerts: any[] = [];
      for (const [userId, records] of Object.entries(employeeRecords)) {
        if (records.length % 2 === 1) {
          const emp = employees.find(e => e.id === userId);
          if (emp) {
            const lastEntry = records[records.length - 1];
            const elapsed = (Date.now() - new Date(lastEntry.timestamp).getTime()) / 60000;
            const workMinutes = emp.workHoursMinutes || 528;
            if (elapsed > workMinutes + 60) {
              alerts.push({
                title: `${emp.name} - Jornada estendida`,
                description: `Trabalhando ha mais de ${Math.floor(elapsed / 60)}h sem registrar saida`,
                type: "overtime",
              });
            }
          }
        }
      }

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentRecords = await storage.getTimeRecordsByCompany(companyId, sevenDaysAgo, now);
      const existingAdj = await storage.getAdjustmentsByCompany(companyId);
      const adjKeys = new Set(existingAdj
        .filter(a => a.irregularityType && a.status !== "rejected")
        .map(a => `${a.userId}-${a.date}-${a.irregularityType}`));
      const holidaysData = await storage.getHolidaysByCompany(companyId);
      const holidayDates = new Set(holidaysData.map(h => h.date));

      const recentByUser: Record<string, Record<string, any[]>> = {};
      for (const r of recentRecords) {
        if (!recentByUser[r.userId]) recentByUser[r.userId] = {};
        const day = new Date(r.timestamp).toISOString().split("T")[0];
        if (!recentByUser[r.userId][day]) recentByUser[r.userId][day] = [];
        recentByUser[r.userId][day].push(r);
      }

      let irregularityCount = 0;
      for (const emp of activeEmployees) {
        const userDays = recentByUser[emp.id] || {};
        for (const [day, recs] of Object.entries(userDays)) {
          if (day === todayStr) continue;
          if (holidayDates.has(day)) continue;
          const dd = new Date(day + "T12:00:00");
          if (dd.getDay() === 0 || dd.getDay() === 6) continue;
          if (recs.length % 2 === 1 && !adjKeys.has(`${emp.id}-${day}-missing_exit`)) {
            irregularityCount++;
          }
          if (recs.length === 2 && !adjKeys.has(`${emp.id}-${day}-missing_lunch`)) {
            irregularityCount++;
          }
        }
      }

      if (irregularityCount > 0) {
        alerts.unshift({
          title: `${irregularityCount} irregularidade${irregularityCount > 1 ? "s" : ""} detectada${irregularityCount > 1 ? "s" : ""}`,
          description: "Pontos incompletos nos ultimos 7 dias. Verifique em Ajustes.",
          type: "irregularity",
        });
      }

      const pendingAdj = existingAdj.filter(a => a.status === "pending").length;
      if (pendingAdj > 0) {
        alerts.push({
          title: `${pendingAdj} ajuste${pendingAdj > 1 ? "s" : ""} pendente${pendingAdj > 1 ? "s" : ""}`,
          description: "Solicitacoes de ajuste aguardando revisao.",
          type: "pending_adjustment",
        });
      }

      res.json({
        totalEmployees: activeEmployees.length,
        workingNow: workingNow.size,
        absentToday,
        overtimeHours: "0h",
        alerts,
        irregularityCount,
        pendingAdjustments: pendingAdj,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      res.status(500).json({ message: "Erro ao carregar dashboard" });
    }
  });

  app.get("/api/admin/recent-records", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId!;
      const records = await storage.getTimeRecordsByCompany(companyId);
      const employees = await storage.getEmployeesByCompany(companyId);
      const empMap = new Map(employees.map(e => [e.id, e]));

      const lastPunchByUser = new Map<number, string>();
      for (const r of records) {
        if (!lastPunchByUser.has(r.userId)) {
          lastPunchByUser.set(r.userId, r.type);
        }
      }

      const enriched = records.slice(0, 20).map(r => ({
        ...r,
        userName: empMap.get(r.userId)?.name || "Desconhecido",
        isWorking: lastPunchByUser.get(r.userId) === "entry",
      }));

      res.json(enriched);
    } catch (err) {
      console.error("Recent records error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  app.get("/api/admin/employees", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId!;
      const employees = await storage.getEmployeesByCompany(companyId);
      const todayRecords = await storage.getTimeRecordsByCompany(companyId);

      const employeeRecords: Record<string, any[]> = {};
      for (const r of todayRecords) {
        if (!employeeRecords[r.userId]) employeeRecords[r.userId] = [];
        employeeRecords[r.userId].push(r);
      }

      const enriched = employees.map(e => ({
        ...e,
        password: undefined,
        isWorking: (employeeRecords[e.id]?.length || 0) % 2 === 1,
      }));

      res.json(enriched);
    } catch (err) {
      console.error("Employees error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  app.post("/api/admin/employees", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId!;
      const parsed = createEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados invalidos" });
      }
      const { name, username, email, password, department, position, workHoursMinutes } = parsed.data;

      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(400).json({ message: "Usuario ja existe" });

      const employee = await storage.createUser({
        username,
        password,
        name,
        email,
        role: "employee",
        companyId,
        department: department || null,
        position: position || null,
        workHoursMinutes: workHoursMinutes || null,
        mustChangePassword: true,
        active: true,
      });

      const { password: _, ...safe } = employee;
      res.json(safe);
    } catch (err) {
      console.error("Create employee error:", err);
      res.status(500).json({ message: "Erro ao criar funcionario" });
    }
  });

  app.put("/api/admin/employees/:id", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const { name, email, department, position, workHoursMinutes, password } = req.body;
      const data: any = { name, email, department: department || null, position: position || null, workHoursMinutes: workHoursMinutes || null };
      if (password) data.password = password;

      const updated = await storage.updateUser(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Funcionario nao encontrado" });

      const { password: _, ...safe } = updated;
      res.json(safe);
    } catch (err) {
      console.error("Update employee error:", err);
      res.status(500).json({ message: "Erro ao atualizar" });
    }
  });

  app.patch("/api/admin/employees/:id/toggle", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const { active } = req.body;
      const updated = await storage.updateUser(req.params.id, { active });
      if (!updated) return res.status(404).json({ message: "Funcionario nao encontrado" });
      res.json({ message: "Status atualizado" });
    } catch (err) {
      res.status(500).json({ message: "Erro" });
    }
  });

  app.get("/api/admin/company", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const company = await storage.getCompany(req.user!.companyId!);
      if (!company) return res.status(404).json({ message: "Empresa nao encontrada" });
      res.json(company);
    } catch (err) {
      res.status(500).json({ message: "Erro" });
    }
  });

  app.put("/api/admin/company", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const updated = await storage.updateCompany(req.user!.companyId!, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar" });
    }
  });

  app.get("/api/admin/holidays", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const holidays = await storage.getHolidaysByCompany(req.user!.companyId!);
      res.json(holidays);
    } catch (err) {
      res.status(500).json({ message: "Erro" });
    }
  });

  app.post("/api/admin/holidays", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const holiday = await storage.createHoliday({
        ...req.body,
        companyId: req.user!.companyId!,
      });
      res.json(holiday);
    } catch (err) {
      res.status(500).json({ message: "Erro" });
    }
  });

  app.delete("/api/admin/holidays/:id", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      await storage.deleteHoliday(req.params.id);
      res.json({ message: "Feriado removido" });
    } catch (err) {
      res.status(500).json({ message: "Erro" });
    }
  });

  app.get("/api/admin/irregularities", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId!;
      const employees = await storage.getEmployeesByCompany(companyId);
      const activeEmployees = employees.filter(e => e.active);
      const company = await storage.getCompany(companyId);
      const holidays = await storage.getHolidaysByCompany(companyId);
      const holidayDates = new Set(holidays.map(h => h.date));

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const allRecords = await storage.getTimeRecordsByCompany(companyId, thirtyDaysAgo, now);
      const existingAdjustments = await storage.getAdjustmentsByCompany(companyId);
      const adjustmentKeys = new Set(existingAdjustments
        .filter(a => a.irregularityType && a.status !== "rejected")
        .map(a => `${a.userId}-${a.date}-${a.irregularityType}`));

      const recordsByUser: Record<string, Record<string, any[]>> = {};
      for (const r of allRecords) {
        if (!recordsByUser[r.userId]) recordsByUser[r.userId] = {};
        const day = new Date(r.timestamp).toISOString().split("T")[0];
        if (!recordsByUser[r.userId][day]) recordsByUser[r.userId][day] = [];
        recordsByUser[r.userId][day].push(r);
      }

      const irregularities: any[] = [];

      for (const emp of activeEmployees) {
        const userDays = recordsByUser[emp.id] || {};

        for (const [day, records] of Object.entries(userDays)) {
          if (day === todayStr) continue;
          if (holidayDates.has(day)) continue;
          const dayDate = new Date(day + "T12:00:00");
          const dayOfWeek = dayDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;

          const sorted = records.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          const punchCount = sorted.length;

          if (punchCount % 2 === 1) {
            const key = `${emp.id}-${day}-missing_exit`;
            if (!adjustmentKeys.has(key)) {
              const lastPunch = sorted[sorted.length - 1];
              const lastTime = new Date(lastPunch.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              irregularities.push({
                id: `${emp.id}-${day}-missing_exit`,
                userId: emp.id,
                userName: emp.name,
                department: emp.department,
                date: day,
                dateFormatted: dayDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }),
                type: "missing_exit",
                description: `Ultimo registro: ${lastTime} (${punchCount} registro${punchCount > 1 ? "s" : ""}) - Falta saida`,
                punchCount,
                punches: sorted.map((r: any) => ({
                  time: new Date(r.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                  type: r.type,
                })),
              });
            }
          }

          if (punchCount === 2) {
            const key = `${emp.id}-${day}-missing_lunch`;
            if (!adjustmentKeys.has(key)) {
              const entryTime = new Date(sorted[0].timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const exitTime = new Date(sorted[1].timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              irregularities.push({
                id: `${emp.id}-${day}-missing_lunch`,
                userId: emp.id,
                userName: emp.name,
                department: emp.department,
                date: day,
                dateFormatted: dayDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }),
                type: "missing_lunch",
                description: `Entrada: ${entryTime}, Saida: ${exitTime} - Sem registro de almoco`,
                punchCount,
                punches: sorted.map((r: any) => ({
                  time: new Date(r.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                  type: r.type,
                })),
              });
            }
          }
        }
      }

      irregularities.sort((a, b) => b.date.localeCompare(a.date));
      res.json(irregularities);
    } catch (err) {
      console.error("Irregularities error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  app.get("/api/admin/adjustments", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const adjustments = await storage.getAdjustmentsByCompany(req.user!.companyId!);
      const employees = await storage.getEmployeesByCompany(req.user!.companyId!);
      const empMap = new Map(employees.map(e => [e.id, e]));

      const enriched = adjustments.map(a => ({
        ...a,
        userName: empMap.get(a.userId)?.name || "Desconhecido",
      }));

      res.json(enriched);
    } catch (err) {
      res.status(500).json({ message: "Erro" });
    }
  });

  app.post("/api/admin/adjustments", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const { userId, date, type, adminNote, irregularityType } = req.body;
      if (!userId || !date || !type) {
        return res.status(400).json({ message: "Dados incompletos" });
      }

      const employee = await storage.getUser(userId);
      if (!employee || employee.companyId !== req.user!.companyId) {
        return res.status(403).json({ message: "Funcionario nao encontrado" });
      }

      const adjustment = await storage.createAdjustmentRequest({
        userId,
        companyId: req.user!.companyId!,
        date,
        type,
        requestedTime: null,
        reason: null,
        status: "awaiting_employee",
        createdBy: "admin",
        adminNote: adminNote || `Irregularidade detectada: ${type === "missing_exit" ? "Saida nao registrada" : "Almoco nao registrado"}`,
        irregularityType: irregularityType || type,
      });

      res.json(adjustment);
    } catch (err) {
      console.error("Create admin adjustment error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  app.patch("/api/admin/adjustments/:id/review", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      const updated = await storage.updateAdjustment(req.params.id, {
        status,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
      });

      if (status === "approved" && updated && updated.requestedTime) {
        const [hours, minutes] = updated.requestedTime.split(":").map(Number);
        const dateStr = updated.date;
        const punchTime = new Date(dateStr + "T00:00:00");
        punchTime.setHours(hours, minutes, 0, 0);

        let punchType = updated.type;
        if (punchType === "missing_exit") punchType = "exit";
        else if (punchType === "missing_lunch") punchType = "exit";

        await storage.createTimeRecordWithTimestamp({
          userId: updated.userId,
          companyId: updated.companyId,
          type: punchType,
          timestamp: punchTime,
          latitude: null,
          longitude: null,
          address: "Ajuste aprovado",
          ip: "adjustment",
        });
      }

      res.json(updated);
    } catch (err) {
      console.error("Review adjustment error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  // Reports routes
  app.get("/api/admin/reports", authMiddleware(["admin_company"]), async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId!;
      const { startDate, endDate, employeeId } = req.query;
      const company = await storage.getCompany(companyId);
      const employees = await storage.getEmployeesByCompany(companyId);
      const holidays = await storage.getHolidaysByCompany(companyId);
      const tolerance = company?.toleranceMinutes || 10;

      const start = startDate ? new Date(startDate as string + "T00:00:00") : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate as string + "T23:59:59.999") : new Date();
      end.setHours(23, 59, 59, 999);

      const targetEmployees = employeeId
        ? employees.filter(e => e.id === employeeId)
        : employees.filter(e => e.active);

      const holidayDates = new Set(holidays.map(h => h.date));

      const allRecords = await storage.getTimeRecordsByCompany(companyId, start, end);
      const recordsByUser: Record<string, typeof allRecords> = {};
      for (const r of allRecords) {
        if (!recordsByUser[r.userId]) recordsByUser[r.userId] = [];
        recordsByUser[r.userId].push(r);
      }

      const allDatesInRange: string[] = [];
      const cursor = new Date(start);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const rangeEnd = end > today ? today : end;
      while (cursor <= rangeEnd) {
        const y = cursor.getFullYear();
        const mo = String(cursor.getMonth() + 1).padStart(2, "0");
        const d = String(cursor.getDate()).padStart(2, "0");
        allDatesInRange.push(`${y}-${mo}-${d}`);
        cursor.setDate(cursor.getDate() + 1);
      }

      const report = [];
      for (const emp of targetEmployees) {
        const records = recordsByUser[emp.id] || [];
        const workHoursMinutes = emp.workHoursMinutes || company?.workHoursMinutes || 528;

        const dayMap: Record<string, any[]> = {};
        for (const r of records) {
          const ts = new Date(r.timestamp);
          const y = ts.getFullYear();
          const mo = String(ts.getMonth() + 1).padStart(2, "0");
          const d = String(ts.getDate()).padStart(2, "0");
          const day = `${y}-${mo}-${d}`;
          if (!dayMap[day]) dayMap[day] = [];
          dayMap[day].push(r);
        }

        let totalWorkedMinutes = 0;
        let totalExpectedMinutes = 0;
        let totalBankMinutes = 0;
        let daysWorked = 0;
        let lateCount = 0;
        let absentCount = 0;
        const dailyDetails: any[] = [];

        for (const day of allDatesInRange) {
          const dayRecords = dayMap[day] || [];
          const dateParts = day.split("-").map(Number);
          const dayDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
          const dayOfWeek = dayDate.getDay();
          const isHoliday = holidayDates.has(day);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const expectedMinutes = (isHoliday || isWeekend) ? 0 : workHoursMinutes;

          if (dayRecords.length === 0) {
            totalExpectedMinutes += expectedMinutes;
            if (expectedMinutes > 0) absentCount++;
            dailyDetails.push({
              date: day,
              punches: [],
              workedMinutes: 0,
              expectedMinutes,
              balance: expectedMinutes > 0 ? -expectedMinutes : 0,
              isHoliday,
              isWeekend,
              isAbsent: expectedMinutes > 0,
              isLate: false,
              isStillWorking: false,
            });
            if (expectedMinutes > 0) {
              totalBankMinutes += -expectedMinutes;
            }
            continue;
          }

          const sorted = dayRecords.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          const punches = sorted.map((r: any) => ({
            time: new Date(r.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            type: r.type as string,
            latitude: r.latitude,
            longitude: r.longitude,
          }));

          let dayMinutes = 0;
          const hasOpenSession = sorted.length % 2 === 1;
          const nowMs = Date.now();
          const nowDate = new Date();
          const todayStr = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}-${String(nowDate.getDate()).padStart(2, "0")}`;
          const isToday = day === todayStr;
          const isStillWorking = hasOpenSession && isToday;
          const hasIrregularity = hasOpenSession && !isToday;

          for (let i = 0; i < sorted.length; i += 2) {
            const entry = new Date(sorted[i].timestamp).getTime();
            let exit: number | null = null;
            if (sorted[i + 1]) {
              exit = new Date(sorted[i + 1].timestamp).getTime();
            } else if (isToday) {
              exit = nowMs;
            }
            if (exit) {
              dayMinutes += (exit - entry) / 60000;
            }
          }

          totalWorkedMinutes += dayMinutes;
          totalExpectedMinutes += expectedMinutes;
          if (dayRecords.length > 0) daysWorked++;

          const diff = dayMinutes - expectedMinutes;
          let isLate = false;
          if (expectedMinutes > 0 && Math.abs(diff) > tolerance) {
            totalBankMinutes += diff;
          }

          if (sorted.length > 0 && expectedMinutes > 0) {
            const firstEntry = new Date(sorted[0].timestamp);
            const entryMinutes = firstEntry.getHours() * 60 + firstEntry.getMinutes();
            if (entryMinutes > 8 * 60 + tolerance) {
              lateCount++;
              isLate = true;
            }
          }

          dailyDetails.push({
            date: day,
            punches,
            workedMinutes: Math.round(dayMinutes),
            expectedMinutes,
            balance: Math.round(diff),
            isHoliday,
            isWeekend,
            isAbsent: false,
            isLate,
            isStillWorking,
            hasIrregularity,
            punchCount: sorted.length,
          });
        }

        report.push({
          employee: {
            id: emp.id,
            name: emp.name,
            username: emp.username,
            department: emp.department,
            position: emp.position,
            workHoursMinutes,
          },
          summary: {
            totalWorkedMinutes: Math.round(totalWorkedMinutes),
            totalExpectedMinutes,
            totalBankMinutes: Math.round(totalBankMinutes),
            daysWorked,
            lateCount,
            absentCount,
            workDays: allDatesInRange.filter(d => {
              const parts = d.split("-").map(Number);
              const dt = new Date(parts[0], parts[1] - 1, parts[2]);
              return dt.getDay() !== 0 && dt.getDay() !== 6 && !holidayDates.has(d);
            }).length,
          },
          dailyDetails,
        });
      }

      res.json({
        period: { start: start.toISOString(), end: end.toISOString() },
        company: { name: company?.name, cnpj: company?.cnpj },
        report,
      });
    } catch (err) {
      console.error("Reports error:", err);
      res.status(500).json({ message: "Erro ao gerar relatorio" });
    }
  });

  // Employee routes
  app.get("/api/employee/today", authMiddleware(["employee"]), async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "Usuario nao encontrado" });

      const company = user.companyId ? await storage.getCompany(user.companyId) : null;
      const records = await storage.getTodayRecords(user.id);

      const workHoursMinutes = user.workHoursMinutes || company?.workHoursMinutes || 528;

      let bankHours = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const allRecords = await storage.getTimeRecordsByUser(user.id);
      const monthRecords = allRecords.filter(r => new Date(r.timestamp) >= startOfMonth);

      const dayMap: Record<string, any[]> = {};
      for (const r of monthRecords) {
        const day = new Date(r.timestamp).toISOString().split("T")[0];
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(r);
      }

      for (const [day, dayRecords] of Object.entries(dayMap)) {
        let totalMinutes = 0;
        const sorted = dayRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        for (let i = 0; i < sorted.length; i += 2) {
          const entry = new Date(sorted[i].timestamp).getTime();
          const exit = sorted[i + 1] ? new Date(sorted[i + 1].timestamp).getTime() : Date.now();
          totalMinutes += (exit - entry) / 60000;
        }
        const tolerance = company?.toleranceMinutes || 10;
        const diff = totalMinutes - workHoursMinutes;
        if (Math.abs(diff) > tolerance) {
          bankHours += diff;
        }
      }

      res.json({
        records,
        workHoursMinutes,
        bankHours: Math.round(bankHours),
      });
    } catch (err) {
      console.error("Today error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  app.post("/api/employee/punch", authMiddleware(["employee"]), async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "Usuario nao encontrado" });

      const todayRecords = await storage.getTodayRecords(user.id);
      const type = todayRecords.length % 2 === 0 ? "entry" : "exit";
      const { latitude, longitude, force } = req.body;

      if (!force && todayRecords.length > 0) {
        const lastRecord = todayRecords[todayRecords.length - 1];
        const lastTime = new Date(lastRecord.timestamp).getTime();
        const minutesSince = (Date.now() - lastTime) / 60000;

        if (minutesSince < 10) {
          const lastTimeStr = new Date(lastRecord.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          const lastType = lastRecord.type === "entry" ? "Entrada" : "Saida";
          return res.status(409).json({
            message: `Voce ja registrou ${lastType} as ${lastTimeStr} (ha ${Math.floor(minutesSince)} minutos). Deseja registrar novamente?`,
            recentPunch: true,
            lastPunchTime: lastTimeStr,
            lastPunchType: lastType,
            minutesSince: Math.floor(minutesSince),
          });
        }
      }

      const record = await storage.createTimeRecord({
        userId: user.id,
        companyId: user.companyId!,
        type,
        latitude: latitude || null,
        longitude: longitude || null,
        address: null,
        ip: (req.headers["x-forwarded-for"] as string) || req.ip || null,
      });

      res.json(record);
    } catch (err) {
      console.error("Punch error:", err);
      res.status(500).json({ message: "Erro ao registrar ponto" });
    }
  });

  app.get("/api/employee/history", authMiddleware(["employee"]), async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "Usuario nao encontrado" });

      const company = user.companyId ? await storage.getCompany(user.companyId) : null;
      const workHoursMinutes = user.workHoursMinutes || company?.workHoursMinutes || 528;
      const tolerance = company?.toleranceMinutes || 10;

      const allRecords = await storage.getTimeRecordsByUser(user.id);

      const dayMap: Record<string, any[]> = {};
      for (const r of allRecords) {
        const day = new Date(r.timestamp).toISOString().split("T")[0];
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(r);
      }

      const history = Object.entries(dayMap)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 30)
        .map(([date, records]) => {
          const sorted = records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          let totalMinutes = 0;
          for (let i = 0; i < sorted.length; i += 2) {
            const entry = new Date(sorted[i].timestamp).getTime();
            const exit = sorted[i + 1] ? new Date(sorted[i + 1].timestamp).getTime() : 0;
            if (exit) totalMinutes += (exit - entry) / 60000;
          }

          const diff = totalMinutes - workHoursMinutes;
          const overtime = diff > tolerance ? Math.round(diff) : 0;
          const deficit = diff < -tolerance ? Math.round(Math.abs(diff)) : 0;

          const d = new Date(date + "T12:00:00");
          const dateFormatted = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });

          return {
            date,
            dateFormatted,
            records: sorted,
            totalMinutes: Math.round(totalMinutes),
            overtime,
            deficit,
          };
        });

      res.json(history);
    } catch (err) {
      console.error("History error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  app.get("/api/employee/adjustments", authMiddleware(["employee"]), async (req: AuthRequest, res) => {
    try {
      const adjustments = await storage.getAdjustmentsByUser(req.user!.id);
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.json(adjustments);

      const allRecords = await storage.getTimeRecordsByUser(user.id);

      const recordsByDay: Record<string, any[]> = {};
      for (const r of allRecords) {
        const day = new Date(r.timestamp).toISOString().split("T")[0];
        if (!recordsByDay[day]) recordsByDay[day] = [];
        recordsByDay[day].push(r);
      }

      const enriched = adjustments.map(a => {
        const dayRecords = recordsByDay[a.date] || [];
        const sorted = dayRecords.sort((x: any, y: any) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime());
        const punches = sorted.map((r: any) => ({
          time: new Date(r.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          type: r.type as string,
        }));

        const dayDate = new Date(a.date + "T12:00:00");
        const dateFormatted = dayDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

        const expectedPunches = [
          { label: "1a Entrada", order: 0 },
          { label: "Saida Almoco", order: 1 },
          { label: "Volta Almoco", order: 2 },
          { label: "Saida Final", order: 3 },
        ];

        const timeline = expectedPunches.map((ep, idx) => ({
          label: ep.label,
          time: punches[idx]?.time || null,
          type: punches[idx]?.type || null,
          missing: !punches[idx],
        }));

        return {
          ...a,
          dateFormatted,
          punches,
          punchCount: punches.length,
          timeline,
        };
      });

      res.json(enriched);
    } catch (err) {
      console.error("Employee adjustments error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  app.post("/api/employee/adjustments", authMiddleware(["employee"]), async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "Usuario nao encontrado" });

      const adjustment = await storage.createAdjustmentRequest({
        userId: user.id,
        companyId: user.companyId!,
        date: req.body.date,
        requestedTime: req.body.requestedTime,
        type: req.body.type,
        reason: req.body.reason,
        createdBy: "employee",
      });

      res.json(adjustment);
    } catch (err) {
      res.status(500).json({ message: "Erro" });
    }
  });

  app.patch("/api/employee/adjustments/:id/respond", authMiddleware(["employee"]), async (req: AuthRequest, res) => {
    try {
      const { requestedTime, reason } = req.body;
      if (!requestedTime || !reason) {
        return res.status(400).json({ message: "Horario e motivo sao obrigatorios" });
      }

      const adjustments = await storage.getAdjustmentsByUser(req.user!.id);
      const adjustment = adjustments.find(a => a.id === req.params.id);
      if (!adjustment) return res.status(404).json({ message: "Ajuste nao encontrado" });
      if (adjustment.status !== "awaiting_employee") {
        return res.status(400).json({ message: "Este ajuste nao esta aguardando resposta" });
      }

      const updated = await storage.updateAdjustment(req.params.id, {
        requestedTime,
        reason,
        status: "pending",
      });

      res.json(updated);
    } catch (err) {
      console.error("Employee respond error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  // Master routes
  app.get("/api/master/dashboard", authMiddleware(["admin_master"]), async (req: AuthRequest, res) => {
    try {
      const allCompanies = await storage.getAllCompanies();
      const totalUsers = await storage.countAllUsers();
      const todayRecords = await storage.countTodayRecords();

      const companiesWithCounts = await Promise.all(
        allCompanies.map(async (c) => ({
          ...c,
          employeeCount: await storage.countUsersByCompany(c.id),
        }))
      );

      res.json({
        totalCompanies: allCompanies.length,
        totalUsers,
        todayRecords,
        activeCompanies: allCompanies.filter(c => c.active).length,
        companies: companiesWithCounts,
      });
    } catch (err) {
      console.error("Master dashboard error:", err);
      res.status(500).json({ message: "Erro" });
    }
  });

  return httpServer;
}
