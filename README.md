🧭 availability-app
A web application for managing guides’ service availability and assignments — built with Nuxt 3, Supabase, and Element Plus.
⚙️ Tech Stack

Frontend: Nuxt 3 (Vue 3 + Composition API)

UI Library: Element Plus

State: Pinia

Backend / Database: Supabase (PostgreSQL + Auth + Realtime)

Auth: Supabase Magic Link / Email

Realtime: Supabase Realtime Channels

PDF Export: jsPDF (placeholder, coming soon)

🚀 Getting Started
1️⃣ Clone & Install
git clone <your-repo-url>
cd availability-app
npm install

2️⃣ Create .env file in project root
NUXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=<your-public-anon-key>


⚠️ Never use the service role key on the frontend.

3️⃣ Run Dev Server
npm run dev


App runs at http://localhost:3000

🧩 Database Schema (Phase 1)

Tables

services — list of all available services (sailing, date, service)

service_guides — link between service_id and user_id with status
(tentative, confirmed, cxl_requested, cxl)

Security

Row-Level Security (RLS) policies restrict each user to their own records

Admins use service-role key via Edge Functions (Phase 2)

🧠 Current Features (Phase 1)

🔐 Authentication — secure login with Supabase Auth (magic link / email)

📋 Services Listing — full list of available services with info

🙋‍♂️ Guide Actions

Select a service → creates tentative record

Unselect → deletes the record

Request Cancellation → changes status from confirmed → cxl_requested

🧾 My Services Page — shows only user’s selected services and statuses

🔄 Realtime Updates — instant sync when admin changes service statuses

🛡️ RLS Policies — PostgreSQL security ensures user isolation

🧱 Reusable UI — single <ServiceTable> component used in both pages

🧩 Ready for Phase 2

Admin confirmation of guides

Approving cancellations

Advanced reporting & PDF export

🧭 Next Steps (Phase 2 Roadmap)

🧑‍💼 Admin panel to assign & confirm guides

📨 Notifications for confirmation/cancellation

🗂 Advanced filtering, search, and export

🧾 Full PDF and CSV exports for office reports

🧑‍💻 Development Notes

All Supabase queries use useSupabase() composable (NUXT_PUBLIC_SUPABASE_* envs).

All user-level writes go through RLS policies.

Admin-level actions will go through Edge Functions using the service role key.

Real-time updates handled via supabase.channel('...').on('postgres_changes').