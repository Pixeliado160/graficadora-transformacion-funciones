/* ==========================================================================
   graficadora.js — UI de la demo (GitHub Pages)
   Obtiene los cálculos de motor.js (JS, espejo del backend Python) y los
   dibuja. Diseño: una sola animación memorable — la curva transiciona entre
   estados cada vez que cambia un parámetro.
   ========================================================================== */

const COLOR = { azul: "#1B6FE3", naranja: "#E8683C", grid: "#C8C4B8", tinta: "#0E1116", tinta2: "#585750" };
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // Si ya existe el gráfico, ACTUALIZAMOS los datos en vez de recrearlo:
  // así Chart.js interpola entre la curva anterior y la nueva (transición).
  if (grafico) {
    grafico.data.datasets[0].data = serieF;
    grafico.data.datasets[1].data = serieG;
    grafico.update();           // anima del estado viejo al nuevo
    return;
  }

  grafico = new Chart($("lienzo"), {
    type: "line",
    data: {
      datasets: [
        { label: "f(x) original", data: serieF, borderColor: COLOR.naranja,
          borderDash: [5, 5], borderWidth: 1.75, pointRadius: 0, tension: 0.18, spanGaps: false },
        { label: "g(x) transformada", data: serieG, borderColor: COLOR.azul,
          borderWidth: 2.75, pointRadius: 0, tension: 0.18, spanGaps: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion ? false : { duration: 520, easing: "easeInOutCubic" },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },  // la leyenda vive en el HTML, más limpia
        tooltip: {
          backgroundColor: COLOR.tinta, padding: 10, cornerRadius: 0,
          titleFont: { family: "Inter" }, bodyFont: { family: "Inter" },
          callbacks: {
            title: (it) => `x = ${(+it[0].parsed.x).toFixed(2)}`,
            label: (it) => `${it.dataset.label.split(" ")[0]} = ${(+it.parsed.y).toFixed(3)}`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          grid: { color: COLOR.grid, lineWidth: 0.5 },
          border: { color: COLOR.tinta },
          ticks: { color: COLOR.tinta2, font: { family: "Inter", size: 11 } },
        },
        y: {
          grid: { color: COLOR.grid, lineWidth: 0.5 },
          border: { color: COLOR.tinta },
          ticks: { color: COLOR.tinta2, font: { family: "Inter", size: 11 } },
        },
      },
    },
  });
}

function pintarResumen(frases) {
  const ul = $("resumen");
  ul.innerHTML = "";
  frases.forEach((f, i) => {
    const li = document.createElement("li");
    li.textContent = f;
    li.style.animationDelay = reduceMotion ? "0s" : `${i * 45}ms`;  // escalonado discreto
    ul.appendChild(li);
  });
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

// Re-graficar en vivo al escribir, con pequeño debounce (sensación fluida)
let t = null;
function graficarVivo() { clearTimeout(t); t = setTimeout(graficar, 180); }

["a", "b", "c", "d", "base_exp", "x_min", "x_max", "puntos_tabla"].forEach((id) =>
  $(id).addEventListener("input", graficarVivo)
);
selFuncion.addEventListener("change", () => { alternarCajaBase(); graficar(); });
$("btn-graficar").addEventListener("click", graficar);
$("btn-reset").addEventListener("click", restablecer);

cargarFunciones();
graficar();
