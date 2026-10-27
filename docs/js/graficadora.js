/* ==========================================================================
   graficadora.js — UI de la demo (GitHub Pages)
   Tema oscuro violeta/cian. Cálculos desde motor.js (espejo del Python).
   Animaciones con GSAP: entrada orquestada, aurora que respira, curva que
   se dibuja trazo a trazo. Respeta prefers-reduced-motion.
   ========================================================================== */

const COLOR = {
  violeta: "#a855f7", cian: "#22d3ee",
  grid: "rgba(154,160,207,.14)", borde: "#2a2c52",
  texto: "#eef0ff", texto2: "#9aa0cf",
};
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let grafico = null;
let primeraVez = true;
const $ = (id) => document.getElementById(id);
const selFuncion = $("funcion");
const cajaBase = $("caja-base");
const msgError = $("mensaje-error");

function cargarFunciones() {
  selFuncion.innerHTML = "";
  listarFunciones().forEach((fn) => {
    const op = document.createElement("option");
    op.value = fn.clave;
    op.textContent = `${fn.nombre} — ${fn.formula}`;
    selFuncion.appendChild(op);
  });
  alternarCajaBase();
}

function alternarCajaBase() {
  cajaBase.classList.toggle("oculto", selFuncion.value !== "exponencial");
}

function graficar() {
  ocultarError();
  const datos = {
    funcion: selFuncion.value,
    a: $("a").value, b: $("b").value, c: $("c").value, d: $("d").value,
    base_exp: $("base_exp").value,
    x_min: $("x_min").value, x_max: $("x_max").value,
    puntos_tabla: $("puntos_tabla").value,
  };
  try {
    const data = calcular(datos);
    dibujarGrafica(data);
    pintarResumen(data.resumen);
    pintarTabla(data.tabla);
    $("etq-f").textContent = `f(x) = ${data.formula_f.replace("f(x) = ", "")}`;
    $("etq-g").textContent = data.formula_g;
  } catch (e) {
    mostrarError(e.message || "No se pudo calcular con esos valores.");
  }
}

function dibujarGrafica(data) {
  const serieF = data.serie_f.map((p) => ({ x: p[0], y: p[1] }));
  const serieG = data.serie_g.map((p) => ({ x: p[0], y: p[1] }));

  if (grafico) {
    grafico.data.datasets[0].data = serieF;
    grafico.data.datasets[1].data = serieG;
    grafico.update();
    return;
  }

  grafico = new Chart($("lienzo"), {
    type: "line",
    data: {
      datasets: [
        { label: "f(x) original", data: serieF, borderColor: COLOR.cian,
          borderDash: [5, 5], borderWidth: 1.75, pointRadius: 0, tension: 0.18, spanGaps: false },
        { label: "g(x) transformada", data: serieG, borderColor: COLOR.violeta,
          borderWidth: 3, pointRadius: 0, tension: 0.18, spanGaps: false,
          // Glow sutil bajo la curva protagonista
          backgroundColor: "rgba(168,85,247,.06)", fill: true },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // Curva "dibujándose" trazo a trazo en el primer render
      animation: reduceMotion ? false : { duration: 900, easing: "easeInOutCubic" },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#15162e", borderColor: COLOR.borde, borderWidth: 1,
          padding: 11, cornerRadius: 10, titleColor: COLOR.cian, bodyColor: COLOR.texto,
          titleFont: { family: "Space Grotesk" }, bodyFont: { family: "Inter" },
          callbacks: {
            title: (it) => `x = ${(+it[0].parsed.x).toFixed(2)}`,
            label: (it) => `${it.dataset.label.split(" ")[0]} = ${(+it.parsed.y).toFixed(3)}`,
          },
        },
      },
      scales: {
        x: { type: "linear", grid: { color: COLOR.grid }, border: { color: COLOR.borde },
             ticks: { color: COLOR.texto2, font: { family: "Inter", size: 11 } } },
        y: { grid: { color: COLOR.grid }, border: { color: COLOR.borde },
             ticks: { color: COLOR.texto2, font: { family: "Inter", size: 11 } } },
      },
    },
  });
}

function pintarResumen(frases) {
  const ul = $("resumen");
  ul.innerHTML = "";
  frases.forEach((f) => {
    const li = document.createElement("li");
    li.textContent = f;
    ul.appendChild(li);
  });
  // Entrada escalonada de las frases (GSAP)
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
    tr.innerHTML = `<td>${celda(f.x)}</td><td>${celda(f.fx)}</td><td>${celda(f.gx)}</td>`;
    tbody.appendChild(tr);
  });
}

function mostrarError(txt) { msgError.textContent = txt; msgError.classList.remove("oculto"); }
function ocultarError() { msgError.classList.add("oculto"); }

function restablecer() {
  $("a").value = 1; $("b").value = 1; $("c").value = 0; $("d").value = 0;
  $("x_min").value = -10; $("x_max").value = 10; $("puntos_tabla").value = 9; $("base_exp").value = 2;
  graficar();
}

// Re-graficar en vivo al escribir, con debounce
let t = null;
function graficarVivo() { clearTimeout(t); t = setTimeout(graficar, 160); }
["a", "b", "c", "d", "base_exp", "x_min", "x_max", "puntos_tabla"].forEach((id) =>
  $(id).addEventListener("input", graficarVivo)
);
selFuncion.addEventListener("change", () => { alternarCajaBase(); graficar(); });
$("btn-graficar").addEventListener("click", graficar);
$("btn-reset").addEventListener("click", restablecer);

/* ---------- Animaciones de página con GSAP ---------- */
function animarEntrada() {
  if (reduceMotion || !window.gsap) {
    document.querySelectorAll(".anim-init").forEach((el) => (el.style.opacity = 1));
    return;
  }
  // Entrada orquestada: cabecera primero, luego paneles
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.fromTo(".cabecera .anim-init",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, 0)
    .fromTo(".lienzo-area .anim-init, .inferior .anim-init",
        { opacity: 0, y: 34 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }, 0.25);

  // La marca con un brillo de entrada
  gsap.fromTo(".marca", { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "back.out(2)", delay: 0.1 });

  // Aurora que respira (loop suave)
  gsap.to(".aurora .b1", { x: 60, y: 40, scale: 1.15, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".aurora .b2", { x: -50, y: -30, scale: 1.1, duration: 11, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".aurora .b3", { x: 40, y: -50, scale: 1.2, duration: 13, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

// Micro-feedback al pulsar Graficar
$("btn-graficar").addEventListener("click", () => {
  if (!reduceMotion && window.gsap) gsap.fromTo("#btn-graficar", { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
});

cargarFunciones();
graficar();
animarEntrada();
