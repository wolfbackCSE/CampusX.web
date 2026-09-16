CampusX - Light/Dark + Provider/Client + Hire + Messaging (Legacy Linking Fix)

Live site: https://wolfbackcse.github.io/CampusX.web/

SUPABASE AUTH REDIRECT
----------------------
In Supabase Dashboard > Authentication > URL Configuration, set:
- Site URL: https://wolfbackcse.github.io/CampusX.web/
- Redirect URL: https://wolfbackcse.github.io/CampusX.web/

IMPORTANT DATABASE STEP
1. Open Supabase Dashboard > SQL Editor > New query.
2. Open supabase-profile-upgrade.sql from this package.
3. Copy the ENTIRE file into Supabase and click Run.
4. Refresh the deployed CampusX site and sign in again.

HIRE AND REVIEW FLOW
--------------------
1. A client opens a provider profile and sends a hire request.
2. The request appears for both participants under Messages > Ongoing work.
3. The provider selects Accept, then Mark work complete when finished.
4. The client opens the completed request and selects Leave feedback.
5. The client submits a star rating and written feedback on the provider profile.

If hire requests or reviews are missing, run the full
supabase-profile-upgrade.sql migration above, then sign out and sign in again.

PROFILE PHOTO STORAGE
---------------------
If uploaded profile photos do not appear, run the storage section in
supabase-profile-upgrade.sql. It creates the public `profile-files` bucket
and the authenticated upload/public-read policies required by the app.
No additional SQL is needed for the mobile menu or browser navigation.

NOTIFICATIONS AND FEEDBACK
--------------------------
The notification bell shows unread messages plus hire updates. Hiring details
remain in the inbox under Hiring Details, while completed clients can select
Leave feedback there to open the rating form directly. The existing
supabase-profile-upgrade.sql migration is required for hire rows and review
permissions; no new SQL migration was added for this UI update.

WHAT THIS VERSION FIXES
- Old listings no longer block the Hire form just because provider_id is missing.
- CampusX tries to resolve old providers from normalized name, profile email, Auth email, metadata name, and mobile/contact data.
- If an old listing still has no matching CampusX Auth account, a client can still submit a hire request. The request is stored as awaiting_provider_link and is automatically attached when that provider signs in/claims the listing.
- Once linked, queued hire requests become pending and the provider can Accept/Decline/Complete them.
- Direct in-app messaging requires a real provider account (there must be a real recipient). The app retries automatic linking before showing a friendly fallback.
- Previous recursive conversation_members policies remain disabled by the migration.
- Provider Studio / Client Workspace, CV, photo, contact details, ratings/reviews, light/dark mode and motion design are retained.

DEPLOYMENT
Upload the contents of this ZIP to Netlify after running the SQL migration.

Footer credit:
Developed & Maintained by Md Farhadul Islam
https://mdfarhadulislam.netlify.app/

SQL UUID HOTFIX
---------------
If an older migration failed with "function min(uuid) does not exist", run
fix-uuid-min-error.sql once, or simply run the corrected full
supabase-profile-upgrade.sql from this package. The resolver now uses UUID-safe
array aggregation instead of min(uuid).


MESSAGING COLUMN HOTFIX
-----------------------
If sending a message fails with:
  null value in column "message" of relation "messages" violates not-null constraint
run fix-message-column.sql once in Supabase SQL Editor.

This build also sends both `body` and legacy `message` fields and renders either one,
so it works with both old and upgraded CampusX message tables. The full
supabase-profile-upgrade.sql includes the same compatibility trigger.

NEW: Notifications + Delete controls
- Run fix-notifications-delete.sql once in Supabase SQL Editor after deploying this version.
- The top navigation bell shows unread incoming messages and who sent them.
- Opening a conversation marks its incoming messages as read.
- A sender can delete their own message for both participants.
- Provider Studio now has Delete skill on each owned skill listing.
