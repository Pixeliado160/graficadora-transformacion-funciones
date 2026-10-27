/* ==========================================================================
   graficadora.js — Lógica del FRONTEND
   --------------------------------------------------------------------------
   Este archivo NO hace matemática: solo toma lo que el usuario escribe,
   lo envía al backend de Python (Flask) y dibuja la respuesta.

   Flujo:
     1. Al cargar, pide /api/funciones para llenar el menú.
     2. Al pulsar "Graficar", envía los parámetros a /api/graficar (POST).
     3. Con la respuesta, dibuja f(x) y g(x), pinta la tabla y el resumen.
   ========================================================================== */

let grafico = null; // instancia de Chart.js reutilizada

// --- Referencias a elementos del DOM ---
const $ = (id) => document.getElementById(id);
const selFuncion = $("funcion");
const cajaBase = $("caja-base");
const msgError = $("mensaje-error");

// --- 1. Cargar el catálogo de funciones al iniciar ---
async function cargarFunciones() {
  try {
    const r = await fetch("/api/funciones");
    const lista = await r.json();
    selFuncion.innerHTML = "";
    lista.forEach((fn) => {
      const op = document.createElement("option");
      op.value = fn.clave;
      op.textContent = `${fn.nombre}  —  ${fn.formula}`;
      selFuncion.appendChild(op);
    });
    alternarCajaBase();
  } catch (e) {
    mostrarError("No se pudo cargar la lista de funciones. ¿Está corriendo el servidor Python?");
  }
}

// Muestra el campo "base" solo si la función elegida es la exponencial
function alternarCajaBase() {
  cajaBase.classList.toggle("oculto", selFuncion.value !== "exponencial");
}

// --- 2. Enviar parámetros al backend y graficar ---
async function graficar() {
  ocultarError();
  const cuerpo = {
    funcion: selFuncion.value,
    a: $("a").value,
    b: $("b").value,
    c: $("c").value,
    d: $("d").value,
    base_exp: $("base_exp").value,
    x_min: $("x_min").value,
    x_max: $("x_max").value,
    puntos_tabla: $("puntos_tabla").value,
  };

  try {
    const r = await fetch("/api/graficar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const data = await r.json();

    if (!data.ok) {
      mostrarError(data.error || "Ocurrió un error al calcular.");
      return;
    }

    dibujarGrafica(data);
    pintarResumen(data.resumen);
    pintarTabla(data.tabla);
    $("etq-f").textContent = `f(x) original: ${data.formula_f}`;
    $("etq-g").textContent = `g(x) transformada: ${data.formula_g}`;
  } catch (e) {
    mostrarError("No se pudo contactar el servidor Python. Verifica que app.py esté corriendo.");
  }
}

// --- 3. Dibujo con Chart.js ---
function dibujarGrafica(data) {
  // Convertimos [[x, y], ...] al formato {x, y} que entiende Chart.js.
  // Los puntos fuera de dominio (y === null) crean huecos en la línea.
  const serieF = data.serie_f.map((p) => ({ x: p[0], y: p[1] }));
  const serieG = data.serie_g.map((p) => ({ x: p[0], y: p[1] }));

  const cfg = {
    type: "line",
    data: {
      datasets: [
        {
          label: `f(x) original`,
          data: serieF,
          borderColor: "#ff9f6c",
          borderDash: [6, 5],      // punteada (requisito)
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.15,
          spanGaps: false,
        },
        {
          label: `g(x) transformada`,
          data: serieG,
          borderColor: "#6c8cff",
          borderWidth: 3,          // continua y resaltada (requisito)
          pointRadius: 0,
          tension: 0.15,
          spanGaps: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { labels: { color: "#e8ebf7" } },   // leyenda (requisito)
        title: {
          display: true,
          text: "Función original f(x) vs. función transformada g(x)",
          color: "#e8ebf7",
        },
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Eje X", color: "#9aa3c7" },
          grid: { color: "#2a3052" },               // cuadrícula (requisito)
          ticks: { color: "#9aa3c7" },
        },
        y: {
          title: { display: true, text: "Eje Y", color: "#9aa3c7" },
          grid: { color: "#2a3052" },
          ticks: { color: "#9aa3c7" },
        },
      },
    },
  };

  if (grafico) grafico.destroy();
  grafico = new Chart($("lienzo"), cfg);
}

// --- Resumen interpretativo (lista de frases) ---
function pintarResumen(frases) {
  const ul = $("resumen");
  ul.innerHTML = "";
  frases.forEach((f) => {
    const li = document.createElement("li");
    li.textContent = f;
    ul.appendChild(li);
  });
}

// --- Tabla de puntos ---
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

// --- Manejo de errores visibles ---
function mostrarError(txt) {
  msgError.textContent = txt;
  msgError.classList.remove("oculto");
}
function ocultarError() {
  msgError.classList.add("oculto");
}

// --- Restablecer valores por defecto (a=1, b=1, c=0, d=0) ---
function restablecer() {
  $("a").value = 1;
  $("b").value = 1;
  $("c").value = 0;
  $("d").value = 0;
  $("x_min").value = -10;
  $("x_max").value = 10;
  $("puntos_tabla").value = 9;
  $("base_exp").value = 2;
  graficar();
}

// --- Enlaces de eventos ---
selFuncion.addEventListener("change", () => { alternarCajaBase(); graficar(); });
$("btn-graficar").addEventListener("click", graficar);
$("btn-reset").addEventListener("click", restablecer);

// Arranque
(async function init() {
  await cargarFunciones();
  graficar(); // dibuja algo de inmediato con los valores por defecto
})();
