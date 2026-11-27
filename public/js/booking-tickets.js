// Booking page: when the user picks a day, ask the API which ticket classes are
// sold that day, then gray out and disable the ones that are not.
// Loaded after the inline booking script in src/views/trips/book.ejs.
// Everything is wrapped in a function so its names (like ticketRadios) cannot clash
// with the global variables the inline booking script already declares.
(() => {
    const ticketRadios = () => [...document.querySelectorAll('input[name="ticketClass"]')];
    const statusEl = document.getElementById('ticketAvailabilityStatus');
    const submitBtn = document.querySelector('.booking-form button[type="submit"]');

    let lastRequestedDay = null;
    let latestRequestId = 0;

    const setStatus = (message) => {
        if (statusEl) {
            statusEl.textContent = message;
        }
    };

    const setTicketAvailable = (radio, isAvailable) => {
        const card = radio.closest('.ticket-card');
        radio.disabled = !isAvailable;
        if (card) {
            card.classList.toggle('unavailable', !isAvailable);
            card.setAttribute('aria-disabled', String(!isAvailable));
            const note = card.querySelector('.ticket-unavailable-note');
            if (note) {
                note.hidden = isAvailable;
            }
        }
    };

    // If the selected ticket just became unavailable, move the selection to the first
    // available one. Dispatching "change" reuses the page's existing handler, which
    // updates the booking summary and price.
    const keepSelectionValid = () => {
        const radios = ticketRadios();
        const selected = radios.find((radio) => radio.checked);
        if (selected && !selected.disabled) {
            return;
        }
        const firstAvailable = radios.find((radio) => !radio.disabled);
        if (firstAvailable) {
            firstAvailable.checked = true;
            firstAvailable.dispatchEvent(new Event('change'));
        }
    };

    const applyAvailability = (availableClasses, day) => {
        ticketRadios().forEach((radio) => {
            setTicketAvailable(radio, availableClasses.has(radio.value));
        });
        keepSelectionValid();

        const anyAvailable = availableClasses.size > 0;
        if (submitBtn) {
            submitBtn.disabled = !anyAvailable;
        }
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        setStatus(anyAvailable ? '' : `No ticket classes are available on ${dayName}. Please choose another day.`);
    };

    // If the API cannot be reached, leave every ticket selectable so the user can still book.
    const enableAllTickets = () => {
        ticketRadios().forEach((radio) => setTicketAvailable(radio, true));
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    };

    const updateTicketsForDay = async (day) => {
        if (!day || day === lastRequestedDay) {
            return;
        }
        lastRequestedDay = day;

        // Only the most recent request may update the page, so quick clicks between
        // days cannot leave the cards showing an older day's results.
        latestRequestId += 1;
        const requestId = latestRequestId;
        setStatus('Checking ticket availability…');

        try {
            const response = await fetch(`/api/ticket-classes?day=${encodeURIComponent(day)}`);
            if (!response.ok) {
                throw new Error(`Failed to load ticket classes (${response.status})`);
            }
            const payload = await response.json();
            if (requestId !== latestRequestId) {
                return;
            }
            const availableClasses = new Set((payload.ticketClasses || []).map((ticket) => ticket.class));
            applyAvailability(availableClasses, day);
        } catch (error) {
            if (requestId !== latestRequestId) {
                return;
            }
            lastRequestedDay = null;
            enableAllTickets();
            setStatus('We could not check ticket availability right now. All ticket classes are shown.');
            console.error(error);
        }
    };

    const selectedDay = () => {
        const checked = document.querySelector('input[name="selectedDay"]:checked');
        return checked ? checked.value : null;
    };

    // The page's own day-pill click handler runs first and marks the new day as checked,
    // so by the time this listener runs, selectedDay() returns the new day.
    document.querySelectorAll('.days-display label').forEach((label) => {
        label.addEventListener('click', () => updateTicketsForDay(selectedDay()));
    });
    document.querySelectorAll('input[name="selectedDay"]').forEach((input) => {
        input.addEventListener('change', () => updateTicketsForDay(selectedDay()));
    });

    updateTicketsForDay(selectedDay());
})();
