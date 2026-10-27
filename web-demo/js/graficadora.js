/* ==========================================================================
   graficadora.js — UI de la DEMO estática (GitHub Pages)
   Igual que la versión del frontend, pero en vez de pedir los cálculos a
   un servidor Python, los obtiene de motor.js (que corre en el navegador).
   ========================================================================== */

let grafico = null;
const $ = (id) => document.getElementById(id);
const selFuncion = $("funcion");
const cajaBase = $("caja-base");
const msgError = $("mensaje-error");

function cargarFunciones() {
  selFuncion.innerHTML = "";
  listarFunciones().forEach((fn) => {
    const op = document.createElement("option");
    op.value = fn.clave;
    op.textContent = `${fn.nombre}  —  ${fn.formula}`;
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
    const data = calcular(datos); // motor local (motor.js)
    dibujarGrafica(data);
    pintarResumen(data.resumen);
    pintarTabla(data.tabla);
    $("etq-f").textContent = `f(x) original: ${data.formula_f}`;
    $("etq-g").textContent = `g(x) transformada: ${data.formula_g}`;
  } catch (e) {
    mostrarError(e.message || "Ocurrió un error al calcular.");
  }
}

function dibujarGrafica(data) {
  const serieF = data.serie_f.map((p) => ({ x: p[0], y: p[1] }));
  const serieG = data.serie_g.map((p) => ({ x: p[0], y: p[1] }));
  const cfg = {
    type: "line",
    data: {
      datasets: [
        { label: "f(x) original", data: serieF, borderColor: "#ff9f6c",
          borderDash: [6, 5], borderWidth: 2, pointRadius: 0, tension: 0.15, spanGaps: false },
        { label: "g(x) transformada", data: serieG, borderColor: "#6c8cff",
          borderWidth: 3, pointRadius: 0, tension: 0.15, spanGaps: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { labels: { color: "#e8ebf7" } },
        title: { display: true, text: "Función original f(x) vs. función transformada g(x)", color: "#e8ebf7" },
      },
      scales: {
        x: { type: "linear", title: { display: true, text: "Eje X", color: "#9aa3c7" },
             grid: { color: "#2a3052" }, ticks: { color: "#9aa3c7" } },
        y: { title: { display: true, text: "Eje Y", color: "#9aa3c7" },
             grid: { color: "#2a3052" }, ticks: { color: "#9aa3c7" } },
      },
    },
  };
  if (grafico) grafico.destroy();
  grafico = new Chart($("lienzo"), cfg);
}

function pintarResumen(frases) {
  const ul = $("resumen"); ul.innerHTML = "";
  frases.forEach((f) => { const li = document.createElement("li"); li.textContent = f; ul.appendChild(li); });
}

function pintarTabla(filas) {
  const tbody = $("tabla-puntos").querySelector("tbody"); tbody.innerHTML = "";
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

selFuncion.addEventListener("change", () => { alternarCajaBase(); graficar(); });
$("btn-graficar").addEventListener("click", graficar);
$("btn-reset").addEventListener("click", restablecer);

cargarFunciones();
graficar();
