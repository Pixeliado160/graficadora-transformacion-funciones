"""
funciones.py
============
Catálogo de FUNCIONES MADRE (funciones base) del proyecto.

Cada función base f(x) se define aquí junto con su dominio válido,
de modo que el resto del programa no necesita saber los detalles
matemáticos: solo pide la función por su clave.

Requisito del proyecto (sección 2.1): al menos 5 funciones base.
Aquí ofrecemos 6: línea, cuadrática, cúbica, valor absoluto,
raíz cuadrada y exponencial.
"""

import math


def _dominio_todos(x: float) -> bool:
    """Dominio = todos los reales."""
    return True


def _dominio_no_negativos(x: float) -> bool:
    """Dominio = x >= 0 (usado por la raíz cuadrada)."""
    return x >= 0


# Catálogo de funciones madre.
# Cada entrada guarda:
#   - nombre:   etiqueta legible para el usuario
#   - formula:  representación en texto de f(x)
#   - f:        la función matemática en sí (recibe x, devuelve f(x))
#   - dominio:  predicado que dice si x pertenece al dominio de f
FUNCIONES_BASE = {
    "lineal": {
        "nombre": "Línea",
        "formula": "f(x) = x",
        "f": lambda x: x,
        "dominio": _dominio_todos,
    },
    "cuadratica": {
        "nombre": "Cuadrática",
        "formula": "f(x) = x²",
        "f": lambda x: x ** 2,
        "dominio": _dominio_todos,
    },
    "cubica": {
        "nombre": "Cúbica",
        "formula": "f(x) = x³",
        "f": lambda x: x ** 3,
        "dominio": _dominio_todos,
    },
    "valor_absoluto": {
        "nombre": "Valor Absoluto",
        "formula": "f(x) = |x|",
        "f": lambda x: abs(x),
        "dominio": _dominio_todos,
    },
    "raiz_cuadrada": {
        "nombre": "Raíz Cuadrada",
        "formula": "f(x) = √x",
        "f": lambda x: math.sqrt(x),
        "dominio": _dominio_no_negativos,
    },
    "exponencial": {
        "nombre": "Exponencial",
        "formula": "f(x) = aˣ  (base a > 0, a ≠ 1)",
        # La base se inyecta como parámetro extra 'base_exp'.
        "f": None,  # se construye dinámicamente (ver construir_funcion_base)
        "dominio": _dominio_todos,
        "requiere_base": True,
    },
}


def construir_funcion_base(clave: str, base_exp: float = 2.0):
    """
    Devuelve la función f(x) ya lista para evaluar.

    Para la exponencial se necesita una base (por defecto 2). Validamos
    que la base cumpla a > 0 y a != 1 como exige el enunciado.
    """
    if clave not in FUNCIONES_BASE:
        raise ValueError(f"Función base desconocida: '{clave}'")

    info = FUNCIONES_BASE[clave]

    if clave == "exponencial":
        if base_exp <= 0 or base_exp == 1:
            raise ValueError("La base de la exponencial debe ser > 0 y distinta de 1.")
        return lambda x: base_exp ** x

    return info["f"]


def info_funcion(clave: str) -> dict:
    """Devuelve el diccionario de metadatos (nombre, fórmula, dominio) de la función."""
    if clave not in FUNCIONES_BASE:
        raise ValueError(f"Función base desconocida: '{clave}'")
    return FUNCIONES_BASE[clave]


def listar_funciones() -> list:
    """
    Lista compacta para el frontend: clave, nombre y fórmula de cada
    función madre disponible.
    """
    return [
        {"clave": k, "nombre": v["nombre"], "formula": v["formula"]}
        for k, v in FUNCIONES_BASE.items()
    ]
