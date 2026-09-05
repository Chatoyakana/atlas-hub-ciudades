(() => {
  "use strict";

  const atlas = window.HUB_ATLAS;
  const cities = atlas.cities;
  const metros = atlas.metros || [];
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
    countryLabelLayer: document.getElementById("countryLabelLayer"),
    connectionLayer: document.getElementById("connectionLayer"),
    markerLayer: document.getElementById("markerLayer"),
    metroLayer: document.getElementById("metroLayer"),
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
    toast: document.getElementById("toast"),
    statusAnnouncer: document.getElementById("statusAnnouncer"),
    sortLabel: document.getElementById("sortLabel"),
    shareFallback: document.getElementById("shareFallback"),
    shareUrl: document.getElementById("shareUrl"),
    shareFallbackClose: document.getElementById("shareFallbackClose"),
    workspace: document.querySelector(".workspace"),
    directoryView: document.getElementById("directoryView"),
    directoryBody: document.getElementById("directoryBody"),
    directoryCount: document.getElementById("directoryCount"),
    directoryEmpty: document.getElementById("directoryEmpty"),
    directoryClose: document.getElementById("directoryClose"),
    entityDialog: document.getElementById("entityDialog"),
    entityCard: document.getElementById("entityCard"),
    printSheet: document.getElementById("printSheet"),
    openDirectoryButton: document.getElementById("openDirectoryButton")
  };

  const allThemes = [...new Set(cities.flatMap(city => city.themes))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
  const allCountries = [...new Set(cities.map(city => city.country))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
  const memberCountries = new Set(allCountries);
  const themeFrequency = allThemes
    .map(theme => ({ theme, count: cities.filter(city => city.themes.includes(theme)).length }))
    .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme, "es"));

  const hashCity = new URLSearchParams(location.hash.replace(/^#/, "")).get("ciudad");
  const openedFromLink = cityById.has(hashCity);
  const state = {
    selectedId: cityById.has(hashCity) ? hashCity : window.innerWidth > 1120 ? "medellin" : null,
    search: "",
    country: "all",
    theme: "all",
    reverseSort: false,
    detailTab: "resumen",
    connectionsVisible: true,
    filteredIds: new Set(cities.map(city => city.id)),
    suppressClick: false,
    filtersOpener: null,
    detailOpener: null,
    directoryOpen: false
  };

  // Ciudad -> área metropolitana a la que pertenece, para saber cuáles se
  // ocultan tras un nodo agrupado mientras el mapa está alejado.
  const metroByCity = new Map();
  metros.forEach(metro => metro.members.forEach(id => metroByCity.set(id, metro)));

  // Por debajo de este ancho de viewBox el mapa se considera "acercado" y los
  // grupos se abren. baseView.width ronda 672 con el encuadre calculado.
  // Cuánto se puede acercar respecto al mapa completo. Con el tope anterior
  // —2,7x— un solo pellizco ya lo agotaba y el gesto se quedaba muerto.
  const MAX_ZOOM = 8;
  const METRO_EXPAND_WIDTH = 430;
  // Nivel al que se acerca el mapa al seleccionar una ciudad.
  const FOCUS_WIDTH = 300;

  // Índice plano de todas las entidades: personas, instituciones, proyectos,
  // programas, iniciativas y premios. Es lo que permite abrir cualquiera desde
  // cualquier sitio con solo su identificador.
  const entityById = new Map();
  cities.forEach(city => {
    [
      ...city.people,
      ...city.institutions,
      ...city.projects,
      ...city.programs,
      ...city.initiatives,
      ...city.awards
    ].forEach(entity => entityById.set(entity.id, entity));
  });

  const svgNS = "http://www.w3.org/2000/svg";
  const baseView = { x: 0, y: 0, width: 860, height: 760 };
  let view = { ...baseView };
  let drag = null;
  let toastTimer = null;
  let announceTimer = null;
  let mapFeatures = [];
  let focusAnimation = 0;
  let lastExpandedState = false;
  let labelRelayout = 0;

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
      users:
        '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 9a2.5 2.5 0 0 1 0 5M17 17.5a4.5 4.5 0 0 1 4 1.5"/>',
      building: '<path d="M4 21V7l8-4 8 4v14M8 10h2M14 10h2M8 14h2M14 14h2M9 21v-3h6v3"/>',
      project: '<path d="M4 7h7l2 2h7v10H4V7Z"/><path d="M4 10h16"/>',
      program: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
      spark:
        '<path d="m12 3 1.5 4.2L18 9l-4.5 1.8L12 15l-1.5-4.2L6 9l4.5-1.8L12 3Z"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/>',
      people:
        '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M14 19a4 4 0 0 1 8 0"/>',
      population:
        '<path d="M3 21V9l6-4v4l6-4v16"/><path d="M15 21V11l6 3v7M3 21h18"/><path d="M6 13h1.5M6 17h1.5M11 13h1.5M11 17h1.5"/>',
      area: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
      mountain: '<path d="m3 20 6.5-11 3.3 5 2.4-4L21 20H3Z"/><path d="m7.7 12 1.8 2 1.6-1.9"/>',
      density:
        '<circle cx="7" cy="7" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 7h6M7 9v6M17 9v6M9 17h6"/>',
      network:
        '<circle cx="6" cy="7" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="m8 7 8-.7M7 9l4 7M17 8l-4 8"/>',
      download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
      share:
        '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      award:
        '<circle cx="12" cy="8" r="5"/><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9"/><path d="m10 8 1.3 1.2L14 6.5"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
      globe:
        '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'
    };
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }

  function sourceBadge(source) {
    const isHub = source === "hub";
    return `<span class="source-badge source-badge--${isHub ? "hub" : "demo"}" title="${isHub ? "Registro publicado en el sitio del HUB" : "Contenido sintético de demostración"}">${isHub ? "Fuente HUB" : "Demo"}</span>`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value);
  }

  function formatCompact(value) {
    return new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  }

  function formatDate(dateValue, includeDay = false) {
    const date = new Date(`${dateValue}T12:00:00`);
    return new Intl.DateTimeFormat(
      "es-CO",
      includeDay ? { day: "numeric", month: "long", year: "numeric" } : { month: "long", year: "numeric" }
    ).format(date);
  }

  function membershipDuration(dateValue) {
    const start = new Date(`${dateValue}T12:00:00`);
    let months =
      (referenceDate.getFullYear() - start.getFullYear()) * 12 + referenceDate.getMonth() - start.getMonth();
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

  // D-05: antes esto se recalculaba para cada ciudad en cada tecla escrita.
  const searchIndex = new Map();

  function searchableText(city) {
    const cached = searchIndex.get(city.id);
    if (cached !== undefined) return cached;
    const text = buildSearchableText(city);
    searchIndex.set(city.id, text);
    return text;
  }

  function buildSearchableText(city) {
    return normalize(
      [
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
      ]
        .filter(Boolean)
        .join(" ")
    );
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
      allCountries
        .map(country => `<option value="${escapeHTML(country)}">${escapeHTML(country)}</option>`)
        .join("")
    );

    els.themeChips.innerHTML = [
      `<button type="button" class="theme-chip is-active" data-theme="all">Todos</button>`,
      ...themeFrequency.map(
        ({ theme, count }) =>
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

    els.cityList.innerHTML = filtered
      .map(
        city => `
      <button class="city-item ${state.selectedId === city.id ? "is-selected" : ""}" type="button" data-city-id="${escapeHTML(city.id)}"${state.selectedId === city.id ? ' aria-current="true"' : ""}>
        <span class="city-item__marker">${escapeHTML(city.code)}</span>
        <span class="city-item__copy">
          <strong>${escapeHTML(city.name)}</strong>
          <span>${escapeHTML(city.locality ? `${city.locality} · ${city.country}` : city.country)} · ${city.people.length} personas</span>
        </span>
        <span class="city-item__count" title="${actionCount(city)} acciones registradas">${actionCount(city)}</span>
      </button>
    `
      )
      .join("");

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
    if (state.directoryOpen) renderDirectory();
    renderThemeChips();
    renderMapState(filtered);
    renderDetail();

    const hasFilters = Boolean(state.search) || state.country !== "all" || state.theme !== "all";
    els.clearFilters.disabled = !hasFilters;
    els.mapSubtitle.textContent = filtered.length
      ? `${filtered.length} ${filtered.length === 1 ? "nodo visible" : "nodos visibles"} · selecciona una ciudad para abrir su ficha`
      : "No hay nodos que coincidan con los filtros";
  }

  // N-03: antes el control solo alternaba una clase, asi que ni a la vista ni
  // a un lector de pantalla se podia saber en que orden estaba la lista.
  function updateSortControl() {
    const label = state.reverseSort ? "Z–A" : "A–Z";
    const description = `Ordenar por país, de la ${state.reverseSort ? "Z a la A" : "A a la Z"}`;
    if (els.sortLabel) els.sortLabel.textContent = label;
    els.sortButton.setAttribute("aria-pressed", String(state.reverseSort));
    els.sortButton.setAttribute("aria-label", description);
    els.sortButton.setAttribute("title", description);
  }

  function clearFilters() {
    state.search = "";
    state.country = "all";
    state.theme = "all";
    els.citySearch.value = "";
    els.countryFilter.value = "all";
    applyFilters({ preserveSelection: true });
  }

  // M-02: antes se mapeaba lon/lat al lienzo con una regla de tres sobre una
  // caja fija. Eso estiraba el area hacia los extremos y dejaba fuera, sin
  // aviso, cualquier coordenada ajena al encuadre codificado a mano.
  //
  // Lambert azimutal equiareal: conserva las areas relativas y se comporta bien
  // en una region compacta que cruza el ecuador, como America Latina y el
  // Caribe. Se implementa aqui —son doce lineas de trigonometria— para no
  // introducir la primera dependencia del proyecto.
  const PROJECTION_CENTER = { lon: -74, lat: -9 };
  const DEG = Math.PI / 180;
  const VIEW_PADDING = 26;

  function laea([lon, lat]) {
    const lon0 = PROJECTION_CENTER.lon * DEG;
    const lat0 = PROJECTION_CENTER.lat * DEG;
    const phi = lat * DEG;
    const dLambda = lon * DEG - lon0;
    const denominator =
      1 + Math.sin(lat0) * Math.sin(phi) + Math.cos(lat0) * Math.cos(phi) * Math.cos(dLambda);
    const k = Math.sqrt(2 / Math.max(denominator, 1e-9));
    return [
      k * Math.cos(phi) * Math.sin(dLambda),
      k * (Math.cos(lat0) * Math.sin(phi) - Math.sin(lat0) * Math.cos(phi) * Math.cos(dLambda))
    ];
  }

  // El encuadre se deriva de lo que hay que dibujar, no de constantes: asi una
  // ciudad o una geometria nuevas reencuadran el mapa en vez de salirse de el.
  // El lienzo se recorta al contenido —America Latina proyectada a area igual
  // es mas alta que ancha— para que el SVG no reserve franjas vacias a los
  // lados; preserveAspectRatio ya lo centra dentro de su contenedor.
  const MAX_CANVAS = { width: 860, height: 760 };

  function computeFit(coordinates) {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    coordinates.forEach(coordinate => {
      const [x, y] = laea(coordinate);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
    const spanX = Math.max(maxX - minX, 1e-9);
    const spanY = Math.max(maxY - minY, 1e-9);
    const scale = Math.min(
      (MAX_CANVAS.width - VIEW_PADDING * 2) / spanX,
      (MAX_CANVAS.height - VIEW_PADDING * 2) / spanY
    );
    return {
      scale,
      canvasWidth: Math.round(spanX * scale + VIEW_PADDING * 2),
      canvasHeight: Math.round(spanY * scale + VIEW_PADDING * 2),
      tx: VIEW_PADDING - minX * scale,
      // La y de la proyeccion crece hacia el norte y la del SVG hacia abajo.
      ty: VIEW_PADDING + maxY * scale
    };
  }

  function applyFit(nextFit) {
    fit = nextFit;
    baseView.width = nextFit.canvasWidth;
    baseView.height = nextFit.canvasHeight;
    view = { ...baseView };
    setViewBox();
  }

  function collectCoordinates(features) {
    const coordinates = cities.map(city => [city.lon, city.lat]);
    features.forEach(feature => {
      const polygons =
        feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
      polygons.forEach(polygon =>
        polygon.forEach(ring =>
          ring.forEach(coordinate => {
            coordinates.push(coordinate);
          })
        )
      );
    });
    return coordinates;
  }

  // Encuadre provisional con las ciudades, sustituido en cuanto llega la
  // geometria; garantiza que project() nunca se llame sin un fit valido.
  let fit = computeFit(cities.map(city => [city.lon, city.lat]));

  function project(coordinate) {
    const [x, y] = laea(coordinate);
    return [fit.tx + x * fit.scale, fit.ty - y * fit.scale];
  }

  // Dos nodos que caen a menos de CLUSTER_GAP px son indistinguibles a esta escala
  // (las tres comunas de Santiago quedan a ~1 px entre si), asi que el grupo se
  // despliega en abanico con linea guia en vez de calibrar cada offset a mano.
  const CLUSTER_GAP = 15;
  const SPREAD_RADIUS = 27;

  function computeMarkerOffsets() {
    const base = cities.map(city => {
      const [x, y] = project([city.lon, city.lat]);
      return { id: city.id, x, y };
    });

    const parent = base.map((_, index) => index);
    const find = index => (parent[index] === index ? index : (parent[index] = find(parent[index])));
    for (let i = 0; i < base.length; i++) {
      for (let j = i + 1; j < base.length; j++) {
        if (Math.hypot(base[i].x - base[j].x, base[i].y - base[j].y) >= CLUSTER_GAP) continue;
        const rootI = find(i);
        const rootJ = find(j);
        if (rootI !== rootJ) parent[rootJ] = rootI;
      }
    }

    const groups = new Map();
    base.forEach((_, index) => {
      const root = find(index);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(index);
    });

    const offsets = new Map();
    groups.forEach(members => {
      if (members.length === 1) {
        offsets.set(base[members[0]].id, [0, 0]);
        return;
      }
      const cx = members.reduce((sum, index) => sum + base[index].x, 0) / members.length;
      const cy = members.reduce((sum, index) => sum + base[index].y, 0) / members.length;
      // Ordenar por angulo real conserva la disposicion geografica dentro del abanico.
      const ordered = [...members].sort(
        (a, b) =>
          Math.atan2(base[a].y - cy, base[a].x - cx) - Math.atan2(base[b].y - cy, base[b].x - cx) ||
          base[a].id.localeCompare(base[b].id)
      );
      const radius = SPREAD_RADIUS + (ordered.length - 2) * 6;
      ordered.forEach((index, position) => {
        const angle = -Math.PI / 2 + (position / ordered.length) * Math.PI * 2;
        offsets.set(base[index].id, [
          cx + Math.cos(angle) * radius - base[index].x,
          cy + Math.sin(angle) * radius - base[index].y
        ]);
      });
    });
    return offsets;
  }

  let markerOffsets = computeMarkerOffsets();

  function markerPosition(city) {
    const [x, y] = project([city.lon, city.lat]);
    const [dx, dy] = markerOffsets.get(city.id) || [0, 0];
    return { anchorX: x, anchorY: y, x: x + dx, y: y + dy };
  }

  function geometryToPath(geometry) {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    return polygons
      .map(polygon =>
        polygon
          .map(
            ring =>
              ring
                .map((coord, index) => {
                  const [x, y] = project(coord);
                  return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ") + " Z"
          )
          .join(" ")
      )
      .join(" ");
  }

  function createSvg(tag, attributes = {}) {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  // M-02: la geometria se carga antes de dibujar porque el encuadre se calcula
  // a partir de ella. Si falla, se encuadra solo con las ciudades y el mapa
  // sigue siendo utilizable.
  async function buildMap() {
    try {
      const response = await fetch("data/latam-countries.geojson");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const geojson = await response.json();
      mapFeatures = geojson.features;
    } catch (error) {
      console.warn("No fue posible cargar la capa cartográfica:", error);
      showToast("La capa de países no pudo cargarse; los nodos siguen disponibles.");
    }

    applyFit(computeFit(collectCoordinates(mapFeatures)));
    warnAboutStrayCities();
    markerOffsets = computeMarkerOffsets();

    if (mapFeatures.length) {
      buildCountries();
      buildCountryLabels();
    }
    buildConnections();
    buildMarkers();
    buildMetroMarkers();
    // Después de ambos: las etiquetas de ciudad y de grupo compiten por el
    // mismo espacio, así que se colocan en una sola pasada.
    layoutLabels();
    // Las métricas de texto cambian cuando termina de cargar la tipografía.
    document.fonts?.ready.then(layoutLabels);
    // Conexiones y nodos por encima de los paises.
    els.networkMap
      .querySelector("#mapViewport")
      .append(els.countryLayer, els.countryLabelLayer, els.connectionLayer, els.markerLayer, els.metroLayer);
    renderMapState(getFilteredCities());

    // Quien llega por enlace directo a una ciudad la encuentra ya centrada;
    // sin animación, porque no hay un estado previo del que venir.
    if (openedFromLink && state.selectedId) {
      const city = cityById.get(state.selectedId);
      const width = metroByCity.has(city.id) ? 280 : FOCUS_WIDTH;
      const height = width * (baseView.height / baseView.width);
      const [x, y] = project([city.lon, city.lat]);
      view = clampView({ x: x - width / 2, y: y - height / 2, width, height });
      setViewBoxAndSync();
    }
  }

  // M-02: avisar en vez de dibujar en silencio una ciudad fuera de la region.
  function warnAboutStrayCities() {
    if (!mapFeatures.length) return;
    let minLon = Infinity,
      maxLon = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;
    mapFeatures.forEach(feature => {
      const box = feature.bbox;
      if (!box) return;
      minLon = Math.min(minLon, box[0]);
      minLat = Math.min(minLat, box[1]);
      maxLon = Math.max(maxLon, box[2]);
      maxLat = Math.max(maxLat, box[3]);
    });
    if (!Number.isFinite(minLon)) return;
    const stray = cities.filter(
      city => city.lon < minLon || city.lon > maxLon || city.lat < minLat || city.lat > maxLat
    );
    if (stray.length) {
      console.warn(
        "Ciudades fuera de la región cartografiada; el mapa se reencuadró para incluirlas:",
        stray.map(city => `${city.name} (${city.lat}, ${city.lon})`).join(", ")
      );
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
        "aria-label": memberCountries.has(countryName) ? `Filtrar ciudades de ${countryName}` : countryName
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

  // --- Nombres de país -----------------------------------------------------
  //
  // El anillo exterior del polígono de mayor área da el centroide de área, que
  // para casi todos los países de la región cae dentro del territorio. Cuando
  // no —países cóncavos o archipiélagos— se descarta la etiqueta antes que
  // dibujarla en el mar.

  function ringArea(ring) {
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
    }
    return Math.abs(area / 2);
  }

  function ringCentroid(ring) {
    let twiceArea = 0;
    let x = 0;
    let y = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      twiceArea += cross;
      x += (ring[j][0] + ring[i][0]) * cross;
      y += (ring[j][1] + ring[i][1]) * cross;
    }
    if (!twiceArea) return null;
    return [x / (3 * twiceArea), y / (3 * twiceArea)];
  }

  function pointInRing(point, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const cruza =
        yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
      if (cruza) inside = !inside;
    }
    return inside;
  }

  function largestRing(geometry) {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    let mayor = null;
    let mayorArea = 0;
    polygons.forEach(polygon => {
      const ring = polygon[0];
      const area = ringArea(ring);
      if (area > mayorArea) {
        mayorArea = area;
        mayor = ring;
      }
    });
    return mayor;
  }

  function buildCountryLabels() {
    els.countryLabelLayer.innerHTML = "";
    mapFeatures.forEach(feature => {
      const ring = largestRing(feature.geometry);
      if (!ring) return;
      const centro = ringCentroid(ring);
      if (!centro || !pointInRing(centro, ring)) return;

      const [x, y] = project(centro);
      const puntos = ring.map(coord => project(coord));
      const xs = puntos.map(punto => punto[0]);
      const ys = puntos.map(punto => punto[1]);
      const anchoPais = Math.max(...xs) - Math.min(...xs);
      const altoPais = Math.max(...ys) - Math.min(...ys);

      const label = createSvg("text", {
        x: x.toFixed(1),
        y: y.toFixed(1),
        "text-anchor": "middle",
        class: `country-label ${memberCountries.has(feature.properties.name) ? "is-member" : ""}`,
        "data-country-label": feature.properties.name,
        "data-country-width": anchoPais.toFixed(1),
        "data-country-height": altoPais.toFixed(1),
        "data-country-area": (anchoPais * altoPais).toFixed(0)
      });
      label.textContent = feature.properties.name;
      els.countryLabelLayer.appendChild(label);
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

  // Posiciones candidatas alrededor del nodo, de la mas legible a la menos.
  const LABEL_CANDIDATES = [
    { dx: 15, dy: 4, anchor: "start" },
    { dx: -15, dy: 4, anchor: "end" },
    { dx: 15, dy: -10, anchor: "start" },
    { dx: -15, dy: -10, anchor: "end" },
    { dx: 15, dy: 17, anchor: "start" },
    { dx: -15, dy: 17, anchor: "end" },
    { dx: 0, dy: -15, anchor: "middle" },
    { dx: 0, dy: 23, anchor: "middle" }
  ];
  const LABEL_HEIGHT = 11;
  const NODE_RADIUS = 11.5;
  const METRO_RADIUS = 16;

  function overlapArea(a, b) {
    const width = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
    const height = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
    return width > 0 && height > 0 ? width * height : 0;
  }

  function labelBox(pos, candidate, width) {
    const x = pos.x + candidate.dx;
    const y = pos.y + candidate.dy;
    const left = candidate.anchor === "start" ? x : candidate.anchor === "end" ? x - width : x - width / 2;
    return { x1: left - 2, y1: y - LABEL_HEIGHT, x2: left + width + 2, y2: y + 3 };
  }

  function labelCost(box, placed, nodes) {
    let cost = 0;
    if (box.x1 < 2 || box.x2 > baseView.width - 2 || box.y1 < 2 || box.y2 > baseView.height - 2) {
      cost += 400;
    }
    // Chocar con otra etiqueta se penaliza mas que rozar un nodo: dos textos
    // superpuestos son ilegibles, un texto sobre un circulo todavia se lee.
    placed.forEach(other => {
      cost += overlapArea(box, other) * 3;
    });
    nodes.forEach(node => {
      cost += overlapArea(box, node);
    });
    return cost;
  }

  // Coloca las etiquetas evitando cajas ya ocupadas. Las ciudades con mas
  // acciones eligen primero, de modo que las densas conservan la mejor posicion.
  function layoutLabels() {
    const nodeBox = (x, y, radius) => ({
      x1: x - radius,
      y1: y - radius,
      x2: x + radius,
      y2: y + radius
    });

    const nodes = cities.map(city => {
      const pos = markerPosition(city);
      return nodeBox(pos.x, pos.y, NODE_RADIUS);
    });
    metros.forEach(metro => {
      const [x, y] = project([metro.lon, metro.lat]);
      nodes.push(nodeBox(x, y, METRO_RADIUS));
    });

    const placed = [];

    // Los grupos metropolitanos eligen primero: son los que se ven mientras el
    // mapa está alejado, que es el estado en el que se lee el mapa completo.
    const targets = [
      ...metros.map(metro => {
        const [x, y] = project([metro.lon, metro.lat]);
        return {
          label: els.metroLayer.querySelector(`[data-metro-id="${CSS.escape(metro.id)}"] .city-label`),
          pos: { x, y }
        };
      }),
      ...[...cities]
        .sort((a, b) => actionCount(b) - actionCount(a) || a.name.localeCompare(b.name, "es"))
        .map(city => ({
          label: els.markerLayer.querySelector(`[data-marker-id="${CSS.escape(city.id)}"] .city-label`),
          pos: markerPosition(city)
        }))
    ];

    targets.forEach(({ label, pos }) => {
      if (!label) return;
      let width;
      try {
        width = label.getComputedTextLength() || 0;
      } catch {
        width = 0;
      }
      if (!width) width = label.textContent.length * 5.2;

      let best = null;
      for (const candidate of LABEL_CANDIDATES) {
        const box = labelBox(pos, candidate, width);
        const cost = labelCost(box, placed, nodes);
        if (!best || cost < best.cost) best = { candidate, box, cost };
        if (cost === 0) break;
      }

      label.setAttribute("x", (pos.x + best.candidate.dx).toFixed(1));
      label.setAttribute("y", (pos.y + best.candidate.dy).toFixed(1));
      label.setAttribute("text-anchor", best.candidate.anchor);
      placed.push(best.box);
    });

    layoutCountryLabels(placed);
  }

  // Cajas que ocupan ahora mismo las etiquetas ya colocadas de ciudades y
  // grupos, junto con los nodos. Al cambiar el zoom solo se recalculan los
  // nombres de país: mover las etiquetas de ciudad haría que saltaran mientras
  // el usuario acerca o desplaza el mapa.
  function occupiedBoxes() {
    const zoom = view.width / baseView.width;
    const alto = LABEL_HEIGHT * zoom;
    const boxes = cities.map(city => {
      const pos = markerPosition(city);
      return {
        x1: pos.x - NODE_RADIUS,
        y1: pos.y - NODE_RADIUS,
        x2: pos.x + NODE_RADIUS,
        y2: pos.y + NODE_RADIUS
      };
    });
    metros.forEach(metro => {
      const [x, y] = project([metro.lon, metro.lat]);
      boxes.push({ x1: x - METRO_RADIUS, y1: y - METRO_RADIUS, x2: x + METRO_RADIUS, y2: y + METRO_RADIUS });
    });

    els.networkMap.querySelectorAll(".city-marker .city-label, .metro-marker .city-label").forEach(label => {
      const grupo = label.closest("g");
      if (grupo && getComputedStyle(grupo).display === "none") return;
      const x = Number(label.getAttribute("x"));
      const y = Number(label.getAttribute("y"));
      const anchor = label.getAttribute("text-anchor");
      let width;
      try {
        width = label.getComputedTextLength() || 0;
      } catch {
        width = 0;
      }
      if (!width) width = label.textContent.length * 5.2 * zoom;
      const left = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
      boxes.push({ x1: left - 2, y1: y - alto, x2: left + width + 2, y2: y + 3 });
    });

    return boxes;
  }

  // Los nombres de país se resuelven al final, así que ceden ante las etiquetas
  // de ciudad y de grupo, que son el contenido del atlas. Ceden solo ante
  // ellas: pasar por detrás de un nodo no impide leer un rótulo tenue, y
  // tratar los nodos como obstáculo dejaba sin nombre justo a los países con
  // ciudades en la red, que son los que más importa nombrar.
  //
  // Tampoco se exige que el texto quepa dentro del territorio: Chile o Ecuador
  // no lo permitirían nunca, y en cartografía es corriente sacar el rótulo de
  // un país estrecho al espacio contiguo. Sí se prueban desplazamientos
  // verticales antes de renunciar.
  // Desplazamientos en fracción del tamaño del propio país, para que uno
  // grande pueda buscar hueco lejos de su centro y uno pequeño apenas se mueva.
  const COUNTRY_LABEL_OFFSETS = [
    [0, 0],
    [0, -0.13],
    [0, 0.13],
    [-0.2, 0],
    [0.2, 0],
    [-0.2, -0.13],
    [0.2, -0.13],
    [-0.2, 0.13],
    [0.2, 0.13],
    [0, -0.27],
    [0, 0.27]
  ];

  function layoutCountryLabels(placed) {
    const zoom = view.width / baseView.width;
    const alto = 9 * zoom;

    // Los países grandes eligen primero; los pequeños ceden si no queda hueco.
    const labels = [...els.countryLabelLayer.querySelectorAll(".country-label")].sort(
      (a, b) => Number(b.getAttribute("data-country-area")) - Number(a.getAttribute("data-country-area"))
    );

    labels.forEach(label => {
      if (!label.getAttribute("data-base-y")) {
        label.setAttribute("data-base-x", label.getAttribute("x"));
        label.setAttribute("data-base-y", label.getAttribute("y"));
      }
      const baseX = Number(label.getAttribute("data-base-x"));
      const baseY = Number(label.getAttribute("data-base-y"));
      const anchoPais = Number(label.getAttribute("data-country-width"));
      const altoPais = Number(label.getAttribute("data-country-height"));

      let width;
      try {
        width = label.getComputedTextLength() || 0;
      } catch {
        width = 0;
      }
      if (!width) width = label.textContent.length * 4.6 * zoom;

      // Sacar el rótulo fuera del territorio vale para un país estrecho, pero
      // no para una isla diminuta: el nombre acabaría flotando en el océano,
      // lejos de lo que nombra. Al acercar el texto encoge en coordenadas del
      // mapa, baja la proporción y esos nombres van apareciendo.
      if (width > anchoPais * 3) {
        label.classList.add("is-hidden");
        return;
      }

      let colocada = null;
      for (const [fx, fy] of COUNTRY_LABEL_OFFSETS) {
        const x = baseX + fx * anchoPais;
        const y = baseY + fy * altoPais;
        const box = { x1: x - width / 2 - 2, y1: y - alto, x2: x + width / 2 + 2, y2: y + 3 };
        const fuera = box.x1 < 2 || box.x2 > baseView.width - 2 || box.y1 < 2 || box.y2 > baseView.height - 2;
        if (fuera) continue;
        if (placed.some(other => overlapArea(box, other) > 0)) continue;
        colocada = { x, y, box };
        break;
      }

      if (colocada) {
        label.setAttribute("x", colocada.x.toFixed(1));
        label.setAttribute("y", colocada.y.toFixed(1));
        label.classList.remove("is-hidden");
        placed.push(colocada.box);
      } else {
        label.classList.add("is-hidden");
      }
    });
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

      if (Math.abs(pos.x - pos.anchorX) > 0.5 || Math.abs(pos.y - pos.anchorY) > 0.5) {
        group.appendChild(
          createSvg("line", {
            x1: pos.anchorX.toFixed(1),
            y1: pos.anchorY.toFixed(1),
            x2: pos.x.toFixed(1),
            y2: pos.y.toFixed(1),
            class: "marker-leader"
          })
        );
      }

      group.append(
        createSvg("circle", { cx: pos.x, cy: pos.y, r: 23, class: "marker-hit" }),
        createSvg("circle", { cx: pos.x, cy: pos.y, r: 18, class: "marker-pulse" }),
        createSvg("circle", {
          cx: pos.x,
          cy: pos.y,
          r: 10.5,
          class: "marker-ring",
          filter: "url(#markerShadow)"
        }),
        createSvg("circle", { cx: pos.x, cy: pos.y, r: 6.3, class: "marker-core" }),
        createSvg("circle", { cx: pos.x, cy: pos.y, r: 1.8, class: "marker-center" })
      );

      const label = createSvg("text", { x: pos.x, y: pos.y, class: "city-label" });
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

  // El mapa está "acercado" cuando el viewBox baja del umbral; entonces los
  // grupos metropolitanos se abren y muestran sus comunas.
  function metrosExpanded() {
    return view.width <= METRO_EXPAND_WIDTH;
  }

  // Una comuna se oculta si su área está agrupada y el mapa no está acercado,
  // salvo que sea la ciudad seleccionada: quien abre una ficha debe ver su nodo.
  function isCollapsedByMetro(cityId) {
    const metro = metroByCity.get(cityId);
    if (!metro || metrosExpanded()) return false;
    return cityId !== state.selectedId;
  }

  function buildMetroMarkers() {
    els.metroLayer.innerHTML = "";
    metros.forEach(metro => {
      const [x, y] = project([metro.lon, metro.lat]);
      const group = createSvg("g", {
        class: "metro-marker",
        "data-metro-id": metro.id,
        role: "button",
        tabindex: "0",
        "aria-label": `${metro.name}, ${metro.country}. ${metro.members.length} comunas de la red. Acercar para verlas.`
      });

      group.append(
        createSvg("circle", { cx: x, cy: y, r: 24, class: "marker-hit" }),
        createSvg("circle", { cx: x, cy: y, r: 15, class: "metro-ring", filter: "url(#markerShadow)" }),
        createSvg("circle", { cx: x, cy: y, r: 9.5, class: "metro-core" })
      );

      const count = createSvg("text", {
        x,
        y: y + 3.4,
        "text-anchor": "middle",
        class: "metro-count"
      });
      count.textContent = String(metro.members.length);
      group.appendChild(count);

      const label = createSvg("text", {
        x: x + 19,
        y: y + 4,
        "text-anchor": "start",
        class: "city-label metro-label"
      });
      label.textContent = metro.name;
      group.appendChild(label);

      const title = createSvg("title");
      title.textContent = `${metro.name} · ${metro.note}`;
      group.appendChild(title);

      group.addEventListener("click", event => {
        event.stopPropagation();
        if (state.suppressClick) return;
        expandMetro(metro);
      });
      group.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          expandMetro(metro);
        }
      });
      group.addEventListener("pointerenter", event => showMetroTooltip(metro, event));
      group.addEventListener("pointermove", event => moveTooltip(event));
      group.addEventListener("pointerleave", hideTooltip);

      els.metroLayer.appendChild(group);
    });
  }

  function showMetroTooltip(metro, event) {
    const memberNames = metro.members
      .map(id => cityById.get(id)?.name)
      .filter(Boolean)
      .join(" · ");
    els.mapTooltip.innerHTML = `
      <strong>${escapeHTML(metro.name)}</strong>
      <span>${escapeHTML(memberNames)}</span>
      <small>Acercar para abrir el grupo</small>`;
    els.mapTooltip.hidden = false;
    moveTooltip(event);
  }

  // Acercar sobre el grupo lo abre, porque cruza el umbral de expansión.
  function expandMetro(metro) {
    hideTooltip();
    focusMapOn(metro.lon, metro.lat, Math.min(FOCUS_WIDTH, METRO_EXPAND_WIDTH - 40));
    announce(`${metro.name} abierto: ${metro.members.length} comunas de la red.`);
  }

  function renderMetroState(visibleIds) {
    const expanded = metrosExpanded();
    els.metroLayer.querySelectorAll(".metro-marker").forEach(node => {
      const metro = metros.find(item => item.id === node.dataset.metroId);
      const hasVisibleMember = metro.members.some(id => visibleIds.has(id));
      const selectedInside = metro.members.includes(state.selectedId);
      node.classList.toggle("is-hidden", expanded || !hasVisibleMember || selectedInside);
      node.classList.toggle("is-muted", !hasVisibleMember);
    });
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
      marker.classList.toggle("is-collapsed", isCollapsedByMetro(id));
      marker.setAttribute("aria-pressed", id === state.selectedId ? "true" : "false");
    });

    renderMetroState(visibleIds);

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
      els.overviewThemes.innerHTML = selected.themes
        .slice(0, 2)
        .map(theme => `<span>${escapeHTML(theme)}</span>`)
        .join("");
    } else {
      els.mapOverviewCard.classList.remove("is-city");
      els.overviewHeadline.textContent = `${filtered.length} ${filtered.length === 1 ? "ciudad visible" : "ciudades visibles"}`;
      els.overviewText.textContent = filtered.length
        ? "Haz clic en un nodo para explorar su ecosistema de conocimiento."
        : "Ajusta los filtros para volver a mostrar nodos de la red.";
      els.overviewThemes.innerHTML = themeFrequency
        .slice(0, 3)
        .map(item => `<span>${escapeHTML(item.theme)}</span>`)
        .join("");
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
        <button class="command-button" type="button" data-action="export-pdf">${icon("download")} Exportar PDF</button>
      </div>
      <div class="detail-tabs" role="tablist" aria-label="Secciones de la ficha">
        ${[
          ["resumen", "Resumen"],
          ["ecosistema", "Ecosistema"],
          ["acciones", "Acciones"],
          ["datos", "Datos y premios"]
        ]
          .map(
            ([id, label]) =>
              `<button class="detail-tab ${state.detailTab === id ? "is-active" : ""}" type="button" role="tab" aria-selected="${state.detailTab === id}" data-detail-tab="${id}">${label}</button>`
          )
          .join("")}
      </div>`;
  }

  function demoNotice() {
    return `<div class="demo-notice">${icon("info")}<span>Los elementos con sello <strong>Demo</strong> son sintéticos y sirven para probar la estructura del atlas; <strong>todas las personas lo son</strong>. Los registros <strong>Fuente HUB</strong> —instituciones y proyectos— provienen del sitio oficial.</span></div>`;
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
          ${strengths
            .map(
              item => `
            <div class="topic-bar">
              <div class="topic-bar__label"><span>${escapeHTML(item.theme)}</span><span>${item.value}%</span></div>
              <div class="topic-bar__track"><div class="topic-bar__fill" style="width:${item.value}%"></div></div>
            </div>`
            )
            .join("")}
        </div>
      </section>

      <div class="collaboration-card">
        <div class="collaboration-card__top"><span>${icon("network")}</span><strong>Conexiones de conocimiento</strong></div>
        <p>${related.length ? `${city.name} comparte temas y aprendizajes con ${related.length} ${related.length === 1 ? "ciudad" : "ciudades"} del mapa.` : "Aún no se han modelado conexiones directas para esta ciudad."}</p>
        <div class="related-cities">
          ${related.map(item => `<button class="related-city-button" type="button" data-related-city="${escapeHTML(item.id)}">${escapeHTML(item.name)}</button>`).join("")}
        </div>
      </div>`;
  }

  function renderEcosystem(city) {
    return `
      ${demoNotice()}
      <section>
        <div class="section-heading"><h3>Personas y actores</h3><span>${city.people.length} perfiles</span></div>
        <div class="person-list">
          ${city.people
            .map(
              person => `
            <button class="person-card is-openable" type="button" data-entity-id="${escapeHTML(person.id)}">
              <span class="person-avatar">${escapeHTML(person.initials)}</span>
              <span class="person-copy"><strong>${escapeHTML(person.name)}</strong><span>${escapeHTML(person.role)}</span></span>
              ${sourceBadge(person.source)}
            </button>`
            )
            .join("")}
        </div>
      </section>
      <section class="section-block">
        <div class="section-heading"><h3>Instituciones involucradas</h3><span>${city.institutions.length} nodos</span></div>
        <div class="institution-list">
          ${city.institutions
            .map(
              institution => `
            <button class="institution-card is-openable" type="button" data-entity-id="${escapeHTML(institution.id)}">
              <span class="institution-icon">${icon("building")}</span>
              <span class="institution-copy">
                <strong>${escapeHTML(institution.name)}</strong>
                <span>${escapeHTML(institution.type)}</span>
                <em>${escapeHTML(institution.role)}</em>
              </span>
              ${sourceBadge(institution.source)}
            </button>`
            )
            .join("")}
        </div>
      </section>`;
  }

  function actionCard(item, extra = "") {
    return `
      <button class="action-card is-openable" type="button" data-entity-id="${escapeHTML(item.id)}">
        <div class="action-card__top">
          <span class="action-copy"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.description)}</p></span>
          ${sourceBadge(item.source)}
        </div>
        <div class="action-meta"><span class="status-badge">${escapeHTML(item.status)}</span>${extra ? `<span>${escapeHTML(extra)}</span>` : ""}</div>
      </button>`;
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
          ${city.awards
            .map(
              award => `
            <button class="award-card is-openable" type="button" data-entity-id="${escapeHTML(award.id)}">
              <span class="award-icon">${icon("award")}</span>
              <span><strong>${escapeHTML(award.title)}</strong><p>${escapeHTML(award.organization)} · ${award.year}</p></span>
              ${sourceBadge(award.source)}
            </button>`
            )
            .join("")}
        </div>
      </section>`;
  }

  // N-02: "Directorio" solo enfocaba el buscador. Esta es la vista que la
  // etiqueta anuncia: las personas de la red en una tabla, con su institucion,
  // su ciudad y la procedencia del registro, sujeta a los mismos filtros.
  const directoryPeople = cities
    .flatMap(city => city.people.map(person => ({ ...person, city })))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  function renderDirectory() {
    const visible = directoryPeople.filter(entry => state.filteredIds.has(entry.city.id));
    const cityCount = new Set(visible.map(entry => entry.city.id)).size;

    els.directoryCount.textContent = visible.length
      ? `${visible.length} ${visible.length === 1 ? "persona" : "personas"} en ${cityCount} ${cityCount === 1 ? "ciudad" : "ciudades"} · perfiles de demostración`
      : "Sin personas para los filtros activos";

    els.directoryEmpty.hidden = visible.length > 0;
    els.directoryBody.innerHTML = visible
      .map(
        entry => `
      <tr>
        <th scope="row">
          <button class="directory-person" type="button" data-entity-id="${escapeHTML(entry.id)}">
            <span class="person-avatar">${escapeHTML(entry.initials)}</span>
            <span class="directory-person__copy">
              <strong>${escapeHTML(entry.name)}</strong>
              <span>${escapeHTML(entry.role)}</span>
            </span>
          </button>
        </th>
        <td>${escapeHTML(entry.organization)}</td>
        <td>
          <button class="directory-city" type="button" data-directory-city="${escapeHTML(entry.city.id)}">
            ${escapeHTML(entry.city.name)}<span>${escapeHTML(entry.city.country)}</span>
          </button>
        </td>
        <td>${sourceBadge(entry.source)}</td>
      </tr>`
      )
      .join("");

    els.directoryBody.querySelectorAll("[data-entity-id]").forEach(button => {
      button.addEventListener("click", () => openEntity(button.dataset.entityId));
    });

    els.directoryBody.querySelectorAll("[data-directory-city]").forEach(button => {
      button.addEventListener("click", () => {
        closeDirectory();
        selectCity(button.dataset.directoryCity);
      });
    });
  }

  function openDirectory() {
    state.directoryOpen = true;
    renderDirectory();
    els.directoryView.hidden = false;
    els.workspace.hidden = true;
    setActiveNav("directorio");
    els.directoryClose.focus();
    announce("Vista de directorio abierta.");
  }

  function closeDirectory() {
    if (!state.directoryOpen) return;
    state.directoryOpen = false;
    els.directoryView.hidden = true;
    els.workspace.hidden = false;
    setActiveNav("mapa");
  }

  const ENTITY_LABELS = {
    persona: "Persona",
    institucion: "Institución",
    proyecto: "Proyecto",
    programa: "Programa",
    iniciativa: "Iniciativa",
    premio: "Premio"
  };

  const ENTITY_ICONS = {
    persona: "users",
    institucion: "building",
    proyecto: "project",
    programa: "program",
    iniciativa: "spark",
    premio: "award"
  };

  function factRow(label, value) {
    return `<div class="fact"><dt>${escapeHTML(label)}</dt><dd>${value}</dd></div>`;
  }

  function factList(rows) {
    return `<dl class="fact-list">${rows.join("")}</dl>`;
  }

  function chipList(items) {
    return `<div class="entity-chips">${items.map(item => `<span>${escapeHTML(item)}</span>`).join("")}</div>`;
  }

  function personBody(entity) {
    // Las personas del directorio no llevan datos añadidos: ver la nota en data.js.
    if (entity.detail.kind === "hub") {
      return `
        <div class="entity-note">${icon("info")}<span>${escapeHTML(entity.detail.note)}</span></div>
        ${factList([
          factRow("Cargo", escapeHTML(entity.role)),
          factRow("Institución", escapeHTML(entity.organization)),
          factRow("Ciudad", escapeHTML(cityById.get(entity.cityId).name))
        ])}
        <a class="entity-source" href="${escapeHTML(entity.sourceUrl)}" target="_blank" rel="noreferrer">Ver el directorio del HUB</a>`;
    }
    return `
      <p class="entity-lead">${escapeHTML(entity.detail.bio)}</p>
      ${factList([
        factRow("Cargo", escapeHTML(entity.role)),
        factRow("Institución", escapeHTML(entity.organization)),
        factRow("En el equipo desde", entity.detail.since),
        factRow("Formación", escapeHTML(entity.detail.education)),
        factRow("Contacto", `<code>${escapeHTML(entity.detail.contact)}</code>`)
      ])}
      <h4>Temas de trabajo</h4>
      ${chipList(entity.detail.focus)}`;
  }

  function institutionBody(entity) {
    return `
      <p class="entity-lead">${escapeHTML(entity.role)}</p>
      ${factList([
        factRow("Tipo", escapeHTML(entity.type)),
        factRow("En funcionamiento desde", entity.detail.founded),
        factRow("Equipo aproximado", `${entity.detail.teamSize} personas`),
        factRow("Alcance", escapeHTML(entity.detail.reach))
      ])}
      <h4>Líneas de trabajo</h4>
      <ul class="entity-list">${entity.detail.lines.map(line => `<li>${escapeHTML(line)}</li>`).join("")}</ul>`;
  }

  function projectBody(entity) {
    return `
      <p class="entity-lead">${escapeHTML(entity.description)}</p>
      ${factList([
        factRow("Objetivo", escapeHTML(entity.detail.goal)),
        factRow("Estado", escapeHTML(entity.status)),
        factRow("Periodo", escapeHTML(entity.detail.period)),
        factRow("Responsable", escapeHTML(entity.detail.lead)),
        factRow("Presupuesto demo", `${formatNumber(entity.detail.budget)} USD`)
      ])}
      <h4>Hitos</h4>
      <ol class="milestones">
        ${entity.detail.milestones
          .map(
            milestone => `
          <li class="${milestone.done ? "is-done" : ""}">
            <span class="milestone-dot"></span>${escapeHTML(milestone.label)}
          </li>`
          )
          .join("")}
      </ol>
      <h4>Indicadores</h4>
      <div class="indicator-grid">
        ${entity.detail.indicators
          .map(
            indicator => `
          <div class="indicator"><strong>${formatNumber(indicator.value)}</strong><span>${escapeHTML(indicator.label)}</span></div>`
          )
          .join("")}
      </div>
      <h4>Aliados</h4>
      ${chipList(entity.detail.partners)}`;
  }

  function programBody(entity) {
    return `
      <p class="entity-lead">${escapeHTML(entity.description)}</p>
      ${factList([
        factRow("Estado", escapeHTML(entity.status)),
        factRow("Formato", escapeHTML(entity.detail.format)),
        factRow("Duración", escapeHTML(entity.detail.duration)),
        factRow("Cohortes realizadas", entity.detail.cohorts),
        factRow("Participantes", entity.participants),
        factRow("Dirigido a", escapeHTML(entity.detail.audience)),
        factRow("Requisitos", escapeHTML(entity.detail.requirements))
      ])}
      <h4>Qué se lleva cada equipo</h4>
      <ul class="entity-list">${entity.detail.outcomes.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
  }

  function initiativeBody(entity) {
    return `
      <p class="entity-lead">${escapeHTML(entity.description)}</p>
      ${factList([
        factRow("Estado", escapeHTML(entity.status)),
        factRow("Duración", escapeHTML(entity.detail.duration)),
        factRow("Participantes", entity.detail.participants),
        factRow("Tema", escapeHTML(entity.detail.theme))
      ])}
      <h4>Cómo se hace</h4>
      <ol class="entity-list entity-list--ordered">${entity.detail.method.map(step => `<li>${escapeHTML(step)}</li>`).join("")}</ol>
      <h4>Qué se busca aprender</h4>
      <p>${escapeHTML(entity.detail.learning)}</p>`;
  }

  function awardBody(entity) {
    return `
      ${factList([
        factRow("Categoría", escapeHTML(entity.detail.category)),
        factRow("Otorgado por", escapeHTML(entity.organization)),
        factRow("Año", entity.year),
        factRow("Jurado", escapeHTML(entity.detail.jury)),
        factRow("Alcance", escapeHTML(entity.detail.scope))
      ])}
      <h4>Motivo</h4>
      <p>${escapeHTML(entity.detail.reason)}</p>`;
  }

  const ENTITY_BODIES = {
    persona: personBody,
    institucion: institutionBody,
    proyecto: projectBody,
    programa: programBody,
    iniciativa: initiativeBody,
    premio: awardBody
  };

  function entityTitle(entity) {
    return entity.entity === "persona" ? entity.name : entity.title || entity.name;
  }

  function openEntity(id) {
    const entity = entityById.get(id);
    if (!entity) return;
    const city = cityById.get(entity.cityId);

    els.entityCard.innerHTML = `
      <div class="entity-head">
        <span class="entity-kind">${icon(ENTITY_ICONS[entity.entity])} ${escapeHTML(ENTITY_LABELS[entity.entity])}</span>
        <button class="dialog-close" type="button" data-close-entity aria-label="Cerrar">${icon("close")}</button>
      </div>
      <h2 id="entityTitle">${escapeHTML(entityTitle(entity))}</h2>
      <div class="entity-meta">
        <button class="entity-city" type="button" data-entity-city="${escapeHTML(city.id)}">${icon("globe")} ${escapeHTML(city.name)}, ${escapeHTML(city.country)}</button>
        ${sourceBadge(entity.source)}
      </div>
      <div class="entity-body">${ENTITY_BODIES[entity.entity](entity)}</div>`;

    els.entityDialog.showModal();
    els.entityCard.scrollTop = 0;

    els.entityCard
      .querySelector("[data-close-entity]")
      .addEventListener("click", () => els.entityDialog.close());
    els.entityCard.querySelector("[data-entity-city]").addEventListener("click", () => {
      els.entityDialog.close();
      selectCity(city.id);
    });
    announce(`${ENTITY_LABELS[entity.entity]}: ${entityTitle(entity)}.`);
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
              ${themeFrequency
                .slice(0, 5)
                .map(
                  (item, index) => `
                <div class="topic-bar">
                  <div class="topic-bar__label"><span>${escapeHTML(item.theme)}</span><span>${item.count} ciudades</span></div>
                  <div class="topic-bar__track"><div class="topic-bar__fill" style="width:${Math.round((item.count / themeFrequency[0].count) * (92 - index * 3))}%"></div></div>
                </div>`
                )
                .join("")}
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
    els.detailContent.querySelectorAll("[data-entity-id]").forEach(button => {
      button.addEventListener("click", () => openEntity(button.dataset.entityId));
    });
    els.detailContent.querySelectorAll("[data-detail-tab]").forEach(button => {
      button.addEventListener("click", () => {
        state.detailTab = button.dataset.detailTab;
        renderDetail();
        announce(`${city.name}, sección ${button.textContent.trim()}.`);
      });
    });
    els.detailContent
      .querySelector("[data-action='share']")
      ?.addEventListener("click", () => shareCity(city));
    els.detailContent
      .querySelector("[data-action='export-pdf']")
      ?.addEventListener("click", () => exportCityPdf(city));
    els.detailContent.querySelectorAll("[data-related-city]").forEach(button => {
      button.addEventListener("click", () => selectCity(button.dataset.relatedCity));
    });

    updateBackdrop();
  }

  function isOverlayWidth() {
    return window.innerWidth <= 1120;
  }

  function selectCity(id, { updateHash = true, focusMap = true } = {}) {
    if (!cityById.has(id)) return;
    closeDirectory();
    if (state.selectedId !== id && isOverlayWidth()) state.detailOpener = document.activeElement;
    state.selectedId = id;
    state.detailTab = "resumen";
    if (updateHash) replaceCityHash(id);
    applyFilters({ preserveSelection: true });
    hideTooltip();

    // Al seleccionar, el mapa se acerca y centra en la ciudad. Si pertenece a
    // un área metropolitana, el nivel elegido abre además el grupo.
    const city = cityById.get(id);
    if (focusMap) {
      focusMapOn(city.lon, city.lat, metroByCity.has(id) ? Math.min(FOCUS_WIDTH, 280) : FOCUS_WIDTH);
    }
    announce(`Ficha de ${city.name} abierta.`);

    const listItem = els.cityList.querySelector(`[data-city-id="${CSS.escape(id)}"]`);
    // A-04: un behavior "smooth" explicito ignora scroll-behavior del CSS.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listItem?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion ? "auto" : "smooth" });

    if (window.innerWidth <= 700) {
      els.explorerPanel.classList.remove("is-open");
    }
    updateBackdrop();

    // Despues de updateBackdrop: hasta aqui la ficha podia seguir inerte por
    // tener el panel de filtros abierto, y un elemento inerte no toma el foco.
    if (isOverlayWidth() && state.detailOpener) focusFirstIn(els.detailContent);
  }

  function closeDetail() {
    const opener = state.detailOpener;
    state.selectedId = null;
    state.detailTab = "resumen";
    state.detailOpener = null;
    replaceCityHash(null);
    applyFilters({ preserveSelection: true });
    if (opener?.isConnected) opener.focus();
  }

  function replaceCityHash(id) {
    const next = id ? `#ciudad=${encodeURIComponent(id)}` : `${location.pathname}${location.search}`;
    history.replaceState(null, "", next);
  }

  async function shareCity(city) {
    const url = `${location.origin}${location.pathname}#ciudad=${encodeURIComponent(city.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${city.name} · Atlas HUB`,
          text: `Explora la ficha de ${city.name} en el Atlas HUB.`,
          url
        });
        return;
      }
      // navigator.clipboard solo existe bajo HTTPS o localhost.
      if (!navigator.clipboard) throw new Error("clipboard no disponible");
      await navigator.clipboard.writeText(url);
      showToast("Enlace de la ciudad copiado.");
    } catch (error) {
      if (error?.name === "AbortError") return;
      // N-05: en vez de pedir al usuario que busque la URL, se la damos ya
      // seleccionada. Es el caso normal al servir el prototipo por HTTP.
      showShareFallback(url);
    }
  }

  function showShareFallback(url) {
    if (!els.shareFallback) {
      showToast("No fue posible compartir; copia la URL del navegador.");
      return;
    }
    els.shareUrl.value = url;
    els.shareFallback.hidden = false;
    els.shareUrl.focus();
    els.shareUrl.select();
    announce("Enlace listo para copiar.");
  }

  function hideShareFallback() {
    if (els.shareFallback) els.shareFallback.hidden = true;
  }

  // A-02: la ficha ya no es una region viva. En vez de releer la tarjeta
  // completa en cada render, se anuncia solo lo que cambio.
  function announce(message) {
    if (!els.statusAnnouncer) return;
    els.statusAnnouncer.textContent = "";
    // Una pausa corta fuerza a los lectores a releer un texto repetido.
    // setTimeout y no requestAnimationFrame: rAF no corre en pestanas ocultas.
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      els.statusAnnouncer.textContent = message;
    }, 60);
  }

  // Exportación en PDF.
  //
  // Sin librería: se compone una hoja imprimible con la ficha completa —no solo
  // la pestaña abierta— y se manda a imprimir. El navegador ofrece "Guardar
  // como PDF" y produce un documento con texto seleccionable y buscable, mejor
  // resultado que rasterizar la pantalla, y mantiene la promesa de no añadir
  // dependencias en tiempo de ejecución.
  function printSection(title, count, body) {
    return `
      <section class="print-section">
        <h2>${escapeHTML(title)}${count === undefined ? "" : ` <span>${count}</span>`}</h2>
        ${body}
      </section>`;
  }

  function printSourceTag(source) {
    return source === "hub"
      ? `<span class="print-tag print-tag--hub">Fuente HUB</span>`
      : `<span class="print-tag">Demo</span>`;
  }

  function buildPrintSheet(city) {
    const related = [...relatedCityIds(city.id)].map(id => cityById.get(id).name);
    const records = [
      ...city.people,
      ...city.institutions,
      ...city.projects,
      ...city.programs,
      ...city.initiatives,
      ...city.awards
    ];
    const verified = records.filter(item => item.source === "hub").length;
    const density = Math.round(city.population / city.area);

    els.printSheet.innerHTML = `
      <header class="print-head">
        <div class="print-brand">
          <strong>ATLAS HUB</strong>
          <span>Atlas de conocimiento · HUB de Ciudades de América Latina y el Caribe</span>
        </div>
        <div class="print-issued">Ficha generada el ${formatDate(atlas.referenceDate, true)}</div>
      </header>

      <div class="print-title">
        <span class="print-country">${escapeHTML(city.code)} · ${escapeHTML(city.country)}</span>
        <h1>${escapeHTML(city.name)}</h1>
        ${city.locality ? `<p class="print-locality">${escapeHTML(city.locality)}</p>` : ""}
        <p class="print-summary">${escapeHTML(city.summary)}</p>
        <p class="print-themes">${city.themes.map(theme => escapeHTML(theme)).join(" · ")}</p>
      </div>

      <div class="print-kpis">
        <div><strong>${formatNumber(city.population)}</strong><span>Habitantes (demo)</span></div>
        <div><strong>${formatNumber(city.area)} km²</strong><span>Superficie (demo)</span></div>
        <div><strong>${city.people.length}</strong><span>Personas vinculadas</span></div>
        <div><strong>${actionCount(city)}</strong><span>Acciones registradas</span></div>
      </div>

      <div class="print-notice">
        Este documento combina instituciones y proyectos publicados en el sitio del HUB con contenido
        de demostración generado para probar el prototipo. <strong>Todas las personas que aparecen son
        inventadas.</strong> Cada registro lleva su procedencia: los marcados <strong>Demo</strong> no
        deben interpretarse como información oficial.
      </div>

      ${printSection(
        "Datos base",
        undefined,
        `<table class="print-table">
          <tbody>
            <tr><th>Población</th><td>${formatNumber(city.population)} hab. <em>(demo)</em></td></tr>
            <tr><th>Superficie</th><td>${formatNumber(city.area)} km² <em>(demo)</em></td></tr>
            <tr><th>Densidad</th><td>${formatNumber(density)} hab./km² <em>(demo)</em></td></tr>
            <tr><th>Elevación</th><td>${formatNumber(city.elevation)} m s. n. m. <em>(demo)</em></td></tr>
            <tr><th>Coordenadas</th><td>${city.lat}, ${city.lon}</td></tr>
            <tr><th>Ingreso a la red</th><td>${formatDate(city.joined, true)} · hace ${membershipDuration(city.joined)}</td></tr>
            <tr><th>Última actualización</th><td>${formatDate(city.updated, true)}</td></tr>
          </tbody>
        </table>`
      )}

      ${printSection(
        "Personas",
        city.people.length,
        `<ul class="print-list">
          ${city.people
            .map(
              person => `
            <li>
              <strong>${escapeHTML(person.name)}</strong> ${printSourceTag(person.source)}
              <span>${escapeHTML(person.role)}</span>
              <span class="print-muted">${escapeHTML(person.organization)}</span>
            </li>`
            )
            .join("")}
        </ul>`
      )}

      ${printSection(
        "Instituciones",
        city.institutions.length,
        `<ul class="print-list">
          ${city.institutions
            .map(
              institution => `
            <li>
              <strong>${escapeHTML(institution.name)}</strong> ${printSourceTag(institution.source)}
              <span>${escapeHTML(institution.type)}</span>
              <span class="print-muted">${escapeHTML(institution.role)}</span>
            </li>`
            )
            .join("")}
        </ul>`
      )}

      ${printSection(
        "Proyectos",
        city.projects.length,
        city.projects
          .map(
            project => `
          <article class="print-entry">
            <h3>${escapeHTML(project.title)} ${printSourceTag(project.source)}</h3>
            <p>${escapeHTML(project.description)}</p>
            <p class="print-muted">${escapeHTML(project.status)} · ${escapeHTML(project.detail.period)} · responsable: ${escapeHTML(project.detail.lead)}</p>
            <p class="print-muted">Hitos: ${project.detail.milestones.map(m => `${escapeHTML(m.label)}${m.done ? " ✓" : ""}`).join(" · ")}</p>
          </article>`
          )
          .join("")
      )}

      ${printSection(
        "Programas",
        city.programs.length,
        city.programs
          .map(
            program => `
          <article class="print-entry">
            <h3>${escapeHTML(program.title)} ${printSourceTag(program.source)}</h3>
            <p>${escapeHTML(program.description)}</p>
            <p class="print-muted">${escapeHTML(program.status)} · ${escapeHTML(program.detail.duration)} · ${program.participants} participantes</p>
          </article>`
          )
          .join("")
      )}

      ${printSection(
        "Iniciativas",
        city.initiatives.length,
        city.initiatives
          .map(
            initiative => `
          <article class="print-entry">
            <h3>${escapeHTML(initiative.title)} ${printSourceTag(initiative.source)}</h3>
            <p>${escapeHTML(initiative.description)}</p>
            <p class="print-muted">${escapeHTML(initiative.status)} · ${escapeHTML(initiative.detail.duration)} · ${initiative.detail.participants} participantes</p>
          </article>`
          )
          .join("")
      )}

      ${printSection(
        "Premios y reconocimientos",
        city.awards.length,
        city.awards
          .map(
            award => `
          <article class="print-entry">
            <h3>${escapeHTML(award.title)} ${printSourceTag(award.source)}</h3>
            <p class="print-muted">${escapeHTML(award.organization)} · ${award.year} · ${escapeHTML(award.detail.category)}</p>
            <p>${escapeHTML(award.detail.reason)}</p>
          </article>`
          )
          .join("")
      )}

      ${printSection(
        "Conexiones en la red",
        related.length,
        related.length
          ? `<p>${escapeHTML(city.name)} comparte temas y aprendizajes con: ${related.map(name => escapeHTML(name)).join(" · ")}.</p>`
          : `<p class="print-muted">Aún no se han modelado conexiones directas para esta ciudad.</p>`
      )}

      <footer class="print-foot">
        <p><strong>Procedencia.</strong> ${verified} de ${records.length} registros de esta ficha —instituciones y proyectos— tienen fuente pública en el sitio del HUB (${escapeHTML(atlas.sources.directory)}). El resto, incluidas todas las personas, es contenido de demostración.</p>
        <p><strong>Cartografía.</strong> ${escapeHTML(atlas.sources.map)}.</p>
        <p class="print-muted">Atlas de conocimiento · HUB de Ciudades · prototipo</p>
      </footer>`;
  }

  function exportCityPdf(city) {
    buildPrintSheet(city);
    // El título del documento es el nombre que el navegador propone al guardar.
    const originalTitle = document.title;
    document.title = `Atlas HUB · ${city.name}`;
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    showToast("Elige «Guardar como PDF» en el diálogo de impresión.");
    window.print();
    // Salvaguarda: algunos navegadores no emiten afterprint.
    setTimeout(restore, 4000);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
  }

  function setViewBox() {
    els.networkMap.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
    // El SVG escala todo su contenido con el viewBox, así que al acercar el
    // texto crecería con el mapa. Esta variable lo contrarresta para que las
    // etiquetas conserven su tamaño en pantalla a cualquier zoom.
    els.networkMap.style.setProperty("--map-zoom", (view.width / baseView.width).toFixed(4));
  }

  // Cambiar el zoom puede cruzar el umbral que abre o cierra los grupos
  // metropolitanos, así que el estado del mapa se revisa en cada movimiento.
  function setViewBoxAndSync() {
    setViewBox();
    if (metrosExpanded() !== lastExpandedState) {
      lastExpandedState = metrosExpanded();
      renderMapState(getFilteredCities());
    }
    scheduleLabelRelayout();
  }

  // Acercarse deja sitio para más nombres de país, porque el texto encoge en
  // coordenadas del mapa. Se recalcula en el siguiente fotograma para no
  // hacerlo una vez por cada evento de movimiento.
  function scheduleLabelRelayout() {
    if (labelRelayout || !els.countryLabelLayer.childElementCount) return;
    labelRelayout = requestAnimationFrame(() => {
      labelRelayout = 0;
      layoutCountryLabels(occupiedBoxes());
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Desplaza y acerca el mapa hasta dejar un punto centrado. Anima el viewBox
  // para que no se pierda la referencia de dónde estaba el nodo.
  function focusMapOn(lon, lat, targetWidth = FOCUS_WIDTH) {
    const [x, y] = project([lon, lat]);
    const width = Math.max(250, Math.min(baseView.width, targetWidth));
    const height = width * (baseView.height / baseView.width);
    const target = clampView({ x: x - width / 2, y: y - height / 2, width, height });

    // Sin animación si el sistema la desaconseja, o si la pestaña está en
    // segundo plano: ahí requestAnimationFrame no corre y el mapa se quedaría
    // a medio camino hasta que alguien volviera a mirarlo.
    if (prefersReducedMotion() || document.hidden) {
      view = target;
      setViewBoxAndSync();
      return;
    }

    const from = { ...view };
    const start = performance.now();
    const duration = 460;
    cancelAnimationFrame(focusAnimation);

    const step = now => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic: sale rápido y frena al llegar.
      const eased = 1 - Math.pow(1 - t, 3);
      view = {
        x: from.x + (target.x - from.x) * eased,
        y: from.y + (target.y - from.y) * eased,
        width: from.width + (target.width - from.width) * eased,
        height: from.height + (target.height - from.height) * eased
      };
      setViewBoxAndSync();
      if (t < 1) focusAnimation = requestAnimationFrame(step);
    };
    focusAnimation = requestAnimationFrame(step);
  }

  function clampView(next) {
    next.width = Math.min(baseView.width, Math.max(baseView.width / MAX_ZOOM, next.width));
    next.height = next.width * (baseView.height / baseView.width);
    if (next.height > baseView.height) {
      next.height = baseView.height;
      next.width = next.height * (baseView.width / baseView.height);
    }
    next.x = Math.min(baseView.width - next.width, Math.max(0, next.x));
    next.y = Math.min(baseView.height - next.height, Math.max(0, next.y));
    return next;
  }

  function zoomMap(factor, clientPoint = null, referenceWidth = null) {
    const rect = els.networkMap.getBoundingClientRect();
    const px = clientPoint ? (clientPoint.x - rect.left) / rect.width : 0.5;
    const py = clientPoint ? (clientPoint.y - rect.top) / rect.height : 0.5;
    const focusX = view.x + px * view.width;
    const focusY = view.y + py * view.height;
    const base = referenceWidth ?? view.width;
    const nextWidth = base * factor;
    const nextHeight = nextWidth * (view.height / view.width);
    view = clampView({
      x: focusX - px * nextWidth,
      y: focusY - py * nextHeight,
      width: nextWidth,
      height: nextHeight
    });
    setViewBoxAndSync();
  }

  function resetMap() {
    cancelAnimationFrame(focusAnimation);
    view = { ...baseView };
    setViewBoxAndSync();
  }

  function updateBackdrop() {
    const filtersOpen = els.explorerPanel.classList.contains("is-open") && window.innerWidth <= 700;
    const detailsOpen = Boolean(state.selectedId) && window.innerWidth <= 1120;
    els.mobileBackdrop.hidden = !(filtersOpen || detailsOpen);
    updateInertBackground(filtersOpen, detailsOpen);
  }

  // A-03: mientras una capa cubre la pantalla, lo que queda detras se marca
  // inerte para que no reciba foco ni lecturas de pantalla.
  const INERT_REGIONS = [".topbar", ".page-heading", ".map-panel"];

  function updateInertBackground(filtersOpen, detailsOpen) {
    const overlayOpen = filtersOpen || detailsOpen;
    INERT_REGIONS.forEach(selector => {
      const region = document.querySelector(selector);
      if (region) region.inert = overlayOpen;
    });
    els.explorerPanel.inert = detailsOpen && !filtersOpen;
    els.detailPanel.inert = filtersOpen;
  }

  function focusFirstIn(container) {
    const focusable = container.querySelector(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }

  function setActiveNav(navId) {
    document.querySelectorAll(".main-nav [data-nav]").forEach(button => {
      const isActive = button.dataset.nav === navId;
      button.classList.toggle("nav-item--active", isActive);
      if (isActive) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function openFilters() {
    state.filtersOpener = document.activeElement;
    els.explorerPanel.classList.add("is-open");
    updateBackdrop();
    setTimeout(() => els.citySearch.focus(), 180);
  }

  function closeFilters() {
    const wasOpen = els.explorerPanel.classList.contains("is-open");
    els.explorerPanel.classList.remove("is-open");
    updateBackdrop();
    if (wasOpen && state.filtersOpener?.isConnected) {
      state.filtersOpener.focus();
      state.filtersOpener = null;
    }
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
      updateSortControl();
      applyFilters({ preserveSelection: true });
      announce(`Lista ordenada por país, ${state.reverseSort ? "de la Z a la A" : "de la A a la Z"}.`);
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

    // M-04: capturar la rueda siempre es una trampa latente. Si el documento
    // desborda la ventana, el zoom exige Ctrl/Cmd y el scroll normal pasa.
    //
    // El factor sale de la magnitud del gesto, no de su dirección. Un paso fijo
    // por evento daba saltos del 12% con el trackpad, que manda ráfagas de
    // eventos muy pequeños: el pellizco avanzaba a tirones en vez de seguir a
    // los dedos. El pellizco de trackpad llega precisamente así, como wheel con
    // ctrlKey y deltas finos, mientras que una rueda de ratón manda saltos
    // grandes y espaciados; de ahí las dos sensibilidades.
    els.networkMap.addEventListener(
      "wheel",
      event => {
        const pageScrolls = document.documentElement.scrollHeight > window.innerHeight + 1;
        if (pageScrolls && !event.ctrlKey && !event.metaKey) return;
        event.preventDefault();

        // deltaMode: 0 píxeles, 1 líneas, 2 páginas.
        const unidad = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
        const delta = event.deltaY * unidad;
        const sensibilidad = event.ctrlKey ? 0.01 : 0.0035;
        // El tope por evento evita que una rueda con deltas enormes salte de
        // un extremo al otro del mapa de una vez.
        const factor = Math.min(1.6, Math.max(0.625, Math.exp(delta * sensibilidad)));
        zoomMap(factor, { x: event.clientX, y: event.clientY });
      },
      { passive: false }
    );

    // M-03: el SVG lleva touch-action: none, asi que el pellizco nativo esta
    // desactivado y hay que reconstruirlo. Con dos punteros activos, la escala
    // sale de como cambia la distancia entre ellos y el centro de zoom de su
    // punto medio; con uno, se conserva el arrastre de siempre.
    const activePointers = new Map();
    let pinch = null;
    let viewOnFirstTouch = null;

    function pointerPair() {
      const points = [...activePointers.values()];
      return points.length === 2 ? points : null;
    }

    function pointerMidpoint(pair) {
      return { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 };
    }

    // El gesto se ancla a la vista que había cuando bajó el primer dedo y al
    // punto del mapa que quedó bajo el centro del pellizco. Todo lo demás se
    // deriva de ahí: sin ese ancla fijo, cada fotograma recalculaba la
    // referencia sobre la vista ya modificada y el mapa se iba solo.
    function beginPinch(pair) {
      // El primer dedo pudo arrastrar un poco antes de que llegara el segundo.
      if (viewOnFirstTouch) view = { ...viewOnFirstTouch };
      drag = null;
      els.networkMap.classList.remove("is-dragging");

      const rect = els.networkMap.getBoundingClientRect();
      const mid = pointerMidpoint(pair);
      const px = (mid.x - rect.left) / rect.width;
      const py = (mid.y - rect.top) / rect.height;

      pinch = {
        startDistance: Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1,
        startView: { ...view },
        anchorX: view.x + px * view.width,
        anchorY: view.y + py * view.height,
        moved: false
      };
      setViewBoxAndSync();
    }

    els.networkMap.addEventListener("pointerdown", event => {
      if (event.pointerType !== "mouse") {
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (activePointers.size === 1) viewOnFirstTouch = { ...view };
        const pair = pointerPair();
        if (pair) {
          beginPinch(pair);
          return;
        }
      }
      if (event.button !== 0 || event.target.closest(".city-marker, .metro-marker")) return;
      drag = {
        startX: event.clientX,
        startY: event.clientY,
        viewX: view.x,
        viewY: view.y,
        moved: false
      };
      state.suppressClick = false;
      els.networkMap.classList.add("is-dragging");
      try {
        els.networkMap.setPointerCapture(event.pointerId);
      } catch {}
    });

    els.networkMap.addEventListener("pointermove", event => {
      if (activePointers.has(event.pointerId)) {
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      const pair = pointerPair();
      if (pair) {
        if (!pinch) beginPinch(pair);
        const distance = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1;
        if (Math.abs(distance - pinch.startDistance) > 6) pinch.moved = true;

        const rect = els.networkMap.getBoundingClientRect();
        const mid = pointerMidpoint(pair);
        const px = (mid.x - rect.left) / rect.width;
        const py = (mid.y - rect.top) / rect.height;
        const nextWidth = pinch.startView.width * (pinch.startDistance / distance);
        const nextHeight = nextWidth * (pinch.startView.height / pinch.startView.width);

        // El punto anclado al empezar se mantiene bajo el centro del gesto.
        view = clampView({
          x: pinch.anchorX - px * nextWidth,
          y: pinch.anchorY - py * nextHeight,
          width: nextWidth,
          height: nextHeight
        });
        setViewBoxAndSync();
        return;
      }
      if (!drag) return;
      const rect = els.networkMap.getBoundingClientRect();
      const dx = ((event.clientX - drag.startX) / rect.width) * view.width;
      const dy = ((event.clientY - drag.startY) / rect.height) * view.height;
      if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 4) {
        drag.moved = true;
      }
      view = clampView({ ...view, x: drag.viewX - dx, y: drag.viewY - dy });
      setViewBox();
    });

    const endDrag = event => {
      activePointers.delete(event.pointerId);
      if (pinch) {
        if (activePointers.size >= 2) return;
        state.suppressClick = pinch.moved;
        pinch = null;
        // Si queda un dedo en pantalla, pasa a arrastrar desde donde está, en
        // vez de dejar el mapa muerto hasta levantar y volver a tocar.
        const [rest] = [...activePointers.values()];
        if (rest) {
          drag = { startX: rest.x, startY: rest.y, viewX: view.x, viewY: view.y, moved: true };
          viewOnFirstTouch = { ...view };
        } else if (state.suppressClick) {
          setTimeout(() => {
            state.suppressClick = false;
          }, 0);
        }
        return;
      }
      if (!drag) return;
      viewOnFirstTouch = null;
      state.suppressClick = drag.moved;
      drag = null;
      els.networkMap.classList.remove("is-dragging");
      try {
        els.networkMap.releasePointerCapture(event.pointerId);
      } catch {}
      setTimeout(() => {
        state.suppressClick = false;
      }, 0);
    };
    els.networkMap.addEventListener("pointerup", endDrag);
    els.networkMap.addEventListener("pointercancel", endDrag);

    els.openFiltersButton.addEventListener("click", openFilters);
    els.mobileResultsButton.addEventListener("click", openFilters);
    els.closeFiltersButton.addEventListener("click", closeFilters);
    els.shareFallbackClose?.addEventListener("click", hideShareFallback);
    // En movil la barra de navegacion esta oculta, asi que el directorio
    // necesita su propia entrada en la cabecera.
    els.openDirectoryButton?.addEventListener("click", () => {
      closeFilters();
      openDirectory();
    });

    els.directoryClose.addEventListener("click", () => {
      closeDirectory();
      document.querySelector("[data-nav='mapa']")?.focus();
    });

    els.mobileBackdrop.addEventListener("click", () => {
      closeFilters();
      if (isOverlayWidth() && state.selectedId) closeDetail();
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

    document.querySelector(".main-nav")?.addEventListener("click", event => {
      const button = event.target.closest("[data-nav]");
      if (!button) return;
      setActiveNav(button.dataset.nav);
      if (button.dataset.nav === "mapa") {
        closeDirectory();
        resetMap();
        closeFilters();
        showToast("Vista cartográfica activa.");
      } else if (button.dataset.nav === "directorio") {
        openDirectory();
      }
    });

    document.addEventListener("keydown", event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.innerWidth <= 700) openFilters();
        else els.citySearch.focus();
      }
      if (event.key === "Escape") {
        if (els.shareFallback && !els.shareFallback.hidden) hideShareFallback();
        else if (state.directoryOpen) closeDirectory();
        else if (els.explorerPanel.classList.contains("is-open")) closeFilters();
        else if (isOverlayWidth() && state.selectedId) closeDetail();
      }
    });

    window.addEventListener("hashchange", () => {
      const id = new URLSearchParams(location.hash.replace(/^#/, "")).get("ciudad");
      if (cityById.has(id)) selectCity(id, { updateHash: false });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 700) els.explorerPanel.classList.remove("is-open");
      if (!isOverlayWidth()) els.detailPanel.classList.toggle("is-open", Boolean(state.selectedId));
      updateBackdrop();
    });
  }

  // D-03: si el validador descartó registros, se dice; antes un dato mal
  // formado se propagaba en silencio hasta un error de render.
  function reportDataIssues() {
    const issues = atlas.issues || [];
    if (!issues.length) return;
    console.warn(`Atlas HUB · ${issues.length} registro(s) descartado(s) al validar:`);
    issues.forEach(issue => console.warn(` · ${issue}`));
    showToast(
      issues.length === 1
        ? "Se descartó 1 registro con datos incompletos; revisa la consola."
        : `Se descartaron ${issues.length} registros con datos incompletos; revisa la consola.`
    );
  }

  function init() {
    reportDataIssues();
    populateFilters();
    updateKpis();
    updateSortControl();
    wireEvents();
    buildMap();
    applyFilters({ preserveSelection: true });
    setViewBox();
  }

  init();
})();
