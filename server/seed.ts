import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    const existingMaster = await storage.getUserByUsername("admin");
    if (existingMaster) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database...");

    const company = await storage.createCompany({
      name: "TechCorp Brasil Ltda",
      cnpj: "12.345.678/0001-90",
      email: "contato@techcorp.com.br",
      phone: "(11) 99999-0000",
      address: "Av. Paulista, 1000 - Sao Paulo, SP",
      geoLat: -23.5613,
      geoLng: -46.6560,
      geoRadius: 200,
      workHoursMinutes: 528,
      closingDayStart: 1,
      closingDayEnd: 1,
      toleranceMinutes: 10,
      active: true,
    });

    await storage.createUser({
      username: "admin",
      password: "admin123",
      name: "Administrador Master",
      email: "master@pontomax.com",
      role: "admin_master",
      companyId: null,
      department: null,
      position: "Admin Master",
      workHoursMinutes: null,
      mustChangePassword: false,
      active: true,
    });

    await storage.createUser({
      username: "empresa",
      password: "empresa123",
      name: "Carlos Silva",
      email: "carlos@techcorp.com.br",
      role: "admin_company",
      companyId: company.id,
      department: "Administracao",
      position: "Gerente",
      workHoursMinutes: null,
      mustChangePassword: false,
      active: true,
    });

    const emp1 = await storage.createUser({
      username: "joao.santos",
      password: "123456",
      name: "Joao Santos",
      email: "joao@techcorp.com.br",
      role: "employee",
      companyId: company.id,
      department: "Desenvolvimento",
      position: "Desenvolvedor Senior",
      workHoursMinutes: 528,
      mustChangePassword: false,
      active: true,
    });

    const emp2 = await storage.createUser({
      username: "maria.oliveira",
      password: "123456",
      name: "Maria Oliveira",
      email: "maria@techcorp.com.br",
      role: "employee",
      companyId: company.id,
      department: "Design",
      position: "UI Designer",
      workHoursMinutes: 528,
      mustChangePassword: false,
      active: true,
    });

    const emp3 = await storage.createUser({
      username: "pedro.costa",
      password: "123456",
      name: "Pedro Costa",
      email: "pedro@techcorp.com.br",
      role: "employee",
      companyId: company.id,
      department: "Desenvolvimento",
      position: "Desenvolvedor Junior",
      workHoursMinutes: 480,
      mustChangePassword: false,
      active: true,
    });

    await storage.createUser({
      username: "ana.ferreira",
      password: "123456",
      name: "Ana Ferreira",
      email: "ana@techcorp.com.br",
      role: "employee",
      companyId: company.id,
      department: "RH",
      position: "Analista RH",
      workHoursMinutes: 528,
      mustChangePassword: false,
      active: true,
    });

    const now = new Date();
    const today8am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 2, 0);

    await storage.createTimeRecord({
      userId: emp1.id,
      companyId: company.id,
      type: "entry",
      latitude: -23.5613,
      longitude: -46.6560,
      address: "Av. Paulista, 1000",
      ip: "192.168.1.10",
    });

    await storage.createTimeRecord({
      userId: emp2.id,
      companyId: company.id,
      type: "entry",
      latitude: -23.5615,
      longitude: -46.6558,
      address: "Av. Paulista, 1000",
      ip: "192.168.1.11",
    });

    await storage.createHoliday({
      companyId: company.id,
      name: "Natal",
      date: "2025-12-25",
      national: true,
    });

    await storage.createHoliday({
      companyId: company.id,
      name: "Ano Novo",
      date: "2026-01-01",
      national: true,
    });

    await storage.createHoliday({
      companyId: company.id,
      name: "Carnaval",
      date: "2026-02-16",
      national: true,
    });

    await storage.createHoliday({
      companyId: company.id,
      name: "Tiradentes",
      date: "2026-04-21",
      national: true,
    });

    await storage.createAdjustmentRequest({
      userId: emp3.id,
      companyId: company.id,
      date: "2026-02-18",
      requestedTime: "08:00",
      type: "entry",
      reason: "Esqueci de registrar entrada - estava em reuniao externa",
    });

    console.log("Database seeded successfully!");
    console.log("Login credentials:");
    console.log("  Admin Master: admin / admin123");
    console.log("  Admin Empresa: empresa / empresa123");
    console.log("  Funcionario: joao.santos / 123456");
  } catch (err) {
    console.error("Seed error:", err);
  }
}
