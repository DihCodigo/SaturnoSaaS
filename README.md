#  Saturno SaaS - Sistema de Controle de Ponto Eletrônico

##  Sobre o Projeto

O **Saturno** é uma aplicação web SaaS completa para controle de ponto eletrônico online, com foco em empresas que precisam gerenciar jornada de trabalho, banco de horas e relatórios profissionais.

O sistema foi desenvolvido com arquitetura moderna, escalável e segura, suportando múltiplas empresas com isolamento total de dados.

---

##  Diferencial do Sistema

O acesso ao sistema é totalmente controlado por níveis de usuário:

###  Tipos de Usuário

####  ADMIN MASTER
- Dono do sistema SaaS
- Gerencia empresas
- Controla planos
- Visualiza dados globais

####  ADMIN DA EMPRESA
- Pode se cadastrar
- Cria e gerencia funcionários
- Define regras de jornada
- Gera relatórios completos

####  FUNCIONÁRIO
- NÃO pode se cadastrar
- Criado exclusivamente pelo administrador
- Obrigado a alterar senha no primeiro acesso
- Registra ponto com validações avançadas

---

##  Funcionalidades Principais

###  Registro de Ponto Inteligente
- Entrada e saída ilimitadas
- Geolocalização obrigatória
- Captura de foto via webcam
- Registro de:
  - Latitude / Longitude
  - Endereço
  - IP
  - Data e hora do servidor

---

###  Regras de Jornada

- Configuração de carga horária personalizada
- Período de fechamento mensal
- Tolerância automática de **10 minutos (CLT)**
- Cálculo automático:
  - Hora extra 50%
  - Hora extra 100% (domingos/feriados)
  - Hora extra 150% (configurável)

---

###  Painel Administrativo

- Funcionários ativos em tempo real
- Controle de presença
- Banco de horas
- Gestão de setores
- Alertas automáticos de inconsistência

---

###  Relatórios Profissionais

- Relatório individual detalhado
- Relatório mensal consolidado
- Exportação:
  - PDF
  - Excel
- Assinatura digital
- QR Code de validação

---

###  PWA (App Instalável)

- Funciona offline
- Sincronização automática
- Notificações push

---

###  Integrações

- WhatsApp (API / Twilio)
- Alertas automáticos:
  - Esquecimento de ponto
  - Fechamento de período

---

##  Arquitetura

### Frontend
- Angular 17+
- Angular Material
- PWA
- JWT Interceptor
- Guards de rota

### Backend
- Node.js + NestJS
- Arquitetura limpa (Clean Architecture)
- JWT + Refresh Token
- Bcrypt (hash de senha)

### Banco de Dados
- MySQL 8+
- Multiempresa com `company_id`

---

##  Segurança

- Senhas criptografadas (bcrypt)
- Proteção contra:
  - SQL Injection
  - XSS
  - CSRF
- Rate limit
- Logs de auditoria completos
- 2FA (autenticação em dois fatores)

---

## 🗂 Estrutura do Projeto

backend/
frontend/
database/
.env
