(() => {
  "use strict";

  const atlas = window.HUB_ATLAS;
  const cities = atlas.cities;
  const connections = atlas.connections;
  const cityById = new Map(cities.map(city => [city.id, city]));
  const referenceDate = new Date(`${atlas.referenceDate}T12:00:00`);

  const els = {
    citySearch: document.getElementById("citySearch"),
    countryFilter: document.getElementById("countryFilter"),
    themeChips: document.getElementById("themeChips"),
    clearFilters: document.getElementById("clearFilters"),
    sortButton: document.getElementById("sortButton"),
    cityList: document.getElementById("cityList"),
    resultsLabel: document.getElementById("resultsLabel"),
    mapSubtitle: document.getElementById("mapSubtitle"),
    networkMap: document.getElementById("networkMap"),
    mapCanvas: document.getElementById("mapCanvas"),
    countryLayer: document.getElementById("countryLayer"),
    connectionLayer: document.getElementById("connectionLayer"),
    markerLayer: document.getElementById("markerLayer"),
    mapTooltip: document.getElementById("mapTooltip"),
    mapOverviewCard: document.getElementById("mapOverviewCard"),
    overviewHeadline: document.getElementById("overviewHeadline"),
    overviewText: document.getElementById("overviewText"),
    overviewThemes: document.getElementById("overviewThemes"),
    detailPanel: document.getElementById("detailPanel"),
    detailContent: document.getElementById("detailContent"),
    connectionsToggle: document.getElementById("connectionsToggle"),
    resetMapButton: document.getElementById("resetMapButton"),
    zoomIn: document.getElementById("zoomIn"),
    zoomOut: document.getElementById("zoomOut"),
    zoomHome: document.getElementById("zoomHome"),
    explorerPanel: document.getElementById("explorerPanel"),
    openFiltersButton: document.getElementById("openFiltersButton"),
    closeFiltersButton: document.getElementById("closeFiltersButton"),
    mobileResultsButton: document.getElementById("mobileResultsButton"),
    mobileResultCount: document.getElementById("mobileResultCount"),
    mobileBackdrop: document.getElementById("mobileBackdrop"),
    methodDialog: document.getElementById("methodDialog"),
    toast: document.getElementById("toast")
  };

  const allThemes = [...new Set(cities.flatMap(city => city.themes))].sort((a, b) => a.localeCompare(b, "es"));
  const allCountries = [...new Set(cities.map(city => city.country))].sort((a, b) => a.localeCompare(b, "es"));
  const memberCountries = new Set(allCountries);
  const themeFrequency = allThemes
    .map(theme => ({ theme, count: cities.filter(city => city.themes.includes(theme)).length }))
    .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme, "es"));

  const hashCity = new URLSearchParams(location.hash.replace(/^#/, "")).get("ciudad");
  const state = {
    selectedId: cityById.has(hashCity) ? hashCity : (window.innerWidth > 1120 ? "medellin" : null),
    search: "",
    country: "all",
    theme: "all",
    reverseSort: false,
    detailTab: "resumen",
    connectionsVisible: true,
    filteredIds: new Set(cities.map(city => city.id)),
    suppressClick: false
  };

  const svgNS = "http://www.w3.org/2000/svg";
  const baseView = { x: 0, y: 0, width: 860, height: 760 };
  let view = { ...baseView };
  let drag = null;
  let toastTimer = null;
  let mapFeatures = [];

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function icon(name, className = "") {
    const paths = {
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
      users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 9a2.5 2.5 0 0 1 0 5M17 17.5a4.5 4.5 0 0 1 4 1.5"/>',
      building: '<path d="M4 21V7l8-4 8 4v14M8 10h2M14 10h2M8 14h2M14 14h2M9 21v-3h6v3"/>',
      project: '<path d="M4 7h7l2 2h7v10H4V7Z"/><path d="M4 10h16"/>',
      program: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
      spark: '<path d="m12 3 1.5 4.2L18 9l-4.5 1.8L12 15l-1.5-4.2L6 9l4.5-1.8L12 3Z"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/>',
      people: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M14 19a4 4 0 0 1 8 0"/>',
      population: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M14 19a4 4 0 0 1 8 0"/>',
      area: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
      mountain: '<path d="m3 20 6.5-11 3.3 5 2.4-4L21 20H3Z"/><path d="m7.7 12 1.8 2 1.6-1.9"/>',
      density: '<circle cx="7" cy="7" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 7h6M7 9v6M17 9v6M9 17h6"/>',
      network: '<circle cx="6" cy="7" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="m8 7 8-.7M7 9l4 7M17 8l-4 8"/>',
      download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
      share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      award: '<circle cx="12" cy="8" r="5"/><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9"/><path d="m10 8 1.3 1.2L14 6.5"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'
    };
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }

  function sourceBadge(source) {
    const isHub = source === "hub";
    return `<span class="source-badge source-badge--${isHub ? "hub" : "demo"}" title="${isHub ? "Registro publicado por el HUB" : "Contenido sintético de demostración"}">${isHub ? "Fuente HUB" : "Demo"}</span>`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value);
  }

  function formatCompact(value) {
    return new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  }

  function formatDate(dateValue, includeDay = false) {
    const date = new Date(`${dateValue}T12:00:00`);
    return new Intl.DateTimeFormat("es-CO", includeDay
      ? { day: "numeric", month: "long", year: "numeric" }
      : { month: "long", year: "numeric" }
    ).format(date);
  }

  function membershipDuration(dateValue) {
    const start = new Date(`${dateValue}T12:00:00`);
    let months = (referenceDate.getFullYear() - start.getFullYear()) * 12 + referenceDate.getMonth() - start.getMonth();
    if (referenceDate.getDate() < start.getDate()) months -= 1;
    months = Math.max(0, months);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (!years) return `${remainingMonths} ${remainingMonths === 1 ? "mes" : "meses"}`;
    if (!remainingMonths) return `${years} ${years === 1 ? "año" : "años"}`;
    return `${years} ${years === 1 ? "año" : "años"} y ${remainingMonths} ${remainingMonths === 1 ? "mes" : "meses"}`;
  }

  function actionCount(city) {
    return city.projects.length + city.programs.length + city.initiatives.length;
  }

  function searchableText(city) {
    return normalize([
      city.name,
      city.locality,
      city.country,
      city.summary,
      ...city.themes,
      ...city.people.flatMap(person => [person.name, person.role]),
      ...city.institutions.flatMap(inst => [inst.name, inst.type]),
      ...city.projects.flatMap(project => [project.title, project.description]),
      ...city.programs.flatMap(program => [program.title, program.description]),
      ...city.initiatives.flatMap(initiative => [initiative.title, initiative.description]),
      ...city.awards.map(award => award.title)
    ].filter(Boolean).join(" "));
  }

  function getFilteredCities() {
    const query = normalize(state.search);
    const filtered = cities.filter(city => {
      const countryMatch = state.country === "all" || city.country === state.country;
      const themeMatch = state.theme === "all" || city.themes.includes(state.theme);
      const searchMatch = !query || searchableText(city).includes(query);
      return countryMatch && themeMatch && searchMatch;
    });

    filtered.sort((a, b) => {
      const countryCompare = a.country.localeCompare(b.country, "es");
      const cityCompare = a.name.localeCompare(b.name, "es");
      const result = countryCompare || cityCompare;
      return state.reverseSort ? -result : result;
    });
    return filtered;
  }

  function populateFilters() {
    els.countryFilter.insertAdjacentHTML(
      "beforeend",
      allCountries.map(country => `<option value="${escapeHTML(country)}">${escapeHTML(country)}</option>`).join("")
    );

    els.themeChips.innerHTML = [
      `<button type="button" class="theme-chip is-active" data-theme="all">Todos</button>`,
      ...themeFrequency.map(({ theme, count }) =>
        `<button type="button" class="theme-chip" data-theme="${escapeHTML(theme)}">${escapeHTML(theme)} · ${count}</button>`
      )
    ].join("");
  }

  function updateKpis() {
    const actors = cities.reduce((sum, city) => sum + city.people.length, 0);
    const actions = cities.reduce((sum, city) => sum + actionCount(city), 0);
    document.getElementById("kpiCities").textContent = cities.length;
    document.getElementById("kpiCountries").textContent = allCountries.length;
    document.getElementById("kpiActors").textContent = actors;
    document.getElementById("kpiActions").textContent = actions;
  }

  function renderCityList(filtered) {
    els.resultsLabel.textContent = `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"}`;
    els.mobileResultCount.textContent = filtered.length;

    if (!filtered.length) {
      els.cityList.innerHTML = `
        <div class="empty-results">
          ${icon("search")}
          <strong>Sin coincidencias</strong>
          <p>Prueba otro término o limpia los filtros activos.</p>
        </div>`;
      return;
    }

    els.cityList.innerHTML = filtered.map(city => `
      <button class="city-item ${state.selectedId === city.id ? "is-selected" : ""}" type="button" data-city-id="${city.id}" role="option" aria-selected="${state.selectedId === city.id}">
        <span class="city-item__marker">${escapeHTML(city.code)}</span>
        <span class="city-item__copy">
          <strong>${escapeHTML(city.name)}</strong>
          <span>${escapeHTML(city.locality ? `${city.locality} · ${city.country}` : city.country)} · ${city.people.length} personas</span>
        </span>
        <span class="city-item__count" title="${actionCount(city)} acciones registradas">${actionCount(city)}</span>
      </button>
    `).join("");

    els.cityList.querySelectorAll("[data-city-id]").forEach(button => {
      button.addEventListener("click", () => selectCity(button.dataset.cityId));
      button.addEventListener("mouseenter", () => highlightMarker(button.dataset.cityId, true));
      button.addEventListener("mouseleave", () => highlightMarker(button.dataset.cityId, false));
    });
  }

  function highlightMarker(id, active) {
    const marker = els.markerLayer.querySelector(`[data-marker-id="${CSS.escape(id)}"]`);
    if (marker && id !== state.selectedId) marker.classList.toggle("is-related", active);
  }

  function renderThemeChips() {
    els.themeChips.querySelectorAll("[data-theme]").forEach(button => {
      button.classList.toggle("is-active", button.dataset.theme === state.theme);
      button.setAttribute("aria-pressed", button.dataset.theme === state.theme ? "true" : "false");
    });
  }

  function applyFilters({ preserveSelection = false } = {}) {
    const filtered = getFilteredCities();
    state.filteredIds = new Set(filtered.map(city => city.id));

    if (!preserveSelection && state.selectedId && !state.filteredIds.has(state.selectedId)) {
      state.selectedId = null;
      state.detailTab = "resumen";
      replaceCityHash(null);
    }

    renderCityList(filtered);
    renderThemeChips();
    renderMapState(filtered);
    renderDetail();

    const hasFilters = Boolean(state.search) || state.country !== "all" || state.theme !== "all";
    els.clearFilters.disabled = !hasFilters;
    els.mapSubtitle.textContent = filtered.length
      ? `${filtered.length} ${filtered.length === 1 ? "nodo visible" : "nodos visibles"} · selecciona una ciudad para abrir su ficha`
      : "No hay nodos que coincidan con los filtros";
  }

  function clearFilters() {
    state.search = "";
    state.country = "all";
    state.theme = "all";
    els.citySearch.value = "";
    els.countryFilter.value = "all";
    applyFilters({ preserveSelection: true });
  }

  function project([lon, lat]) {
    const minLon = -119;
    const maxLon = -32;
    const minLat = -57;
    const maxLat = 33;
    const x = 43 + ((lon - minLon) / (maxLon - minLon)) * 774;
    const y = 27 + ((maxLat - lat) / (maxLat - minLat)) * 703;
    return [x, y];
  }

  function markerPosition(city) {
    const [x, y] = project([city.lon, city.lat]);
    const [dx, dy] = city.markerOffset || [0, 0];
    return { anchorX: x, anchorY: y, x: x + dx, y: y + dy };
  }

  function geometryToPath(geometry) {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map(polygon => polygon.map(ring => ring.map((coord, index) => {
      const [x, y] = project(coord);
      return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ") + " Z").join(" ")).join(" ");
  }

  function createSvg(tag, attributes = {}) {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  async function buildMap() {
    buildConnections();
    buildMarkers();

    try {
      const response = await fetch("data/latam-countries.geojson");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const geojson = await response.json();
      mapFeatures = geojson.features;
      buildCountries();
      // Keep connections and nodes visually above countries after the async fetch.
      els.networkMap.querySelector("#mapViewport").append(els.countryLayer, els.connectionLayer, els.markerLayer);
      renderMapState(getFilteredCities());
    } catch (error) {
      console.warn("No fue posible cargar la capa cartográfica:", error);
      showToast("La capa de países no pudo cargarse; los nodos siguen disponibles.");
    }
  }

  function buildCountries() {
    els.countryLayer.innerHTML = "";
    mapFeatures.forEach(feature => {
      const countryName = feature.properties.name;
      const path = createSvg("path", {
        d: geometryToPath(feature.geometry),
        class: `country-shape ${memberCountries.has(countryName) ? "has-city" : ""}`,
        "data-country-name": countryName,
        tabindex: memberCountries.has(countryName) ? "0" : "-1",
        role: memberCountries.has(countryName) ? "button" : "img",
        "aria-label": memberCountries.has(countryName)
          ? `Filtrar ciudades de ${countryName}`
          : countryName
      });
      const title = createSvg("title");
      title.textContent = countryName;
      path.appendChild(title);
      path.addEventListener("click", event => {
        event.stopPropagation();
        if (!memberCountries.has(countryName)) {
          showToast(`Aún no hay una ciudad registrada en ${countryName}.`);
          return;
        }
        state.country = state.country === countryName ? "all" : countryName;
        els.countryFilter.value = state.country;
        applyFilters();
      });
      path.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          path.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      });
      els.countryLayer.appendChild(path);
    });
  }

  function buildConnections() {
    els.connectionLayer.innerHTML = "";
    connections.forEach((connection, index) => {
      const from = cityById.get(connection.from);
      const to = cityById.get(connection.to);
      const p1 = markerPosition(from);
      const p2 = markerPosition(to);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy) || 1;
      const bend = Math.min(34, length * 0.13) * (index % 2 ? -1 : 1);
      const cx = (p1.x + p2.x) / 2 - (dy / length) * bend;
      const cy = (p1.y + p2.y) / 2 + (dx / length) * bend;
      const path = createSvg("path", {
        d: `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`,
        class: "connection-path",
        "data-from": connection.from,
        "data-to": connection.to,
        "data-theme": connection.theme
      });
      const title = createSvg("title");
      title.textContent = `${from.name} ↔ ${to.name}: ${connection.theme}`;
      path.appendChild(title);
      els.connectionLayer.appendChild(path);
    });
  }

  function labelPlacement(city) {
    const custom = {
      medellin: { dx: -12, dy: -7, anchor: "end" },
      bogota: { dx: 12, dy: 13, anchor: "start" },
      quito: { dx: 12, dy: -7, anchor: "start" },
      guayaquil: { dx: -12, dy: 4, anchor: "end" },
      "ciudad-guatemala": { dx: 12, dy: -8, anchor: "start" },
      "tuxtla-gutierrez": { dx: -12, dy: -5, anchor: "end" },
      tapachula: { dx: 12, dy: 13, anchor: "start" },
      providencia: { dx: 12, dy: -2, anchor: "start" },
      renca: { dx: -12, dy: 2, anchor: "end" },
      nunoa: { dx: 12, dy: 12, anchor: "start" },
      cordoba: { dx: 12, dy: -7, anchor: "start" },
      mendoza: { dx: -12, dy: 7, anchor: "end" },
      montevideo: { dx: 12, dy: 5, anchor: "start" }
    };
    return custom[city.id] || { dx: 12, dy: 4, anchor: "start" };
  }

  function buildMarkers() {
    els.markerLayer.innerHTML = "";
    cities.forEach(city => {
      const pos = markerPosition(city);
      const group = createSvg("g", {
        class: "city-marker",
        "data-marker-id": city.id,
        role: "button",
        tabindex: "0",
        "aria-label": `${city.name}, ${city.country}. ${city.people.length} personas y ${actionCount(city)} acciones.`
      });

      if (city.markerOffset) {
        group.appendChild(createSvg("line", {
          x1: pos.anchorX.toFixed(1),
          y1: pos.anchorY.toFixed(1),
          x2: pos.x.toFixed(1),
          y2: pos.y.toFixed(1),
          class: "marker-leader"
        }));
      }

      group.append(
        createSvg("circle", { cx: pos.x, cy: pos.y, r: 23, class: "marker-hit" }),
        createSvg("circle", { cx: pos.x, cy: pos.y, r: 18, class: "marker-pulse" }),
        createSvg("circle", { cx: pos.x, cy: pos.y, r: 10.5, class: "marker-ring", filter: "url(#markerShadow)" }),
        createSvg("circle", { cx: pos.x, cy: pos.y, r: 6.3, class: "marker-core" }),
        createSvg("circle", { cx: pos.x, cy: pos.y, r: 1.8, class: "marker-center" })
      );

      const placement = labelPlacement(city);
      const label = createSvg("text", {
        x: pos.x + placement.dx,
        y: pos.y + placement.dy,
        "text-anchor": placement.anchor,
        class: "city-label"
      });
      label.textContent = city.name.replace(" Capital", "");
      group.appendChild(label);

      group.addEventListener("click", event => {
        event.stopPropagation();
        if (state.suppressClick) return;
        selectCity(city.id);
      });
      group.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectCity(city.id);
        }
      });
      group.addEventListener("pointerenter", event => showTooltip(city, event));
      group.addEventListener("pointermove", event => moveTooltip(event));
      group.addEventListener("pointerleave", hideTooltip);
      group.addEventListener("focus", event => showTooltip(city, event, true));
      group.addEventListener("blur", hideTooltip);

      els.markerLayer.appendChild(group);
    });
  }

  function showTooltip(city, event, fromKeyboard = false) {
    els.mapTooltip.innerHTML = `
      <strong>${escapeHTML(city.name)}</strong>
      <span>${escapeHTML(city.country)} · ${city.people.length} personas · ${actionCount(city)} acciones</span>
      <small>${escapeHTML(city.themes[0])}</small>`;
    els.mapTooltip.hidden = false;
    if (fromKeyboard) {
      const targetRect = event.currentTarget.getBoundingClientRect();
      const mapRect = els.mapCanvas.getBoundingClientRect();
      positionTooltip(targetRect.right - mapRect.left, targetRect.top + targetRect.height / 2 - mapRect.top);
    } else {
      moveTooltip(event);
    }
  }

  function moveTooltip(event) {
    const rect = els.mapCanvas.getBoundingClientRect();
    positionTooltip(event.clientX - rect.left, event.clientY - rect.top);
  }

  function positionTooltip(x, y) {
    const width = 190;
    const safeX = Math.max(5, Math.min(x, els.mapCanvas.clientWidth - width - 18));
    const safeY = Math.max(45, Math.min(y, els.mapCanvas.clientHeight - 45));
    els.mapTooltip.style.left = `${safeX}px`;
    els.mapTooltip.style.top = `${safeY}px`;
  }

  function hideTooltip() {
    els.mapTooltip.hidden = true;
  }

  function relatedCityIds(cityId) {
    const ids = new Set();
    connections.forEach(connection => {
      if (connection.from === cityId) ids.add(connection.to);
      if (connection.to === cityId) ids.add(connection.from);
    });
    return ids;
  }

  function renderMapState(filtered) {
    const visibleIds = new Set(filtered.map(city => city.id));
    const selected = state.selectedId ? cityById.get(state.selectedId) : null;
    const related = selected ? relatedCityIds(selected.id) : new Set();

    els.markerLayer.querySelectorAll(".city-marker").forEach(marker => {
      const id = marker.dataset.markerId;
      marker.classList.toggle("is-selected", id === state.selectedId);
      marker.classList.toggle("is-muted", !visibleIds.has(id));
      marker.classList.toggle("is-related", related.has(id));
      marker.setAttribute("aria-pressed", id === state.selectedId ? "true" : "false");
    });

    els.connectionLayer.classList.toggle("is-hidden", !state.connectionsVisible);
    els.connectionLayer.querySelectorAll(".connection-path").forEach(path => {
      const from = path.dataset.from;
      const to = path.dataset.to;
      const bothVisible = visibleIds.has(from) && visibleIds.has(to);
      const isRelated = Boolean(selected) && (from === selected.id || to === selected.id);
      path.classList.toggle("is-related", isRelated);
      path.classList.toggle("is-muted", !bothVisible || (Boolean(selected) && !isRelated));
    });

    els.countryLayer.querySelectorAll(".country-shape").forEach(path => {
      const country = path.dataset.countryName;
      const active = state.country !== "all" && country === state.country;
      const muted = state.country !== "all" && country !== state.country;
      path.classList.toggle("is-country-active", active);
      path.classList.toggle("is-country-muted", muted);
    });

    if (selected) {
      els.mapOverviewCard.classList.add("is-city");
      els.overviewHeadline.textContent = selected.name;
      els.overviewText.textContent = `${selected.country} · en la red hace ${membershipDuration(selected.joined)}.`;
      els.overviewThemes.innerHTML = selected.themes.slice(0, 2).map(theme => `<span>${escapeHTML(theme)}</span>`).join("");
    } else {
      els.mapOverviewCard.classList.remove("is-city");
      els.overviewHeadline.textContent = `${filtered.length} ${filtered.length === 1 ? "ciudad visible" : "ciudades visibles"}`;
      els.overviewText.textContent = filtered.length
        ? "Haz clic en un nodo para explorar su ecosistema de conocimiento."
        : "Ajusta los filtros para volver a mostrar nodos de la red.";
      els.overviewThemes.innerHTML = themeFrequency.slice(0, 3).map(item => `<span>${escapeHTML(item.theme)}</span>`).join("");
    }
  }

  function detailHeader(city) {
    return `
      <div class="detail-hero">
        <div class="detail-hero__top">
          <div class="country-lockup"><span class="country-code">${escapeHTML(city.code)}</span>${escapeHTML(city.country)}</div>
          <button class="detail-close" type="button" data-close-detail aria-label="Cerrar ficha">${icon("close")}</button>
        </div>
        <h2>${escapeHTML(city.name)}</h2>
        ${city.locality ? `<p class="detail-locality">${escapeHTML(city.locality)}</p>` : ""}
        <div class="membership-line">Miembro desde ${formatDate(city.joined)} · hace ${membershipDuration(city.joined)}</div>
        <div class="detail-theme-tags">${city.themes.map(theme => `<span>${escapeHTML(theme)}</span>`).join("")}</div>
      </div>
      <div class="detail-commandbar">
        <button class="command-button" type="button" data-action="share">${icon("share")} Compartir</button>
        <button class="command-button" type="button" data-action="export">${icon("download")} Exportar ficha</button>
      </div>
      <div class="detail-tabs" role="tablist" aria-label="Secciones de la ficha">
        ${[
          ["resumen", "Resumen"],
          ["ecosistema", "Ecosistema"],
          ["acciones", "Acciones"],
          ["datos", "Datos y premios"]
        ].map(([id, label]) => `<button class="detail-tab ${state.detailTab === id ? "is-active" : ""}" type="button" role="tab" aria-selected="${state.detailTab === id}" data-detail-tab="${id}">${label}</button>`).join("")}
      </div>`;
  }

  function demoNotice() {
    return `<div class="demo-notice">${icon("info")}<span>Los elementos con sello <strong>Demo</strong> son sintéticos y sirven para probar la estructura del atlas. Los registros <strong>Fuente HUB</strong> provienen del sitio oficial.</span></div>`;
  }

  function renderSummary(city) {
    const index = cities.findIndex(item => item.id === city.id);
    const related = [...relatedCityIds(city.id)].map(id => cityById.get(id));
    const strengths = city.themes.map((theme, themeIndex) => ({
      theme,
      value: Math.max(58, 91 - themeIndex * 12 - (index % 5) * 2)
    }));

    return `
      ${demoNotice()}
      <p class="city-summary">${escapeHTML(city.summary)}</p>
      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-card__icon">${icon("population")}</span>
          <span class="stat-card__copy"><strong>${formatCompact(city.population)}</strong><span>Población demo</span></span>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">${icon("area")}</span>
          <span class="stat-card__copy"><strong>${formatNumber(city.area)} km²</strong><span>Superficie demo</span></span>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">${icon("people")}</span>
          <span class="stat-card__copy"><strong>${city.people.length}</strong><span>Personas vinculadas</span></span>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">${icon("spark")}</span>
          <span class="stat-card__copy"><strong>${actionCount(city)}</strong><span>Acciones registradas</span></span>
        </div>
      </div>

      <section class="section-block">
        <div class="section-heading"><h3>Capacidades destacadas</h3><span>Índice demo</span></div>
        <div class="topic-bars">
          ${strengths.map(item => `
            <div class="topic-bar">
              <div class="topic-bar__label"><span>${escapeHTML(item.theme)}</span><span>${item.value}%</span></div>
              <div class="topic-bar__track"><div class="topic-bar__fill" style="width:${item.value}%"></div></div>
            </div>`).join("")}
        </div>
      </section>

      <div class="collaboration-card">
        <div class="collaboration-card__top"><span>${icon("network")}</span><strong>Conexiones de conocimiento</strong></div>
        <p>${related.length ? `${city.name} comparte temas y aprendizajes con ${related.length} ${related.length === 1 ? "ciudad" : "ciudades"} del mapa.` : "Aún no se han modelado conexiones directas para esta ciudad."}</p>
        <div class="related-cities">
          ${related.map(item => `<button class="related-city-button" type="button" data-related-city="${item.id}">${escapeHTML(item.name)}</button>`).join("")}
        </div>
      </div>`;
  }

  function renderEcosystem(city) {
    return `
      ${demoNotice()}
      <section>
        <div class="section-heading"><h3>Personas y actores</h3><span>${city.people.length} perfiles</span></div>
        <div class="person-list">
          ${city.people.map(person => `
            <article class="person-card">
              <span class="person-avatar">${escapeHTML(person.initials)}</span>
              <span class="person-copy"><strong>${escapeHTML(person.name)}</strong><span>${escapeHTML(person.role)}</span></span>
              ${sourceBadge(person.source)}
            </article>`).join("")}
        </div>
      </section>
      <section class="section-block">
        <div class="section-heading"><h3>Instituciones involucradas</h3><span>${city.institutions.length} nodos</span></div>
        <div class="institution-list">
          ${city.institutions.map(institution => `
            <article class="institution-card">
              <span class="institution-icon">${icon("building")}</span>
              <span class="institution-copy">
                <strong>${escapeHTML(institution.name)}</strong>
                <span>${escapeHTML(institution.type)}</span>
                <em>${escapeHTML(institution.role)}</em>
              </span>
              ${sourceBadge(institution.source)}
            </article>`).join("")}
        </div>
      </section>`;
  }

  function actionCard(item, extra = "") {
    return `
      <article class="action-card">
        <div class="action-card__top">
          <span class="action-copy"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.description)}</p></span>
          ${sourceBadge(item.source)}
        </div>
        <div class="action-meta"><span class="status-badge">${escapeHTML(item.status)}</span>${extra ? `<span>${escapeHTML(extra)}</span>` : ""}</div>
      </article>`;
  }

  function renderActions(city) {
    return `
      ${demoNotice()}
      <div class="action-type-heading"><span>${icon("project")}</span><h3>Proyectos</h3><small>${city.projects.length}</small></div>
      <div class="action-list">${city.projects.map(project => actionCard(project, `Inicio · ${project.year}`)).join("")}</div>

      <div class="action-type-heading"><span>${icon("program")}</span><h3>Programas</h3><small>${city.programs.length}</small></div>
      <div class="action-list">${city.programs.map(program => actionCard(program, `${program.participants} participantes`)).join("")}</div>

      <div class="action-type-heading"><span>${icon("spark")}</span><h3>Iniciativas</h3><small>${city.initiatives.length}</small></div>
      <div class="action-list">${city.initiatives.map(initiative => actionCard(initiative)).join("")}</div>`;
  }

  function renderDataAndAwards(city) {
    const records = [
      ...city.people,
      ...city.institutions,
      ...city.projects,
      ...city.programs,
      ...city.initiatives,
      ...city.awards
    ];
    const verified = records.filter(item => item.source === "hub").length;
    const quality = Math.round((verified / records.length) * 100);
    const density = Math.round(city.population / city.area);

    return `
      ${demoNotice()}
      <div class="quality-card">
        <div class="quality-card__heading"><strong>Nivel de verificación</strong><span>${quality}% verificado</span></div>
        <div class="quality-track"><span style="width:${Math.max(quality, 4)}%"></span></div>
        <p>${verified} de ${records.length} registros de contenido tienen fuente pública vinculada. Los datos base continúan como demostración.</p>
      </div>

      <section class="section-block">
        <div class="section-heading"><h3>Datos base de la ciudad</h3><span>Demostración</span></div>
        <table class="data-table">
          <tbody>
            <tr><th>Población</th><td>${formatNumber(city.population)} hab.</td></tr>
            <tr><th>Superficie</th><td>${formatNumber(city.area)} km²</td></tr>
            <tr><th>Densidad</th><td>${formatNumber(density)} hab./km²</td></tr>
            <tr><th>Elevación</th><td>${formatNumber(city.elevation)} m s. n. m.</td></tr>
            <tr><th>Ingreso a la red</th><td>${formatDate(city.joined, true)}</td></tr>
            <tr><th>Última actualización</th><td>${formatDate(city.updated, true)}</td></tr>
          </tbody>
        </table>
      </section>

      <section class="section-block">
        <div class="section-heading"><h3>Premios y reconocimientos</h3><span>${city.awards.length} registro</span></div>
        <div class="award-list">
          ${city.awards.map(award => `
            <article class="award-card">
              <span class="award-icon">${icon("award")}</span>
              <span><strong>${escapeHTML(award.title)}</strong><p>${escapeHTML(award.organization)} · ${award.year}</p></span>
              ${sourceBadge(award.source)}
            </article>`).join("")}
        </div>
      </section>`;
  }

  function renderGlobalDetail() {
    const actorCount = cities.reduce((sum, city) => sum + city.people.length, 0);
    const actionTotal = cities.reduce((sum, city) => sum + actionCount(city), 0);
    els.detailContent.innerHTML = `
      <div class="global-detail">
        <div class="global-hero">
          <div class="global-hero__icon">${icon("globe")}</div>
          <h2>Una red para aprender entre ciudades</h2>
          <p>Selecciona cualquier nodo del mapa o del directorio para abrir su ficha de conocimiento.</p>
        </div>
        <div class="global-body">
          ${demoNotice()}
          <div class="global-stats">
            <div class="global-stat"><strong>${cities.length}</strong><span>ciudades</span></div>
            <div class="global-stat"><strong>${actorCount}</strong><span>personas</span></div>
            <div class="global-stat"><strong>${actionTotal}</strong><span>acciones</span></div>
          </div>
          <section class="section-block">
            <div class="section-heading"><h3>Cómo explorar</h3><span>3 pasos</span></div>
            <ol class="onboarding-list">
              <li><b>01</b><span><strong>Filtra el territorio</strong><span>Busca por país, tema, persona o proyecto.</span></span></li>
              <li><b>02</b><span><strong>Abre una ciudad</strong><span>Consulta datos base, tiempo en la red y capacidades.</span></span></li>
              <li><b>03</b><span><strong>Sigue sus conexiones</strong><span>Descubre actores, instituciones y acciones relacionadas.</span></span></li>
            </ol>
          </section>
          <section class="section-block">
            <div class="section-heading"><h3>Temas más compartidos</h3><span>Red completa</span></div>
            <div class="topic-bars">
              ${themeFrequency.slice(0, 5).map((item, index) => `
                <div class="topic-bar">
                  <div class="topic-bar__label"><span>${escapeHTML(item.theme)}</span><span>${item.count} ciudades</span></div>
                  <div class="topic-bar__track"><div class="topic-bar__fill" style="width:${Math.round((item.count / themeFrequency[0].count) * (92 - index * 3))}%"></div></div>
                </div>`).join("")}
            </div>
          </section>
        </div>
      </div>`;
  }

  function renderDetail() {
    const city = state.selectedId ? cityById.get(state.selectedId) : null;
    if (!city) {
      renderGlobalDetail();
      els.detailPanel.classList.remove("is-open");
      updateBackdrop();
      return;
    }

    const content = {
      resumen: () => renderSummary(city),
      ecosistema: () => renderEcosystem(city),
      acciones: () => renderActions(city),
      datos: () => renderDataAndAwards(city)
    }[state.detailTab]();

    els.detailContent.innerHTML = `${detailHeader(city)}<div class="detail-body">${content}</div>`;
    els.detailPanel.scrollTop = 0;
    els.detailPanel.classList.add("is-open");

    els.detailContent.querySelector("[data-close-detail]")?.addEventListener("click", closeDetail);
    els.detailContent.querySelectorAll("[data-detail-tab]").forEach(button => {
      button.addEventListener("click", () => {
        state.detailTab = button.dataset.detailTab;
        renderDetail();
      });
    });
    els.detailContent.querySelector("[data-action='share']")?.addEventListener("click", () => shareCity(city));
    els.detailContent.querySelector("[data-action='export']")?.addEventListener("click", () => exportCity(city));
    els.detailContent.querySelectorAll("[data-related-city]").forEach(button => {
      button.addEventListener("click", () => selectCity(button.dataset.relatedCity));
    });

    updateBackdrop();
  }

  function selectCity(id, { updateHash = true } = {}) {
    if (!cityById.has(id)) return;
    state.selectedId = id;
    state.detailTab = "resumen";
    if (updateHash) replaceCityHash(id);
    applyFilters({ preserveSelection: true });
    hideTooltip();

    const listItem = els.cityList.querySelector(`[data-city-id="${CSS.escape(id)}"]`);
    listItem?.scrollIntoView({ block: "nearest", behavior: "smooth" });

    if (window.innerWidth <= 700) {
      els.explorerPanel.classList.remove("is-open");
    }
    updateBackdrop();
  }

  function closeDetail() {
    state.selectedId = null;
    state.detailTab = "resumen";
    replaceCityHash(null);
    applyFilters({ preserveSelection: true });
  }

  function replaceCityHash(id) {
    const next = id ? `#ciudad=${encodeURIComponent(id)}` : `${location.pathname}${location.search}`;
    history.replaceState(null, "", next);
  }

  async function shareCity(city) {
    const url = `${location.origin}${location.pathname}#ciudad=${encodeURIComponent(city.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${city.name} · Atlas HUB`, text: `Explora la ficha de ${city.name} en el Atlas HUB.`, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Enlace de la ciudad copiado.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("No fue posible compartir; copia la URL del navegador.");
    }
  }

  function exportCity(city) {
    const exportData = {
      meta: {
        aviso: "Prototipo: combina registros del HUB con contenido de demostración.",
        fuente_directorio: atlas.sources.directory,
        exportado_el: atlas.referenceDate
      },
      ciudad: {
        nombre: city.name,
        localidad: city.locality || null,
        pais: city.country,
        coordenadas: { latitud: city.lat, longitud: city.lon },
        miembro_desde: city.joined,
        tiempo_en_la_red: membershipDuration(city.joined),
        datos_base_demo: {
          poblacion: city.population,
          superficie_km2: city.area,
          elevacion_m: city.elevation
        },
        temas: city.themes,
        personas: city.people,
        instituciones: city.institutions,
        proyectos: city.projects,
        programas: city.programs,
        iniciativas: city.initiatives,
        premios: city.awards
      }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atlas-hub-${city.id}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast("Ficha exportada en formato JSON.");
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
  }

  function setViewBox() {
    els.networkMap.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
  }

  function clampView(next) {
    next.width = Math.min(baseView.width, Math.max(250, next.width));
    next.height = next.width * (baseView.height / baseView.width);
    if (next.height > baseView.height) {
      next.height = baseView.height;
      next.width = next.height * (baseView.width / baseView.height);
    }
    next.x = Math.min(baseView.width - next.width, Math.max(0, next.x));
    next.y = Math.min(baseView.height - next.height, Math.max(0, next.y));
    return next;
  }

  function zoomMap(factor, clientPoint = null) {
    const rect = els.networkMap.getBoundingClientRect();
    const px = clientPoint ? (clientPoint.x - rect.left) / rect.width : 0.5;
    const py = clientPoint ? (clientPoint.y - rect.top) / rect.height : 0.5;
    const focusX = view.x + px * view.width;
    const focusY = view.y + py * view.height;
    const nextWidth = view.width * factor;
    const nextHeight = view.height * factor;
    view = clampView({
      x: focusX - px * nextWidth,
      y: focusY - py * nextHeight,
      width: nextWidth,
      height: nextHeight
    });
    setViewBox();
  }

  function resetMap() {
    view = { ...baseView };
    setViewBox();
  }

  function updateBackdrop() {
    const filtersOpen = els.explorerPanel.classList.contains("is-open") && window.innerWidth <= 700;
    const detailsOpen = Boolean(state.selectedId) && window.innerWidth <= 1120;
    els.mobileBackdrop.hidden = !(filtersOpen || detailsOpen);
  }

  function openFilters() {
    els.explorerPanel.classList.add("is-open");
    updateBackdrop();
    setTimeout(() => els.citySearch.focus(), 180);
  }

  function closeFilters() {
    els.explorerPanel.classList.remove("is-open");
    updateBackdrop();
  }

  function wireEvents() {
    let searchDebounce;
    els.citySearch.addEventListener("input", event => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.search = event.target.value;
        applyFilters();
      }, 90);
    });

    els.countryFilter.addEventListener("change", event => {
      state.country = event.target.value;
      applyFilters();
    });

    els.themeChips.addEventListener("click", event => {
      const button = event.target.closest("[data-theme]");
      if (!button) return;
      state.theme = button.dataset.theme;
      applyFilters();
    });

    els.clearFilters.addEventListener("click", clearFilters);
    els.sortButton.addEventListener("click", () => {
      state.reverseSort = !state.reverseSort;
      els.sortButton.classList.toggle("is-reversed", state.reverseSort);
      applyFilters({ preserveSelection: true });
    });

    els.connectionsToggle.addEventListener("click", () => {
      state.connectionsVisible = !state.connectionsVisible;
      els.connectionsToggle.classList.toggle("toolbar-button--active", state.connectionsVisible);
      els.connectionsToggle.setAttribute("aria-pressed", String(state.connectionsVisible));
      els.connectionLayer.classList.toggle("is-hidden", !state.connectionsVisible);
    });

    els.zoomIn.addEventListener("click", () => zoomMap(0.8));
    els.zoomOut.addEventListener("click", () => zoomMap(1.25));
    els.zoomHome.addEventListener("click", resetMap);
    els.resetMapButton.addEventListener("click", () => {
      clearFilters();
      resetMap();
      showToast("Mapa y filtros restablecidos.");
    });

    els.networkMap.addEventListener("wheel", event => {
      event.preventDefault();
      zoomMap(event.deltaY > 0 ? 1.12 : 0.89, { x: event.clientX, y: event.clientY });
    }, { passive: false });

    els.networkMap.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.target.closest(".city-marker")) return;
      drag = {
        startX: event.clientX,
        startY: event.clientY,
        viewX: view.x,
        viewY: view.y,
        moved: false
      };
      state.suppressClick = false;
      els.networkMap.classList.add("is-dragging");
      els.networkMap.setPointerCapture(event.pointerId);
    });

    els.networkMap.addEventListener("pointermove", event => {
      if (!drag) return;
      const rect = els.networkMap.getBoundingClientRect();
      const dx = ((event.clientX - drag.startX) / rect.width) * view.width;
      const dy = ((event.clientY - drag.startY) / rect.height) * view.height;
      if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 4) drag.moved = true;
      view = clampView({ ...view, x: drag.viewX - dx, y: drag.viewY - dy });
      setViewBox();
    });

    const endDrag = event => {
      if (!drag) return;
      state.suppressClick = drag.moved;
      drag = null;
      els.networkMap.classList.remove("is-dragging");
      try { els.networkMap.releasePointerCapture(event.pointerId); } catch (_) {}
      setTimeout(() => { state.suppressClick = false; }, 0);
    };
    els.networkMap.addEventListener("pointerup", endDrag);
    els.networkMap.addEventListener("pointercancel", endDrag);

    els.openFiltersButton.addEventListener("click", openFilters);
    els.mobileResultsButton.addEventListener("click", openFilters);
    els.closeFiltersButton.addEventListener("click", closeFilters);
    els.mobileBackdrop.addEventListener("click", () => {
      closeFilters();
      if (window.innerWidth <= 1120 && state.selectedId) closeDetail();
    });

    document.querySelectorAll("[data-open-method]").forEach(button => {
      button.addEventListener("click", () => els.methodDialog.showModal());
    });

    document.querySelector(".brand").addEventListener("click", event => {
      event.preventDefault();
      clearFilters();
      state.selectedId = null;
      replaceCityHash(null);
      resetMap();
      renderDetail();
      renderMapState(getFilteredCities());
    });

    document.querySelector("[data-nav='mapa']")?.addEventListener("click", () => {
      resetMap();
      closeFilters();
      showToast("Vista cartográfica activa.");
    });

    document.querySelector("[data-nav='directorio']")?.addEventListener("click", () => {
      if (window.innerWidth <= 700) openFilters();
      else els.citySearch.focus();
    });

    document.addEventListener("keydown", event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.innerWidth <= 700) openFilters();
        else els.citySearch.focus();
      }
      if (event.key === "Escape") {
        if (els.explorerPanel.classList.contains("is-open")) closeFilters();
        else if (window.innerWidth <= 1120 && state.selectedId) closeDetail();
      }
    });

    window.addEventListener("hashchange", () => {
      const id = new URLSearchParams(location.hash.replace(/^#/, "")).get("ciudad");
      if (cityById.has(id)) selectCity(id, { updateHash: false });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 700) els.explorerPanel.classList.remove("is-open");
      if (window.innerWidth > 1120) els.detailPanel.classList.toggle("is-open", Boolean(state.selectedId));
      updateBackdrop();
    });
  }

  function init() {
    populateFilters();
    updateKpis();
    wireEvents();
    buildMap();
    applyFilters({ preserveSelection: true });
    setViewBox();
  }

  init();
})();
