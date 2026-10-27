"""
validacion.py
=============
VALIDACIÓN DE ENTRADAS (requisito sección 3).

Mantiene la captura/limpieza de datos separada de la lógica matemática.
Se encarga de:
  - rechazar valores alfanuméricos donde se esperan números,
  - aplicar los VALORES POR DEFECTO (a=1, b=1, c=0, d=0),
  - validar la base de la exponencial (a > 0, a ≠ 1),
  - garantizar un intervalo coherente (x_min < x_max).
"""

from . import funciones


def a_numero(valor, defecto):
    """
    Convierte 'valor' a float. Si viene vacío o no es numérico, usa el
    valor por defecto. Así el programa nunca truena por un texto
    alfanumérico (cumple "controlar que el usuario no ingrese valores
    alfanuméricos cuando se requieren números").
    """
    if valor is None:
        return float(defecto)
    try:
        return float(valor)
    except (ValueError, TypeError):
        return float(defecto)


def validar_parametros(datos: dict) -> dict:
    """
    Recibe el diccionario crudo que llega desde el frontend y devuelve un
    diccionario limpio y seguro con todos los parámetros ya normalizados.

    Lanza ValueError solo en casos irrecuperables (función inexistente o
    base de exponencial inválida).
    """
    clave = (datos.get("funcion") or "").strip()
    if clave not in funciones.FUNCIONES_BASE:
        raise ValueError(
            "Debe seleccionar una función base válida "
            f"(opciones: {', '.join(funciones.FUNCIONES_BASE.keys())})."
        )

    # Coeficientes con valores por defecto
    a = a_numero(datos.get("a"), 1.0)
    b = a_numero(datos.get("b"), 1.0)
    c = a_numero(datos.get("c"), 0.0)
    d = a_numero(datos.get("d"), 0.0)

    # Base de la exponencial
    base_exp = a_numero(datos.get("base_exp"), 2.0)
    if clave == "exponencial" and (base_exp <= 0 or base_exp == 1):
        raise ValueError("La base de la exponencial debe ser > 0 y distinta de 1.")

    # Intervalo de graficado
    x_min = a_numero(datos.get("x_min"), -10.0)
    x_max = a_numero(datos.get("x_max"), 10.0)
    if x_min >= x_max:
        # intervalo incoherente -> volvemos a un rango seguro por defecto
        x_min, x_max = -10.0, 10.0

    # Cantidad de puntos de la tabla (mínimo 5)
    puntos_tabla = int(a_numero(datos.get("puntos_tabla"), 9))
    if puntos_tabla < 5:
        puntos_tabla = 5

    return {
        "funcion": clave,
        "a": a, "b": b, "c": c, "d": d,
        "base_exp": base_exp,
        "x_min": x_min, "x_max": x_max,
        "puntos_tabla": puntos_tabla,
    }
