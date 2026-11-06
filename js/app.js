
import { fetchDestinations } from "./api.js";
import {
    formatNumber,
    saveToStorage,
    getFromStorage,
    showToast
} from "./utils.js";

class TravelDashboard {
    constructor() {
        this.destinations = [];
        this.filteredDestinations = [];
        this.favorites = getFromStorage("travelFavorites");
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.viewMode = "grid";
        this.sortOrder = "asc";
        this.searchTerm = "";
        this.selectedRegion = "all";
        this.darkMode = localStorage.getItem("travelTheme") === "dark";

        this.app = document.getElementById("app");
    }

    async init() {
        this.renderLayout();
        this.applyTheme();
        this.attachEvents();
        await this.loadData();
    }

    renderLayout() {
        this.app.innerHTML = `
            <header class="topbar">
                <div class="brand">✈️Let's<span>Travel</span></div>

                <div class="header-actions">
                    <button id="themeBtn">🌙 Theme</button>
                    <button id="refreshBtn">↻ Refresh</button>
                </div>
            </header>

            <main class="container">

                <section class="hero">
                    <div>
                        <p class="eyebrow">EXPLORE THE WORLD</p>
                        <h1>Discover Your Next <span>Adventure</span></h1>
                        <p>Explore destinations across the globe.</p>
                    </div>
                    <div class="hero-icon">🌍</div>
                </section>

                <section class="stats">
                    <div class="stat-card">
                        <span>Total Destinations</span>
                        <h2 id="totalCount">0</h2>
                    </div>
                    <div class="stat-card">
                        <span>Favorites</span>
                        <h2 id="favoriteCount">0</h2>
                    </div>
                    <div class="stat-card">
                        <span>Showing Results</span>
                        <h2 id="showingCount">0</h2>
                    </div>
                </section>

                <section class="toolbar">
                    <input
                        type="search"
                        id="searchInput"
                        placeholder="Search country or capital..."
                    >

                    <select id="regionFilter">
                        <option value="all">All Regions</option>
                        <option value="Africa">Africa</option>
                        <option value="Americas">Americas</option>
                        <option value="Asia">Asia</option>
                        <option value="Europe">Europe</option>
                        <option value="Oceania">Oceania</option>
                    </select>

                    <select id="sortSelect">
                        <option value="asc">Name: A - Z</option>
                        <option value="desc">Name: Z - A</option>
                        <option value="population">Population: High - Low</option>
                    </select>

                    <button id="favoritesBtn">♥ Favorites</button>
                    <button id="gridBtn" class="active">▦ Cards</button>
                    <button id="tableBtn">☰ Table</button>
                    <button id="exportBtn">↓ Export JSON</button>
                </section>

                <div id="loading" class="loading">Loading destinations...</div>

                <section id="destinationContainer" class="destination-grid"></section>

                <div id="pagination" class="pagination"></div>

            </main>

            <div id="modalContainer"></div>
        `;
    }

    attachEvents() {
        document.getElementById("searchInput").addEventListener("input", (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.currentPage = 1;
            this.applyFilters();
        });

        document.getElementById("regionFilter").addEventListener("change", (e) => {
            this.selectedRegion = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        document.getElementById("sortSelect").addEventListener("change", (e) => {
            this.sortOrder = e.target.value;
            this.applyFilters();
        });

        document.getElementById("refreshBtn").addEventListener("click", () => {
            this.loadData();
        });

        document.getElementById("themeBtn").addEventListener("click", () => {
            this.darkMode = !this.darkMode;
            localStorage.setItem("travelTheme", this.darkMode ? "dark" : "light");
            this.applyTheme();
        });

        document.getElementById("favoritesBtn").addEventListener("click", () => {
            this.showFavorites = !this.showFavorites;
            this.applyFilters();
        });

        document.getElementById("gridBtn").addEventListener("click", () => {
            this.viewMode = "grid";
            this.renderDestinations();
        });

        document.getElementById("tableBtn").addEventListener("click", () => {
            this.viewMode = "table";
            this.renderDestinations();
        });

        document.getElementById("exportBtn").addEventListener("click", () => {
            this.exportJSON();
        });

        document.getElementById("destinationContainer").addEventListener("click", (e) => {
            const favoriteBtn = e.target.closest("[data-favorite]");
            const detailBtn = e.target.closest("[data-detail]");

            if (favoriteBtn) {
                this.toggleFavorite(favoriteBtn.dataset.favorite);
            }

            if (detailBtn) {
                this.showDetails(detailBtn.dataset.detail);
            }
        });

        document.getElementById("pagination").addEventListener("click", (e) => {
            const pageBtn = e.target.closest("[data-page]");

            if (pageBtn) {
                this.currentPage = Number(pageBtn.dataset.page);
                this.renderDestinations();
            }
        });

        document.getElementById("modalContainer").addEventListener("click", (e) => {
            if (e.target.closest("[data-close]")) {
                document.getElementById("modalContainer").innerHTML = "";
            }
        });
    }

    async loadData() {
    const loading = document.getElementById("loading");

    loading.style.display = "block";
    loading.textContent = "Loading destinations...";

    try {
        this.destinations = await fetchDestinations();

        await new Promise(resolve => setTimeout(resolve, 1000));

        this.applyFilters();

        showToast("Destinations loaded successfully!");

    } catch (error) {
        loading.style.display = "block";
        loading.textContent = "Unable to load data. Please try again.";

        showToast("Something went wrong!");

    } finally {
        if (this.destinations.length > 0) {
            loading.style.display = "none";
        }
    }
}

    applyFilters() {
        let results = [...this.destinations];

        if (this.searchTerm) {
            results = results.filter(item =>
                item.name.toLowerCase().includes(this.searchTerm) ||
                item.capital.toLowerCase().includes(this.searchTerm)
            );
        }

        if (this.selectedRegion !== "all") {
            results = results.filter(item =>
                item.region === this.selectedRegion
            );
        }

        if (this.showFavorites) {
            results = results.filter(item =>
                this.favorites.includes(item.id)
            );
        }

        if (this.sortOrder === "asc") {
            results.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.sortOrder === "desc") {
            results.sort((a, b) => b.name.localeCompare(a.name));
        } else {
            results.sort((a, b) => b.population - a.population);
        }

        this.filteredDestinations = results;
        this.currentPage = 1;
        this.updateStats();
        this.renderDestinations();
    }

    updateStats() {
        document.getElementById("totalCount").textContent =
            this.destinations.length;

        document.getElementById("favoriteCount").textContent =
            this.favorites.length;

        document.getElementById("showingCount").textContent =
            this.filteredDestinations.length;
    }

    renderDestinations() {
        const container = document.getElementById("destinationContainer");
        const pagination = document.getElementById("pagination");

        const start = (this.currentPage - 1) * this.itemsPerPage;

        const pageData = this.filteredDestinations.slice(
            start,
            start + this.itemsPerPage
        );

        container.className = this.viewMode === "grid"
            ? "destination-grid"
            : "table-wrapper";

        if (pageData.length === 0) {
            container.innerHTML = "<p class='empty'>No destinations found.</p>";
            pagination.innerHTML = "";
            return;
        }

        if (this.viewMode === "grid") {
            container.innerHTML = pageData.map(item => `
                <article class="destination-card">
                    <img src="${item.flag}" alt="${item.name} flag">

                    <div class="card-content">
                        <span class="region">${item.region}</span>
                        <h3>${item.name}</h3>
                        <p> ${item.capital}</p>
                        <p> ${formatNumber(item.population)}</p>

                        <div class="card-actions">
                            <button data-detail="${item.id}">View Details</button>
                            <button data-favorite="${item.id}">
                                ${this.favorites.includes(item.id) ? "♥" : "♡"}
                            </button>
                        </div>
                    </div>
                </article>
            `).join("");
        } else {
            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Country</th>
                            <th>Capital</th>
                            <th>Region</th>
                            <th>Population</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageData.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.capital}</td>
                                <td>${item.region}</td>
                                <td>${formatNumber(item.population)}</td>
                                <td>
                                    <button data-detail="${item.id}">Details</button>
                                    <button data-favorite="${item.id}">
                                        ${this.favorites.includes(item.id) ? "♥" : "♡"}
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        }

        this.renderPagination();
    }

    renderPagination() {
        const totalPages = Math.ceil(
            this.filteredDestinations.length / this.itemsPerPage
        );

        const pagination = document.getElementById("pagination");

        pagination.innerHTML = Array.from(
            { length: totalPages },
            (_, i) => `
                <button
                    data-page="${i + 1}"
                    class="${this.currentPage === i + 1 ? "active" : ""}"
                >
                    ${i + 1}
                </button>
            `
        ).join("");
    }

    toggleFavorite(id) {
        if (this.favorites.includes(id)) {
            this.favorites = this.favorites.filter(item => item !== id);
            showToast("Removed from favorites");
        } else {
            this.favorites = [...this.favorites, id];
            showToast("Added to favorites");
        }

        saveToStorage("travelFavorites", this.favorites);
        this.applyFilters();
    }

    showDetails(id) {
        const item = this.destinations.find(
            destination => destination.id === id
        );

        if (!item) return;

        document.getElementById("modalContainer").innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <button class="close-btn" data-close>✕</button>
                    <img src="${item.flag}" alt="${item.name} flag">
                    <h2>${item.name}</h2>
                    <p><strong>Capital:</strong> ${item.capital}</p>
                    <p><strong>Region:</strong> ${item.region}</p>
                    <p><strong>Continent:</strong> ${item.continent}</p>
                    <p><strong>Population:</strong> ${formatNumber(item.population)}</p>
                </div>
            </div>
        `;
    }

    exportJSON() {
        const blob = new Blob(
            [JSON.stringify(this.filteredDestinations, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "travel-destinations.json";
        link.click();

        URL.revokeObjectURL(url);
        showToast("JSON exported successfully!");
    }

    applyTheme() {
        document.body.classList.toggle("dark-mode", this.darkMode);

        const button = document.getElementById("themeBtn");

        if (button) {
            button.textContent = this.darkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
        }
    }
}

const dashboard = new TravelDashboard();
dashboard.init();
