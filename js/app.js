/* FLORIDA · motor del periódico (sin dependencias, sin build) */
(() => {
"use strict";
const CFG = window.FLORIDA || {};
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
const cache = {};
const getJSON = u => cache[u] ||= fetch(u, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); });
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const fecha = (iso, larga = true) => { const d = new Date(iso + "T12:00:00"); return larga ? `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` : `${d.getDate()} ${MESES[d.getMonth()].slice(0,3)}`; };
const hace = iso => { const s = (Date.now() - new Date(iso)) / 1000; if (s < 60) return "ahora"; if (s < 3600) return `hace ${Math.floor(s/60)} min`; if (s < 86400) return `hace ${Math.floor(s/3600)} h`; return `hace ${Math.floor(s/86400)} d`; };

/* ───────── Liga ───────── */
function crest(liga, id, cls = "") {
  const t = liga.equipos[id]; if (!t) return "";
  if (t.escudo) return `<img class="escudo ${cls}" src="${esc(t.escudo)}" alt="${esc(t.corto)}" loading="lazy">`;
  return `<span class="escudo fake ${cls}" style="background:${esc(t.color)}" title="${esc(t.corto)}">${esc(t.siglas)}</span>`;
}
function standings(liga) {
  const row = {};
  for (const id in liga.equipos) row[id] = { id, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0, forma: [] };
  for (const j of liga.jornadas) for (const [a, ga, gb, b] of j.partidos) {
    const A = row[a], B = row[b]; if (!A || !B || ga == null) continue;
    A.pj++; B.pj++; A.gf += ga; A.gc += gb; B.gf += gb; B.gc += ga;
    if (ga > gb) { A.g++; B.p++; A.pts += 3; A.forma.push("G"); B.forma.push("P"); }
    else if (ga < gb) { B.g++; A.p++; B.pts += 3; B.forma.push("G"); A.forma.push("P"); }
    else { A.e++; B.e++; A.pts++; B.pts++; A.forma.push("E"); B.forma.push("E"); }
  }
  let rows = Object.values(row);
  const of = liga.clasificacion_oficial;
  if (of && of.length === rows.length) {
    const pos = Object.fromEntries(of.map((id, i) => [id, i]));
    rows.sort((x, y) => (y.pts - x.pts) || (pos[x.id] - pos[y.id]));
  } else rows.sort((x, y) => (y.pts - x.pts) || ((y.gf - y.gc) - (x.gf - x.gc)) || (y.gf - x.gf));
  rows.forEach((r, i) => r.pos = i + 1);
  return rows;
}
function tablaHTML(liga, { compacta = false } = {}) {
  const rows = standings(liga);
  const head = compacta
    ? `<tr><th>#</th><th style="text-align:left">Equipo</th><th>PJ</th><th>DG</th><th>Pts</th></tr>`
    : `<tr><th>#</th><th style="text-align:left">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th><th>Forma</th></tr>`;
  const body = rows.map(r => {
    const t = liga.equipos[r.id], dg = r.gf - r.gc, nos = r.id === liga.nuestro ? ' class="nos"' : "";
    const forma = `<span class="forma">${r.forma.slice(-5).map(f => `<i class="${f}">${f}</i>`).join("")}</span>`;
    return compacta
      ? `<tr${nos}><td>${r.pos}</td><td class="eq">${crest(liga, r.id)}${esc(t.corto)}</td><td>${r.pj}</td><td>${dg > 0 ? "+" + dg : dg}</td><td class="pts">${r.pts}</td></tr>`
      : `<tr${nos}><td>${r.pos}</td><td class="eq">${crest(liga, r.id)}${esc(t.corto)}</td><td>${r.pj}</td><td>${r.g}</td><td>${r.e}</td><td>${r.p}</td><td>${r.gf}</td><td>${r.gc}</td><td>${dg > 0 ? "+" + dg : dg}</td><td class="pts">${r.pts}</td><td>${forma}</td></tr>`;
  }).join("");
  return `<table class="tabla"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}
function proximoHTML(liga, p) {
  if (!p) return "";
  const loc = p.casa ? liga.nuestro : p.rival, vis = p.casa ? p.rival : liga.nuestro;
  const dias = Math.ceil((new Date(p.fecha + "T12:00:00") - Date.now()) / 864e5);
  const cuenta = dias > 1 ? `Faltan ${dias} días` : dias === 1 ? "¡Mañana!" : dias === 0 ? "¡Hoy hay partido!" : "";
  return `<div class="proximo"><div class="et">Próximo partido · Jornada ${p.j}</div>
    <div class="vs">${crest(liga, loc)}<b>VS</b>${crest(liga, vis)}</div>
    <div class="cuando">${esc(liga.equipos[loc].corto)} – ${esc(liga.equipos[vis].corto)}</div>
    <div class="aviso" style="color:#bbb">${fecha(p.fecha)} · ${p.casa ? "La Pixarra" : "A domicilio"}</div>
    ${cuenta ? `<div class="cuenta">${cuenta}</div>` : ""}</div>`;
}
function goleadoresHTML(liga) {
  return `<table class="tabla"><thead><tr><th style="text-align:left">Jugador</th><th>PJ</th><th>Goles</th></tr></thead><tbody>${
    liga.goleadores_florida.map(g => `<tr><td class="eq">${esc(g.apodo || g.jugador.split(",").reverse().join(" ").trim())}</td><td>${g.pj}</td><td class="pts">${g.goles}</td></tr>`).join("")
  }</tbody></table>`;
}

/* ───────── Backend (Supabase REST, opcional) ───────── */
const API = {
  ok: !!(CFG.supabaseUrl && CFG.supabaseKey),
  h() { return { apikey: CFG.supabaseKey, Authorization: "Bearer " + CFG.supabaseKey, "Content-Type": "application/json" }; },
  async get(tabla, q) { const r = await fetch(`${CFG.supabaseUrl}/rest/v1/${tabla}?${q}`, { headers: this.h() }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  async post(tabla, fila) { const r = await fetch(`${CFG.supabaseUrl}/rest/v1/${tabla}`, { method: "POST", headers: { ...this.h(), Prefer: "return=minimal" }, body: JSON.stringify(fila) }); if (!r.ok) throw new Error(await r.text()); }
};
const SIN_BACKEND = `<p class="aviso">El buzón aún no está conectado. En cuanto la redacción active la base de datos podrás escribir aquí.</p>`;
const votante = () => { let v = ls.get("florida-votante"); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); ls.set("florida-votante", v); } return v; };

function comentariosWidget(edicion, pieza, titulo) {
  const d = document.createElement("details");
  d.className = "coment";
  d.innerHTML = `<summary>Comentarios <span class="n"></span></summary><div class="lista"></div>${API.ok ? `
    <form class="cf">
      <input name="nombre" maxlength="40" placeholder="Tu nombre o apodo" required value="${esc(ls.get("florida-nombre") || "")}">
      <textarea name="texto" maxlength="1500" placeholder="¿Qué opinas? Lo mejor puede salir en la próxima edición." required></textarea>
      <div class="fila"><button class="btn" type="submit">Publicar</button><span class="aviso msg"></span></div>
    </form>` : SIN_BACKEND}`;
  const lista = $(".lista", d), n = $(".n", d);
  const cargar = async () => {
    if (!API.ok) return;
    try {
      const cs = await API.get("comentarios", `select=nombre,texto,created_at&edicion=eq.${encodeURIComponent(edicion)}&pieza=eq.${encodeURIComponent(pieza)}&tipo=eq.comentario&order=created_at.asc`);
      n.textContent = cs.length ? `(${cs.length})` : "";
      lista.innerHTML = cs.length ? cs.map(c => `<div class="c-item"><div class="q">${esc(c.nombre)}<time>${hace(c.created_at)}</time></div><p>${esc(c.texto)}</p></div>`).join("") : `<p class="c-vacio">Nadie ha dicho nada todavía. Sé el primero.</p>`;
    } catch (e) { lista.innerHTML = `<p class="aviso err">No se pudieron cargar los comentarios.</p>`; }
  };
  const f = $("form", d);
  if (f) f.addEventListener("submit", async ev => {
    ev.preventDefault();
    const msg = $(".msg", f), btn = $("button", f), nombre = f.nombre.value.trim(), texto = f.texto.value.trim();
    if (!nombre || !texto) return;
    btn.disabled = true; msg.className = "aviso msg"; msg.textContent = "Enviando…";
    try {
      await API.post("comentarios", { edicion, pieza, tipo: "comentario", nombre, titulo, texto });
      ls.set("florida-nombre", nombre); f.texto.value = ""; msg.className = "aviso msg ok"; msg.textContent = "¡Publicado!"; cargar();
    } catch (e) { msg.className = "aviso msg err"; msg.textContent = "Error al enviar. Prueba otra vez."; }
    btn.disabled = false;
  });
  cargar();
  return d;
}

async function encuestaWidget(cont, edicion, enc) {
  if (!enc) return;
  const clave = `florida-voto-${enc.id}`;
  cont.innerHTML = `<div class="caja encuesta"><h3>El jurado popular</h3><div class="pad"><p class="preg">${esc(enc.pregunta)}</p>
    ${enc.opciones.map((o, i) => `<button type="button" class="op" data-i="${i}"><span class="barra"></span><span>${esc(o)}</span><span class="n"></span></button>`).join("")}
    <p class="aviso msg">${API.ok ? "Un voto por persona." : "La votación se abrirá cuando se active la base de datos."}</p></div></div>`;
  const bots = [...cont.querySelectorAll(".op")], msg = $(".msg", cont);
  const pintar = votos => {
    const tot = votos.length, mio = ls.get(clave);
    bots.forEach((b, i) => {
      const c = votos.filter(v => v.opcion === i).length;
      $(".barra", b).style.width = tot ? (100 * c / tot) + "%" : "0";
      $(".n", b).textContent = tot ? `${Math.round(100 * c / tot)}% · ${c}` : "";
      b.classList.toggle("mia", mio === String(i));
      b.disabled = !API.ok || mio != null;
    });
    if (tot) msg.textContent = `${tot} voto${tot === 1 ? "" : "s"}${mio != null ? " · ya has votado" : ""}`;
  };
  const cargar = async () => { if (!API.ok) return pintar([]); try { pintar(await API.get("votos", `select=opcion&edicion=eq.${edicion}&encuesta=eq.${enc.id}`)); } catch { msg.textContent = "No se pudieron cargar los votos."; } };
  bots.forEach(b => b.addEventListener("click", async () => {
    if (!API.ok || ls.get(clave) != null) return;
    const i = +b.dataset.i;
    try { await API.post("votos", { edicion, encuesta: enc.id, opcion: i, votante: votante() }); ls.set(clave, String(i)); }
    catch (e) { if (String(e).includes("duplicate")) ls.set(clave, String(i)); else { msg.textContent = "Error al votar."; return; } }
    cargar();
  }));
  cargar();
}

/* ───────── Cabecera / pie ───────── */
function cabecera(pagina, ed) {
  const f = ed ? ed.fecha : new Date().toISOString().slice(0, 10);
  const meta = ed ? `<b>${fecha(f).split(",")[0]}</b> ${fecha(f).split(", ")[1]}<br>Nº ${ed.numero} · Jornada ${ed.jornada}<br>Precio: una caña` : `<b>${fecha(f).split(",")[0]}</b> ${fecha(f).split(", ")[1]}`;
  const nav = [["index.html", "Portada", "edicion"], ["liga.html", "Clasificación", "liga"], ["plantilla.html", "Plantilla", "plantilla"], ["hemeroteca.html", "Hemeroteca", "hemeroteca"], ["memes.html", "Memes", "memes"]]
    .map(([h, t, p]) => `<a href="${h}"${p === pagina ? ' class="on"' : ""}>${t}</a>`).join("");
  return `<header class="mast">
      <div class="meta">${meta}</div>
      <a class="logo" href="index.html">FLORIDA</a>
      <div class="lema"><span>Un barrio.</span><span>Un equipo.</span><span>Una familia.</span><small>El diario del C.A. de La Florida</small></div>
      <div class="sublogo">Diario deportivo del Club Atlético de La Florida · Oviedo</div>
    </header>
    <nav class="menu">${nav}<a class="cta${pagina === "buzon" ? " on" : ""}" href="buzon.html">✍ Buzón del lector</a></nav>`;
}
/* Publicidad: patrocinador principal del club */
const SPONSOR_URL = "https://www.omodajaecoo.es/";
const escudoClub = `<img class="ad-escudo" src="img/escudos/florida.jpg" alt="">`;
function anuncio(tipo = "faldon") {
  const marca = `<div class="ad-marca"><span class="ad-oj">OMODA <i>|</i> JAECOO</span><span class="ad-rn">resnovamotor</span></div>`;
  if (tipo === "roba") return `<a class="ad ad-roba" href="${SPONSOR_URL}" target="_blank" rel="noopener sponsored"><span class="ad-tag">Publicidad</span>
    ${escudoClub}${marca}<p class="ad-claim">Más autonomía que Manute:<br><b>aguanta los 90 minutos.</b></p><span class="ad-sub">Patrocinador principal · C.A. de La Florida</span></a>`;
  return `<a class="ad ad-faldon" href="${SPONSOR_URL}" target="_blank" rel="noopener sponsored"><span class="ad-tag">Publicidad</span>
    ${escudoClub}<div class="ad-centro">${marca}<span class="ad-sub">Patrocinador principal</span></div>${escudoClub}</a>`;
}
const pie = () => `<div class="ad-pie">${anuncio()}</div><footer class="pie"><span><b>FLORIDA</b> · Periódico satírico del vestuario del C.A. de La Florida. Datos reales, mala leche inventada.</span>
  <span>Datos: <a href="https://www.asturfutbol.es" target="_blank" rel="noopener">Asturfútbol</a> · Fotos: <a href="https://www.instagram.com/clubatleticodelaflorida/" target="_blank" rel="noopener">@clubatleticodelaflorida</a> · Memes: <a href="https://memegen.link" target="_blank" rel="noopener">memegen.link</a></span></footer>`;

/* ───────── Edición (portada) ───────── */
function memeHTML(m) {
  const cap = m.alt ? `<figcaption>${esc(m.alt)}</figcaption>` : "";
  const enlace = m.pieza ? `href="#${esc(m.pieza)}"` : "";
  if (m.img) return `<figure class="meme"><a ${enlace}><img src="${esc(m.img)}" alt="${esc(m.alt || "")}" loading="lazy"></a></figure>`;
  return `<figure class="meme"><a ${enlace}><div class="overlay-meme"><img src="${esc(m.foto)}" alt="" style="object-position:${esc(m.pos || "50% 50%")}" loading="lazy"><div class="t a">${esc(m.arriba || "")}</div><div class="t b">${esc(m.abajo || "")}</div></div></a>${cap}</figure>`;
}
/* La voz del lector: todo lo que llegó al buzón (y los comentarios a la edición anterior)
   entre la publicación de la edición anterior y la de esta sale publicado, sin filtro. */
const esImagen = u => /^https?:\/\//.test(u || "") && (/\.(jpe?g|png|gif|webp)(\?|$)/i.test(u) || /api\.memegen\.link\/images\//.test(u));
const publicadaDe = e => e && (e.publicada || e.fecha + "T23:59:59Z");
async function vozDelLector(cont, ed, prev, esUltima) {
  if (!API.ok || !cont) return;
  const hasta = publicadaDe(ed), desde = prev ? publicadaDe(prev) : "2000-01-01T00:00:00Z";
  const q = `select=created_at,edicion,pieza,tipo,nombre,titulo,texto,enlace&and=(created_at.gte.${encodeURIComponent(desde)},created_at.lt.${encodeURIComponent(hasta)})&order=created_at.asc&limit=200`;
  let items = [], veredicto = "", espera = 0;
  try {
    items = await API.get("comentarios", q);
    if (prev) {
      const pe = await getJSON(`data/ediciones/${prev.fecha}.json`);
      if (pe.encuesta) {
        const vs = await API.get("votos", `select=opcion&encuesta=eq.${encodeURIComponent(pe.encuesta.id)}`);
        if (vs.length) {
          const tot = vs.length, cuenta = pe.encuesta.opciones.map((o, i) => ({ o, n: vs.filter(v => v.opcion === i).length })).sort((a, b) => b.n - a.n);
          veredicto = `<div class="caja encuesta" style="margin-bottom:16px"><h3>Veredicto del jurado popular</h3><div class="pad"><p class="preg">${esc(pe.encuesta.pregunta)}</p>${cuenta.map(c => `<div class="op" style="cursor:default"><span class="barra" style="width:${100 * c.n / tot}%"></span><span>${esc(c.o)}</span><span>${Math.round(100 * c.n / tot)}% · ${c.n}</span></div>`).join("")}<p class="aviso">${tot} votos. Gana: <b>${esc(cuenta[0].o)}</b></p></div></div>`;
        }
      }
    }
    if (esUltima) espera = (await API.get("comentarios", `select=created_at&created_at=gte.${encodeURIComponent(hasta)}`)).length;
  } catch (e) { console.warn("voz del lector", e); }
  const tipoTxt = { sugerencia: "Exclusiva del lector", meme: "Meme del lector", comentario: "Réplica" };
  const tarjeta = c => `<div class="voz-item voz-${esc(c.tipo)}">
      <span class="voz-tipo">${tipoTxt[c.tipo] || "Carta"}</span>
      ${c.titulo ? `<h4>${esc(c.titulo)}</h4>` : ""}
      ${c.tipo === "comentario" && c.pieza ? `<p class="aviso">Sobre «${esc(c.titulo || c.pieza)}» (${fecha(c.edicion, false)})</p>` : ""}
      ${esImagen(c.enlace) ? `<img src="${esc(c.enlace)}" alt="" loading="lazy">` : ""}
      <p>${esc(c.texto)}</p>
      ${c.enlace && !esImagen(c.enlace) ? `<p><a href="${esc(c.enlace)}" target="_blank" rel="noopener nofollow">Ver enlace</a></p>` : ""}
      <div class="voz-firma">— ${esc(c.nombre)}</div></div>`;
  if (!items.length && !veredicto && !espera) return;
  cont.innerHTML = `<h2 class="seccion-t" style="margin-top:28px">La voz del lector</h2>
    <p class="aviso">Todo lo que llegó al buzón y a los comentarios desde la edición anterior, publicado tal cual. Aquí no se censura a nadie (casi).</p>
    ${veredicto}
    ${items.length ? `<div class="voz">${items.map(tarjeta).join("")}</div>` : ""}
    ${espera ? `<p class="voz-espera">📬 Hay <b>${espera}</b> mensaje${espera === 1 ? "" : "s"} en el buzón esperando a la próxima edición. <a href="buzon.html">Manda el tuyo</a>.</p>` : ""}`;
}
async function paginaEdicion(root) {
  const [indice, liga, sagas] = await Promise.all([getJSON("data/ediciones/index.json"), getJSON("data/liga.json"), getJSON("data/sagas.json")]);
  const pedida = new URLSearchParams(location.search).get("e");
  const orden = [...indice].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const meta = orden.find(e => e.fecha === pedida) || orden[0];
  const ed = await getJSON(`data/ediciones/${meta.fecha}.json`);
  document.title = `FLORIDA · ${ed.titulo_web}`;
  const P = ed.portada, M = P.marcador, sagaDe = Object.fromEntries(sagas.sagas.map(s => [s.slug, s]));
  const tick = ed.ticker.map(t => `<span>${esc(t)}</span>`).join("");
  const eqM = id => `<div class="eq">${crest(liga, id)}${esc(liga.equipos[id].corto)}</div>`;
  const otras = orden.filter(e => e.fecha !== ed.fecha);

  root.innerHTML = cabecera("edicion", ed) + `
    <div class="ticker"><b>Última hora</b><div class="run">${tick}${tick}</div></div>
    <section class="portada">
      <div class="hero">
        <img class="bg" src="${esc(P.foto)}" alt="" style="object-position:${esc(P.foto_pos || "50% 50%")}">
        ${M ? `<div class="marcador">${eqM(M.local)}<div class="num">${M.gl}<i>-</i>${M.gv}</div>${eqM(M.visitante)}${M.goles_local ? `<div class="goles">${M.goles_local.map(esc).join(" · ")}</div>` : ""}</div>` : ""}
        <div class="txt">
          <span class="kicker">${esc(P.kicker)}</span>
          <h1>${P.titular.map(t => `<span>${esc(t)}</span>`).join("")}</h1>
          <p class="sub">${md(P.subtitulo)}</p>
          ${P.pieza ? `<a class="leer" href="#${esc(P.pieza)}">Leer la crónica ›</a>` : ""}
          <div class="pie">${esc(P.foto_pie || "")}</div>
        </div>
      </div>
      <div class="laterales">${P.laterales.map(l => `
        <a class="lat ${esc(l.tono || "")}" href="#${esc(l.pieza)}">${l.foto ? `<img src="${esc(l.foto)}" alt="" loading="lazy">` : ""}
          <div class="in"><span class="et">${esc(l.etiqueta)}</span><h3>${esc(l.titulo)}</h3><p>${md(l.texto)}</p></div></a>`).join("")}
      </div>
    </section>
    <section class="franja">${P.franja.map(f => `
      <a class="fr" href="#${esc(f.pieza)}">${f.escudo ? crest(liga, f.escudo) : ""}<div><div class="et">${esc(f.etiqueta)}</div><h4>${esc(f.titulo)}</h4><p>${md(f.texto)}</p></div></a>`).join("")}
    </section>
    <div class="ad-franja">${anuncio()}</div>
    <div class="cuerpo">
      <main id="piezas"><h2 class="seccion-t">En esta edición</h2></main>
      <aside class="side">
        <section>${proximoHTML(liga, ed.proximo)}</section>
        <section>${anuncio("roba")}</section>
        <section id="encuesta"></section>
        <section class="caja"><h3>Clasificación <a href="liga.html">Completa ›</a></h3>${tablaHTML(liga, { compacta: true })}</section>
        <section class="caja"><h3>Pichichi naranja</h3>${goleadoresHTML(liga)}</section>
        <section class="caja"><h3>Sagas abiertas</h3><div class="pad"><ul class="sagas">${sagas.sagas.filter(s => s.estado === "abierta").map(s => `
          <li><b>${esc(s.titulo)}</b>${esc(s.resumen)}${s.contador ? `<br><span class="cont">${s.contador.valor} ${esc(s.contador.etiqueta)}</span>` : ""}</li>`).join("")}</ul></div></section>
        ${otras.length ? `<section class="caja"><h3>Ediciones anteriores</h3><div class="pad">${otras.slice(0, 5).map(o => `<p style="margin:0 0 6px;font-family:var(--f-cond)"><a href="index.html?e=${o.fecha}"><b>${esc(o.titulo)}</b></a> · ${fecha(o.fecha, false)}</p>`).join("")}</div></section>` : ""}
      </aside>
    </div>
    <div class="pagina" style="padding-top:0">
      <h2 class="seccion-t">La galería del meme</h2>
      <div class="memes">${ed.memes.map(memeHTML).join("")}</div>
      <p class="aviso" style="margin-top:10px">¿Tienes uno mejor? <a href="memes.html"><b>Hazlo en el generador</b></a> y mándalo al buzón.</p>
      ${ed.breves?.length ? `<h2 class="seccion-t" style="margin-top:28px">Breves</h2><div class="breves">${ed.breves.map(b => `<div class="breve">${b.foto ? `<img src="${esc(b.foto)}" alt="" loading="lazy">` : ""}<div><h4>${esc(b.titulo)}</h4><p>${md(b.texto)}</p></div></div>`).join("")}</div>` : ""}
      <section id="voz"></section>
    </div>` + pie();
  const prev = orden[orden.indexOf(meta) + 1];
  vozDelLector($("#voz"), ed, prev, meta === orden[0]);

  const cont = $("#piezas");
  for (const p of ed.piezas) {
    const s = p.saga && sagaDe[p.saga];
    const art = document.createElement("article");
    art.className = "pieza" + (p.foto || p.escudo ? "" : " sinfoto");
    art.id = p.id;
    const visual = p.foto ? `<figure><img src="${esc(p.foto)}" alt="" loading="lazy"><figcaption>${esc(p.foto_pie || "")}</figcaption></figure>`
      : p.escudo ? `<figure style="display:flex;justify-content:center;padding:20px;background:var(--crema)">${crest(liga, p.escudo).replace('class="escudo', 'style="width:160px;height:160px;font-size:40px" class="escudo')}</figure>` : "";
    art.innerHTML = `<div class="cab"><span class="sec">${esc(p.seccion)}</span>${s ? `<a class="saga" href="plantilla.html#sagas">Saga · ${esc(s.titulo)}</a>` : ""}</div>
      <h2>${esc(p.titulo)}</h2><p class="entr">${md(p.subtitulo)}</p><div class="firma">Por <b>${esc(p.firma || "Redacción")}</b></div>
      <div class="grid"><div class="txt">${p.cuerpo.map(x => `<p>${md(x)}</p>`).join("")}</div>${visual}</div>`;
    art.appendChild(comentariosWidget(ed.fecha, p.id, p.titulo));
    cont.appendChild(art);
  }
  encuestaWidget($("#encuesta"), ed.fecha, ed.encuesta);
  if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 50);
}

/* ───────── Otras páginas ───────── */
async function paginaLiga(root) {
  const liga = await getJSON("data/liga.json");
  const nuestros = liga.calendario_florida.map(c => {
    const j = liga.jornadas.find(x => x.n === c.j);
    const p = j && j.partidos.find(x => x[0] === liga.nuestro || x[3] === liga.nuestro);
    const loc = c.casa ? liga.nuestro : c.rival, vis = c.casa ? c.rival : liga.nuestro;
    let res = "—", cls = "";
    if (p && p[1] != null) { res = `${p[1]} - ${p[2]}`; const nos = p[0] === liga.nuestro ? p[1] - p[2] : p[2] - p[1]; cls = nos > 0 ? "G" : nos < 0 ? "P" : "E"; }
    return `<tr${c.j === liga.ultima_jornada + 1 ? ' class="nos"' : ""}><td>${c.j}</td><td>${fecha(c.fecha, false)}</td><td class="eq">${crest(liga, loc)}${esc(liga.equipos[loc].corto)}</td><td><b>${res}</b> ${cls ? `<span class="forma"><i class="${cls}">${cls}</i></span>` : ""}</td><td class="eq">${crest(liga, vis)}${esc(liga.equipos[vis].corto)}</td></tr>`;
  }).join("");
  const ult = liga.jornadas[liga.jornadas.length - 1];
  root.innerHTML = cabecera("liga") + `<div class="pagina">
    <h1>La <em>Liga</em></h1><p class="lead">${esc(liga.competicion)} · Temporada ${esc(liga.temporada)}. Actualizado tras la jornada ${liga.ultima_jornada}. Fuente: <a href="${esc(liga.fuente)}" target="_blank" rel="noopener">Asturfútbol</a>.</p>
    <section class="caja" style="margin-bottom:26px"><h3>Clasificación</h3><div class="scroll-x">${tablaHTML(liga)}</div></section>
    <div class="dos">
      <section class="caja"><h3>Calendario de La Florida</h3><div class="scroll-x"><table class="tabla"><thead><tr><th>J</th><th>Fecha</th><th style="text-align:left">Local</th><th>Res.</th><th style="text-align:left">Visitante</th></tr></thead><tbody>${nuestros}</tbody></table></div></section>
      <div>
        <section class="caja" style="margin-bottom:26px"><h3>Resultados jornada ${ult.n}</h3><table class="tabla"><tbody>${ult.partidos.map(([a, ga, gb, b]) => `<tr${a === liga.nuestro || b === liga.nuestro ? ' class="nos"' : ""}><td class="eq">${crest(liga, a)}${esc(liga.equipos[a].corto)}</td><td class="pts">${ga} - ${gb}</td><td class="eq">${crest(liga, b)}${esc(liga.equipos[b].corto)}</td></tr>`).join("")}</tbody></table></section>
        <section class="caja" style="margin-bottom:26px"><h3>Goleadores de La Florida</h3>${goleadoresHTML(liga)}</section>
        <section class="caja"><h3>Pichichi de la liga <a href="${esc(liga.fuente_goleadores)}" target="_blank" rel="noopener">Ver todo ›</a></h3><table class="tabla"><thead><tr><th style="text-align:left">Jugador</th><th style="text-align:left">Equipo</th><th>Goles</th></tr></thead><tbody>${liga.goleadores_liga.map(g => `<tr${g.equipo === liga.nuestro ? ' class="nos"' : ""}><td class="eq">${esc(g.jugador.split(",").reverse().join(" ").trim())}</td><td class="eq">${crest(liga, g.equipo)}${esc(liga.equipos[g.equipo].corto)}</td><td class="pts">${g.goles}</td></tr>`).join("")}</tbody></table></section>
      </div>
    </div></div>` + pie();
}

async function paginaPlantilla(root) {
  const [pl, sagas, liga] = await Promise.all([getJSON("data/plantilla.json"), getJSON("data/sagas.json"), getJSON("data/liga.json")]);
  const goles = Object.fromEntries(liga.goleadores_florida.map(g => [g.jugador.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, ""), g.goles]));
  const golesDe = j => j.federacion ? goles[j.federacion.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "")] : null;
  const sagaDe = Object.fromEntries(sagas.sagas.map(s => [s.slug, s]));
  const ficha = (j, rol) => { const g = golesDe(j); return `<div class="ficha" id="${esc(j.slug)}">${g ? `<span class="dorsal">⚽ ${g}</span>` : ""}
    <div class="pos">${esc(rol || j.posicion || "Jugador")}</div><h3>${esc(j.apodo)}</h3>${j.instagram ? `<a class="aviso" href="https://www.instagram.com/${esc(j.instagram)}/" target="_blank" rel="noopener">@${esc(j.instagram)}</a>` : ""}
    <p>${md(j.bio || "")}</p><div class="tags">${(j.sagas || []).map(s => sagaDe[s] ? `<a href="#saga-${s}">${esc(sagaDe[s].titulo)}</a>` : "").join("")}${j.confirmar ? `<span class="conf">Ficha por confirmar</span>` : ""}</div></div>`; };
  root.innerHTML = cabecera("plantilla") + `<div class="pagina">
    <h1>La <em>Plantilla</em></h1><p class="lead">Fichas oficiosas del vestuario. Si algo no cuadra, corrígelo en el <a href="buzon.html">buzón</a>.</p>
    <h2 class="seccion-t">Banquillo y despachos</h2><div class="fichas">${pl.cuerpo_tecnico.map(j => ficha(j, j.rol)).join("")}</div>
    <h2 class="seccion-t" style="margin-top:28px">Jugadores</h2><div class="fichas">${pl.jugadores.map(j => ficha(j)).join("")}</div>
    <h2 class="seccion-t" id="sagas" style="margin-top:28px">Sagas</h2>
    <div class="fichas">${sagas.sagas.map(s => `<div class="ficha" id="saga-${esc(s.slug)}"><div class="pos">${s.estado === "abierta" ? "En curso" : "Cerrada"}</div><h3>${esc(s.titulo)}</h3><p>${esc(s.resumen)}</p>
      ${s.contador ? `<p class="goles">${s.contador.valor} ${esc(s.contador.etiqueta)}</p>` : ""}
      <ol style="margin:8px 0 0;padding-left:18px;font-size:14.5px">${s.capitulos.map(c => `<li><a href="index.html?e=${c.edicion}">${fecha(c.edicion, false)}</a>: ${esc(c.texto)}</li>`).join("")}</ol></div>`).join("")}</div>
  </div>` + pie();
  if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 50);
}

async function paginaHemeroteca(root) {
  const indice = await getJSON("data/ediciones/index.json");
  root.innerHTML = cabecera("hemeroteca") + `<div class="pagina"><h1>Heme<em>roteca</em></h1><p class="lead">Todas las portadas de FLORIDA, una por jornada.</p>
    <div class="hemero">${[...indice].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(e => `<a class="hcard" href="index.html?e=${e.fecha}"><img src="${esc(e.portada)}" alt="" loading="lazy"><div><small>Nº ${e.numero} · Jornada ${e.jornada} · ${fecha(e.fecha, false)}</small><h3>${esc(e.titulo)}</h3><p>${esc(e.resumen)}</p></div></a>`).join("")}</div></div>` + pie();
}

async function paginaBuzon(root) {
  const indice = await getJSON("data/ediciones/index.json");
  const ult = [...indice].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const pre = new URLSearchParams(location.search);
  root.innerHTML = cabecera("buzon") + `<div class="pagina">
    <h1>Buzón del <em>lector</em></h1>
    <p class="lead">¿Algo que debería salir en la próxima edición? ¿Una exclusiva del vestuario, una foto, un meme, una queja o una réplica a algo que hemos publicado? Escríbelo aquí: <b>todo lo que llegue se publica en la siguiente edición</b> (una por semana, después de cada partido), en la sección «La voz del lector». Y si da para noticia, la redacción la convierte en portada.</p>
    <div class="dos">
      <section class="caja"><h3>Enviar a la redacción</h3><div class="pad">${API.ok ? `
        <form class="cf" id="fb">
          <label class="aviso">Tipo</label>
          <select name="tipo"><option value="sugerencia">Propuesta de noticia</option><option value="comentario">Comentario / réplica a algo publicado</option><option value="meme">Meme</option></select>
          <input name="nombre" maxlength="40" placeholder="Tu nombre o apodo" required value="${esc(ls.get("florida-nombre") || "")}">
          <input name="titulo" maxlength="140" placeholder="Titular propuesto (opcional)" value="${esc(pre.get("titulo") || "")}">
          <textarea name="texto" maxlength="3000" placeholder="¿Qué pasó? Cuanto más detalle, mejor." required style="min-height:150px">${esc(pre.get("texto") || "")}</textarea>
          <input name="enlace" maxlength="600" placeholder="Enlace a foto o meme (opcional)" value="${esc(pre.get("enlace") || "")}">
          <div class="fila"><button class="btn" type="submit">Enviar a la redacción</button><span class="aviso msg"></span></div>
        </form>` : SIN_BACKEND}</div></section>
      <section class="caja"><h3>Lo último en el buzón</h3><div class="pad" id="ultimos"><p class="c-vacio">${API.ok ? "Cargando…" : "Aquí aparecerán las propuestas de los lectores."}</p></div></section>
    </div>
    <p class="aviso" style="margin-top:16px">Normas de la casa: sátira entre compañeros, sin pasarse. Lo que no sea publicable, no se publica. Edición en curso: <a href="index.html?e=${ult.fecha}">${esc(ult.titulo)}</a>.</p>
  </div>` + pie();
  const ultimos = $("#ultimos");
  const cargar = async () => {
    if (!API.ok) return;
    try {
      const cs = await API.get("comentarios", "select=nombre,tipo,titulo,texto,pieza,enlace,created_at&order=created_at.desc&limit=30");
      ultimos.innerHTML = cs.length ? cs.map(c => `<div class="c-item"><div class="q">${esc(c.nombre)} <span class="aviso">· ${esc(c.tipo)}${c.pieza ? " · sobre «" + esc(c.titulo || c.pieza) + "»" : c.titulo ? " · «" + esc(c.titulo) + "»" : ""}</span><time>${hace(c.created_at)}</time></div><p>${esc(c.texto)}</p>${c.enlace ? `<p><a href="${esc(c.enlace)}" target="_blank" rel="noopener nofollow">Ver adjunto</a></p>` : ""}</div>`).join("") : `<p class="c-vacio">Vacío. ¿Nadie tiene nada que contar?</p>`;
    } catch { ultimos.innerHTML = `<p class="aviso err">No se pudo cargar el buzón.</p>`; }
  };
  const f = $("#fb");
  if (f && ["sugerencia", "comentario", "meme"].includes(pre.get("tipo"))) f.tipo.value = pre.get("tipo");
  if (f) f.addEventListener("submit", async ev => {
    ev.preventDefault();
    const msg = $(".msg", f), btn = $("button", f);
    const fila = { edicion: ult.fecha, pieza: null, tipo: f.tipo.value, nombre: f.nombre.value.trim(), titulo: f.titulo.value.trim() || null, texto: f.texto.value.trim(), enlace: f.enlace.value.trim() || null };
    if (fila.enlace && !/^https?:\/\//.test(fila.enlace)) { msg.className = "aviso msg err"; msg.textContent = "El enlace debe empezar por http"; return; }
    btn.disabled = true; msg.textContent = "Enviando…";
    try { await API.post("comentarios", fila); ls.set("florida-nombre", fila.nombre); f.reset(); f.nombre.value = fila.nombre; msg.className = "aviso msg ok"; msg.textContent = "¡Recibido! La redacción lo tendrá en cuenta."; cargar(); }
    catch { msg.className = "aviso msg err"; msg.textContent = "Error al enviar. Prueba otra vez."; }
    btn.disabled = false;
  });
  cargar();
}

/* ───────── Arranque ───────── */
window.PX = { $, esc, md, getJSON, cabecera, pie, API, ls };
const paginas = { edicion: paginaEdicion, liga: paginaLiga, plantilla: paginaPlantilla, hemeroteca: paginaHemeroteca, buzon: paginaBuzon };
const root = document.getElementById("app"), pag = document.body.dataset.pagina;
if (paginas[pag]) paginas[pag](root).catch(e => { console.error(e); root.innerHTML = `<div class="pagina"><h1>Fe de <em>erratas</em></h1><p class="lead">No se pudo cargar la página: ${esc(e.message)}</p></div>`; });
})();
