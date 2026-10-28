/* ==========================================================================
   graficadora.js — UI de la demo (GitHub Pages)
   Entrada única estilo GeoGebra: el usuario escribe la función como texto.
   Cálculos desde motor.js (intérprete propio, sin eval; espejo del Python).
   Animaciones con GSAP: entrada orquestada, aurora que respira, curva que
   se dibuja trazo a trazo. Respeta prefers-reduced-motion.
   ========================================================================== */

const COLOR = {
  acento: "#e8e8ea",
  grid: "rgba(141,141,150,.12)", eje: "rgba(210,210,218,.55)", borde: "#26262c",
  texto: "#f2f2f4", texto2: "#8d8d96",
};
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let grafico = null;
const $ = (id) => document.getElementById(id);
const campoExpr = $("expr");
const msgError = $("mensaje-error");

function graficar() {
  ocultarError();
  const datos = {
    expr: campoExpr.value,
    x_min: $("x_min").value,
    x_max: $("x_max").value,
    puntos: $("puntos_tabla").value,
  };
  try {
    const data = calcular(datos);
    dibujarGrafica(data);
    $("etq-g").textContent = `y = ${data.expr}`;
    pintarResumen(data);
    pintarTabla(data.tabla);
  } catch (e) {
    mostrarError(e.message || "No se pudo graficar con esa función.");
  }
}

function dibujarGrafica(data) {
  const serie = data.serie.map((p) => ({ x: p[0], y: p[1] }));

  // Límites X = intervalo exacto pedido (sin margen, como GeoGebra)
  const xs = serie.map((p) => p.x);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);

  // Límites Y: según los datos, pero SIEMPRE incluyendo el 0 (origen visible)
  // y con un pequeño respiro arriba/abajo.
  const ys = serie.map((p) => p.y).filter((y) => y !== null && Number.isFinite(y));
  let yMin = 0, yMax = 0;
  if (ys.length) { yMin = Math.min(0, ...ys); yMax = Math.max(0, ...ys); }
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const resp = (yMax - yMin) * 0.08;
  yMin -= resp; yMax += resp;

  if (grafico) {
    grafico.data.datasets[0].data = serie;
    grafico.options.scales.x.min = xMin;
    grafico.options.scales.x.max = xMax;
    grafico.options.scales.y.min = yMin;
    grafico.options.scales.y.max = yMax;
    grafico.update();
    return;
  }

  grafico = new Chart($("lienzo"), {
    type: "line",
    data: {
      datasets: [
        { label: "y", data: serie, borderColor: COLOR.acento,
          borderWidth: 2.5, pointRadius: 0, tension: 0, spanGaps: false, fill: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion ? false : { duration: 900, easing: "easeInOutCubic" },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#141417", borderColor: COLOR.borde, borderWidth: 1,
          padding: 11, cornerRadius: 10, titleColor: COLOR.texto2, bodyColor: COLOR.texto,
          titleFont: { family: "Space Grotesk" }, bodyFont: { family: "Inter" },
          callbacks: {
            title: (it) => `x = ${(+it[0].parsed.x).toFixed(2)}`,
            label: (it) => `y = ${(+it.parsed.y).toFixed(3)}`,
          },
        },
      },
      scales: {
        // Plano cartesiano estilo GeoGebra: ejes cruzados en el origen (0,0),
        // la línea del cero resaltada, cuadrícula tenue a ambos lados.
        x: {
          type: "linear", position: "center",
          min: xMin, max: xMax,
          grid: {
            color: (ctx) => (ctx.tick.value === 0 ? COLOR.eje : COLOR.grid),
            lineWidth: (ctx) => (ctx.tick.value === 0 ? 1.6 : 1),
          },
          border: { display: false },
          ticks: {
            color: COLOR.texto2, font: { family: "Inter", size: 11 },
            maxRotation: 0, autoSkipPadding: 14,
            // Ocultar el "0" sobre el propio eje para no encimar números
            callback: (v) => (v === 0 ? "" : v),
          },
        },
        y: {
          type: "linear", position: "center",
          min: yMin, max: yMax,
          grid: {
            color: (ctx) => (ctx.tick.value === 0 ? COLOR.eje : COLOR.grid),
            lineWidth: (ctx) => (ctx.tick.value === 0 ? 1.6 : 1),
          },
          border: { display: false },
          ticks: {
            color: COLOR.texto2, font: { family: "Inter", size: 11 },
            autoSkipPadding: 12,
            callback: (v) => (v === 0 ? "" : v),
          },
        },
      },
    },
  });
}

/* Lee la tabla ya calculada y arma frases simples de interpretación. */
function pintarResumen(data) {
  const ul = $("resumen");
  ul.innerHTML = "";
  const frases = [];
  frases.push(`y = ${data.expr}`);

  const def = data.tabla.filter((f) => f.y !== null);
  if (def.length === 0) {
    frases.push("Ningún punto del intervalo está dentro del dominio. Prueba otro rango de x.");
  } else {
    const ys = def.map((f) => f.y);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const pMin = def.find((f) => f.y === yMin), pMax = def.find((f) => f.y === yMax);
    frases.push(`En este intervalo, el valor más bajo es y = ${yMin} (en x = ${pMin.x}).`);
    frases.push(`El valor más alto es y = ${yMax} (en x = ${pMax.x}).`);
    if (def.length < data.tabla.length) {
      frases.push("Algunos puntos quedan fuera del dominio (marcados con “—”).");
    }
  }

  frases.forEach((f) => {
    const li = document.createElement("li");
    li.textContent = f;
    ul.appendChild(li);
  });
  if (!reduceMotion && window.gsap) {
    gsap.from("#resumen li", { opacity: 0, x: -14, duration: 0.4, stagger: 0.05, ease: "power2.out", overwrite: true });
  }
}

function pintarTabla(filas) {
  const tbody = $("tabla-puntos").querySelector("tbody");
  tbody.innerHTML = "";
  const celda = (v) => (v === null || v === undefined ? "—" : v);
  filas.forEach((f) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${celda(f.x)}</td><td>${celda(f.y)}</td>`;
    tbody.appendChild(tr);
  });
}

function mostrarError(txt) { msgError.textContent = txt; msgError.classList.remove("oculto"); }
function ocultarError() { msgError.classList.add("oculto"); }

function restablecer() {
  campoExpr.value = "2*(x-1)^2+3";
  $("x_min").value = -10; $("x_max").value = 10; $("puntos_tabla").value = 9;
  graficar();
}

// Re-graficar en vivo al escribir, con debounce
let t = null;
function graficarVivo() { clearTimeout(t); t = setTimeout(graficar, 160); }
["expr", "x_min", "x_max", "puntos_tabla"].forEach((id) =>
  $(id).addEventListener("input", graficarVivo)
);
$("btn-graficar").addEventListener("click", graficar);
$("btn-reset").addEventListener("click", restablecer);

// Chips de ejemplo: colocan la expresión y grafican
document.querySelectorAll(".ejemplos .chip").forEach((chip) =>
  chip.addEventListener("click", () => {
    campoExpr.value = chip.dataset.expr;
    graficar();
    if (!reduceMotion && window.gsap) gsap.fromTo(chip, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
  })
);

/* ---------- Animaciones de página con GSAP ---------- */
function animarEntrada() {
  if (reduceMotion || !window.gsap) {
    document.querySelectorAll(".anim-init").forEach((el) => (el.style.opacity = 1));
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.fromTo(".cabecera .anim-init",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, 0)
    .fromTo(".lienzo-area .anim-init, .inferior .anim-init",
        { opacity: 0, y: 34 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }, 0.25);

  gsap.fromTo(".marca", { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "back.out(2)", delay: 0.1 });

  gsap.to(".aurora .b1", { x: 60, y: 40, scale: 1.15, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".aurora .b2", { x: -50, y: -30, scale: 1.1, duration: 11, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".aurora .b3", { x: 40, y: -50, scale: 1.2, duration: 13, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

// Micro-feedback al pulsar Graficar
$("btn-graficar").addEventListener("click", () => {
  if (!reduceMotion && window.gsap) gsap.fromTo("#btn-graficar", { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
});

graficar();
animarEntrada();
