# Technical Specification — Feature Set 2: Schedules

## 1. Feature Overview
This feature implements dynamic retrieval and management of train schedules associated with a specific trip (*Trip*) within the Kizuna Rail application.
- Stores schedules in MongoDB using a Mongoose schema linked to the trips collection.
- Exposes a REST endpoint documented with Swagger (`/api/trips/{id}/schedules`) that returns all schedules for a trip or filters them by a specific month (`1` to `12`).
- Updates the trip details view (`src/views/trips/details.ejs`) so schedules are loaded and dynamically updated on the client side when a user selects a month, decoupling initial schedule fetching from the EJS trip details controller.

## 2. Data Model of Involved Collections
### Collection: `schedules`
- Schema file: `src/models/schemas/schedules.js`
- Model/query file: `src/models/schedules.js`
- Model function: `getSchedulesByTripId(tripId, month = null)` — queries MongoDB with Mongoose filtering by `tripId` and, when `month` is provided, also filters by schedules active in that month.

| Field | Mongoose Type | Required | Description / Rules |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Unique schedule identifier in MongoDB. |
| `tripId` | `ObjectId` (`ref: 'Trip'`) | Yes | Reference to the corresponding trip in the `trips` collection. |
| `departureTime` | `String` | Yes | Train departure time (e.g., `"08:30"`). |
| `arrivalTime` | `String` | Yes | Train arrival time at destination (e.g., `"11:15"`). |
| `daysOfWeek` | `[String]` | Yes | Operating days (e.g., `["Mon", "Wed", "Fri"]`). |
| `months` | `[Number]` | Yes | Month numbers (`1` to `12`) when the schedule operates (supports filtering via `?month=`). |

### Related Collection: `trips`
- Relationship: A trip (`Trip`) can have multiple schedules (`1:N`) linked through `schedules.tripId`.

## 3. API Endpoints (Request/Response Formats and Status Codes)
- Routes + Swagger file: `src/routes/api-routes.js`
- Controller file: `src/controllers/schedules.js`
  - `getSchedulesForTrip(req, res)`: retrieves all schedules for the trip specified in `req.params.id`.
  - `getSchedulesForTripAndMonth(req, res)`: retrieves schedules filtered by `req.params.id` and `req.query.month`.

### `GET /api/trips/{id}/schedules`
Returns all schedules for a trip, or schedules for a specific month if the `month` query parameter is provided.
- Request parameters:
  - `id` (path, required): Valid MongoDB `ObjectId` for the trip.
  - `month` (query, optional): Integer between `1` and `12`.
- Request body: None (`GET`).
- Responses and status codes:
  - `200 OK`: Returns a JSON array of matching schedules (`[]` if none match).
  - `400 Bad Request`: When `id` is not a valid `ObjectId` or `month` is not an integer between `1` and `12`.
  - `404 Not Found`: When `tripId` does not exist in the database.
  - `500 Internal Server Error`: Unexpected error while querying MongoDB.

## 4. Test Plan (Specific Checks)
1. General schedule query: `GET /api/trips/{id}/schedules` with a valid `id` -> `200 OK` and JSON array of schedules.
2. Filtered query for a valid month: `GET /api/trips/{id}/schedules?month=3` -> `200 OK` and schedules active in month `3`.
3. Query for a month with no schedules: `GET /api/trips/{id}/schedules?month=12` -> `200 OK` and empty array `[]`.
4. Invalid input validation: invalid `id` or `month` outside `1..12` -> `400 Bad Request`.
5. Frontend integration (`src/views/trips/details.ejs`): selecting a month dynamically updates schedules via the API without full page reload.
6. Swagger docs: `/api-docs` displays `/api/trips/{id}/schedules` with its parameters and status codes.

## 5. Additional Notes and Implementation Dependencies
- Dependencies: Relies on existing trips (`Trip` / `trips`) to reference valid `tripId` values.
- EJS controller decoupling: The trip details controller no longer queries schedules on the server; client-side JavaScript loads them via the API.
- Environment variables: `MONGODB_URI` and `MONGODB_DB_NAME` configured in the environment.
