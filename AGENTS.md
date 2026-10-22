# OpenCode Execution Prompt: YakuAlert Qollana (PWA + Supabase + Maps)

Create a responsive, production-ready Progressive Web Application (PWA) in Spanish named "YakuAlert Qollana" designed for residents, the communal plumber (gasfitero), and the JASS president of the Qollana community.

## 1. Core Stack & Architecture
- Framework: React + Vite + TypeScript
- Progressive Web App: `vite-plugin-pwa` enabled with offline submission queue and cache
- Styling: Tailwind CSS (Primary Blue `#0B6E99`, Sustainability Green `#2E9E5B`)[cite: 1]
- UI Components: Shadcn UI / Radix UI (Button, Dialog, Card, Input, Select, Badge, Toast)
- Interactive Map: Leaflet / React-Leaflet with markers for leak reports[cite: 1]
- Database: Supabase (`reportes_fugas`, `historial_auditoria`, `avisos_cortes`)[cite: 1]

## 2. Business Logic & Security Audit
1. Public Access: Any resident can report a water leak by providing description, sector (Alto Qollana, Centro, Bajo Qollana), and selecting a location on the interactive map[cite: 1].
2. System Code Generation: Upon report creation, the app auto-generates a unique tracking code (e.g., `YAK-001`) and a system verification PIN (e.g., `7842`).
3. State Change Restriction: Only authorized roles (Gasfitero Comunal or Presidente JASS) can change status from `Pendiente` -> `En proceso` -> `Atendido`[cite: 1].
4. Audit Log Requirement: Every status update MUST generate an audit record in `historial_auditoria` saving `reporte_id`, `estado_anterior`, `estado_nuevo`, `accion_realizada`, `usuario_responsable`, `rol_responsable`, and `codigo_usado`[cite: 1].
5. Offline Mode: If offline, new reports must be saved in IndexedDB/localStorage and auto-synced with Supabase when connectivity is restored[cite: 1].

## 3. UI Screen Structure (Bottom Navigation)
- Tab 1: Inicio
  - System introduction & value proposition[cite: 1].
  - Sustainable impact banner: "30% de agua recuperada · ODS 6 (meta de referencia)"[cite: 1].
  - Overview map with active leak markers[cite: 1].
- Tab 2: Reportar Fuga
  - Form: Vecino name, sector selector, interactive map pin selector, description, reference[cite: 1].
  - Offline toast notification if submitted without signal.
- Tab 3: Lista de Reportes
  - Filterable list by status (`Pendiente`, `En proceso`, `Atendido`)[cite: 1].
  - "Marcar Estado" button opening `AuditPinModal` requiring system verification code[cite: 1].
- Tab 4: Avisos de Cortes
  - List of scheduled service maintenance announcements per sector[cite: 1].

## 4. Initial Sample Data
Provide 5 mock reports and 2 scheduled service cuts in Supabase migration scripts as specified in `20261020_init_schema.sql`[cite: 1].