/* PIXARRA · Generador de memes (canvas + memegen.link) */
(async () => {
"use strict";
const { $, esc, getJSON, cabecera, pie } = window.PX;
const root = document.getElementById("app");
root.innerHTML = cabecera("memes") + `<div class="pagina">
  <h1>Fábrica de <em>memes</em></h1>
  <p class="lead">Elige una foto del equipo, una plantilla clásica o sube la tuya. Escribe, descarga y mándalo al buzón: los mejores salen en la próxima edición.</p>
  <div class="gen">
    <div><canvas id="lienzo" width="900" height="900"></canvas><p class="aviso" id="estado"></p></div>
    <div class="ctrl">
      <div class="tabs"><button class="on" data-t="equipo">Fotos del equipo</button><button data-t="clasicos">Clásicos</button><button data-t="subir">Sube la tuya</button></div>
      <input type="text" id="buscar" class="oculto" placeholder="Buscar plantilla (drake, pigeon, fine…)">
      <div class="galeria" id="galeria"></div>
      <input type="file" id="fichero" accept="image/*" class="oculto">
      <label>Texto de arriba<textarea id="arriba" rows="2">Cuando quedan 25 minutos</textarea></label>
      <label>Texto de abajo<textarea id="abajo" rows="2">y ya has pegado 4 sprints</textarea></label>
      <label>Tamaño de letra <input type="range" id="tam" min="30" max="140" value="78"></label>
      <label>Color <select id="color"><option value="#ffffff">Blanco</option><option value="#ff6a00">Naranja Florida</option><option value="#ffd400">Amarillo</option><option value="#111111">Negro</option></select></label>
      <div class="fila">
        <button class="btn" id="descargar">⬇ Descargar</button>
        <button class="btn sec" id="buzon">✍ Mandar al buzón</button>
      </div>
      <p class="aviso" id="enlace"></p>
    </div>
  </div></div>` + pie();

const cv = $("#lienzo"), cx = cv.getContext("2d"), gal = $("#galeria"), estado = $("#estado");
let img = null, fuente = null; // fuente: {tipo:'equipo'|'clasico'|'subida', src, id}
let fotos = [], clasicos = null;

const draw = () => {
  const W = 900;
  if (!img) { cv.width = W; cv.height = W; cx.fillStyle = "#222"; cx.fillRect(0, 0, W, W); return; }
  const H = Math.round(W * img.naturalHeight / img.naturalWidth);
  cv.width = W; cv.height = Math.min(H, 1600);
  cx.drawImage(img, 0, 0, W, cv.height);
  const size = +$("#tam").value, col = $("#color").value;
  cx.font = `${size}px Anton, Impact, sans-serif`;
  cx.textAlign = "center"; cx.lineJoin = "round";
  cx.fillStyle = col; cx.strokeStyle = col === "#111111" ? "#fff" : "#000"; cx.lineWidth = Math.max(4, size / 8);
  const lineas = t => {
    const out = [];
    for (const parr of t.toUpperCase().split("\n")) {
      let l = "";
      for (const w of parr.split(" ")) { const p = l ? l + " " + w : w; if (cx.measureText(p).width > W * 0.92 && l) { out.push(l); l = w; } else l = p; }
      out.push(l);
    }
    return out.filter(Boolean);
  };
  const lh = size * 1.05;
  lineas($("#arriba").value).forEach((l, i) => { const y = 20 + size + i * lh; cx.strokeText(l, W / 2, y); cx.fillText(l, W / 2, y); });
  const ab = lineas($("#abajo").value);
  ab.forEach((l, i) => { const y = cv.height - 28 - (ab.length - 1 - i) * lh; cx.strokeText(l, W / 2, y); cx.fillText(l, W / 2, y); });
  enlaceMemegen();
};

const cargar = (src, f) => new Promise(res => {
  const im = new Image(); im.crossOrigin = "anonymous";
  im.onload = () => { img = im; fuente = f; estado.textContent = ""; draw(); res(); };
  im.onerror = () => { estado.textContent = "No se pudo cargar la imagen."; res(); };
  im.src = src;
});

const memegenTexto = t => encodeURIComponent((t || "_").replace(/_/g, "__").replace(/-/g, "--").replace(/ /g, "_").replace(/\?/g, "~q").replace(/\//g, "~s").replace(/#/g, "~h").replace(/%/g, "~p").replace(/"/g, "''").replace(/\n/g, "~n")).replace(/%7E/g, "~");
function urlMemegen() {
  if (!fuente || fuente.tipo === "subida") return null;
  const a = memegenTexto($("#arriba").value.trim() || "_"), b = memegenTexto($("#abajo").value.trim() || "_");
  if (fuente.tipo === "clasico") return `https://api.memegen.link/images/${fuente.id}/${a}/${b}.jpg?font=impact`;
  if (!/^https?:/.test(location.protocol)) return null;
  return `https://api.memegen.link/images/custom/${a}/${b}.jpg?font=impact&background=${encodeURIComponent(new URL(fuente.src, location.href).href)}`;
}
function enlaceMemegen() {
  const u = urlMemegen();
  $("#enlace").innerHTML = u ? `Enlace para compartir: <a href="${esc(u)}" target="_blank" rel="noopener">abrir en memegen.link</a>` : (fuente?.tipo === "subida" ? "Las fotos subidas solo se pueden descargar (no se suben a ningún sitio)." : "");
}

function pintarGaleria(t) {
  $("#buscar").classList.toggle("oculto", t !== "clasicos");
  $("#fichero").classList.toggle("oculto", t !== "subir");
  gal.classList.toggle("oculto", t === "subir");
  if (t === "equipo") gal.innerHTML = fotos.map((f, i) => `<button data-i="${i}" title="${esc(f.texto)}" class="${fuente?.src === f.src ? "on" : ""}"><img src="${esc(f.src)}" alt="${esc(f.texto)}" loading="lazy"></button>`).join("");
  if (t === "clasicos") {
    if (!clasicos) { gal.innerHTML = `<p class="aviso">Cargando plantillas…</p>`; fetch("https://api.memegen.link/templates/").then(r => r.json()).then(d => { clasicos = d.filter(x => x.blank); pintarGaleria("clasicos"); }).catch(() => gal.innerHTML = `<p class="aviso err">No se pudo conectar con memegen.link</p>`); return; }
    const q = $("#buscar").value.toLowerCase();
    gal.innerHTML = clasicos.filter(c => !q || c.name.toLowerCase().includes(q) || c.id.includes(q)).slice(0, 120)
      .map(c => `<button data-id="${esc(c.id)}" title="${esc(c.name)}" class="${fuente?.id === c.id ? "on" : ""}"><img src="${esc(c.blank)}" alt="${esc(c.name)}" loading="lazy"></button>`).join("");
  }
}
let pestaña = "equipo";
document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  pestaña = b.dataset.t; pintarGaleria(pestaña);
}));
$("#buscar").addEventListener("input", () => pintarGaleria("clasicos"));
gal.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.i != null) { const f = fotos[+b.dataset.i]; cargar(f.src, { tipo: "equipo", src: f.src }).then(() => pintarGaleria(pestaña)); }
  if (b.dataset.id) { const c = clasicos.find(x => x.id === b.dataset.id); cargar(c.blank, { tipo: "clasico", id: c.id, src: c.blank }).then(() => pintarGaleria(pestaña)); }
});
$("#fichero").addEventListener("change", e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => cargar(r.result, { tipo: "subida", src: "subida" }); r.readAsDataURL(f);
});
["arriba", "abajo", "tam", "color"].forEach(id => $("#" + id).addEventListener("input", draw));
$("#descargar").addEventListener("click", () => {
  try {
    cv.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "meme-pixarra.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }, "image/png");
  } catch { const u = urlMemegen(); if (u) window.open(u, "_blank"); else estado.textContent = "Tu navegador no deja descargar esta imagen; usa el enlace de memegen."; }
});
$("#buzon").addEventListener("click", () => {
  const u = urlMemegen();
  const p = new URLSearchParams({ tipo: "meme", titulo: "Meme: " + ($("#arriba").value.trim() || $("#abajo").value.trim()).slice(0, 100), texto: `Arriba: ${$("#arriba").value.trim()}\nAbajo: ${$("#abajo").value.trim()}`, enlace: u || "" });
  location.href = "buzon.html?" + p.toString();
});

try { fotos = (await getJSON("data/fotos.json")).fotos; } catch { fotos = []; }
pintarGaleria("equipo");
await document.fonts?.load?.("78px Anton").catch(() => {});
if (fotos[0]) cargar(fotos[0].src, { tipo: "equipo", src: fotos[0].src }); else draw();
})();
