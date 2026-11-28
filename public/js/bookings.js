document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('bookings-table-body');
    const loading = document.getElementById('bookings-loading');
    const error = document.getElementById('bookings-error');
    const empty = document.getElementById('bookings-empty');
    if (!tableBody) {
        return;
    }

    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }
        const payload = await response.json();
        if (!Array.isArray(payload.bookings)) {
            throw new Error('Booking API returned an invalid response');
        }

        payload.bookings.forEach((booking) => {
            const row = document.createElement('tr');
            const values = [
                booking.id,
                booking.tripId,
                booking.scheduleId,
                booking.selectedDay,
                booking.ticketClass,
                booking.passengers.length,
                new Date(booking.createdAt).toLocaleString()
            ];
            values.forEach((value) => {
                const cell = document.createElement('td');
                cell.textContent = value ?? '';
                row.appendChild(cell);
            });
            tableBody.appendChild(row);
        });
        empty.hidden = payload.bookings.length !== 0;
    } catch (fetchError) {
        error.hidden = false;
        error.textContent = 'Unable to load bookings right now. Please try again in a moment.';
        console.error(fetchError);
    } finally {
        loading.hidden = true;
    }
});
