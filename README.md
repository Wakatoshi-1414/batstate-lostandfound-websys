# BatStateU Lost & Found – Frontend Starter

A responsive HTML/CSS frontend starter for a Batangas State University lost-and-found portal.

## Pages
- `feed.html` – public homepage and sample listings
- `index.html` – sign-in page
- `register.html` – account registration
- `user-dashboard.html` – student dashboard
- `admin-dashboard.html` – admin dashboard
- `item-details.html` – item details and contact/claim actions
- `report-item.html` – lost/found item submission form
- `my-listings.html` – user's listings
- `notifications.html` – notifications
- `profile.html` – profile settings

## Run locally
Open `feed.html` or `index.html` in a browser. No build tools are required.

## Important integration notes
This is intentionally an HTML/CSS-only starter. Forms, filters, buttons, authentication, uploads, search, claims, and admin actions are visual placeholders until JavaScript/backend integration.
- Keep element IDs and add `name` attributes when wiring forms.
- Recommended data fields for an item: `id`, `title`, `type` (lost/found), `category`, `description`, `campus`, `location`, `dateReported`, `imageUrls`, `status`, `reporterId`, `contactEmail`, `contactNumber`.
- Public browsing is allowed. Require authentication for reporting, claiming, editing, and account pages.
- Listings publish immediately after successful submission.
- Support both contact methods: display approved contact details and provide an authenticated claim-request workflow.
- Never expose admin-only actions to ordinary users. Enforce roles and permissions on the backend, not only by hiding buttons in HTML.
- Consider masking personal contact details or using school email only to reduce privacy risks.

## Campus values
ARASOF Nasugbu Campus; Lemery Campus; Alangilan Campus; Pablo Borbon Campus; JPLPC Malvar Campus; Balayan Campus; San Juan Campus; Mabini Campus; Lobo Campus; Rosario Campus; Lipa Campus.

## Styling
All shared styles are in `css/style.css`. The interface uses a blue/navy/white visual system and responsive breakpoints.
