--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin_master',
    'admin_company',
    'employee'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adjustment_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adjustment_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    company_id character varying NOT NULL,
    date text NOT NULL,
    requested_time text,
    type text NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by character varying,
    reviewed_at timestamp without time zone,
    created_by text DEFAULT 'employee'::text NOT NULL,
    admin_note text,
    irregularity_type text
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    cnpj text NOT NULL,
    address text,
    phone text,
    email text,
    geo_lat real,
    geo_lng real,
    geo_radius integer DEFAULT 100,
    work_hours_minutes integer DEFAULT 528,
    closing_day_start integer DEFAULT 1,
    closing_day_end integer DEFAULT 1,
    tolerance_minutes integer DEFAULT 10,
    active boolean DEFAULT true
);


--
-- Name: holidays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.holidays (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying,
    name text NOT NULL,
    date text NOT NULL,
    "national" boolean DEFAULT false
);


--
-- Name: time_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_records (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    company_id character varying NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    type text NOT NULL,
    latitude real,
    longitude real,
    address text,
    ip text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    role public.user_role DEFAULT 'employee'::public.user_role NOT NULL,
    company_id character varying,
    department text,
    "position" text,
    work_hours_minutes integer,
    must_change_password boolean DEFAULT false,
    active boolean DEFAULT true
);


--
-- Data for Name: adjustment_requests; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.adjustment_requests (id, user_id, company_id, date, requested_time, type, reason, status, reviewed_by, reviewed_at, created_by, admin_note, irregularity_type) VALUES ('effd60e2-dde6-4c80-9158-059b7079ebe2', '774fdba7-1aa9-4767-bc42-30812fb80548', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', '2026-02-18', '08:00', 'entry', 'Esqueci de registrar entrada - estava em reuniao externa', 'pending', NULL, NULL, 'employee', NULL, NULL);
INSERT INTO public.adjustment_requests (id, user_id, company_id, date, requested_time, type, reason, status, reviewed_by, reviewed_at, created_by, admin_note, irregularity_type) VALUES ('cf5ad9b2-85ad-46da-9d0e-ab49193a2112', '24e694e6-1c06-4f19-a3f4-b1aeb4068c2f', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', '2026-02-20', '18:30', 'missing_exit', 'Esqueci de registrar a saida. Sai as 18:30.', 'pending', NULL, NULL, 'admin', 'Maria, por favor informe o horario de saida do dia 20/02.', 'missing_exit');
INSERT INTO public.adjustment_requests (id, user_id, company_id, date, requested_time, type, reason, status, reviewed_by, reviewed_at, created_by, admin_note, irregularity_type) VALUES ('670573a6-8b0b-4c06-84bd-46ad939a1e8c', 'fa7f6093-a359-4808-aab7-bd877db62bc9', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20', '23:20', 'missing_exit', 'Esqueci de registrar saída.', 'approved', 'c956a8cb-923d-4648-899f-3f803bcad78d', '2026-02-23 11:10:18.752', 'admin', 'Irregularidade detectada no dia sex., 20/02: Saida nao registrada. Por favor, informe o horario correto e o motivo.', 'missing_exit');


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.companies (id, name, cnpj, address, phone, email, geo_lat, geo_lng, geo_radius, work_hours_minutes, closing_day_start, closing_day_end, tolerance_minutes, active) VALUES ('d5b819ba-0d6d-4541-82f6-c9d119c196de', 'TechCorp Brasil Ltda', '12.345.678/0001-90', 'Av. Paulista, 1000 - Sao Paulo, SP', '(11) 99999-0000', 'contato@techcorp.com.br', -23.5613, -46.656, 200, 528, 1, 1, 10, true);
INSERT INTO public.companies (id, name, cnpj, address, phone, email, geo_lat, geo_lng, geo_radius, work_hours_minutes, closing_day_start, closing_day_end, tolerance_minutes, active) VALUES ('66548a22-d91b-434f-b7cf-194fcd597efd', 'NeedNews', '40.177.823/0001-01', 'Nestor Gonçalves Duque', '(12) 98221-1873', 'iddiegobis@gmail.com', NULL, NULL, 100, 528, 1, 1, 10, true);
INSERT INTO public.companies (id, name, cnpj, address, phone, email, geo_lat, geo_lng, geo_radius, work_hours_minutes, closing_day_start, closing_day_end, tolerance_minutes, active) VALUES ('2ea76010-a130-46bd-b21e-31af5ecd210a', 'Objctv', '62.423.804/0001-50', 'Nestor Gonçalves Duque', '(12) 98221-1873', 'empresa@objctv.one', NULL, NULL, 100, 528, 1, 1, 10, true);


--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('0c1d4bd5-fff8-4f94-94bd-fb6abb37d76a', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Natal', '2025-12-25', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('99127fe1-5c57-4a82-abb8-30af872d79db', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Ano Novo', '2026-01-01', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('02e035fc-2971-4f18-a837-585915d386b1', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Carnaval', '2026-02-16', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('d988fd31-812a-48ab-bbc4-da4e2562871c', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Tiradentes', '2026-04-21', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('8aa58912-445b-4293-b9eb-52cd240d0492', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Dia do Trabalho', '2026-05-01', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('a06bec06-44e8-4ca0-8073-6a1548316054', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Natal', '2026-12-25', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('dec2f08b-d550-4fe0-84a6-93e37be42edf', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Carnaval', '2026-02-17', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('fce70a94-ca1e-498b-a71f-f46a3eb822ed', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Quarta-feira de Cinzas', '2026-02-18', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('951466f6-0e2e-43c1-bfd1-f5b8fd8e2566', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Sexta-feira Santa', '2026-04-03', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('d75b0f0a-3363-4747-9941-ff12f0b747d7', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Dia do Trabalho', '2026-05-01', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('3a78d86b-0d0c-4a64-b0c4-f8f8a53b3017', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Corpus Christi', '2026-06-04', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('e4746e06-9d58-46b3-bb4e-ea6d91f2b52e', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Independência do Brasil', '2026-09-07', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('4f5e33d8-1d5f-465c-b86f-476156e6f8c7', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Nossa Senhora Aparecida', '2026-10-12', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('a8ba6fbd-9a19-4d81-9bfb-3d49e5236f0d', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Finados', '2026-11-02', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('e0123dc4-38c9-4fbb-a522-812d4dc56652', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Proclamação da República', '2026-11-15', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('35cd7843-79da-4221-886a-db287a44a7fc', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Consciência Negra', '2026-11-20', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('125f1825-b0cc-45cb-8d2b-de6d3238415f', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Natal', '2026-12-25', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('0da1025b-8533-4540-8e37-160bea9d15e6', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Confraternização Universal', '2026-01-01', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('fe01e239-97ed-4874-8e32-dc89bc203d31', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Carnaval', '2026-02-17', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('3cd3cb7e-3a0c-42bc-8702-32ef99cb99b3', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Carnaval', '2026-02-16', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('03f340ab-511c-41c6-8812-66c32d113722', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Quarta-feira de Cinzas', '2026-02-18', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('88696d3f-ccd3-41ec-88a3-42b942e34387', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Sexta-feira Santa', '2026-04-03', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('7e2974c4-4105-4a65-b510-918ae54c86b8', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Tiradentes', '2026-04-21', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('827af521-9d60-44b5-bf90-5f8b0ea5e532', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Corpus Christi', '2026-06-04', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('df2a86b3-613d-434f-8b7e-6b9572173d88', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Independência do Brasil', '2026-09-07', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('1eb8968d-8087-4c18-9102-7f2e192c08d8', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Nossa Senhora Aparecida', '2026-10-12', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('0eb22d2f-6ae2-4f62-aeb1-5d9a3321c430', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Finados', '2026-11-02', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('d0924404-c92e-4be7-a8c1-7ab58cd08cc6', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Proclamação da República', '2026-11-15', true);
INSERT INTO public.holidays (id, company_id, name, date, "national") VALUES ('274a9129-952c-4c17-b7d1-087d1a3965ea', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Consciência Negra', '2026-11-20', true);


--
-- Data for Name: time_records; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('daaafbb6-83f5-4231-a06c-39a3a8a4d158', 'c210cbac-03d5-43a2-bc4a-3ba13835847b', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', '2026-02-20 18:17:58.18023', 'entry', -23.5613, -46.656, 'Av. Paulista, 1000', '192.168.1.10');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('88b25909-8f5d-42ce-ba7e-7723998f5858', '24e694e6-1c06-4f19-a3f4-b1aeb4068c2f', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', '2026-02-20 18:17:58.183972', 'entry', -23.5615, -46.6558, 'Av. Paulista, 1000', '192.168.1.11');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('4e08d94b-ad6f-4fd2-a5b4-bcebf57a6cb3', 'c62a15b9-eb01-44a8-ba53-84e31fa63c95', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 18:56:56.32951', 'entry', NULL, NULL, NULL, '189.20.75.42, 10.83.3.165');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('12ef8593-f511-4634-8fe3-4aa1af70b10c', 'c62a15b9-eb01-44a8-ba53-84e31fa63c95', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 18:58:41.524943', 'exit', NULL, NULL, NULL, '189.20.75.42, 10.83.3.165');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('cd4b9186-38ea-4d20-b06d-ba5f94ad090f', 'c62a15b9-eb01-44a8-ba53-84e31fa63c95', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 18:58:44.604118', 'entry', NULL, NULL, NULL, '189.20.75.42, 10.83.3.165');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('f5c83079-ef20-4e5c-b0c6-5b4ce184b9c3', 'c62a15b9-eb01-44a8-ba53-84e31fa63c95', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 18:58:47.709706', 'exit', NULL, NULL, NULL, '189.20.75.42, 10.83.3.165');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('5a75edbf-eb79-4b3a-ada5-422178ddcc9f', 'c62a15b9-eb01-44a8-ba53-84e31fa63c95', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 18:58:49.609814', 'entry', NULL, NULL, NULL, '189.20.75.42, 10.83.3.165');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('f584f1ab-eee2-44ce-bacb-0d8815d47c63', 'c62a15b9-eb01-44a8-ba53-84e31fa63c95', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 18:58:51.22123', 'exit', NULL, NULL, NULL, '189.20.75.42, 10.83.3.165');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('c07051f5-67e4-443d-8f41-55349d5dc8f4', 'c62a15b9-eb01-44a8-ba53-84e31fa63c95', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 18:58:54.8868', 'entry', NULL, NULL, NULL, '189.20.75.42, 10.83.3.165');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('0060a8e1-c0ba-4ca2-9d82-d7e106f8dbc6', 'c62a15b9-eb01-44a8-ba53-84e31fa63c95', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 19:02:42.923577', 'exit', NULL, NULL, NULL, '189.20.75.42, 10.83.3.165');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('253cf359-a86c-4e10-9a4d-93a508cec872', 'c210cbac-03d5-43a2-bc4a-3ba13835847b', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', '2026-02-20 19:12:08.311748', 'exit', NULL, NULL, NULL, '34.26.75.71, 10.83.11.225');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('f193b5ba-56e1-4bce-a701-52b92a390b88', 'fa7f6093-a359-4808-aab7-bd877db62bc9', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 19:17:21.202826', 'entry', NULL, NULL, NULL, '189.20.75.42, 10.83.9.216');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('88b0bf0d-d7f6-4a30-8934-f2f118e994f1', 'fa7f6093-a359-4808-aab7-bd877db62bc9', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 19:18:26.288917', 'exit', NULL, NULL, NULL, '189.20.75.42, 10.83.9.216');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('4681916d-2cb5-4969-87c5-afaa0c067fbc', 'fa7f6093-a359-4808-aab7-bd877db62bc9', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 19:18:29.106004', 'entry', NULL, NULL, NULL, '189.20.75.42, 10.83.9.216');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('89e8a390-445f-40a2-ba5c-5072fcac757d', 'c2065a60-7b54-443e-a785-6809416bb97d', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 21:32:20.464454', 'entry', NULL, NULL, NULL, '189.20.75.42, 10.83.12.197');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('f1963420-e290-49bd-8b02-139fc335b0bd', 'c2065a60-7b54-443e-a785-6809416bb97d', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 21:32:25.480265', 'exit', NULL, NULL, NULL, '189.20.75.42, 10.83.12.197');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('7b3a2940-8cc2-405e-9083-65060ceffbf0', 'c2065a60-7b54-443e-a785-6809416bb97d', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 21:32:30.767688', 'entry', NULL, NULL, NULL, '189.20.75.42, 10.83.12.197');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('291cdb37-2ff2-4d50-afc3-d6e4f5de2138', 'c210cbac-03d5-43a2-bc4a-3ba13835847b', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', '2026-02-23 11:02:21.481732', 'entry', NULL, NULL, NULL, '127.0.0.1');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('dbd8a201-f6eb-4dac-ba05-489d89ad3b57', 'c210cbac-03d5-43a2-bc4a-3ba13835847b', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', '2026-02-23 11:02:29.947957', 'exit', NULL, NULL, NULL, '127.0.0.1');
INSERT INTO public.time_records (id, user_id, company_id, "timestamp", type, latitude, longitude, address, ip) VALUES ('d77f9880-d22b-4937-ae94-b11462aad279', 'fa7f6093-a359-4808-aab7-bd877db62bc9', '66548a22-d91b-434f-b7cf-194fcd597efd', '2026-02-20 23:20:00', 'exit', NULL, NULL, 'Ajuste aprovado', 'adjustment');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('9d0b1ce0-5fd1-471e-a66f-e4eda37ba8d8', 'admin', '$2b$10$zeD3jl95OKWnFXdBMncZOuCDN06/U6NW/RVJURqz6mxoqbj9eClXq', 'Administrador Master', 'master@pontomax.com', 'admin_master', NULL, NULL, 'Admin Master', NULL, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('24f96af9-7d26-4957-958f-93735768727a', 'empresa', '$2b$10$OGyBsMpBdARNVFUkAb3hROzEZRtSt5aCF6Lklh3tYFEw.2.QkJmpG', 'Carlos Silva', 'carlos@techcorp.com.br', 'admin_company', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Administracao', 'Gerente', NULL, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('c210cbac-03d5-43a2-bc4a-3ba13835847b', 'joao.santos', '$2b$10$vKB9XjKNbpFcgnVGfuqpeu0QBA2XqWJRclqLfmHjuRN4wUy/IXi2m', 'Joao Santos', 'joao@techcorp.com.br', 'employee', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Desenvolvimento', 'Desenvolvedor Senior', 528, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('24e694e6-1c06-4f19-a3f4-b1aeb4068c2f', 'maria.oliveira', '$2b$10$Lti./BvkHILSDWjLOq.2je0yOPqVrEY43oVdSLsk4I8N445UD8aP2', 'Maria Oliveira', 'maria@techcorp.com.br', 'employee', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Design', 'UI Designer', 528, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('774fdba7-1aa9-4767-bc42-30812fb80548', 'pedro.costa', '$2b$10$fWngjS8wzqVdyNCJXrE3f.yoa7By8wS/dIrP2J9MMUGZgJZ3mDnVi', 'Pedro Costa', 'pedro@techcorp.com.br', 'employee', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'Desenvolvimento', 'Desenvolvedor Junior', 480, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('672540bc-b0a4-46c9-98b5-49a3a21ad002', 'ana.ferreira', '$2b$10$2q6P3P0uP1Hjm6KqJZI9yevZrarq/xyQFGYl2LFc.ixf5DC0q0nty', 'Ana Ferreira', 'ana@techcorp.com.br', 'employee', 'd5b819ba-0d6d-4541-82f6-c9d119c196de', 'RH', 'Analista RH', 528, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('c956a8cb-923d-4648-899f-3f803bcad78d', 'dihcodigo', '$2b$10$Upx1CMdH9jumoqvmL0gqKOVjIsmzpH/bolrjQz96DwsKs1.Wjf6gq', 'Cesar Diego Anovich', 'iddiegobis@gmail.com', 'admin_company', '66548a22-d91b-434f-b7cf-194fcd597efd', NULL, 'Administrador', NULL, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('a740076e-fbaf-483d-8b68-db79a9789f41', 'Joaozinho', '$2b$10$0hzXUy62UXbXkexUr9lE3e84ltAdXz220r7GGf2tzT.uDdT8LNsVm', 'João Dias', 'joao@gmail.com', 'employee', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Desenvolvedor', 'Programador Junior', 528, true, false);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('c62a15b9-eb01-44a8-ba53-84e31fa63c95', 'vinicius', '$2b$10$W0Gwcg.8zJg1AvoBLSmEPOunVKBhCM3XwHYWKglchYEIzsruWjbiG', 'Vinicius Brandao', 'vinicius.souza@objctv.one', 'employee', '66548a22-d91b-434f-b7cf-194fcd597efd', 'AdTech', 'Programador Junior', 528, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('fa7f6093-a359-4808-aab7-bd877db62bc9', 'robs', '$2b$10$WZCAyQBm5SKj5ET0/QRZ0elxCWZMqNF5tb/GyNoU3iHLotNzkv1K2', 'robson', 'robs@objctv.one', 'employee', '66548a22-d91b-434f-b7cf-194fcd597efd', 'Programatico', 'Analista', 528, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('42760f67-ee46-45e2-80d3-a579fd9e6015', 'rogeradmin', '$2b$10$2qHUsYn7hOh.HMj0cbjK7.VKSWs9wHIsamrsafGbH0BdbnwWs/R9W', 'Roger', 'empresa@objctv.one', 'admin_company', '2ea76010-a130-46bd-b21e-31af5ecd210a', NULL, 'Administrador', NULL, false, true);
INSERT INTO public.users (id, username, password, name, email, role, company_id, department, "position", work_hours_minutes, must_change_password, active) VALUES ('c2065a60-7b54-443e-a785-6809416bb97d', 'geovany', '$2b$10$myICNj3op.WkpQxJOITbXONUi2jMAsgM1uYsnOSwVUD0sIuWbuIXy', 'Geovany Oliveira', 'geovany@gmail.com', 'employee', '66548a22-d91b-434f-b7cf-194fcd597efd', 'AdTech', 'Programador junior', 528, false, true);


--
-- Name: adjustment_requests adjustment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjustment_requests
    ADD CONSTRAINT adjustment_requests_pkey PRIMARY KEY (id);


--
-- Name: companies companies_cnpj_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_cnpj_unique UNIQUE (cnpj);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: time_records time_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_records
    ADD CONSTRAINT time_records_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: adjustment_requests adjustment_requests_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjustment_requests
    ADD CONSTRAINT adjustment_requests_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: adjustment_requests adjustment_requests_reviewed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjustment_requests
    ADD CONSTRAINT adjustment_requests_reviewed_by_users_id_fk FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: adjustment_requests adjustment_requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjustment_requests
    ADD CONSTRAINT adjustment_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: holidays holidays_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: time_records time_records_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_records
    ADD CONSTRAINT time_records_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: time_records time_records_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_records
    ADD CONSTRAINT time_records_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- PostgreSQL database dump complete
--


