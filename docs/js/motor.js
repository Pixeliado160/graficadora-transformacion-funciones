/* ==========================================================================
   motor.js — Evaluador de expresiones estilo GeoGebra (demo web)
   --------------------------------------------------------------------------
   El usuario escribe UNA función tal como en GeoGebra, por ejemplo:
        2*(x-1)^2 + 3        sqrt(x-2)        0.5*abs(x)+2        2^x
   y este motor la convierte en una función evaluable y en una tabla de
   puntos, SIN usar eval (intérprete propio: tokenizador + parser Pratt).

   El proyecto "oficial" usa Python (Flask); esta copia web existe solo para
   la demo pública de GitHub Pages y para comparar contra GeoGebra.
   ========================================================================== */

/* -------------------- 1. Tokenizador -------------------- */
function tokenizar(entrada) {
  const s = entrada.replace(/−/g, "-").replace(/·/g, "*").replace(/\s+/g, "");
  const tokens = [];
  let i = 0;
  const esDigito = (c) => c >= "0" && c <= "9";
  const esLetra = (c) => /[a-zA-Z]/.test(c);

  while (i < s.length) {
    const c = s[i];
    if (esDigito(c) || (c === "." && esDigito(s[i + 1]))) {
      let num = "";
      while (i < s.length && (esDigito(s[i]) || s[i] === ".")) num += s[i++];
      tokens.push({ t: "num", v: parseFloat(num) });
    } else if (esLetra(c)) {
      let id = "";
      while (i < s.length && (esLetra(s[i]) || esDigito(s[i]))) id += s[i++];
      tokens.push({ t: "id", v: id.toLowerCase() });
    } else if ("+-*/^(),".includes(c)) {
      tokens.push({ t: c });
      i++;
    } else {
      throw new Error(`Carácter no válido: "${c}"`);
    }
  }
  tokens.push({ t: "eof" });
  return tokens;
}

/* -------------------- 2. Parser (Pratt) -------------------- */
// Constantes y funciones permitidas (nombres de GeoGebra y comunes)
const CONSTANTES = { pi: Math.PI, e: Math.E };
const FUNCIONES_MAT = {
  sqrt: Math.sqrt, abs: Math.abs,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  ln: Math.log, log: Math.log10, exp: Math.exp,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  sign: Math.sign, cbrt: Math.cbrt,
};

function parsear(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const esperar = (t) => {
    if (peek().t !== t) throw new Error(`Se esperaba "${t}"`);
    return next();
  };

  // Gramática por niveles (de menor a mayor prioridad):
  //   suma:   term (('+'|'-') term)*
  //   term:   unario (('*'|'/') unario)*
  //   unario: '-' unario | '+' unario | potencia
  //   pot:    primario ('^' unario)?       (^ der-asociativo; -x^2 = -(x^2))
  function parseExpr() { return parseSuma(); }

  function parseSuma() {
    let izq = parseTerm();
    while (peek().t === "+" || peek().t === "-") {
      const op = next().t;
      izq = { op, l: izq, r: parseTerm() };
    }
    return izq;
  }

  function parseTerm() {
    let izq = parseUnario();
    while (peek().t === "*" || peek().t === "/") {
      const op = next().t;
      izq = { op, l: izq, r: parseUnario() };
    }
    return izq;
  }

  function parseUnario() {
    if (peek().t === "-") { next(); return { op: "neg", r: parseUnario() }; }
    if (peek().t === "+") { next(); return parseUnario(); }
    return parsePotencia();
  }

  function parsePotencia() {
    const base = parsePrimario();
    if (peek().t === "^") {
      next();
      return { op: "^", l: base, r: parseUnario() }; // permite 2^-x y x^2
    }
    return base;
  }

  function parsePrimario() {
    const tk = peek();
    if (tk.t === "num") { next(); return { num: tk.v }; }
    if (tk.t === "(") {
      next(); const e = parseExpr(1); esperar(")"); return e;
    }
    if (tk.t === "id") {
      next();
      // ¿llamada a función?  nombre(...)
      if (peek().t === "(") {
        next();
        const arg = parseExpr(1);
        esperar(")");
        if (!FUNCIONES_MAT[tk.v]) throw new Error(`Función desconocida: "${tk.v}"`);
        return { fn: tk.v, arg };
      }
      if (tk.v === "x") return { varx: true };
      if (tk.v in CONSTANTES) return { num: CONSTANTES[tk.v] };
      throw new Error(`Símbolo desconocido: "${tk.v}" (use x, o funciones como sqrt, abs…)`);
    }
    throw new Error("Expresión incompleta.");
  }

  const arbol = parseExpr(1);
  esperar("eof");
  return arbol;
}

/* -------------------- 3. Evaluación del árbol -------------------- */
function evalNodo(n, x) {
  if ("num" in n) return n.num;
  if ("varx" in n) return x;
  if ("fn" in n) return FUNCIONES_MAT[n.fn](evalNodo(n.arg, x));
  if (n.op === "neg") return -evalNodo(n.r, x);
  const l = evalNodo(n.l, x), r = evalNodo(n.r, x);
  switch (n.op) {
    case "+": return l + r;
    case "-": return l - r;
    case "*": return l * r;
    case "/": return l / r;
    case "^": return Math.pow(l, r);
  }
  throw new Error("Operación no soportada.");
}

/* Compila una expresión de texto a una función f(x). Lanza Error si es inválida. */
function compilar(expr) {
  if (!expr || !expr.trim()) throw new Error("Escribe una función, por ejemplo: 2*(x-1)^2+3");
  const arbol = parsear(tokenizar(expr));
  return (x) => {
    const y = evalNodo(arbol, x);
    return Number.isFinite(y) ? y : null; // fuera de dominio / indefinido -> hueco
  };
}

/* -------------------- 4. Muestreo y tabla (igual criterio que antes) -------------------- */
function muestrear(f, xMin, xMax, n) {
  if (n < 2) n = 2;
  const paso = (xMax - xMin) / (n - 1);
  const serie = [];
  for (let i = 0; i < n; i++) {
    const x = xMin + i * paso;
    let y;
    try { y = f(x); } catch (_) { y = null; }
    serie.push([x, y === null || !Number.isFinite(y) ? null : y]);
  }
  return serie;
}

function tablaPuntos(f, xMin, xMax, cantidad) {
  if (cantidad < 5) cantidad = 5;
  const paso = (xMax - xMin) / (cantidad - 1);
  const r4 = (v) => (v === null ? null : Math.round(v * 10000) / 10000);
  const filas = [];
  for (let i = 0; i < cantidad; i++) {
    const x = xMin + i * paso;
    let y;
    try { y = f(x); } catch (_) { y = null; }
    if (y !== null && !Number.isFinite(y)) y = null;
    filas.push({ x: r4(x), y: r4(y) });
  }
  return filas;
}

/* -------------------- 5. Validación de parámetros de la interfaz -------------------- */
function aNumero(valor, defecto) {
  if (valor === null || valor === undefined || valor === "") return defecto;
  const n = parseFloat(valor);
  return Number.isNaN(n) ? defecto : n;
}

/* API local: recibe { expr, x_min, x_max, puntos } y devuelve lo que pinta la web */
function calcular(datos) {
  const f = compilar(datos.expr);
  let xMin = aNumero(datos.x_min, -10), xMax = aNumero(datos.x_max, 10);
  if (xMin >= xMax) { xMin = -10; xMax = 10; }
  let puntos = Math.trunc(aNumero(datos.puntos, 9));
  if (puntos < 5) puntos = 5;

  return {
    ok: true,
    expr: datos.expr.trim(),
    serie: muestrear(f, xMin, xMax, 400),
    tabla: tablaPuntos(f, xMin, xMax, puntos),
  };
}
