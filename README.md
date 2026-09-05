# Atlas de conocimiento · HUB de Ciudades

Prototipo navegable de exploración cartográfica para la red del HUB de Ciudades de América Latina y el Caribe.

**En línea:** https://chatoyakana.github.io/atlas-hub-ciudades/

## Qué incluye

- Mapa vectorial interactivo de América Latina y el Caribe, con nombres de país colocados sin colisiones.
- 17 ciudades del directorio público del HUB en 10 países.
- Búsqueda por ciudad, persona, institución, proyecto o iniciativa.
- Vista de directorio: las 51 personas de la red con su institución, ciudad y procedencia, sujeta a los mismos filtros.
- Filtros por país y tema de conocimiento.
- Conexiones temáticas entre nodos.
- Zoom automático a la ciudad seleccionada, y agrupación del Gran Santiago en un nodo que se abre al acercar.
- Ficha por ciudad con:
  - datos base y tiempo en la red;
  - mínimo 3 personas;
  - 2 instituciones;
  - 2 proyectos;
  - 1 programa;
  - 4 iniciativas;
  - premios y nivel de verificación.
- Ficha de detalle para cada entidad: personas, instituciones, proyectos, programas, iniciativas y premios.
- Exportación de cada ficha de ciudad en PDF, y de sus datos en JSON.
- Diseño adaptable a escritorio y móvil.

## Transparencia de datos

La interfaz distingue dos tipos de registro:

- **Fuente HUB:** instituciones nodo publicadas en el [directorio oficial](https://hubdeciudades.org/directorio/) y algunos proyectos destacados en el sitio del HUB. Son datos de organización, no de personas.
- **Demo:** datos base, fechas de adhesión, personas adicionales, premios, programas e iniciativas creados para probar el prototipo. No deben interpretarse como información oficial.

La cartografía utiliza geometrías simplificadas de **Natural Earth**, escala 1:110m
(Admin 0 – Countries). Natural Earth es de dominio público y no exige atribución,
pero se declara aquí y en el pie del mapa.

Las posiciones de los nodos y de las etiquetas se calculan al dibujar: los nodos que
caen a menos de 15 px entre sí —las tres comunas de Santiago quedan a poco más de
1 px— se agrupan y se despliegan en abanico con línea guía, y cada etiqueta elige
entre ocho posiciones candidatas la que no choca con otras etiquetas, con los nodos
ni con el borde del lienzo. No hay desplazamientos calibrados a mano.

## Exportación en PDF

El botón «Exportar PDF» compone una hoja con la ficha completa —no solo la
pestaña abierta— y abre el diálogo de impresión, donde el navegador ofrece
«Guardar como PDF».

Se hace así, y no con una librería, por dos razones: el prototipo mantiene su
promesa de no tener dependencias en tiempo de ejecución, y el resultado es un
PDF con texto seleccionable y buscable, en vez de una captura rasterizada de la
pantalla. La contrapartida es que la descarga pasa por el diálogo del navegador
en lugar de ser directa.

## Datos personales

**El prototipo no contiene datos de personas identificables.** Las 51 personas que
aparecen en el atlas son inventadas, incluidas las 25 que antes recogían nombres
del directorio público del HUB.

Se cambiaron a propósito. Una demostración no necesita personas reales para probar
la experiencia, y versionarlas en Git las volvía permanentes: el historial las
conserva aunque el directorio cambie o alguien pida su baja, y un `git revert` no
las borra. Los cargos sí se conservan, porque describen funciones institucionales
y no identifican a nadie.

El sello **Fuente HUB** queda para instituciones y proyectos, que son datos de
organización publicados por el HUB. Ninguna persona lo lleva.

Los correos de las fichas usan el dominio reservado `.test`, que no puede existir
en internet, para que ninguno pueda confundirse con uno real.

`data/personas.js` sigue siendo un archivo aparte aunque ya no contenga datos
sensibles: es el lugar donde entrarían personas reales si el atlas se conectara a
una fuente administrable, y la aplicación arranca con él vacío. Si eso llega a
ocurrir, antes hay que resolver dos cosas: quién atiende una solicitud de
rectificación o supresión y en qué plazo, y mantener la regla que ya está escrita
en `data.js` —a una persona real no se le genera biografía, formación ni
contacto—.

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
- `data/personas.js`: listado de personas, íntegramente sintético y aislado a propósito (ver más abajo).
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
la cartografía de Natural Earth
—dominio público—, que conservan su propia procedencia. Ver [LICENSE](LICENSE).

## Próxima fase sugerida

Reemplazar `data.js` por una fuente administrable —CMS, base de datos o Google Sheet— e incorporar por registro: responsable, URL de fuente, fecha de actualización, licencia y estado de verificación.
