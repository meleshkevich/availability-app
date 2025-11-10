🧭 Availability App

A web application for managing guides’ service availability, scheduling, and assignments — built with Nuxt 3, Supabase, and Element Plus.

deployed with Vercel: https://availability-app-eight.vercel.app/ 

⚙️ Tech Stack

Frontend: Nuxt 3 (Vue 3 + Composition API)
UI Library: Element Plus
State: Pinia
Backend / Database: Supabase (PostgreSQL + Auth + Realtime)
Auth: Supabase Magic Link / Email
Realtime: Supabase Realtime Channels
PDF Export: pdfmake (embedded Roboto fonts)

🚀 Getting Started
1️⃣ Clone & Install
git clone <your-repo-url>
cd availability-app
npm install

2️⃣ Environment variables (.env)
NUXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>  # server-side only


⚠️ Never expose the service role key on the client.

3️⃣ Run Dev
npm run dev


App runs at http://localhost:3000

🧩 Database Schema
Tables
Table	Purpose
service_types	Reference table for all possible service names (enum-like).
services	List of scheduled services (sailing, date, service_type_id).
service_guides	Availability & assignment mapping (service_id, user_id, status).
user_meta	Editable guide info (display_name, phone).
Status values

tentative → selected
confirmed → assigned by admin
cxl_requested → guide asked to cancel
cxl → cancel approved

Security

Row-Level Security (RLS) limits data per user.

Admins operate via service-role key through server API.

Triggers & policies enforce valid status transitions.

🧠 Core Features
🔐 Authentication

Supabase Auth (email / magic link).
Reactive session stored in Nuxt state.

📋 Services Listing

Single <ServiceTable> component used for:

All services (mode="all")

My services (mode="mine")

Admin panel (mode="admin")

🙋‍♂️ Guide Actions

Select → creates tentative.

Unselect → deletes tentative.

Request CXL → updates confirmed → cxl_requested.

PDF Export → available in “My Services”.

🧾 My Services Page

Displays only the user’s selections.

Filters (date, status, search).

Grouped by Sailing with zebra background.

Export to PDF via pdfmake (one-click download).

🔄 Realtime Updates

Supabase Realtime channels push status changes instantly to clients.

🧑‍💼 Admin Panel

Full table view with filters (sailing/date/status/search).

Assign guide (Confirm).

Approve CXL for requested cancellations.

Cancel Confirmed (returns to open).

Add Service form in accordion.

Manage Service Types (create new types on the fly).

Grouping by Sailing with non-breaking pagination.

🧱 Reusable UI

Unified ServiceTable with three modes and shared filters/pagination.

🧮 PDF Export (pdfmake)

Generates lightweight A4 PDF (Roboto font).

Columns: Date, Sailing, Service, Status.

Exports all filtered records, not just current page.

Works offline in browser, no server calls.

🔧 Admin Extras

AdminAddService accordion form for creating new services.

Automatic creation of new service types (adds row to service_types).

Validation & instant refresh after insert.

📦 Current Architecture

plugins/00.supabase.client.ts — single Supabase client.

plugins/01.auth-init.client.ts — global auth session.

composables/useAuth.ts — signIn/signUp/signOut.

composables/useSupabase.ts — Nuxt-provided client.

components/ServiceTable.vue — main table logic.

components/AdminAddService.vue — admin form.

server/api/admin/** — secure server routes using SUPABASE_SERVICE_ROLE_KEY.

🧭 Next Steps

📊 Sticky table headers and scrollable body.

📧 Email / Slack notifications for assignments.

📈 Reports & CSV export.

🌗 Dark/light theme toggle.

🧩 Role-based multi-tenant access.

🧑‍💻 Development Notes

All Supabase calls use useSupabase() composable.

User writes guarded by RLS.

Admin writes go through server API (service-role).

Realtime handled via .channel('…').on('postgres_changes').

Groups in tables are built client-side (sorted by earliest date).

Element Plus provides layout and form controls.