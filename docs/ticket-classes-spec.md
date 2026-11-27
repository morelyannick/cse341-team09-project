# Feature Set 4: Ticket Classes — Spec

## Description
Move ticket classes onto Mongoose and expose them through a JSON API. On the booking page, when the user picks a day of the week, the page calls the API and grays out and disables any ticket class that is not sold on that day. Classes that are sold stay selectable.

Today the booking page reads the `ticketClasses` collection directly with the MongoDB driver, and the data has no concept of availability by day. This feature adds that concept.

## Data Model
Collection: `ticketClasses` (existing). Mongoose model: `TicketClass`, bound explicitly to `ticketClasses`. Without that, Mongoose would pluralize the name to `ticketclasses` and read an empty collection.

| Field | Type | Rules |
| --- | --- | --- |
| `class` | String | Required, unique, trimmed, lowercase (`standard`, `premium`, `first`) |
| `name` | String | Required |
| `pricePerKm` | Number | Required, ≥ 0 |
| `amenities` | [String] | Defaults to `[]` |
| `description` | String | Optional |
| `availableDays` | [String] | **New.** Each value is a lowercase day name (`monday` … `sunday`), the same format as `schedules.daysOfWeek`. Defaults to all seven days. |

Availability added to the seed data:

| Class | Available days |
| --- | --- |
| Standard | Every day |
| Premium | Tuesday – Sunday |
| First | Friday, Saturday, Sunday |

A ticket class without an `availableDays` field is treated as available every day, so older documents keep working.

### Updating the shared database
`npm run db:import` deletes and reloads every collection, including bookings. To avoid wiping the team's shared data, run the new script instead:

```
npm run db:ticket-days
```

It only sets `availableDays` on the three ticket-class documents.

## Files
- `src/models/schemas/ticket-classes.js`: schema, `DAYS_OF_WEEK` list
- `src/models/ticket-classes.js`: `getAllTicketClasses()`, `getTicketClassesForDay(day)`
- `src/controllers/ticket-classes.js`: API controllers `getAllTicketClasses`, `getTicketClassesForDay`
- `src/routes/api-routes.js`: `GET /api/ticket-classes` with Swagger docs
- `src/controllers/bookings.js`: `bookingPage` uses `getAllTicketClasses()` instead of the driver
- `src/views/trips/book.ejs`, `public/js/booking-tickets.js`, `public/css/utilities/booking.css`: day-based availability on the booking page
- `src/db/seeds/ticket-classes.json`, `src/db/update-ticket-class-days.js`, `package.json`: data and update script
- `tests/ticket-classes.test.js`: automated tests

## API

### GET /api/ticket-classes
Returns every ticket class, sorted by `pricePerKm` (cheapest first).

- `200`: `{ "ticketClasses": [ { "class": "standard", "name": "Standard Class", "pricePerKm": 80, "amenities": [...], "description": "...", "availableDays": [...] }, ... ] }`
- `500`: `{ "error": "Failed to fetch ticket classes" }`

### GET /api/ticket-classes?day={day}
Returns only the classes sold on that day. `day` is a day name in any letter case (`Monday`, `monday`).

- `200`: `{ "day": "monday", "ticketClasses": [ ... ] }`. An empty array is valid if nothing is sold that day.
- `400`: `{ "error": "Day must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday" }` for a missing or invalid value (`?day=`, `?day=funday`)
- `500`: `{ "error": "Failed to fetch ticket classes" }`

`_id`, `__v` and timestamps are not returned. Both routes are documented in Swagger at `/api-docs`.

## Booking page behavior (`/trips/booking/:scheduleId`)
1. The page still renders all ticket classes on the server, so it works even if JavaScript fails.
2. On load, and whenever the user picks a different day, `public/js/booking-tickets.js` calls `/api/ticket-classes?day=<day>`.
3. Classes not in the response get the `unavailable` class (grayed out), their radio input is `disabled`, and a "Not available on the selected day" note appears.
4. If the selected class becomes unavailable, the selection moves to the first available class and the booking summary price updates.
5. If nothing is available that day, a message asks the user to pick another day and the submit button is disabled.
6. If the API call fails, every class stays selectable and a message explains that availability could not be checked.
7. If the user clicks days quickly, only the latest response updates the page.

## Out of Scope
- Server-side rejection of a booking for an unavailable class (the booking route belongs to Feature Set 3).
- Admin screens for editing ticket classes.

## Test Plan
- [ ] `GET /api/ticket-classes` returns 200 with standard, premium, first (cheapest first), with no `_id`
- [ ] `GET /api/ticket-classes?day=monday` returns 200 with only `standard`
- [ ] `GET /api/ticket-classes?day=wednesday` returns `standard`, `premium`
- [ ] `GET /api/ticket-classes?day=saturday` returns all three
- [ ] `GET /api/ticket-classes?day=FriDay` works (case-insensitive) and returns `"day": "friday"`
- [ ] `GET /api/ticket-classes?day=funday` and `?day=` return 400 with the error message
- [ ] A ticket class with no `availableDays` is returned for every day
- [ ] `/api/ticket-classes` appears in Swagger at `/api-docs`, with the `day` parameter
- [ ] `/trips/booking/3` renders all three ticket cards and loads `/js/booking-tickets.js`
- [ ] On the booking page, Monday grays out and disables Premium and First; Wednesday disables only First; Saturday enables all
- [ ] Selecting First on Saturday and then switching to Monday moves the selection to Standard and updates the summary price
- [ ] A booking can still be submitted and reaches the confirmation page
- [ ] `npm run db:ticket-days` adds `availableDays` without touching bookings
- [ ] `npm test` passes (21 tests), and `npm run lint` passes
