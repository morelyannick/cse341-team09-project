const hookTrainsCatalog = () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');
    const paginationEl = document.getElementById('trains-pagination');
    const prevBtn = document.getElementById('trains-prev-btn');
    const nextBtn = document.getElementById('trains-next-btn');
    const pageInfoEl = document.getElementById('trains-page-info');

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;
    const limit = 10;

    const fetchAndRenderTrains = async (page = 1) => {
        if (loadingEl) {
            loadingEl.hidden = false;
        }
        if (errorEl) {
            errorEl.hidden = true;
        }

        try {
            const response = await fetch(`/api/trains?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(`Failed to load trains (${response.status})`);
            }

            const payload = await response.json();
            const trains = payload.trains || [];
            const pagination = payload.pagination || {
                page: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
                totalItems: trains.length
            };

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

            currentPage = pagination.page;

            if (pageInfoEl) {
                pageInfoEl.textContent = `Page ${pagination.page} of ${pagination.totalPages || 1} (${pagination.totalItems} trains)`;
            }

            if (prevBtn) {
                prevBtn.disabled = !pagination.hasPreviousPage;
            }

            if (nextBtn) {
                nextBtn.disabled = !pagination.hasNextPage;
            }

            if (paginationEl) {
                paginationEl.hidden = false;
            }

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

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                fetchAndRenderTrains(currentPage - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            fetchAndRenderTrains(currentPage + 1);
        });
    }

    fetchAndRenderTrains(1);
};

document.addEventListener('DOMContentLoaded', () => {
    hookTrainsCatalog();
});