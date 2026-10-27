/* ==========================================================================
   motor.js — Versión JavaScript del motor matemático
   --------------------------------------------------------------------------
   Esta es la MISMA lógica que el backend de Python (motor/funciones.py,
   transformaciones.py y validacion.py), portada a JavaScript para que la
   demo pública de GitHub Pages funcione sin servidor.

   El proyecto "oficial" usa Python; esta copia existe solo para la demo web.
   ========================================================================== */

// ---------- Funciones madre y sus dominios (espejo de funciones.py) ----------
const FUNCIONES_BASE = {
  lineal:         { nombre: "Línea",          formula: "f(x) = x",            f: x => x,          dominio: () => true },
  cuadratica:     { nombre: "Cuadrática",     formula: "f(x) = x²",           f: x => x * x,      dominio: () => true },
  cubica:         { nombre: "Cúbica",         formula: "f(x) = x³",           f: x => x ** 3,     dominio: () => true },
  valor_absoluto: { nombre: "Valor Absoluto", formula: "f(x) = |x|",          f: x => Math.abs(x),dominio: () => true },
  raiz_cuadrada:  { nombre: "Raíz Cuadrada",  formula: "f(x) = √x",           f: x => Math.sqrt(x), dominio: x => x >= 0 },
  exponencial:    { nombre: "Exponencial",    formula: "f(x) = aˣ (a>0, a≠1)", f: null,           dominio: () => true, requiereBase: true },
};

function construirFuncionBase(clave, baseExp = 2) {
  if (clave === "exponencial") {
    if (baseExp <= 0 || baseExp === 1) throw new Error("La base de la exponencial debe ser > 0 y distinta de 1.");
    return x => Math.pow(baseExp, x);
  }
  return FUNCIONES_BASE[clave].f;
}

function listarFunciones() {
  return Object.entries(FUNCIONES_BASE).map(([clave, v]) => ({
    clave, nombre: v.nombre, formula: v.formula,
  }));
}

// ---------- Validación (espejo de validacion.py) ----------
function aNumero(valor, defecto) {
  if (valor === null || valor === undefined || valor === "") return defecto;
  const n = parseFloat(valor);
  return Number.isNaN(n) ? defecto : n;
}

function validarParametros(d) {
  const clave = (d.funcion || "").trim();
  if (!FUNCIONES_BASE[clave]) throw new Error("Debe seleccionar una función base válida.");

  const a = aNumero(d.a, 1), b = aNumero(d.b, 1), c = aNumero(d.c, 0), dd = aNumero(d.d, 0);
  const baseExp = aNumero(d.base_exp, 2);
  if (clave === "exponencial" && (baseExp <= 0 || baseExp === 1))
    throw new Error("La base de la exponencial debe ser > 0 y distinta de 1.");

  let xMin = aNumero(d.x_min, -10), xMax = aNumero(d.x_max, 10);
  if (xMin >= xMax) { xMin = -10; xMax = 10; }

  let puntos = Math.trunc(aNumero(d.puntos_tabla, 9));
  if (puntos < 5) puntos = 5;

  return { funcion: clave, a, b, c, d: dd, base_exp: baseExp, x_min: xMin, x_max: xMax, puntos_tabla: puntos };
}

// ---------- Transformaciones (espejo de transformaciones.py) ----------
function evaluarG(f, x, a, b, c, d, dominio) {
  const u = b * (x - c);
  if (dominio && !dominio(u)) return null;
  const y = a * f(u) + d;
  return Number.isFinite(y) ? y : null;
}

function muestrear(clave, a, b, c, d, xMin, xMax, n, baseExp) {
  const info = FUNCIONES_BASE[clave];
  const f = construirFuncionBase(clave, baseExp);
  const dom = info.dominio;
  if (n < 2) n = 2;
  const paso = (xMax - xMin) / (n - 1);
  const serieF = [], serieG = [];
  for (let i = 0; i < n; i++) {
    const x = xMin + i * paso;
    let yf = dom(x) ? f(x) : null;
    if (yf !== null && !Number.isFinite(yf)) yf = null;
    const yg = evaluarG(f, x, a, b, c, d, dom);
    serieF.push([x, yf]);
    serieG.push([x, yg]);
  }
  return { serieF, serieG };
}

function tablaPuntos(clave, a, b, c, d, xMin, xMax, cantidad, baseExp) {
  if (cantidad < 5) cantidad = 5;
  const info = FUNCIONES_BASE[clave];
  const f = construirFuncionBase(clave, baseExp);
  const dom = info.dominio;
  const paso = (xMax - xMin) / (cantidad - 1);
  const r4 = v => (v === null ? null : Math.round(v * 10000) / 10000);
  const filas = [];
  for (let i = 0; i < cantidad; i++) {
    const x = xMin + i * paso;
    let yf = dom(x) ? f(x) : null;
    if (yf !== null && !Number.isFinite(yf)) yf = null;
    const yg = evaluarG(f, x, a, b, c, d, dom);
    filas.push({ x: r4(x), fx: r4(yf), gx: r4(yg) });
  }
  return filas;
}

const g = v => (Number.isInteger(v) ? String(v) : String(v)); // formato compacto

function resumenInterpretativo(clave, a, b, c, d, baseExp) {
  const info = FUNCIONES_BASE[clave];
  const ef = [];
  if (clave === "exponencial") ef.push(`Partimos de la función base ${info.nombre}: f(x) = ${g(baseExp)}ˣ.`);
  else ef.push(`Partimos de la función base ${info.nombre}: ${info.formula}.`);

  const aa = Math.abs(a);
  if (aa > 1) ef.push(`a = ${g(a)}: estiramiento vertical por un factor de ${g(aa)}.`);
  else if (aa > 0 && aa < 1) ef.push(`a = ${g(a)}: compresión vertical por un factor de ${g(aa)}.`);
  if (a < 0) ef.push(`a = ${g(a)}: como a < 0, hay reflexión respecto al eje X.`);
  if (a === 1) ef.push("a = 1: no hay cambio de escala ni reflexión vertical.");

  const bb = Math.abs(b);
  if (bb > 1) ef.push(`b = ${g(b)}: compresión horizontal por un factor de 1/${g(bb)}.`);
  else if (bb > 0 && bb < 1) ef.push(`b = ${g(b)}: estiramiento horizontal por un factor de 1/${g(bb)}.`);
  if (b < 0) ef.push(`b = ${g(b)}: como b < 0, hay reflexión respecto al eje Y.`);
  if (b === 1) ef.push("b = 1: no hay cambio de escala ni reflexión horizontal.");

  if (c > 0) ef.push(`c = ${g(c)}: traslación hacia la DERECHA ${g(c)} unidades.`);
  else if (c < 0) ef.push(`c = ${g(c)}: traslación hacia la IZQUIERDA ${g(Math.abs(c))} unidades.`);
  else ef.push("c = 0: no hay desplazamiento horizontal.");

  if (d > 0) ef.push(`d = ${g(d)}: traslación hacia ARRIBA ${g(d)} unidades.`);
  else if (d < 0) ef.push(`d = ${g(d)}: traslación hacia ABAJO ${g(Math.abs(d))} unidades.`);
  else ef.push("d = 0: no hay desplazamiento vertical.");

  return ef;
}

function formulaG(clave, a, b, c, d, baseExp) {
  const cuerpos = {
    lineal: "{u}", cuadratica: "({u})²", cubica: "({u})³",
    valor_absoluto: "|{u}|", raiz_cuadrada: "√({u})",
    exponencial: `${g(baseExp)}^({u})`,
  };
  let u;
  if (c === 0) u = b !== 1 ? `${g(b)}x` : "x";
  else {
    const signo = c > 0 ? "−" : "+";
    u = b !== 1 ? `${g(b)}(x ${signo} ${g(Math.abs(c))})` : `(x ${signo} ${g(Math.abs(c))})`;
  }
  const cuerpo = cuerpos[clave].replace("{u}", u);
  const pref = a === 1 ? "" : `${g(a)}·`;
  let suf = "";
  if (d > 0) suf = ` + ${g(d)}`;
  else if (d < 0) suf = ` − ${g(Math.abs(d))}`;
  return `g(x) = ${pref}${cuerpo}${suf}`;
}

/* API local que imita la respuesta del backend Python */
function calcular(datos) {
  const p = validarParametros(datos);
  const { serieF, serieG } = muestrear(p.funcion, p.a, p.b, p.c, p.d, p.x_min, p.x_max, 400, p.base_exp);
  const tabla = tablaPuntos(p.funcion, p.a, p.b, p.c, p.d, p.x_min, p.x_max, p.puntos_tabla, p.base_exp);
  const resumen = resumenInterpretativo(p.funcion, p.a, p.b, p.c, p.d, p.base_exp);
  const formula = formulaG(p.funcion, p.a, p.b, p.c, p.d, p.base_exp);
  const info = FUNCIONES_BASE[p.funcion];
  return {
    ok: true, funcion_nombre: info.nombre, formula_f: info.formula, formula_g: formula,
    serie_f: serieF, serie_g: serieG, tabla, resumen,
  };
}
