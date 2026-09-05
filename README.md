# Atlas de conocimiento · HUB de Ciudades

Prototipo navegable de exploración cartográfica para la red del HUB de Ciudades de América Latina y el Caribe.

## Qué incluye

- Mapa vectorial interactivo de América Latina y el Caribe.
- 17 ciudades del directorio público del HUB en 10 países.
- Búsqueda por ciudad, persona, institución, proyecto o iniciativa.
- Filtros por país y tema de conocimiento.
- Conexiones temáticas entre nodos.
- Ficha por ciudad con:
  - datos base y tiempo en la red;
  - mínimo 3 personas;
  - 2 instituciones;
  - 2 proyectos;
  - 1 programa;
  - 4 iniciativas;
  - premios y nivel de verificación.
- Exportación de cada ficha en JSON.
- Diseño adaptable a escritorio y móvil.

## Transparencia de datos

La interfaz distingue dos tipos de registro:

- **Fuente HUB:** nombres, cargos e instituciones publicados en el [directorio oficial](https://hubdeciudades.org/directorio/), además de algunos proyectos destacados en el sitio del HUB.
- **Demo:** datos base, fechas de adhesión, personas adicionales, premios, programas e iniciativas creados para probar el prototipo. No deben interpretarse como información oficial.

La cartografía utiliza geometrías simplificadas de **Natural Earth**, escala 1:110m.

## Ejecutar localmente

No requiere instalación de dependencias ni compilación.

```bash
cd atlas-hub
python3 -m http.server 4173 --bind 0.0.0.0
```

Luego abre `http://localhost:4173`.

> Se recomienda servir la carpeta con HTTP porque el mapa carga el GeoJSON local mediante `fetch`.

## Archivos principales

- `index.html`: estructura de la aplicación.
- `styles.css`: sistema visual y diseño adaptable.
- `data.js`: modelo de conocimiento y contenido del prototipo.
- `app.js`: filtros, mapa, paneles, exportación e interacciones.
- `data/latam-countries.geojson`: capa cartográfica local.
- `assets/hub-mark.png`: marca gráfica usada en la cabecera.

## Próxima fase sugerida

Reemplazar `data.js` por una fuente administrable —CMS, base de datos o Google Sheet— e incorporar por registro: responsable, URL de fuente, fecha de actualización, licencia y estado de verificación.
