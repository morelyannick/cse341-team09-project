# Feature Set 5: Protected Trip Admin Page — Spec

## Description
Add an admin-only Trip Administration page at `/admin/trips`. It lists every trip by calling the trips API from client-side JavaScript, and lets an admin edit or delete a trip through the API. After a save or delete, the list updates without a page refresh. When editing, the admin picks the start and end station from the existing stations, and can move existing schedules onto the trip. Creating new stations or schedules is not part of this feature. The admin dashboard links to the new page.

**Depends on Feature Set 1 (Core Authentication, #13).** It uses `requirePageRole('admin')` and `requireApiRole('admin')` from `src/middleware/auth.js`, and `req.session.user.role` set at login.

## Who sees what

| Visitor | `/admin/trips` page | `PUT` / `DELETE /api/trips/:id`, `GET /api/admin/trip-options` |
| --- | --- | --- |
| Signed out | `302` redirect to `/login` | `401` `{ "message": "Authentication required" }` |
| Signed in, role `customer` | `403` Access Forbidden page | `403` `{ "message": "Forbidden" }` |
| Signed in, role `admin` | `200`: trip list, Edit and Delete | Allowed |

Public routes are unchanged: `GET /api/trips` and `GET /api/trips/:id` stay open, because the public trip pages use them.

## Data model
**Trip** (`trips`, existing): `id` (custom string, never changes), `name`, `description`, `region`, `startStation`, `endStation`, `duration`, `distance`, `highlights[]`, `bestSeason`, `operatingMonths[]`, `imageUrl`.
- `startStation` and `endStation` hold a station `id` (for example `nagoya`) from the `stations` collection.

**Schedule** (`schedules`, existing): `tripId` is required and points to a trip `id`. A schedule always belongs to exactly one trip, so the editor moves schedules between trips instead of removing them.

**Booking** (`bookings`, existing): stores the `tripId` it was made for.

**Session** (from Feature Set 1): `req.session.user = { id, name, username, email, role }`.

## API

### PUT /api/trips/:id (admin)
Request body. Every field except `highlights`, `operatingMonths` and `scheduleIds` is required:
```json
{
  "name": "Alpine Panorama Express",
  "description": "Journey through the Japanese Alps...",
  "region": "central",
  "startStation": "nagoya",
  "endStation": "toyama",
  "duration": "4.5 hours",
  "distance": 180,
  "bestSeason": "autumn",
  "highlights": ["Mount Tateyama views", "Hida River gorge"],
  "operatingMonths": [4, 5, 6, 7, 8, 9, 10, 11],
  "scheduleIds": [10]
}
```
Rules:
- The text fields must be non-empty. `distance` is a number ≥ 0. `bestSeason` is `spring`, `summer`, `autumn` or `winter` (any letter case).
- `highlights` is an array of non-empty strings. `operatingMonths` is whole numbers 1–12, with duplicates removed and sorted.
- `startStation` and `endStation` must be existing station ids and must be different.
- `scheduleIds` must be existing schedule ids. Those schedules are moved onto this trip.
- An `id` in the body is ignored, so the URL decides which trip changes.

Responses:
- `200`: the updated trip
- `400`: `{ "error": "Invalid trip data", "errors": ["..."] }` for each problem, including an unknown station or schedule
- `401` / `403`: see the table above
- `404`: `{ "error": "Trip not found" }`
- `500`: `{ "error": "Failed to update trip" }`

### DELETE /api/trips/:id (admin)
- `204`: deleted, with no body
- `409`: `{ "error": "This trip still has N schedule(s). Move them to another trip before deleting it." }`, or the same for bookings
- `401` / `403` / `404` / `500` as above

A trip that still has schedules or bookings can't be deleted. They point to the trip by its id, and deleting it would break the booking and confirmation pages. To delete a trip, first move its schedules to another trip with the editor.

### GET /api/admin/trip-options (admin)
`200`: `{ "stations": [{ "id", "name", "region" }], "schedules": [{ "id", "tripId", "departureTime", "arrivalTime", "daysOfWeek", "status" }] }`. These are the choices for the editor.

All three routes are documented in Swagger at `/api-docs`.

## Page behavior (`/admin/trips`)
1. The page is rendered by EJS. `public/js/trip-admin.js` fetches `/api/trips` and `/api/admin/trip-options`, then clones a `<template>` row for each trip: name, id, region, season, distance, duration, station names and schedule count.
2. **Edit** opens a dialog: text fields, station dropdowns, month checkboxes, and a schedule list. This trip's schedules are checked and locked; other trips' schedules can be checked to move them here.
3. **Save** sends `PUT`. On success the dialog closes, the row and the schedule counts update in place, and a status message shows. On `400` the errors are listed inside the dialog.
4. **Delete** asks for confirmation, then sends `DELETE`. On `204` the row is removed. On `409` the reason shows in the status message.
5. `401` and `403` responses show "Your session has ended…" or "Only admin users can change trips."
6. All API values are written with `textContent`, so trip text can't inject HTML.

## Making an admin for testing
Feature Set 1 makes every new account a customer. Register at `/register`, then run:
```
npm run db:make-admin -- you@example.com
```
Then sign out and sign in again.

## Files
- `src/models/trips.js`: `updateTrip`, `deleteTrip`, `getStationOptions`
- `src/models/schedules.js`: `getAllSchedules`, `countSchedulesForTrip`, `findMissingScheduleIds`, `assignSchedulesToTrip`
- `src/models/bookings.js`: `countBookingsForTrip`
- `src/controllers/trips.js`: `updateTrip`, `deleteTrip`, `getTripAdminOptions`, `tripAdminPage`
- `src/routes/api-routes.js`: `PUT` and `DELETE /api/trips/:id`, `GET /api/admin/trip-options` (with Swagger)
- `src/routes/ejs-routes.js`: `GET /admin/trips` with `requirePageRole('admin')`
- `src/views/admin/trips.ejs`, `public/js/trip-admin.js`, `public/css/utilities/trip-admin.css`
- `src/views/admin/dashboard.ejs`: link to the page
- `src/db/make-admin.js`, `package.json`: `db:make-admin` script
- `tests/trip-admin.test.js`: 17 tests

## Out of scope
- Creating trips, stations or schedules.
- Editing `imageUrl`.

## Test Plan
- [ ] Signed out, `/admin/trips` redirects to `/login`
- [ ] Signed in as a customer, `/admin/trips` shows the 403 page
- [ ] Signed in as an admin, `/admin/trips` lists all trips with station names and schedule counts
- [ ] The admin dashboard links to `/admin/trips`
- [ ] `PUT /api/trips/:id` signed out returns 401 JSON; as a customer, 403
- [ ] As an admin, editing a trip saves it (200), the row updates without a reload, and the change survives a refresh
- [ ] An `id` in the body does not change the trip's id
- [ ] A missing name, a bad season, a negative distance, or the same start and end station return 400, and the errors show in the dialog
- [ ] An unknown station or schedule id returns 400
- [ ] `PUT` on a trip that doesn't exist returns 404
- [ ] Checking another trip's schedule moves it to this trip, and both schedule counts update
- [ ] Deleting a trip that still has schedules returns 409, the message shows, and the trip stays
- [ ] After moving its schedules away, deleting the trip returns 204 and the row disappears; `GET /api/trips/:id` then returns 404
- [ ] Deleting a trip that has bookings returns 409
- [ ] `GET /api/admin/trip-options` returns 401 signed out; as an admin, 12 stations and 14 schedules
- [ ] The routes appear in Swagger
- [ ] `npm test` passes (43 tests), and `npm run lint` passes
