# Booking & Confirmation — Technical Specification

**GitHub Issue:** #7  
**Feature Owner:** Charles Adam Davis  
**Branch:** `feature/issue-7-booking-confirmation`

## 1. General Description

The Booking & Confirmation feature allows customers to reserve seats on scheduled scenic railway trips. Customers select a schedule, ticket class, travel day, and provide passenger information. Once submitted, the application validates the booking, generates a unique confirmation code, stores the booking in MongoDB using Mongoose, and displays a confirmation page.

The feature also provides an API endpoint that allows a booking to be retrieved using its confirmation ID.

The existing booking form and confirmation pages will be preserved while the database operations are moved into reusable Mongoose model functions.

## 2. Data Model

The feature uses a `Confirmation` Mongoose model.

| Field | Type | Requirements |
|---|---|---|
| id | String | Required, unique, trimmed |
| scheduleId | Number | Required |
| tripId | String | Required, trimmed |
| ticketClass | String | Required, trimmed |
| totalPrice | Number | Required, calculated by the server |
| selectedDay | String | Required, trimmed |
| passengers | Array | At least one passenger |
| createdAt | Date | Automatically generated |
| updatedAt | Date | Automatically generated |

### Passenger Subdocument

Each passenger contains:

| Field | Type | Requirements |
|---|---|---|
| firstName | String | Required, trimmed |
| lastName | String | Required, trimmed |
| email | String | Required, valid email format |
| phone | String | Required, trimmed |

### Validation Rules

- Confirmation IDs must be unique.
- A booking must reference an existing schedule and trip.
- The selected schedule must be active.
- The selected travel day must be available for that schedule.
- The ticket class must exist.
- At least one passenger is required.
- Passenger names, email addresses, and phone numbers are required.
- The booking price must be calculated on the server using the trip distance and ticket class price per kilometer. Client-submitted prices are not trusted.

## 3. API Endpoints

### GET `/api/confirmations/:id`

Retrieves a booking using its unique confirmation ID.

**Request:**

- Method: GET
- Parameter: `id` — confirmation code
- Request body: None

**Success Response — 200 OK**

Returns the matching confirmation document, including passenger details and booking information.

**Not Found Response — 404 Not Found**

```json
{
  "message": "Confirmation not found."
}
```

**Server Error Response — 500 Internal Server Error**

```json
{
  "message": "An error occurred while retrieving the confirmation."
}
```

### Existing Website Routes

- `GET /trips/booking/:scheduleId` — Displays the booking form.
- `POST /trips/book` — Validates and saves a booking.
- `GET /trips/confirmation/:confirmationId` — Displays the confirmation page.

## 4. Model Functions

The model will provide two primary functions:

- `createConfirmation(data)` — Validates and creates a new booking.
- `getConfirmationById(id)` — Retrieves a booking using its unique confirmation ID.

These functions keep database operations separate from route handling.

## 5. Testing Plan

Automated tests will use Vitest and Supertest.

Tests will verify:

1. A valid booking can be created.
2. Required booking fields are enforced.
3. Passenger information is validated.
4. Duplicate confirmation IDs are rejected.
5. An existing confirmation can be retrieved.
6. A nonexistent confirmation returns 404.
7. Unexpected database errors return 500.
8. The existing booking workflow continues to function.

## 6. Dependencies and Implementation Notes

- Mongoose is used for booking persistence and retrieval.
- The existing MongoDB connection used by other project features will be preserved during development.
- The Mongoose connection uses the project's `MONGODB_URI` and `MONGODB_DB_NAME` environment variables.
- The team has configured a shared MongoDB database for the deployed application. Local development requires the team's approved connection settings.
- Existing booking form field names will be preserved to avoid breaking the frontend.
- The confirmation code is generated on the server.
- Booking prices are calculated on the server rather than trusted from form submissions.
- The feature depends on the Trips, Schedules, and Ticket Classes collections.

## 7. Implementation and Review

The feature will be implemented on a dedicated branch linked to GitHub Issue #7.

The implementation will include the Mongoose schema, model functions, API route, integration with the existing booking workflow, automated tests, and a local walkthrough video.

The feature will be submitted through a pull request linked to Issue #7 and tested with `npm test` and `npm run lint`.

