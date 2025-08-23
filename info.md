Food Sharing Web App (NextJS + Supabase)
App name: MealBridge

You are an expert AI IDE tasked with building a production‑grade food sharing web application that helps people donate surplus food to nearby recipients, reducing waste and supporting communities. Build a web MVP first, optimized for a future mobile app.

High‑Level Goals

Make it easy to list surplus food with photo, expiry date, and location.
Help nearby recipients discover and reserve available items.
Provide trust and safety via basic verification and reputation.
Support a future integration with delivery partners (e.g., Glovo) for pickup.
Prepare the codebase for an NGO‑backed social venture (donations in later phase).

Tech Stack (strict)

nextjs + TypeScript
Supabase (Auth, Postgres DB, Storage, RLS)
UI: Tailwind CSS + shadcn/ui components
Forms/validation: react-hook-form + zod
Maps: Leaflet with OpenStreetMap (no paid keys)
Images: Supabase Storage + client-side compression
State/data fetching: React Server Components, server actions, and @supabase/ssr
Emails (for now): Supabase Magic Link/OTP

Core Personas & Roles
Donor – lists a food item and confirms a pickup time.
Recipient – finds items nearby and places a reservation.
NGO/Moderator – verifies users, resolves disputes, removes abusive content.
Admin – limited tools to manage flags and category lists (internal use).

Key Features (MVP)
Auth & Profile
Email OTP/Magic Link; optional Google OAuth if trivial.
Profile fields: displayName, role (donor/recipient/ngo), bio (optional), approximate location (lat/lng + neighborhood text), phone (optional).

Simple profile completeness indicator.

Create Donation

Fields: title, description, category, quantity, expiry_date, pickup_window_start/ end, photo (1–3), item condition (sealed/open), storage type (ambient/refrigerated/frozen), coordinates, address text, terms checkbox (“safe-to-share” guideline).

Auto‑geocode from address to coords if available on client, else allow manual pin on map.

Browse & Map

List + Map view with markers.

Filters: distance, category, soonest‑to‑expire, sealed only.

Card shows distance, expiry badge, quantity, and pickup window.

Reserve & Messaging (lightweight)

One‑click “Request/Reserve”; donor can accept/decline.

Basic item chat (per donation) with text only (no files in MVP).

Status flow: available → reserved → picked_up (or canceled).

Notifications

Email notifications for: item created (owner), reservation request (owner), decision (requester), 1‑hour pre‑pickup reminder (both).

Build a notification table to later swap email with push/SMS.

Reputation (basic)

After pickup: thumbs up/down + optional short comment.

Donor/recipient show aggregate score and count.

Moderator Tools (lightweight)

Flag content/user: “safety/expired/suspect”.

NGO/moderator can hide listings, ban users (soft‑delete)


Notifications (MVP via email)

Create a small service (server action or edge function) to enqueue notifications into notifications and send email via Supabase’s built‑in mailer (or console log in dev). Triggers to consider:
New reservation → notify owner.
Decision made → notify requester.
1 hour before pickup_window_start → reminder to both (cron/Edge Function).

Map & Geo
Store lat/lng in donations.
Server query supports “within X km” using a simple Haversine SQL function or PostGIS (optional). For MVP, filter client-side by distance; later add PostGIS.

Seeding
Seed categories: bread, dairy, produce, canned, cooked, baby_food, beverages, desserts, other.
Seed a couple of demo users and donations.

Safe‑Sharing Guidelines (static page)

Add /guidelines with clear rules:
Prefer sealed/non‑perishable items.
If cooked, must be same‑day, clearly labeled (MVP: we can hide cooked by default).
Prohibit high‑risk foods for now.
Pickup etiquette and no‑show policy.

Environment & Config
.env keys for Supabase URL/Anon/Service Role.
Storage bucket donation-images created automatically on first run.
Protect admin pages by checking profiles.role.

Accessibility & UX
Keyboard accessible forms.
Clear expiry/pickup warnings.
Mobile‑first layouts; map collapses into drawer on small screens.

Deliverables
Supabase SQL migration file with schema + RLS.
Minimal seed script.
README with setup:
supabase init, supabase start (optional local), env vars, storage bucket.
pnpm install, pnpm dev.
Example .env.local.example.

Acceptance Criteria
A new user can sign up, set location, and create a donation with photos.
Another user can discover the item on the map/list, request it, and message the donor.
Donor can accept the reservation; status changes propagate immediately.
After pickup, both can leave a rating, and profile totals update.
NGO/Admin can view flags and hide a donation.
RLS prevents reading/writing outside allowed scopes (verify with intentional negative tests).
If anything is ambiguous, choose the most secure, simple, and maintainable approach that fits the MVP.