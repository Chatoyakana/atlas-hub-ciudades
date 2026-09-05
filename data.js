/*
 * Atlas HUB — datos de prototipo.
 * Los registros marcados como "hub" provienen del directorio público del HUB.
 * El resto es contenido sintético para validar la experiencia de exploración.
 */

const HUB_DIRECTORY_URL = "https://hubdeciudades.org/directorio/";
const HUB_HOME_URL = "https://hubdeciudades.org/";

const rawCities = [
  {
    id: "san-jose",
    name: "San José",
    country: "Costa Rica",
    code: "CR",
    lat: 9.9281,
    lon: -84.0907,
    joined: "2024-03-14",
    population: 352381,
    area: 44.6,
    elevation: 1172,
    summary:
      "Nodo centroamericano enfocado en innovación de servicios públicos, participación barrial y resiliencia urbana.",
    themes: ["Innovación pública", "Participación ciudadana", "Datos urbanos"],
    demoPeople: [
      { name: "Valeria Solís Rojas", role: "Coordinadora de innovación abierta" },
      { name: "Diego Araya Jiménez", role: "Especialista en datos urbanos" }
    ],
    institution: "Municipalidad de San José · Agencia Local de Innovación y Desarrollo",
    institutionType: "Gobierno local / laboratorio de innovación",
    projects: ["Barrios que cuidan", "Semáforo de servicios urbanos"],
    program: "Academia de innovación municipal",
    initiatives: [
      "Reto de datos barriales",
      "Escuela de facilitadores",
      "Mapa de cuidados",
      "Clínica de trámites"
    ],
    award: "Mención HUB a la colaboración cívica 2025"
  },
  {
    id: "providencia",
    name: "Providencia",
    country: "Chile",
    code: "CL",
    lat: -33.4314,
    lon: -70.6093,
    joined: "2023-08-22",
    population: 157749,
    area: 14.4,
    elevation: 604,
    summary:
      "Comuna metropolitana que prueba soluciones de eficiencia hídrica, movilidad segura y gestión basada en evidencia.",
    themes: ["Agua y resiliencia", "Movilidad sostenible", "Innovación pública"],
    demoPeople: [
      { name: "Antonia Leiva Contreras", role: "Diseñadora de servicios públicos" },
      { name: "Tomás Valdés Mena", role: "Analista de movilidad urbana" }
    ],
    institution: "Municipalidad de Providencia · HUB Providencia",
    institutionType: "Gobierno local / hub de innovación",
    projects: [
      {
        title: "Piloto de estrategias de ahorro de agua en escuelas",
        description:
          "Monitoreo, señales conductuales y reutilización de aguas grises para reducir de forma sostenida el consumo escolar.",
        source: "hub",
        status: "Piloto",
        year: 2026
      },
      "Cruces seguros con datos"
    ],
    program: "Providencia experimenta",
    initiatives: ["Patios de lluvia", "Caminos escolares", "Desafío cero filas", "Observatorio de veredas"],
    award: "Sello piloto urbano replicable 2025"
  },
  {
    id: "cordoba",
    name: "Córdoba",
    country: "Argentina",
    code: "AR",
    lat: -31.4201,
    lon: -64.1888,
    joined: "2023-06-09",
    population: 1565112,
    area: 576,
    elevation: 390,
    summary:
      "Ecosistema municipal de GovTech y economía del conocimiento que conecta desafíos públicos con talento emprendedor.",
    themes: ["Innovación pública", "Transformación digital", "Datos urbanos"],
    demoPeople: [{ name: "Lucía Ferreyra", role: "Líder de experimentación urbana" }],
    institution: "Municipalidad de Córdoba · CorLab",
    institutionType: "Laboratorio de innovación pública y GovTech",
    projects: ["Gemelo cívico de trámites", "Compras públicas de innovación"],
    program: "Aceleradora GovTech Córdoba",
    initiatives: ["Banco de desafíos", "Demo Day municipal", "Comunidad de datos", "Residencias cívicas"],
    award: "Mención HUB a ecosistema GovTech 2025"
  },
  {
    id: "tuxtla-gutierrez",
    name: "Tuxtla Gutiérrez",
    country: "México",
    code: "MX",
    lat: 16.7516,
    lon: -93.1029,
    joined: "2024-05-17",
    population: 604147,
    area: 334.9,
    elevation: 522,
    summary:
      "Nodo de planificación sostenible que combina observación territorial, adaptación climática y participación ciudadana.",
    themes: ["Planificación urbana", "Datos urbanos", "Agua y resiliencia"],
    demoPeople: [{ name: "Mariana López Coutiño", role: "Especialista en planeación participativa" }],
    institution:
      "Instituto Ciudadano de Planeación Municipal para el Desarrollo Sustentable de Tuxtla Gutiérrez",
    institutionType: "Instituto municipal de planeación",
    projects: ["Atlas de crecimiento sostenible", "Calles frescas Tuxtla"],
    program: "Planeación cercana",
    initiatives: ["Datos de colonia", "Rutas de sombra", "Cabildo joven", "Laboratorio de suelo urbano"],
    award: "Reconocimiento demo a planeación abierta 2024"
  },
  {
    id: "renca",
    name: "Renca",
    country: "Chile",
    code: "CL",
    lat: -33.4064,
    lon: -70.7273,
    joined: "2023-08-22",
    population: 160847,
    area: 24.2,
    elevation: 496,
    summary:
      "Laboratorio comunal que articula innovación pública, circularidad y respuestas locales a la crisis hídrica.",
    themes: ["Agua y resiliencia", "Economía circular", "Innovación pública"],
    demoPeople: [
      { name: "Camila Sepúlveda Díaz", role: "Coordinadora de proyectos urbanos" },
      { name: "Felipe Muñoz Arancibia", role: "Gestor de alianzas comunitarias" }
    ],
    institution: "Municipalidad de Renca · La Fábrica",
    institutionType: "Gobierno local / laboratorio de innovación",
    projects: [
      {
        title: "Piloto de estrategias de ahorro de agua en escuelas",
        description:
          "Solución colaborativa con Providencia que integra monitoreo, hábitos y reúso de aguas grises en escuelas.",
        source: "hub",
        status: "Piloto",
        year: 2026
      },
      "Renca circular"
    ],
    program: "La Fábrica aprende",
    initiatives: [
      "Escuelas guardianas del agua",
      "Mercado circular",
      "Reto plaza viva",
      "Monitores de innovación"
    ],
    award: "Sello piloto urbano replicable 2025"
  },
  {
    id: "tapachula",
    name: "Tapachula",
    country: "México",
    code: "MX",
    lat: 14.9056,
    lon: -92.2634,
    joined: "2024-05-17",
    population: 353706,
    area: 303,
    elevation: 177,
    summary:
      "Ciudad fronteriza que explora soluciones de movilidad humana, mercados resilientes y planificación inclusiva.",
    themes: ["Movilidad sostenible", "Planificación urbana", "Participación ciudadana"],
    demoPeople: [
      { name: "Fernanda Méndez Roblero", role: "Coordinadora de movilidad e inclusión" },
      { name: "Luis Castellanos Pérez", role: "Analista territorial" }
    ],
    institution: "Instituto Ciudadano de Planeación Municipal de Tapachula",
    institutionType: "Instituto municipal de planeación",
    projects: ["Observatorio de movilidad fronteriza", "Mercados resilientes"],
    program: "Frontera urbana inclusiva",
    initiatives: ["Rutas de acogida", "Datos del mercado", "Cruces caminables", "Voces del barrio"],
    award: "Mención demo a inclusión urbana 2025"
  },
  {
    id: "guayaquil",
    name: "Guayaquil",
    country: "Ecuador",
    code: "EC",
    lat: -2.1709,
    lon: -79.9224,
    joined: "2023-11-03",
    population: 2746403,
    area: 344.5,
    elevation: 4,
    summary:
      "Nodo costero de innovación y competitividad con foco en transformación digital y adaptación basada en ecosistemas.",
    themes: ["Transformación digital", "Agua y resiliencia", "Innovación pública"],
    demoPeople: [{ name: "Valentina Cedeño Vera", role: "Líder de innovación climática" }],
    institution: "Empresa Pública Municipal para la Gestión de la Innovación y la Competitividad · ÉPICO",
    institutionType: "Empresa pública municipal",
    projects: ["Manglar urbano", "Ventanilla digital 360"],
    program: "ÉPICO ciudad laboratorio",
    initiatives: ["Reto estero vivo", "Trámites sin papel", "Datos del calor", "Emprende barrio"],
    award: "Mención demo a transformación digital 2025"
  },
  {
    id: "montevideo",
    name: "Montevideo",
    country: "Uruguay",
    code: "UY",
    lat: -34.9011,
    lon: -56.1645,
    joined: "2023-06-09",
    population: 1302954,
    area: 530,
    elevation: 43,
    summary:
      "Laboratorio urbano con experiencia en gobierno abierto, movilidad barrial y políticas públicas centradas en cuidados.",
    themes: ["Datos urbanos", "Movilidad sostenible", "Participación ciudadana"],
    demoPeople: [{ name: "Lucía Bentancur Silva", role: "Diseñadora de políticas públicas" }],
    institution: "Intendencia de Montevideo · Montevideo Lab",
    institutionType: "Laboratorio de innovación pública",
    projects: ["Laboratorio de movilidad barrial", "Datos abiertos de cuidados"],
    program: "Montevideo prueba",
    initiatives: ["Barrios en beta", "Mapa de cuidados", "Bicidatos", "Gobierno abierto en calle"],
    award: "Mención demo a gobierno abierto 2024"
  },
  {
    id: "quito",
    name: "Quito",
    country: "Ecuador",
    code: "EC",
    lat: -0.1807,
    lon: -78.4678,
    joined: "2023-11-03",
    population: 2781641,
    area: 4230,
    elevation: 2850,
    summary:
      "Distrito metropolitano andino que vincula gestión del agua, ordenamiento territorial y soluciones basadas en naturaleza.",
    themes: ["Agua y resiliencia", "Hábitat y vivienda", "Planificación urbana"],
    demoPeople: [{ name: "Mateo Andrade Cárdenas", role: "Especialista en infraestructura verde" }],
    institution:
      "Municipio del Distrito Metropolitano de Quito · Secretaría de Hábitat y Ordenamiento Territorial",
    institutionType: "Gobierno metropolitano",
    projects: [
      {
        title: "YAKU",
        description:
          "Sistema que capta agua lluvia en células subterráneas y la libera gradualmente al suelo, imitando ecosistemas de montaña.",
        source: "hub",
        status: "En marcha",
        year: 2026
      },
      "Hábitat de proximidad"
    ],
    program: "Quito territorio vivo",
    initiatives: [
      "Patios esponja",
      "Catálogo de vivienda adaptable",
      "Datos de quebradas",
      "Laboratorio de laderas"
    ],
    award: "Sello demo a solución basada en naturaleza 2025"
  },
  {
    id: "miraflores",
    name: "Miraflores",
    locality: "Lima Metropolitana",
    country: "Perú",
    code: "PE",
    lat: -12.1211,
    lon: -77.0297,
    joined: "2024-01-26",
    population: 116409,
    area: 9.62,
    elevation: 79,
    summary:
      "Distrito costero que experimenta con caminabilidad, confort térmico y servicios digitales de proximidad.",
    themes: ["Movilidad sostenible", "Transformación digital", "Agua y resiliencia"],
    demoPeople: [
      { name: "Camila Salazar Ponce", role: "Coordinadora de diseño urbano" },
      { name: "Andrés Núñez del Prado", role: "Analista de innovación digital" }
    ],
    institution: "Municipalidad de Miraflores · HUB de Innovación Miraflores",
    institutionType: "Gobierno local / hub de innovación",
    projects: ["Corredores frescos", "Laboratorio de movilidad peatonal"],
    program: "Miraflores a escala humana",
    initiatives: ["Cruces 30", "Sombra costera", "Trámite móvil", "Banco de prototipos"],
    award: "Mención demo a espacio público 2025"
  },
  {
    id: "curitiba",
    name: "Curitiba",
    country: "Brasil",
    code: "BR",
    lat: -25.4284,
    lon: -49.2733,
    joined: "2023-06-09",
    population: 1773718,
    area: 434.9,
    elevation: 934,
    summary:
      "Capital del sur de Brasil que combina tradición de planificación, movilidad y nuevas capacidades de resiliencia urbana.",
    themes: ["Movilidad sostenible", "Agua y resiliencia", "Datos urbanos"],
    demoPeople: [{ name: "Ana Beatriz Souza", role: "Coordinadora de resiliencia urbana" }],
    institution: "Municipalidad de Curitiba · Coordenadoria Municipal de Proteção e Defesa Civil",
    institutionType: "Gobierno local / defensa civil",
    projects: ["Rutas climáticas", "Defensa Civil Predictiva"],
    program: "Curitiba resiliente",
    initiatives: ["Paradas frescas", "Alertas de barrio", "Mapa de refugios", "Reto movilidad limpia"],
    award: "Mención demo a resiliencia urbana 2025"
  },
  {
    id: "medellin",
    name: "Medellín",
    country: "Colombia",
    code: "CO",
    lat: 6.2442,
    lon: -75.5812,
    joined: "2023-06-09",
    population: 2612958,
    area: 380.6,
    elevation: 1495,
    summary:
      "Nodo andino de ciudad inteligente que conecta capacidades públicas, tecnología cívica y aprendizaje en las comunas.",
    themes: ["Transformación digital", "Datos urbanos", "Innovación pública"],
    demoPeople: [
      { name: "Carolina Restrepo Maya", role: "Líder de innovación cívica" },
      { name: "Sebastián Vélez Toro", role: "Científico de datos urbanos" }
    ],
    institution: "Alcaldía de Medellín · Subsecretaría de Ciudad Inteligente",
    institutionType: "Gobierno municipal",
    projects: ["Comunas con datos", "Ruta GovTech Medellín"],
    program: "Medellín aprende haciendo",
    initiatives: [
      "Datos en la cuadra",
      "Reto movilidad accesible",
      "Laboratorio de servicios",
      "Mentores GovTech"
    ],
    award: "Mención demo a inteligencia urbana 2025"
  },
  {
    id: "ciudad-guatemala",
    name: "Ciudad de Guatemala",
    country: "Guatemala",
    code: "GT",
    lat: 14.6349,
    lon: -90.5069,
    joined: "2023-11-03",
    population: 1213651,
    area: 228,
    elevation: 1500,
    summary:
      "Capital centroamericana que ensaya soluciones accesibles para vivienda, confort térmico y planificación metropolitana.",
    themes: ["Hábitat y vivienda", "Agua y resiliencia", "Planificación urbana"],
    demoPeople: [{ name: "Ana Lucía Paredes", role: "Especialista en vivienda y clima" }],
    institution: "Municipalidad de Guatemala · Gerencia de Planificación",
    institutionType: "Gobierno municipal",
    projects: [
      {
        title: "Guía para la autoadecuación de viviendas y mejora del confort térmico",
        description:
          "Autodiagnóstico y catálogo de soluciones de bajo costo para reducir el calor dentro de viviendas existentes.",
        source: "hub",
        status: "En marcha",
        year: 2026
      },
      "Sombra para el barrio"
    ],
    program: "Vivienda preparada",
    initiatives: ["Casa fresca", "Mapa de islas de calor", "Patios productivos", "Taller de autodiagnóstico"],
    award: "Sello demo a innovación habitacional 2025"
  },
  {
    id: "nunoa",
    name: "Ñuñoa",
    locality: "Santiago de Chile",
    country: "Chile",
    code: "CL",
    lat: -33.4569,
    lon: -70.5978,
    joined: "2024-03-14",
    population: 250192,
    area: 16.9,
    elevation: 610,
    summary:
      "Comuna de Santiago enfocada en circularidad, barrios caminables y experimentación con comunidades educativas.",
    themes: ["Economía circular", "Movilidad sostenible", "Participación ciudadana"],
    demoPeople: [
      { name: "Francisca Rojas Silva", role: "Coordinadora de economía circular" },
      { name: "Nicolás Fuentes Araya", role: "Diseñador de movilidad barrial" }
    ],
    institution: "Municipalidad de Ñuñoa · HUB Ñuñoa",
    institutionType: "Gobierno local / hub de innovación",
    projects: ["Escuelas cero residuos", "Barrios de 15 minutos"],
    program: "Ñuñoa circular",
    initiatives: ["Compostaje en red", "Calles para jugar", "Reto comercio limpio", "Mapa caminable"],
    award: "Mención demo a circularidad local 2025"
  },
  {
    id: "bogota",
    name: "Bogotá",
    country: "Colombia",
    code: "CO",
    lat: 4.711,
    lon: -74.0721,
    joined: "2023-06-09",
    population: 7929539,
    area: 1775,
    elevation: 2640,
    summary:
      "Distrito capital que articula planeación, datos territoriales e innovación aplicada a servicios y sistemas de cuidado.",
    themes: ["Datos urbanos", "Planificación urbana", "Innovación pública"],
    demoPeople: [{ name: "Laura Méndez Cárdenas", role: "Diseñadora de servicios urbanos" }],
    institution: "Secretaría Distrital de Planeación · Laboratorio de Ciudad de Bogotá",
    institutionType: "Gobierno distrital / laboratorio de ciudad",
    projects: ["Modelo de datos territoriales", "Laboratorio de cuidado urbano"],
    program: "Bogotá prototipa",
    initiatives: [
      "Reto manzana del cuidado",
      "Visor de proximidad",
      "Residencias de innovación",
      "Datos con la ciudadanía"
    ],
    award: "Mención demo a planeación con datos 2025"
  },
  {
    id: "mendoza",
    name: "Mendoza",
    country: "Argentina",
    code: "AR",
    lat: -32.8895,
    lon: -68.8458,
    joined: "2024-01-26",
    population: 121620,
    area: 57,
    elevation: 746,
    summary:
      "Ciudad oasis que trabaja sobre gestión hídrica, confort urbano y análisis territorial para la adaptación climática.",
    themes: ["Agua y resiliencia", "Datos urbanos", "Planificación urbana"],
    demoPeople: [
      { name: "Paula Quiroga Funes", role: "Arquitecta de adaptación climática" },
      { name: "Martín Sosa Pereyra", role: "Analista geoespacial" }
    ],
    institution: "Municipalidad de la Ciudad de Mendoza · Laboratorio y Análisis Urbano",
    institutionType: "Gobierno local / laboratorio urbano",
    projects: ["Ciudad sombra", "Tablero hídrico abierto"],
    program: "Mendoza oasis vivo",
    initiatives: ["Mapa del arbolado", "Guardianes de acequias", "Refugios climáticos", "Datos de sombra"],
    award: "Mención demo a adaptación climática 2024"
  },
  {
    id: "chihuahua",
    name: "Chihuahua Capital",
    country: "México",
    code: "MX",
    lat: 28.632,
    lon: -106.0691,
    joined: "2024-09-12",
    population: 925762,
    area: 9219,
    elevation: 1415,
    summary:
      "Ecosistema del norte de México que conecta emprendimiento, innovación pública y respuestas al calor urbano.",
    themes: ["Innovación pública", "Transformación digital", "Agua y resiliencia"],
    demoPeople: [
      { name: "Sofía Villalobos Cano", role: "Gestora de ecosistema emprendedor" },
      { name: "Carlos Ortega Molina", role: "Especialista en tecnología urbana" }
    ],
    institution: "Startup Chihuahua",
    institutionType: "Organización de innovación y emprendimiento",
    projects: ["Distrito emprendedor", "Sensor urbano de calor"],
    program: "Chihuahua innova en red",
    initiatives: ["Reto clima extremo", "Mentoría GovTech", "Datos para pymes", "Laboratorio del desierto"],
    award: "Mención demo a ecosistema emprendedor 2025"
  }
];

const projectStatuses = ["En curso", "Piloto", "Diseño", "Escalamiento"];

function normalizeProject(project, city, index, cityIndex) {
  if (typeof project === "object") return project;
  return {
    title: project,
    description: `${project} articula un piloto local de ${city.themes[index % city.themes.length].toLowerCase()} con potencial de aprendizaje y réplica para otras ciudades del HUB.`,
    source: "demo",
    status: projectStatuses[(cityIndex + index) % projectStatuses.length],
    year: 2025 + (index % 2)
  };
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

// Los datos personales viven en data/personas-hub.js, aislados para poder
// aplicar una rectificación o una baja sin tocar el resto del modelo.
const hubPeople = window.HUB_PEOPLE || {};

const initiativeNarratives = [
  ({ title, cityName }) =>
    `Activación breve que pone a prueba ${title.toLowerCase()} con equipos municipales de ${cityName} y cierra con una guía de réplica para la red.`,
  ({ theme }) =>
    `Convocatoria abierta de ${theme.toLowerCase()} que reúne a vecinas, academia y funcionarios alrededor de un desafío acotado.`,
  ({ theme }) =>
    `Piloto de bajo costo para medir qué funciona en ${theme.toLowerCase()} antes de comprometer presupuesto de programa.`,
  ({ theme, cityName }) =>
    `Intercambio entre pares en el que ${cityName} comparte su método de ${theme.toLowerCase()} y recoge aprendizajes de otras ciudades del HUB.`
];

const awardBodies = [
  "Reconocimiento de demostración · red HUB",
  "Jurado de pares de la red (demostración)",
  "Mención de la asamblea anual (demostración)",
  "Comité regional de aprendizajes (demostración)"
];

const HUB_CITIES = rawCities.map((city, cityIndex) => {
  const people = [
    ...(hubPeople[city.id] || []).map(person => ({
      ...person,
      source: "hub",
      initials: initials(person.name),
      organization: city.institution,
      sourceUrl: HUB_DIRECTORY_URL
    })),
    ...city.demoPeople.map(person => ({
      ...person,
      initials: initials(person.name),
      organization: city.institution,
      source: "demo"
    }))
  ];

  return {
    ...city,
    people,
    institutions: [
      {
        name: city.institution,
        type: city.institutionType,
        role: "Institución nodo y enlace principal de la ciudad.",
        source: "hub",
        sourceUrl: HUB_DIRECTORY_URL
      },
      {
        name: `Red de Innovación de ${city.name}`,
        type: "Alianza multisectorial (demostración)",
        role: `Conecta academia, sociedad civil y ecosistema emprendedor alrededor de ${city.themes[0].toLowerCase()}.`,
        source: "demo"
      }
    ],
    projects: city.projects.map((project, index) => normalizeProject(project, city, index, cityIndex)),
    programs: [
      {
        title: city.program,
        description: `Programa anual de formación y acompañamiento para equipos públicos en ${city.themes.slice(0, 2).join(" y ").toLowerCase()}.`,
        status: cityIndex % 3 === 0 ? "Convocatoria" : "Activo",
        source: "demo",
        participants: 24 + cityIndex * 3
      }
    ],
    initiatives: city.initiatives.map((title, index) => ({
      title,
      description: initiativeNarratives[(cityIndex + index) % initiativeNarratives.length]({
        title,
        theme: city.themes[index % city.themes.length],
        cityName: city.name
      }),
      status: ["Activa", "Completada", "En diseño", "Activa"][(cityIndex + index) % 4],
      source: "demo"
    })),
    awards: [
      {
        title: city.award,
        year: cityIndex % 4 === 0 ? 2024 : 2025,
        organization: awardBodies[cityIndex % awardBodies.length],
        source: "demo"
      }
    ],
    dataSource: "demo",
    updated: "2026-08-28"
  };
});

/*
 * Áreas metropolitanas.
 *
 * Tres comunas de la red —Providencia, Ñuñoa y Renca— pertenecen al Gran
 * Santiago y quedan a poco más de un píxel entre sí a escala continental. En
 * vez de dibujarlas siempre desplegadas, el mapa muestra un nodo de Santiago
 * mientras está alejado y las abre al acercar.
 *
 * Un área metropolitana no es una ciudad de la red: no aparece en el
 * directorio, no suma a los KPI y no tiene ficha propia. Es solo una forma de
 * agrupar en el mapa.
 */
const HUB_METROS = [
  {
    id: "santiago",
    name: "Santiago",
    country: "Chile",
    code: "CL",
    lat: -33.4489,
    lon: -70.6693,
    members: ["providencia", "nunoa", "renca"],
    note: "Tres comunas de la red en el Gran Santiago"
  }
];

const HUB_CONNECTIONS = [
  { from: "quito", to: "ciudad-guatemala", theme: "Hábitat y vivienda" },
  { from: "quito", to: "mendoza", theme: "Agua y resiliencia" },
  { from: "renca", to: "providencia", theme: "Agua y resiliencia" },
  { from: "providencia", to: "nunoa", theme: "Movilidad sostenible" },
  { from: "bogota", to: "medellin", theme: "Datos urbanos" },
  { from: "cordoba", to: "chihuahua", theme: "Innovación pública" },
  { from: "cordoba", to: "mendoza", theme: "Datos urbanos" },
  { from: "curitiba", to: "montevideo", theme: "Movilidad sostenible" },
  { from: "san-jose", to: "ciudad-guatemala", theme: "Participación ciudadana" },
  { from: "tuxtla-gutierrez", to: "tapachula", theme: "Planificación urbana" },
  { from: "guayaquil", to: "miraflores", theme: "Agua y resiliencia" },
  { from: "medellin", to: "guayaquil", theme: "Transformación digital" }
];

/*
 * D-03: entre los datos y la vista no había ninguna comprobación. Una ciudad
 * sin `themes` rompía el tooltip, una sin `awards` dejaba el porcentaje de
 * verificación en NaN, y una conexión hacia un identificador inexistente
 * rompía el trazado de las curvas — todo en silencio.
 *
 * El esquema se declara aquí y se valida al cargar. Un registro que no lo
 * cumple se descarta y queda anotado en HUB_ATLAS.issues, que la interfaz
 * muestra, en vez de propagarse hasta un error de render.
 */
const CITY_SCHEMA = {
  id: "string",
  name: "string",
  country: "string",
  code: "string",
  lat: "number",
  lon: "number",
  joined: "date",
  updated: "date",
  population: "number",
  area: "number",
  elevation: "number",
  summary: "string",
  themes: "string[]",
  people: "object[]",
  institutions: "object[]",
  projects: "object[]",
  programs: "object[]",
  initiatives: "object[]",
  awards: "object[]"
};

function checkField(value, kind) {
  switch (kind) {
    case "string":
      return typeof value === "string" && value.trim().length > 0;
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "date":
      return (
        typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
      );
    case "string[]":
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every(item => typeof item === "string" && item.trim())
      );
    case "object[]":
      return Array.isArray(value) && value.every(item => item && typeof item === "object");
    default:
      return false;
  }
}

function validateAtlas(cities, connections) {
  const issues = [];
  const validCities = cities.filter(city => {
    const missing = Object.entries(CITY_SCHEMA)
      .filter(([field, kind]) => !checkField(city[field], kind))
      .map(([field]) => field);
    if (!missing.length) return true;
    issues.push(
      `Ciudad "${city?.id || "sin id"}" descartada; campos inválidos o ausentes: ${missing.join(", ")}.`
    );
    return false;
  });

  const seen = new Set();
  const uniqueCities = validCities.filter(city => {
    if (seen.has(city.id)) {
      issues.push(`Identificador duplicado: "${city.id}". Se conserva la primera aparición.`);
      return false;
    }
    seen.add(city.id);
    return true;
  });

  // Las coordenadas fuera de rango reencuadrarían el mapa entero.
  uniqueCities.forEach(city => {
    if (Math.abs(city.lat) > 90 || Math.abs(city.lon) > 180) {
      issues.push(`Coordenadas fuera de rango en "${city.id}": ${city.lat}, ${city.lon}.`);
    }
  });

  const validConnections = connections.filter(connection => {
    const ok = seen.has(connection.from) && seen.has(connection.to);
    if (!ok) {
      issues.push(
        `Conexión descartada: ${connection.from} ↔ ${connection.to} apunta a una ciudad inexistente.`
      );
    }
    return ok;
  });

  return { cities: uniqueCities, connections: validConnections, issues };
}

const validated = validateAtlas(HUB_CITIES, HUB_CONNECTIONS);

// Un área metropolitana sin miembros válidos no tiene nada que agrupar.
const validIds = new Set(validated.cities.map(city => city.id));
const validatedMetros = HUB_METROS.map(metro => ({
  ...metro,
  members: metro.members.filter(id => validIds.has(id))
})).filter(metro => {
  if (metro.members.length >= 2) return true;
  validated.issues.push(`Área metropolitana "${metro.id}" descartada: necesita 2 o más ciudades válidas.`);
  return false;
});

window.HUB_ATLAS = {
  cities: validated.cities,
  connections: validated.connections,
  metros: validatedMetros,
  issues: validated.issues,
  sources: {
    directory: HUB_DIRECTORY_URL,
    home: HUB_HOME_URL,
    map: "Natural Earth · Admin 0 Countries · escala 1:110m"
  },
  referenceDate: "2026-09-05"
};
