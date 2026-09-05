# Atlas de conocimiento · HUB de Ciudades

Prototipo navegable de exploración cartográfica para la red del HUB de Ciudades de América Latina y el Caribe.

**En línea:** https://chatoyakana.github.io/atlas-hub-ciudades/

## Qué incluye

- Mapa vectorial interactivo de América Latina y el Caribe.
- 17 ciudades del directorio público del HUB en 10 países.
- Búsqueda por ciudad, persona, institución, proyecto o iniciativa.
- Vista de directorio: las 51 personas de la red con su institución, ciudad y procedencia, sujeta a los mismos filtros.
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

La cartografía utiliza geometrías simplificadas de **Natural Earth**, escala 1:110m
(Admin 0 – Countries). Natural Earth es de dominio público y no exige atribución,
pero se declara aquí y en el pie del mapa.

Las posiciones de los nodos y de las etiquetas se calculan al dibujar: los nodos que
caen a menos de 15 px entre sí —las tres comunas de Santiago quedan a poco más de
1 px— se agrupan y se despliegan en abanico con línea guía, y cada etiqueta elige
entre ocho posiciones candidatas la que no choca con otras etiquetas, con los nodos
ni con el borde del lienzo. No hay desplazamientos calibrados a mano.

## Datos personales

`data/personas-hub.js` contiene nombres, cargos e instituciones de 25 personas
identificables, tomados del [directorio público del HUB](https://hubdeciudades.org/directorio/).
Son datos de fuente pública, pero versionarlos en Git los vuelve permanentes: el
historial los conserva aunque el directorio cambie.

Por eso el archivo está separado del resto del modelo, y la aplicación funciona con
él vacío: si se elimina su contenido, el atlas carga igual y solo muestra las
personas de demostración. Cualquier solicitud de rectificación o supresión se aplica
ahí, en un único lugar.

Si detectas un dato tuyo que quieres corregir o retirar, abre una incidencia en el
repositorio o escribe a quien lo mantiene; se aplica sobre ese archivo y se refleja
en el siguiente despliegue.

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
- `data/personas-hub.js`: datos personales tomados del directorio público, aislados a propósito (ver más abajo).
- `app.js`: filtros, mapa, paneles, exportación e interacciones.
- `data/latam-countries.geojson`: capa cartográfica local.
- `assets/hub-mark.png`: marca gráfica usada en la cabecera.

## Comprobaciones

El prototipo se sigue sirviendo sin build ni dependencias en tiempo de ejecución.
Las herramientas son solo de desarrollo:

```bash
npm install
npm test        # valida el modelo de datos y los mínimos por ficha
npm run lint    # ESLint
npm run format  # Prettier
```

`npm test` no necesita navegador: carga `data.js` en un contexto mínimo y
comprueba las invariantes que la interfaz da por supuestas —identificadores
únicos, conexiones sin extremos huérfanos, países con geometría, procedencia
declarada en cada registro y los mínimos que promete este README—. La
integración continua ejecuta ambos en cada `push`.

`npm run format` aplica Prettier; `npm run format:check` lo verifica sin
escribir, y el CI lo ejecuta en cada `push`.

## Validación de datos

`data.js` declara un esquema por ciudad y lo valida al cargar. Un registro que
no lo cumple se descarta y queda anotado en `HUB_ATLAS.issues`; la interfaz lo
avisa por consola y con un mensaje, en lugar de propagar el dato hasta un error
de render. Lo mismo con las conexiones que apuntan a una ciudad inexistente.

## Licencia

El código se publica bajo licencia MIT y el contenido bajo
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es), de modo que
cualquier ciudad de la red pueda reutilizarlo citando la fuente. Quedan fuera
los datos personales del directorio del HUB y la cartografía de Natural Earth
—dominio público—, que conservan su propia procedencia. Ver [LICENSE](LICENSE).

## Próxima fase sugerida

Reemplazar `data.js` por una fuente administrable —CMS, base de datos o Google Sheet— e incorporar por registro: responsable, URL de fuente, fecha de actualización, licencia y estado de verificación.
