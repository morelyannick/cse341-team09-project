const appendText = (parent, tagName, className, value) => {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = value ?? '';
    parent.appendChild(element);
    return element;
};

const initializeTripList = async () => {
    const filters = document.getElementById('filters');
    const grid = document.getElementById('trips-grid');
    if (!filters || !grid) {
        return;
    }

    const regionFilter = document.getElementById('region-filter');
    const seasonFilter = document.getElementById('season-filter');
    const loading = document.getElementById('trips-loading');
    const error = document.getElementById('trips-error');
    const empty = document.getElementById('trips-empty');

    const selectedRegion = filters.dataset.selectedRegion || 'all';
    const selectedSeason = filters.dataset.selectedSeason || 'all';
    let trips = [];

    const updateFilterUrl = () => {
        const url = new URL(window.location.href);
        if (regionFilter.value === 'all') {
            url.searchParams.delete('region');
        } else {
            url.searchParams.set('region', regionFilter.value);
        }
        if (seasonFilter.value === 'all') {
            url.searchParams.delete('season');
        } else {
            url.searchParams.set('season', seasonFilter.value);
        }
        window.history.replaceState(null, '', url);
    };

    const updateTrips = () => {
        const filteredTrips = trips.filter((trip) =>
            (regionFilter.value === 'all' || trip.region === regionFilter.value)
            && (seasonFilter.value === 'all' || trip.bestSeason === seasonFilter.value)
        );
        grid.replaceChildren();

        filteredTrips.forEach((trip) => {
            const card = document.createElement('article');
            card.className = `route-card ${trip.region}`;

            const header = document.createElement('div');
            header.className = 'route-header';
            appendText(header, 'h2', 'route-name', trip.name);
            appendText(header, 'span', 'route-region', trip.region);
            card.appendChild(header);

            const stations = document.createElement('div');
            stations.className = 'station-info';
            const start = document.createElement('div');
            start.className = 'station';
            appendText(start, 'div', 'station-type', 'From:');
            appendText(start, 'div', 'station-name', trip.startStation);
            const end = document.createElement('div');
            end.className = 'station';
            appendText(end, 'div', 'station-type', 'To:');
            appendText(end, 'div', 'station-name', trip.endStation);
            const routeArrow = appendText(stations, 'div', 'route-arrow', '→');
            stations.append(start, routeArrow, end);
            card.appendChild(stations);

            const details = document.createElement('div');
            details.className = 'route-details';
            const duration = appendText(details, 'div', 'detail-item', '');
            appendText(duration, 'span', 'detail-icon', '◷');
            const durationText = document.createElement('span');
            appendText(durationText, 'span', 'detail-label', 'Duration: ');
            durationText.append(document.createTextNode(trip.duration));
            duration.appendChild(durationText);
            const distance = appendText(details, 'div', 'detail-item', '');
            appendText(distance, 'span', 'detail-icon', '⌖');
            const distanceText = document.createElement('span');
            appendText(distanceText, 'span', 'detail-label', 'Distance: ');
            distanceText.append(document.createTextNode(`${trip.distance}km`));
            distance.appendChild(distanceText);
            const season = appendText(details, 'div', 'detail-item', '');
            appendText(season, 'span', `season-badge season-${trip.bestSeason}`, `Best in ${trip.bestSeason}`);
            card.appendChild(details);

            appendText(card, 'div', 'route-description', trip.description);
            const highlights = document.createElement('div');
            highlights.className = 'highlights';
            const highlightsList = document.createElement('div');
            highlightsList.className = 'highlights-list';
            (trip.highlights || []).forEach((highlight) => {
                appendText(highlightsList, 'span', 'highlight-tag', highlight);
            });
            highlights.appendChild(highlightsList);
            card.appendChild(highlights);

            const actions = document.createElement('div');
            actions.className = 'route-actions';
            const link = appendText(actions, 'a', 'view-details-btn', 'View Details & Book →');
            link.href = `/trips/${encodeURIComponent(trip.id)}`;
            card.appendChild(actions);
            grid.appendChild(card);
        });

        empty.hidden = filteredTrips.length !== 0;
    };

    try {
        const response = await fetch('/api/trips');
        if (!response.ok) {
            throw new Error(`Failed to load trips (${response.status})`);
        }
        trips = await response.json();
        if (!Array.isArray(trips)) {
            throw new Error('Trip API returned an invalid response');
        }

        [...new Set(trips.map((trip) => trip.region))].sort().forEach((region) => {
            appendText(regionFilter, 'option', '', `${region.charAt(0).toUpperCase()}${region.slice(1)}`).value = region;
        });
        [...new Set(trips.map((trip) => trip.bestSeason))].sort().forEach((season) => {
            appendText(seasonFilter, 'option', '', `${season.charAt(0).toUpperCase()}${season.slice(1)}`).value = season;
        });
        regionFilter.value = [...regionFilter.options].some((option) => option.value === selectedRegion) ? selectedRegion : 'all';
        seasonFilter.value = [...seasonFilter.options].some((option) => option.value === selectedSeason) ? selectedSeason : 'all';
        regionFilter.addEventListener('change', () => {
            updateFilterUrl();
            updateTrips();
        });
        seasonFilter.addEventListener('change', () => {
            updateFilterUrl();
            updateTrips();
        });
        updateTrips();
    } catch (fetchError) {
        error.hidden = false;
        error.textContent = 'Unable to load trips right now. Please try again in a moment.';
        console.error(fetchError);
    } finally {
        loading.hidden = true;
    }
};

const initializeSchedules = async () => {
    const monthSelect = document.getElementById('schedule-month');
    const grid = document.getElementById('schedules-grid');
    if (!monthSelect || !grid) {
        return;
    }

    const tripId = window.location.pathname.split('/').filter(Boolean).pop();
    const loading = document.getElementById('schedules-loading');
    const error = document.getElementById('schedules-error');
    const empty = document.getElementById('schedules-empty');

    const loadSchedules = async () => {
        loading.hidden = false;
        error.hidden = true;
        empty.hidden = true;
        grid.replaceChildren();

        try {
            const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/schedules?month=${monthSelect.value}`);
            if (!response.ok) {
                throw new Error(`Failed to load schedules (${response.status})`);
            }
            const payload = await response.json();
            if (!Array.isArray(payload.schedules)) {
                throw new Error('Schedule API returned an invalid response');
            }

            payload.schedules.forEach((schedule) => {
                const card = document.createElement('div');
                card.className = 'schedule-card';
                const times = document.createElement('div');
                times.className = 'schedule-times';
                const departure = document.createElement('div');
                departure.className = 'time-block';
                appendText(departure, 'span', 'time-label', 'Departs');
                appendText(departure, 'span', 'time-value', schedule.departureTime);
                const arrival = document.createElement('div');
                arrival.className = 'time-block';
                appendText(arrival, 'span', 'time-label', 'Arrives');
                appendText(arrival, 'span', 'time-value', schedule.arrivalTime);
                const timeArrow = appendText(times, 'span', 'time-arrow', '→');
                times.append(departure, timeArrow, arrival);
                card.appendChild(times);

                const days = document.createElement('div');
                days.className = 'schedule-days';
                schedule.daysOfWeek.forEach((day) => appendText(days, 'span', 'day-badge', day.slice(0, 3)));
                card.appendChild(days);
                const link = appendText(card, 'a', 'book-btn', 'Book Now');
                link.href = `/trips/booking/${encodeURIComponent(schedule.id)}`;
                grid.appendChild(card);
            });
            empty.hidden = payload.schedules.length !== 0;
        } catch (fetchError) {
            error.hidden = false;
            error.textContent = 'Unable to load schedules right now. Please try again in a moment.';
            console.error(fetchError);
        } finally {
            loading.hidden = true;
        }
    };

    monthSelect.value = String(new Date().getMonth() + 1);
    monthSelect.addEventListener('change', loadSchedules);
    await loadSchedules();
};

document.addEventListener('DOMContentLoaded', () => {
    initializeTripList();
    initializeSchedules();
});
