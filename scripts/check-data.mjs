/*
 * Smoke test del modelo de datos. No necesita navegador: carga data.js en un
 * contexto con un window mínimo y comprueba las invariantes que la interfaz da
 * por supuestas, incluidos los mínimos por ficha que promete el README.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const context = { window: {}, console };
vm.createContext(context);
for (const file of ["data/personas-hub.js", "data.js"]) {
  vm.runInContext(readFileSync(join(root, file), "utf8"), context, { filename: file });
}

const atlas = context.window.HUB_ATLAS;
const geojson = JSON.parse(readFileSync(join(root, "data/latam-countries.geojson"), "utf8"));
const failures = [];

function check(description, condition, detail = "") {
  if (condition) {
    console.log(`  ok   ${description}`);
  } else {
    failures.push(`${description}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL ${description}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("Modelo de datos");
check("el validador no descartó ningún registro", atlas.issues.length === 0, atlas.issues.join(" / "));
check("hay al menos una ciudad", atlas.cities.length > 0);

const ids = new Set(atlas.cities.map(city => city.id));
check("los identificadores son únicos", ids.size === atlas.cities.length);

const orphans = atlas.connections.filter(c => !ids.has(c.from) || !ids.has(c.to));
check("ninguna conexión apunta a una ciudad inexistente", orphans.length === 0, `${orphans.length} huérfanas`);

const countries = new Set(atlas.cities.map(city => city.country));
const geoNames = new Set(geojson.features.map(feature => feature.properties.name));
const missingGeometry = [...countries].filter(country => !geoNames.has(country));
check("todo país con ciudad tiene geometría", missingGeometry.length === 0, missingGeometry.join(", "));

console.log("\nMínimos por ficha (README)");
const minimums = { people: 3, institutions: 2, projects: 2, programs: 1, initiatives: 4 };
for (const [field, minimum] of Object.entries(minimums)) {
  const short = atlas.cities.filter(city => (city[field] || []).length < minimum);
  check(`cada ciudad tiene ${minimum}+ en ${field}`, short.length === 0, short.map(c => c.id).join(", "));
}

console.log("\nProcedencia y contenido");
const everyRecordHasSource = atlas.cities.every(city =>
  [...city.people, ...city.institutions, ...city.projects, ...city.programs, ...city.initiatives, ...city.awards]
    .every(record => record.source === "hub" || record.source === "demo")
);
check("todo registro declara su procedencia (hub o demo)", everyRecordHasSource);

const initiativeTexts = new Set(atlas.cities.flatMap(city => city.initiatives.map(i => i.description)));
const initiativeCount = atlas.cities.reduce((sum, city) => sum + city.initiatives.length, 0);
check(
  "las descripciones de iniciativas no son todas iguales",
  initiativeTexts.size > initiativeCount / 4,
  `${initiativeTexts.size} textos para ${initiativeCount} iniciativas`
);

const strayCoordinates = atlas.cities.filter(city => Math.abs(city.lat) > 90 || Math.abs(city.lon) > 180);
check("las coordenadas están en rango", strayCoordinates.length === 0);

console.log(
  `\n${atlas.cities.length} ciudades · ${countries.size} países · ` +
    `${atlas.cities.reduce((s, c) => s + c.people.length, 0)} personas · ` +
    `${atlas.cities.reduce((s, c) => s + c.projects.length + c.programs.length + c.initiatives.length, 0)} acciones`
);

if (failures.length) {
  console.error(`\n${failures.length} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log("\nTodas las comprobaciones pasaron.");
