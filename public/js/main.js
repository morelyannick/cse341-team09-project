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

const hookStationDetails = () => {
    const buttons = document.querySelectorAll('.station-toggle-btn');
    if (!buttons || buttons.length === 0) {
        return;
    }

    buttons.forEach((btn) => {
        btn.addEventListener('click', async () => {
            const stationId = btn.dataset.stationId;
            const panel = document.getElementById(`station-info-${stationId}`);
            if (!panel) return;

            if (!panel.hidden) {
                panel.hidden = true;
                btn.setAttribute('aria-expanded', 'false');
                btn.textContent = 'ℹ️ View Station Details';
                return;
            }

            panel.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
            btn.textContent = '✕ Close Station Details';
            panel.innerHTML = '<p class="station-loading">Loading station details...</p>';

            try {
                const response = await fetch(`/api/stations/${stationId}`);
                if (!response.ok) {
                    throw new Error(`Failed to load station (${response.status})`);
                }

                const data = await response.json();
                const station = data.station || data;

                const facilitiesHtml = station.facilities && station.facilities.length > 0
                    ? `<div class="station-facilities"><strong>Facilities:</strong> ${station.facilities.map((f) => `<span class="facility-pill">${f}</span>`).join(' ')}</div>`
                    : '';

                panel.innerHTML = `
                    <div class="station-card-content">
                        <h3>${station.name}</h3>
                        <p><strong>Prefecture:</strong> ${station.prefecture} | <strong>Region:</strong> ${station.region}</p>
                        ${station.description ? `<p class="station-desc">${station.description}</p>` : ''}
                        ${facilitiesHtml}
                    </div>
                `;
            } catch (err) {
                panel.innerHTML = '<p class="station-error">Unable to load station information at this time.</p>';
            }
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookStationDetails();
});