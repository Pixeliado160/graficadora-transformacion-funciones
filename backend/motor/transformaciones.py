"""
transformaciones.py
====================
Lógica MATEMÁTICA del proyecto, desacoplada del frontend y de la captura
de datos (requisito de "estructura modular", sección 3).

Implementa el MODELO GENERAL DE TRANSFORMACIÓN (sección 2.2):

        g(x) = a · f( b (x − c) ) + d

y genera:
  - la evaluación numérica de f(x) y g(x) sobre un intervalo,
  - la TABLA DE PUNTOS (x, f(x), g(x)),
  - el RESUMEN INTERPRETATIVO en lenguaje natural de cada parámetro.

Este módulo NO sabe nada de HTML, Flask ni matplotlib: solo matemática.
"""

from . import funciones


# ---------------------------------------------------------------------------
# 1. Evaluación de la función transformada g(x)
# ---------------------------------------------------------------------------
def evaluar_g(f, x, a=1.0, b=1.0, c=0.0, d=0.0, dominio=None):
    """
    Evalúa g(x) = a · f(b(x − c)) + d en un punto x.

    Devuelve None si el argumento interno u = b(x − c) cae FUERA del dominio
    de la función base (p. ej. raíz de un negativo). Así evitamos errores de
    dominio, tal como pide la sección 3 (validación de entradas).
    """
    u = b * (x - c)
    if dominio is not None and not dominio(u):
        return None
    try:
        return a * f(u) + d
    except (ValueError, ZeroDivisionError, OverflowError):
        return None


# ---------------------------------------------------------------------------
# 2. Muestreo de la curva (para que el frontend la dibuje)
# ---------------------------------------------------------------------------
def muestrear(clave_funcion, a=1.0, b=1.0, c=0.0, d=0.0,
              x_min=-10.0, x_max=10.0, n=400, base_exp=2.0):
    """
    Genera 'n' puntos entre x_min y x_max y evalúa tanto f(x) (original)
    como g(x) (transformada).

    Devuelve dos listas de pares [x, y]; cuando un punto no existe (fuera de
    dominio) se emite [x, None] para que la gráfica deje un hueco en vez de
    trazar una línea falsa.
    """
    info = funciones.info_funcion(clave_funcion)
    f = funciones.construir_funcion_base(clave_funcion, base_exp)
    dominio = info["dominio"]

    if n < 2:
        n = 2
    paso = (x_max - x_min) / (n - 1)

    serie_f = []
    serie_g = []
    for i in range(n):
        x = x_min + i * paso
        # f(x) original
        yf = f(x) if dominio(x) else None
        if yf is not None:
            try:
                yf = f(x)
            except (ValueError, ZeroDivisionError, OverflowError):
                yf = None
        # g(x) transformada
        yg = evaluar_g(f, x, a, b, c, d, dominio)
        serie_f.append([x, yf])
        serie_g.append([x, yg])

    return serie_f, serie_g


# ---------------------------------------------------------------------------
# 3. Tabla de puntos clave (requisito sección 2.3)
# ---------------------------------------------------------------------------
def tabla_puntos(clave_funcion, a=1.0, b=1.0, c=0.0, d=0.0,
                 x_min=-4.0, x_max=4.0, cantidad=9, base_exp=2.0):
    """
    Construye una tabla con 'cantidad' puntos (mínimo 5 por requisito) con
    columnas (x, f(x), g(x)) dentro de un intervalo configurable.
    """
    if cantidad < 5:
        cantidad = 5  # el proyecto exige al menos 5 puntos

    info = funciones.info_funcion(clave_funcion)
    f = funciones.construir_funcion_base(clave_funcion, base_exp)
    dominio = info["dominio"]

    paso = (x_max - x_min) / (cantidad - 1)
    filas = []
    for i in range(cantidad):
        x = x_min + i * paso
        # f(x)
        if dominio(x):
            try:
                yf = round(f(x), 4)
            except (ValueError, ZeroDivisionError, OverflowError):
                yf = None
        else:
            yf = None
        # g(x)
        yg = evaluar_g(f, x, a, b, c, d, dominio)
        if yg is not None:
            yg = round(yg, 4)
        filas.append({"x": round(x, 4), "fx": yf, "gx": yg})
    return filas


# ---------------------------------------------------------------------------
# 4. Resumen interpretativo en lenguaje natural (requisito sección 2.3)
# ---------------------------------------------------------------------------
def resumen_interpretativo(clave_funcion, a=1.0, b=1.0, c=0.0, d=0.0, base_exp=2.0):
    """
    Describe, con condicionales (sección 3), el efecto geométrico de cada
    parámetro a, b, c, d sobre la función base, según las reglas de las
    secciones 2.2 del enunciado.

    Devuelve una lista de frases (una por efecto detectado).
    """
    info = funciones.info_funcion(clave_funcion)
    nombre = info["nombre"]
    efectos = []

    # Encabezado
    if clave_funcion == "exponencial":
        efectos.append(
            f"Partimos de la función base {nombre}: f(x) = {base_exp:g}ˣ."
        )
    else:
        efectos.append(f"Partimos de la función base {nombre}: {info['formula']}.")

    # --- Parámetro a (vertical) ---
    abs_a = abs(a)
    if abs_a > 1:
        efectos.append(f"a = {a:g}: estiramiento vertical por un factor de {abs_a:g}.")
    elif 0 < abs_a < 1:
        efectos.append(f"a = {a:g}: compresión vertical por un factor de {abs_a:g}.")
    if a < 0:
        efectos.append(f"a = {a:g}: como a < 0, hay reflexión respecto al eje X.")
    if a == 1:
        efectos.append("a = 1: no hay cambio de escala ni reflexión vertical.")

    # --- Parámetro b (horizontal) ---
    abs_b = abs(b)
    if abs_b > 1:
        efectos.append(f"b = {b:g}: compresión horizontal por un factor de 1/{abs_b:g}.")
    elif 0 < abs_b < 1:
        efectos.append(f"b = {b:g}: estiramiento horizontal por un factor de 1/{abs_b:g}.")
    if b < 0:
        efectos.append(f"b = {b:g}: como b < 0, hay reflexión respecto al eje Y.")
    if b == 1:
        efectos.append("b = 1: no hay cambio de escala ni reflexión horizontal.")

    # --- Parámetro c (desplazamiento horizontal) ---
    if c > 0:
        efectos.append(f"c = {c:g}: traslación hacia la DERECHA {c:g} unidades.")
    elif c < 0:
        efectos.append(f"c = {c:g}: traslación hacia la IZQUIERDA {abs(c):g} unidades.")
    else:
        efectos.append("c = 0: no hay desplazamiento horizontal.")

    # --- Parámetro d (desplazamiento vertical) ---
    if d > 0:
        efectos.append(f"d = {d:g}: traslación hacia ARRIBA {d:g} unidades.")
    elif d < 0:
        efectos.append(f"d = {d:g}: traslación hacia ABAJO {abs(d):g} unidades.")
    else:
        efectos.append("d = 0: no hay desplazamiento vertical.")

    return efectos


def formula_g(clave_funcion, a=1.0, b=1.0, c=0.0, d=0.0, base_exp=2.0):
    """
    Construye la expresión textual de g(x) ya con los coeficientes
    sustituidos, p. ej. g(x) = 2·(3(x − 1))² + 4.
    """
    info = funciones.info_funcion(clave_funcion)
    # cuerpo de f según la función
    cuerpos = {
        "lineal": "{u}",
        "cuadratica": "({u})²",
        "cubica": "({u})³",
        "valor_absoluto": "|{u}|",
        "raiz_cuadrada": "√({u})",
        "exponencial": f"{base_exp:g}^({{u}})",
    }
    # argumento interno u = b(x - c)
    if c == 0:
        u = f"{b:g}x" if b != 1 else "x"
    else:
        signo = "−" if c > 0 else "+"
        u = f"{b:g}(x {signo} {abs(c):g})" if b != 1 else f"(x {signo} {abs(c):g})"

    cuerpo = cuerpos[clave_funcion].format(u=u)

    pref = "" if a == 1 else f"{a:g}·"
    suf = ""
    if d > 0:
        suf = f" + {d:g}"
    elif d < 0:
        suf = f" − {abs(d):g}"

    return f"g(x) = {pref}{cuerpo}{suf}"
