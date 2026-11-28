// Trip admin page (Feature Set 5). Loads trips from the API, and edits or
// deletes them through PUT and DELETE /api/trips/:id without reloading the page.
// Every value from the API is written with textContent, never innerHTML.

(() => {
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const statusEl = document.getElementById('trip-admin-status');
    const listEl = document.getElementById('trip-admin-list');
    const rowTemplate = document.getElementById('trip-admin-row');
    const dialog = document.getElementById('trip-editor');
    const form = document.getElementById('trip-editor-form');
    const errorsEl = document.getElementById('trip-editor-errors');
    const monthsEl = document.getElementById('trip-editor-months');
    const schedulesEl = document.getElementById('trip-editor-schedules');
    const regionsEl = document.getElementById('trip-editor-regions');
    const saveBtn = document.getElementById('trip-editor-save');

    let trips = [];
    let stations = [];
    let schedules = [];
    let editingTripId = null;

    const setStatus = (message) => {
        statusEl.textContent = message;
    };

    const stationName = (id) => {
        const station = stations.find((item) => item.id === id);
        return station ? station.name : id;
    };

    const tripName = (id) => {
        const trip = trips.find((item) => item.id === id);
        return trip ? trip.name : id;
    };

    const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

    // Sends a JSON request and returns { ok, status, body }.
    const requestJson = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
        });
        let body = null;
        if (response.status !== 204) {
            try {
                body = await response.json();
            } catch {
                body = null;
            }
        }
        return { ok: response.ok, status: response.status, body };
    };

    // 401 means the session expired; 403 means this account is not an admin.
    const authProblem = (status) => {
        if (status === 401) {
            return 'Your session has ended. Please sign in again.';
        }
        if (status === 403) {
            return 'Only admin users can change trips.';
        }
        return null;
    };

    const renderList = () => {
        listEl.replaceChildren();
        if (trips.length === 0) {
            setStatus('There are no trips.');
            return;
        }
        trips.forEach((trip) => {
            const row = rowTemplate.content.firstElementChild.cloneNode(true);
            row.dataset.tripId = trip.id;
            row.querySelector('.trip-admin-name').textContent = trip.name;
            row.querySelector('.trip-admin-meta').textContent =
                `${trip.id} · ${capitalize(trip.region)} · Best in ${capitalize(trip.bestSeason)} · ${trip.distance} km · ${trip.duration}`;
            row.querySelector('.trip-admin-route').textContent =
                `${stationName(trip.startStation)} → ${stationName(trip.endStation)}`;
            const count = schedules.filter((schedule) => schedule.tripId === trip.id).length;
            row.querySelector('.trip-admin-schedules').textContent =
                `${count} schedule${count === 1 ? '' : 's'}`;
            row.querySelector('.trip-admin-edit').addEventListener('click', () => openEditor(trip.id));
            row.querySelector('.trip-admin-delete').addEventListener('click', () => deleteTrip(trip.id));
            listEl.append(row);
        });
    };

    const loadData = async () => {
        const [tripsResult, optionsResult] = await Promise.all([
            requestJson('/api/trips'),
            requestJson('/api/admin/trip-options')
        ]);
        if (!tripsResult.ok || !optionsResult.ok) {
            const message = authProblem(optionsResult.status) || 'Could not load trips. Please refresh the page.';
            throw new Error(message);
        }
        trips = tripsResult.body.sort((a, b) => a.name.localeCompare(b.name));
        ({ stations, schedules } = optionsResult.body);
    };

    // ---------- editor ----------

    const fillSelect = (select, selectedId) => {
        select.replaceChildren();
        stations.forEach((station) => {
            const option = document.createElement('option');
            option.value = station.id;
            option.textContent = `${station.name} (${capitalize(station.region)})`;
            option.selected = station.id === selectedId;
            select.append(option);
        });
    };

    const fillMonths = (selected) => {
        monthsEl.replaceChildren();
        MONTH_NAMES.forEach((name, index) => {
            const label = document.createElement('label');
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.name = 'operatingMonths';
            box.value = String(index + 1);
            box.checked = selected.includes(index + 1);
            label.append(box, ` ${name}`);
            monthsEl.append(label);
        });
    };

    const fillSchedules = (tripId) => {
        schedulesEl.replaceChildren();
        schedules.forEach((schedule) => {
            const onThisTrip = schedule.tripId === tripId;
            const label = document.createElement('label');
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.name = 'scheduleIds';
            box.value = String(schedule.id);
            box.checked = onThisTrip;
            box.disabled = onThisTrip;
            const days = schedule.daysOfWeek.map((day) => capitalize(day.slice(0, 3))).join(', ');
            const owner = onThisTrip ? 'on this trip' : `currently on ${tripName(schedule.tripId)}`;
            label.append(box, ` #${schedule.id} · ${schedule.departureTime} → ${schedule.arrivalTime} · ${days} (${owner})`);
            schedulesEl.append(label);
        });
    };

    const showErrors = (messages) => {
        errorsEl.replaceChildren();
        messages.forEach((message) => {
            const item = document.createElement('li');
            item.textContent = message;
            errorsEl.append(item);
        });
        errorsEl.hidden = messages.length === 0;
    };

    const openEditor = (tripId) => {
        const trip = trips.find((item) => item.id === tripId);
        if (!trip) {
            return;
        }
        editingTripId = tripId;
        showErrors([]);
        document.getElementById('trip-editor-title').textContent = `Edit ${trip.name}`;
        form.elements.name.value = trip.name;
        form.elements.description.value = trip.description;
        form.elements.region.value = trip.region;
        form.elements.bestSeason.value = trip.bestSeason;
        form.elements.duration.value = trip.duration;
        form.elements.distance.value = trip.distance;
        form.elements.highlights.value = (trip.highlights || []).join('\n');
        fillSelect(form.elements.startStation, trip.startStation);
        fillSelect(form.elements.endStation, trip.endStation);
        fillMonths(trip.operatingMonths || []);
        fillSchedules(trip.id);
        regionsEl.replaceChildren(...[...new Set(trips.map((item) => item.region))].map((region) => {
            const option = document.createElement('option');
            option.value = region;
            return option;
        }));
        dialog.showModal();
    };

    const readForm = () => ({
        name: form.elements.name.value,
        description: form.elements.description.value,
        region: form.elements.region.value.trim().toLowerCase(),
        bestSeason: form.elements.bestSeason.value,
        startStation: form.elements.startStation.value,
        endStation: form.elements.endStation.value,
        duration: form.elements.duration.value,
        distance: form.elements.distance.value === '' ? null : Number(form.elements.distance.value),
        highlights: form.elements.highlights.value.split('\n').map((line) => line.trim()).filter(Boolean),
        operatingMonths: [...monthsEl.querySelectorAll('input:checked')].map((box) => Number(box.value)),
        scheduleIds: [...schedulesEl.querySelectorAll('input:checked:not(:disabled)')].map((box) => Number(box.value))
    });

    const saveTrip = async (event) => {
        event.preventDefault();
        if (!editingTripId) {
            return;
        }
        saveBtn.disabled = true;
        try {
            const changes = readForm();
            const result = await requestJson(`/api/trips/${encodeURIComponent(editingTripId)}`, {
                method: 'PUT',
                body: JSON.stringify(changes)
            });
            if (!result.ok) {
                const problem = authProblem(result.status);
                const details = result.body && Array.isArray(result.body.errors) ? result.body.errors : [];
                const message = problem || (result.body && result.body.error) || `Save failed (${result.status})`;
                showErrors([message, ...details]);
                return;
            }

            // Update this trip and any moved schedules in memory, then redraw the list.
            const index = trips.findIndex((trip) => trip.id === editingTripId);
            trips[index] = result.body;
            schedules.forEach((schedule) => {
                if (changes.scheduleIds.includes(schedule.id)) {
                    schedule.tripId = editingTripId;
                }
            });
            dialog.close();
            renderList();
            setStatus(`Saved ${result.body.name}.`);
        } catch (error) {
            showErrors(['Could not reach the server. Please try again.']);
            console.error(error);
        } finally {
            saveBtn.disabled = false;
        }
    };

    const deleteTrip = async (tripId) => {
        const trip = trips.find((item) => item.id === tripId);
        if (!trip || !window.confirm(`Delete "${trip.name}"? This cannot be undone.`)) {
            return;
        }
        try {
            const result = await requestJson(`/api/trips/${encodeURIComponent(tripId)}`, { method: 'DELETE' });
            if (result.status === 204) {
                trips = trips.filter((item) => item.id !== tripId);
                renderList();
                setStatus(`Deleted ${trip.name}.`);
                return;
            }
            const message = authProblem(result.status) || (result.body && result.body.error) || `Delete failed (${result.status})`;
            setStatus(message);
        } catch (error) {
            setStatus('Could not reach the server. Please try again.');
            console.error(error);
        }
    };

    form.addEventListener('submit', saveTrip);
    document.getElementById('trip-editor-cancel').addEventListener('click', () => dialog.close());

    const start = async () => {
        try {
            await loadData();
            renderList();
            setStatus(`${trips.length} trips`);
        } catch (error) {
            setStatus(error.message);
        }
    };

    start();
})();
