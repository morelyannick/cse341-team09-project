const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');
    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }
            
            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }
            
            window.location.href = url.toString();
        });
    }
};

const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

const hookUserBookings = async () => {
    const listEl = document.getElementById('bookings-list');
    if (!listEl) {
        return;
    }

    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');
    const emptyEl = document.getElementById('bookings-empty');

    try {
        const response = await fetch('/api/bookings/me');
        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const { bookings } = await response.json();
        bookings.forEach((booking) => {
            const item = document.createElement('li');
            item.className = 'booking-card';

            const heading = document.createElement('h3');
            heading.textContent = `Booking ${booking.id}`;
            item.appendChild(heading);

            const details = document.createElement('p');
            details.textContent = `${booking.selectedDay || 'Travel date unavailable'} · ${booking.ticketClass || 'Ticket class unavailable'}`;
            item.appendChild(details);

            const passengers = document.createElement('p');
            passengers.textContent = `${booking.passengers?.length || 0} passenger(s)`;
            item.appendChild(passengers);
            listEl.appendChild(item);
        });

        emptyEl.hidden = bookings.length > 0;
    } catch (error) {
        errorEl.hidden = false;
        errorEl.textContent = 'Unable to load your bookings right now. Please try again later.';
    } finally {
        loadingEl.hidden = true;
    }
};

const hookPasswordVisibility = () => {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle');

    if (!passwordInput || !toggleButton) {
        return;
    }

    toggleButton.addEventListener('click', () => {
        const isVisible = passwordInput.type === 'text';
        passwordInput.type = isVisible ? 'password' : 'text';
        toggleButton.textContent = isVisible ? 'Show password' : 'Hide password';
    });
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookUserBookings();
    hookPasswordVisibility();
});