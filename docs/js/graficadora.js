/* ==========================================================================
   graficadora.js — UI de la demo (GitHub Pages)
   Modelo del enunciado: elegir f(x) madre + coeficientes a,b,c,d → g(x).
   Dibuja la ORIGINAL f(x) (punteada) y la TRANSFORMADA g(x) (continua),
   en plano cartesiano estilo GeoGebra (ejes en el origen, escala 1:1).
   Cálculos desde motor.js (sin eval; espejo del Python).
   ========================================================================== */

const COLOR = {
  gTrazo: "#e8e8ea",                 // g(x) transformada — gris claro casi blanco
  fTrazo: "#6f6f78",                 // f(x) original — gris medio
  grid: "rgba(141,141,150,.12)", eje: "rgba(210,210,218,.55)", borde: "#26262c",
  texto: "#f2f2f4", texto2: "#8d8d96",
};
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let grafico = null;
const $ = (id) => document.getElementById(id);
const msgError = $("mensaje-error");

/* Muestra u oculta la caja de "base" según la función elegida. */
function refrescarCampoBase() {
  const esExp = $("funcion").value === "exponencial";
  $("campo-base").classList.toggle("oculto", !esExp);
}

function graficar() {
  ocultarError();
  const datos = {
    funcion: $("funcion").value,
    base: $("base").value,
    a: $("a").value, b: $("b").value, c: $("c").value, d: $("d").value,
    x_min: $("x_min").value, x_max: $("x_max").value,
    puntos: $("puntos_tabla").value,
  };
  try {
    const data = calcular(datos);
    dibujarGrafica(data);
    $("etq-f").textContent = data.etiquetaF;
    $("etq-g").textContent = data.etiquetaG;
    pintarResumen(data);
    pintarTabla(data.tabla);
  } catch (e) {
    mostrarError(e.message || "No se pudo graficar con esos valores.");
  }
}

/* Ventana cuadrada (escala 1:1 en X e Y, como GeoGebra): el eje X cubre el
   intervalo pedido y el eje Y se deduce de la relación de aspecto del lienzo,
   centrado para que el origen quede visible. Considera AMBAS curvas. */
function ventanaCartesiana(serieF, serieG) {
  const xs = serieG.map((p) => p.x);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const anchoX = xMax - xMin;

  const wrap = document.querySelector(".lienzo-wrap");
  const w = wrap ? wrap.clientWidth : 760;
  const h = wrap ? wrap.clientHeight : 450;
  const aspecto = h / Math.max(w, 1);
  const altoY = anchoX * aspecto;            // mismas unidades por píxel en X e Y

  // Recorrido Y de ambas curvas (para recentrar solo si cabe cómodo).
  const ys = serieF.concat(serieG)
    .map((p) => p.y).filter((y) => y !== null && Number.isFinite(y));
  let centro = 0;
  if (ys.length) {
    const lo = Math.min(...ys), hi = Math.max(...ys);
    if (hi - lo <= altoY * 0.9) centro = (lo + hi) / 2;
  }
  const yMin = centro - altoY / 2, yMax = centro + altoY / 2;
  const paso = pasoBonito(anchoX / 10);
  return { xMin, xMax, yMin, yMax, paso };
}

// Devuelve un paso agradable (1, 2, 5, 10, 20, 50…) cercano al valor dado.
function pasoBonito(v) {
  if (!Number.isFinite(v) || v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const frac = v / base;
  const m = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10;
  return m * base;
}

function dibujarGrafica(data) {
  const serieF = data.serieF.map((p) => ({ x: p[0], y: p[1] }));
  const serieG = data.serieG.map((p) => ({ x: p[0], y: p[1] }));
  const { xMin, xMax, yMin, yMax, paso } = ventanaCartesiana(serieF, serieG);

  if (grafico) {
    grafico.data.datasets[0].data = serieF;
    grafico.data.datasets[1].data = serieG;
    grafico.options.scales.x.min = xMin;
    grafico.options.scales.x.max = xMax;
    grafico.options.scales.x.ticks.stepSize = paso;
    grafico.options.scales.y.min = yMin;
    grafico.options.scales.y.max = yMax;
    grafico.options.scales.y.ticks.stepSize = paso;
    grafico.update();
    return;
  }

  grafico = new Chart($("lienzo"), {
    type: "line",
    data: {
      datasets: [
        // f(x) original — punteada / tenue (enunciado 2.3)
        { label: "f", data: serieF, borderColor: COLOR.fTrazo,
          borderWidth: 2, borderDash: [6, 6], pointRadius: 0, tension: 0, spanGaps: false, fill: false },
        // g(x) transformada — continua resaltada
        { label: "g", data: serieG, borderColor: COLOR.gTrazo,
          borderWidth: 2.8, pointRadius: 0, tension: 0, spanGaps: false, fill: false },
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
            label: (it) => `${it.dataset.label}(x) = ${(+it.parsed.y).toFixed(3)}`,
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
            maxRotation: 0, autoSkipPadding: 14, stepSize: paso,
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
            autoSkipPadding: 12, stepSize: paso,
            callback: (v) => (v === 0 ? "" : v),
          },
        },
      },
    },
  });
}

/* Resumen interpretativo: lista las transformaciones que el motor describió. */
function pintarResumen(data) {
  const ul = $("resumen");
  ul.innerHTML = "";
  const frases = [data.etiquetaG, ...data.transformaciones];
  frases.forEach((f) => {
    const li = document.createElement("li");
    li.textContent = f;
    ul.appendChild(li);
  });
  if (!reduceMotion && window.gsap) {
    gsap.from("#resumen li", { opacity: 0, x: -14, duration: 0.4, stagger: 0.05, ease: "power2.out", overwrite: true });
  }
}

/* Tabla de tres columnas: x, f(x), g(x) (enunciado 2.3). */
function pintarTabla(filas) {
  const tbody = $("tabla-puntos").querySelector("tbody");
  tbody.innerHTML = "";
  const celda = (v) => (v === null || v === undefined ? "—" : v);
  filas.forEach((f) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${celda(f.x)}</td><td>${celda(f.fx)}</td><td>${celda(f.gx)}</td>`;
    tbody.appendChild(tr);
  });
}

function mostrarError(txt) { msgError.textContent = txt; msgError.classList.remove("oculto"); }
function ocultarError() { msgError.classList.add("oculto"); }

function restablecer() {
  // Valores por defecto del enunciado: a=1, b=1, c=0, d=0
  $("funcion").value = "cuadratica";
  $("base").value = 2;
  $("a").value = 1; $("b").value = 1; $("c").value = 0; $("d").value = 0;
  $("x_min").value = -10; $("x_max").value = 10; $("puntos_tabla").value = 9;
  refrescarCampoBase();
  graficar();
}

// Re-graficar en vivo al cambiar cualquier control, con debounce.
let t = null;
function graficarVivo() { clearTimeout(t); t = setTimeout(graficar, 160); }

let tr_ = null;
window.addEventListener("resize", () => { clearTimeout(tr_); tr_ = setTimeout(graficar, 200); });

["funcion", "base", "a", "b", "c", "d", "x_min", "x_max", "puntos_tabla"].forEach((id) =>
  $(id).addEventListener("input", graficarVivo)
);
$("funcion").addEventListener("change", () => { refrescarCampoBase(); graficar(); });
$("btn-graficar").addEventListener("click", graficar);
$("btn-reset").addEventListener("click", restablecer);

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

$("btn-graficar").addEventListener("click", () => {
  if (!reduceMotion && window.gsap) gsap.fromTo("#btn-graficar", { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
});

refrescarCampoBase();
graficar();
animarEntrada();
