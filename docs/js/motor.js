/* ==========================================================================
   motor.js — Motor de Transformación de Funciones (demo web)
   --------------------------------------------------------------------------
   Modelo EXACTO del enunciado de Canvas:

        g(x) = a · f(b (x − c)) + d

   El usuario:
     1. Elige una FUNCIÓN MADRE f(x) de la lista permitida.
     2. Da los coeficientes a, b, c, d.
   El motor evalúa f(x) (original) y g(x) (transformada), arma la tabla
   (x, f(x), g(x)) y describe en lenguaje natural cada transformación.

   SIN eval. El proyecto "oficial" es Python (Flask); esta copia web existe
   para la demo de GitHub Pages y para comparar contra GeoGebra.
   ========================================================================== */

/* -------------------- 1. Funciones madre f(x) permitidas -------------------- */
/* Las seis del enunciado (2.1). 'base' es solo para la exponencial a^x.       */
const FUNCIONES_MADRE = {
  lineal:      { etiqueta: "Línea  f(x) = x",            latex: "x",        f: (x) => x },
  cuadratica:  { etiqueta: "Cuadrática  f(x) = x²",      latex: "x^2",      f: (x) => x * x },
  cubica:      { etiqueta: "Cúbica  f(x) = x³",          latex: "x^3",      f: (x) => x * x * x },
  absoluto:    { etiqueta: "Valor absoluto  f(x) = |x|", latex: "|x|",      f: (x) => Math.abs(x) },
  raiz:        { etiqueta: "Raíz cuadrada  f(x) = √x",   latex: "\\sqrt{x}", f: (x) => (x < 0 ? null : Math.sqrt(x)) },
  exponencial: { etiqueta: "Exponencial  f(x) = aˣ",     latex: "base^x",   f: null /* usa base */ },
};

/* Devuelve la f(x) madre lista para evaluar (la exponencial necesita 'base'). */
function construirMadre(clave, base) {
  const def = FUNCIONES_MADRE[clave];
  if (!def) throw new Error("Elige una función base válida.");
  if (clave === "exponencial") {
    const b = base;
    if (!(b > 0) || b === 1) throw new Error("La base de la exponencial debe ser a > 0 y a ≠ 1.");
    return (x) => Math.pow(b, x);
  }
  return def.f;
}

/* -------------------- 2. Modelo de transformación g(x) = a·f(b(x−c))+d ------ */
function construirTransformada(fMadre, a, b, c, d) {
  return (x) => {
    const u = b * (x - c);          // argumento interno: b(x − c)
    const fu = fMadre(u);           // f(b(x − c))  — puede ser null (fuera de dominio)
    if (fu === null || fu === undefined || !Number.isFinite(fu)) return null;
    const y = a * fu + d;           // a·f(…) + d
    return Number.isFinite(y) ? y : null;
  };
}

/* -------------------- 3. Resumen interpretativo (lenguaje natural) ---------- */
/* Describe, parámetro por parámetro, lo que hace la transformación (req. 2.3). */
function describirTransformaciones(a, b, c, d) {
  const f = [];

  // --- a: factor vertical / reflexión en X ---
  const absA = Math.abs(a);
  if (a < 0) f.push(`Reflexión respecto al eje X (porque a = ${a} es negativo).`);
  if (absA > 1)      f.push(`Estiramiento vertical por un factor de ${absA}.`);
  else if (absA < 1 && absA > 0) f.push(`Compresión vertical por un factor de ${absA}.`);
  if (a === 0)       f.push(`a = 0 aplana la función a la recta y = ${d}.`);

  // --- b: factor horizontal / reflexión en Y ---
  const absB = Math.abs(b);
  if (b < 0) f.push(`Reflexión respecto al eje Y (porque b = ${b} es negativo).`);
  if (absB > 1)      f.push(`Compresión horizontal por un factor de 1/${absB}.`);
  else if (absB < 1 && absB > 0) f.push(`Estiramiento horizontal por un factor de 1/${absB}.`);

  // --- c: desplazamiento horizontal ---
  if (c > 0)      f.push(`Traslación horizontal: ${c} unidad(es) hacia la derecha.`);
  else if (c < 0) f.push(`Traslación horizontal: ${Math.abs(c)} unidad(es) hacia la izquierda.`);

  // --- d: desplazamiento vertical ---
  if (d > 0)      f.push(`Traslación vertical: ${d} unidad(es) hacia arriba.`);
  else if (d < 0) f.push(`Traslación vertical: ${Math.abs(d)} unidad(es) hacia abajo.`);

  if (f.length === 0) f.push("Sin transformación: g(x) coincide con la función base f(x).");
  return f;
}

/* Arma el texto g(x) = … para mostrar en la leyenda (solo informativo).
   'plantillaMadre' ya viene legible: "x", "x²", "x³", "|x|", "√x" o "2^x". */
function expresionG(plantillaMadre, a, b, c, d) {
  const neg = (n) => String(n).replace("-", "−");  // guión → signo menos tipográfico
  // Argumento interno b(x − c) escrito de forma legible.
  let arg;
  if (b === 1 && c === 0) arg = "x";
  else {
    const parteC = c === 0 ? "x" : (c > 0 ? `x − ${c}` : `x + ${Math.abs(c)}`);
    // Si hay b≠1, va entre paréntesis: b(x−c). Si b=1 pero hay c, también: (x−c).
    arg = b === 1 ? `(${parteC})` : `${neg(b)}(${parteC})`;
  }
  // Sustituir la 'x' de la plantilla por el argumento (incluye |x|, √x, x², 2^x).
  let fArg = plantillaMadre.replace(/x/g, arg);
  // Envoltura: a · f(arg) + d
  let s = "";
  if (a === 1) s = fArg;
  else if (a === -1) s = `−${fArg}`;
  else s = `${neg(a)}·${fArg}`;
  if (d > 0) s += ` + ${d}`;
  else if (d < 0) s += ` − ${Math.abs(d)}`;
  return s;
}

/* -------------------- 4. Validación de parámetros -------------------- */
function aNumero(valor, defecto) {
  if (valor === null || valor === undefined || valor === "") return defecto;
  const n = parseFloat(String(valor).replace(",", "."));
  return Number.isNaN(n) ? defecto : n;
}

/* -------------------- 5. Muestreo y tabla -------------------- */
function muestrear(fn, xMin, xMax, n) {
  if (n < 2) n = 2;
  const paso = (xMax - xMin) / (n - 1);
  const serie = [];
  for (let i = 0; i < n; i++) {
    const x = xMin + i * paso;
    let y;
    try { y = fn(x); } catch (_) { y = null; }
    serie.push([x, y === null || !Number.isFinite(y) ? null : y]);
  }
  return serie;
}

function tablaPuntos(fMadre, gTrans, xMin, xMax, cantidad) {
  if (cantidad < 5) cantidad = 5;                 // enunciado: al menos 5 puntos
  const paso = (xMax - xMin) / (cantidad - 1);
  const r4 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? null : Math.round(v * 10000) / 10000);
  const filas = [];
  for (let i = 0; i < cantidad; i++) {
    const x = xMin + i * paso;
    let fx, gx;
    try { fx = fMadre(x); } catch (_) { fx = null; }
    try { gx = gTrans(x); } catch (_) { gx = null; }
    filas.push({ x: r4(x), fx: r4(fx), gx: r4(gx) });
  }
  return filas;
}

/* -------------------- 6. API local -------------------- */
/* Recibe { funcion, base, a, b, c, d, x_min, x_max, puntos } y devuelve todo
   lo que la interfaz necesita pintar (gráfica, tabla, resumen).            */
function calcular(datos) {
  const clave = datos.funcion;
  const base  = aNumero(datos.base, 2);

  // Valores por defecto del enunciado: a=1, b=1, c=0, d=0
  const a = aNumero(datos.a, 1);
  const b = aNumero(datos.b, 1);
  const c = aNumero(datos.c, 0);
  const d = aNumero(datos.d, 0);

  const fMadre = construirMadre(clave, base);
  const gTrans = construirTransformada(fMadre, a, b, c, d);

  let xMin = aNumero(datos.x_min, -10), xMax = aNumero(datos.x_max, 10);
  if (xMin >= xMax) { xMin = -10; xMax = 10; }
  let puntos = Math.trunc(aNumero(datos.puntos, 9));
  if (puntos < 5) puntos = 5;

  const def = FUNCIONES_MADRE[clave];
  // Plantilla legible de la madre, con 'x' intacta para sustituir el argumento.
  const plantillaMadre = clave === "exponencial"
    ? `${base}^x`
    : def.latex.replace(/\\sqrt\{x\}/, "√x").replace("^2", "²").replace("^3", "³");

  return {
    ok: true,
    a, b, c, d,
    etiquetaF: `f(x) = ${plantillaMadre}`,
    etiquetaG: `g(x) = ${expresionG(plantillaMadre, a, b, c, d)}`,
    serieF: muestrear(fMadre, xMin, xMax, 400),
    serieG: muestrear(gTrans, xMin, xMax, 400),
    tabla: tablaPuntos(fMadre, gTrans, xMin, xMax, puntos),
    transformaciones: describirTransformaciones(a, b, c, d),
  };
}

/* Exportación para pruebas con Node (ignorado en el navegador). */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { FUNCIONES_MADRE, construirMadre, construirTransformada, describirTransformaciones, calcular };
}
