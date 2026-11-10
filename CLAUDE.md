# FLORIDA · guía de la redacción

Periódico deportivo satírico del **Club Atlético de La Florida** (Oviedo, 3ª Asturfútbol, Grupo 2).
Una edición por semana, publicada el lunes/martes después de cada partido. Web estática en GitHub Pages:
sin build, todo se pinta en el navegador desde los JSON de `data/`.

## Estructura

```
index.html            portada de la última edición (o ?e=AAAA-MM-DD para una anterior)
liga.html             clasificación, calendario, resultados y goleadores (data/liga.json)
plantilla.html        fichas de jugadores + sagas (data/plantilla.json, data/sagas.json)
hemeroteca.html       todas las ediciones (data/ediciones/index.json)
memes.html            generador de memes (canvas + memegen.link, fotos de data/fotos.json)
buzon.html            buzón del lector (Supabase)
data/ediciones/AAAA-MM-DD.json   contenido de cada edición
img/ig/               fotos del Instagram del club
img/memes/            memes ya renderizados (AAAA-MM-DD-N.jpg)
img/escudos/          escudos de los rivales (asturfutbol.es)
tools/meme.sh         genera un meme con memegen.link → img/memes/
supabase/schema.sql   tablas `comentarios` y `votos`
```

## Cómo hacer una edición nueva (checklist)

1. **Leer el contexto**: la última edición en `data/ediciones/`, `data/sagas.json` (hilos abiertos)
   y `data/plantilla.json`. Lo que pasó antes condiciona el tono y los chistes de ahora.
2. **Leer el buzón** (si Supabase está activo): todo lo que haya en `comentarios` desde la edición
   anterior. Las propuestas buenas se convierten en piezas o breves; los comentarios a piezas se
   pueden citar ("Un lector nos escribe…"). Marcar `usado_en` con la fecha de la nueva edición.
3. **Actualizar `data/liga.json`** desde Asturfútbol (resultados de la jornada, `clasificacion_oficial`,
   `ultima_jornada`, `goleadores_florida`, `goleadores_liga`, `actualizado`). Asturfútbol pide
   sesión: abrirlo en un navegador real.
   - Clasificación: `NFG_VisClasificacion?cod_primaria=1000120&codcompeticion=22880347&codgrupo=23036375&codjornada=N`
   - Goleadores: `NFG_CMP_Goleadores?cod_primaria=1000120&codcompeticion=22880347&codtemporada=22&codgrupo=23036375`
   - Escudos: ficha de cada equipo `NFG_VisEquipos?cod_primaria=1000119&Codigo_Equipo=ID` → `pimg/Clubes/...`
4. **Fotos**: Instagram @clubatleticodelaflorida (se ve sin iniciar sesión). Guardar en `img/ig/`
   con nombre `jN-1.jpg`… y añadirlas a `data/fotos.json` para el generador.
5. **Memes**: `bash tools/meme.sh img/memes/AAAA-MM-DD-N.jpg <plantilla> "línea 1" "línea 2"`.
   Plantillas útiles: drake, db, fine, pigeon, harold, spiderman, pooh, exit, wonka, gru, both, stonks.
   Para memes sobre fotos propias, en el JSON de la edición usar `{ "foto", "arriba", "abajo" }`.
6. **Escribir `data/ediciones/AAAA-MM-DD.json`** copiando la estructura de la anterior
   (`portada`, `ticker`, `piezas`, `breves`, `memes`, `encuesta`, `proximo`). La encuesta lleva un
   `id` nuevo. Incrementar `numero`.
7. **Añadirla a `data/ediciones/index.json`** (la más reciente se muestra en portada).
8. **Actualizar sagas**: nuevo capítulo en las que avancen, actualizar contadores
   (p. ej. jornadas de sequía de Mingo), cerrar (`"estado": "cerrada"`) las que terminen.
9. **Publicar**: commit con mensaje `Edición nº N · J<jornada> · <titular>` y push a `main`.

## Estilo

- Tono Marca/AS de barrio: titulares en mayúsculas, cortos y con mala leche. Sátira entre compañeros,
  nunca hiriente de verdad. Nada de datos personales (teléfonos, direcciones, correos).
- **Hechos reales siempre**: resultados, goleadores y lo que cuente el vestuario. La exageración va en
  el tono, no en los datos. Si algo no está confirmado, se dice ("según fuentes del vestuario").
- Apodos antes que nombres. Si un apodo no está mapeado a la ficha federativa, `confirmar: true`.
- En `cuerpo` se puede usar `**negrita**` y `*cursiva*`.
- Colores: naranja `#ff6a00`, negro, blanco (granate del escudo como acento).

## Datos conocidos que conviene no olvidar

- Campo: **La Pixarra** (hierba sintética). Patrocinador: Omoda | Jaecoo · Resnovamotor.
- Lema: *Un barrio. Un equipo. Una familia.* Hashtag: #VamosFlorida
- Entrenador: Francisco Javier Mesa. Presidente (y jugador): Pedro Górriz.
- Dos Jorges: Jorge Moreno = **Giorgio** (redactor) y Jorge Álvarez.
- Porteros: Guty y Fran.

## Caché del navegador

GitHub Pages cachea CSS/JS ~10 min. Si cambias `css/` o `js/`, sube la versión en los HTML:
`sed -i -E 's/\?v=[0-9a-z]+"/?v=AAAAMMDDx"/g' *.html` (los JSON de `data/` ya se piden sin caché).

## Leer el buzón (Supabase)

Proyecto: `https://sueumjrcfmpzsdgaubzc.supabase.co` (clave pública en `js/config.js`).

```bash
U=https://sueumjrcfmpzsdgaubzc.supabase.co; K=$(grep -o 'sb_publishable_[^"]*' js/config.js)
# todo lo recibido desde la edición anterior
curl -s "$U/rest/v1/comentarios?select=created_at,edicion,pieza,tipo,nombre,titulo,texto,enlace&created_at=gte.AAAA-MM-DD&order=created_at" -H "apikey: $K" -H "Authorization: Bearer $K"
# resultados de una encuesta
curl -s "$U/rest/v1/votos?select=opcion&encuesta=eq.porteros-j8" -H "apikey: $K" -H "Authorization: Bearer $K"
```

Moderar (ocultar un comentario o marcar `usado_en`) se hace en el panel de Supabase → Table Editor;
la web solo puede leer e insertar.
