"""
app.py — Servidor Flask (BACKEND en Python)
===========================================
Este es el "motor" del proyecto expuesto como una pequeña API web.

El frontend (HTML/CSS/JS) envía los parámetros elegidos por el usuario
(función base y coeficientes a, b, c, d) y este servidor —usando el
paquete 'motor' escrito en Python— devuelve:

  - los puntos de f(x) y g(x) para dibujar la gráfica,
  - la tabla de puntos clave (x, f(x), g(x)),
  - el resumen interpretativo en lenguaje natural,
  - la fórmula de g(x) ya con los coeficientes sustituidos.

Toda la MATEMÁTICA vive en Python; el navegador solo dibuja.

Cómo ejecutar:
    cd backend
    pip install -r requirements.txt
    python app.py
Luego abrir en el navegador:  http://127.0.0.1:5000
"""

import os
from flask import Flask, request, jsonify, send_from_directory

from motor import transformaciones, validacion, funciones

# Carpeta del frontend (../frontend respecto a este archivo)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(RAIZ, "frontend")

app = Flask(__name__, static_folder=FRONTEND, static_url_path="")


# ---------------------------------------------------------------------------
# Rutas que sirven el frontend (la página web)
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    """Entrega la página principal (index.html)."""
    return send_from_directory(FRONTEND, "index.html")


# ---------------------------------------------------------------------------
# API: lista de funciones madre disponibles
# ---------------------------------------------------------------------------
@app.route("/api/funciones")
def api_funciones():
    """Devuelve el catálogo de funciones base para poblar el menú del frontend."""
    return jsonify(funciones.listar_funciones())


# ---------------------------------------------------------------------------
# API: calcular la transformación
# ---------------------------------------------------------------------------
@app.route("/api/graficar", methods=["POST"])
def api_graficar():
    """
    Recibe JSON con { funcion, a, b, c, d, base_exp, x_min, x_max, puntos_tabla }
    y devuelve todo lo necesario para que el frontend pinte el resultado.
    """
    datos = request.get_json(silent=True) or {}

    try:
        p = validacion.validar_parametros(datos)
    except ValueError as e:
        # Error controlado de validación -> 400 con mensaje claro
        return jsonify({"ok": False, "error": str(e)}), 400

    # Muestreo de ambas curvas
    serie_f, serie_g = transformaciones.muestrear(
        p["funcion"], p["a"], p["b"], p["c"], p["d"],
        x_min=p["x_min"], x_max=p["x_max"], n=400, base_exp=p["base_exp"],
    )

    # Tabla de puntos clave
    tabla = transformaciones.tabla_puntos(
        p["funcion"], p["a"], p["b"], p["c"], p["d"],
        x_min=p["x_min"], x_max=p["x_max"],
        cantidad=p["puntos_tabla"], base_exp=p["base_exp"],
    )

    # Resumen interpretativo y fórmula
    resumen = transformaciones.resumen_interpretativo(
        p["funcion"], p["a"], p["b"], p["c"], p["d"], base_exp=p["base_exp"]
    )
    formula = transformaciones.formula_g(
        p["funcion"], p["a"], p["b"], p["c"], p["d"], base_exp=p["base_exp"]
    )
    info = funciones.info_funcion(p["funcion"])

    return jsonify({
        "ok": True,
        "funcion_nombre": info["nombre"],
        "formula_f": info["formula"],
        "formula_g": formula,
        "parametros": {"a": p["a"], "b": p["b"], "c": p["c"], "d": p["d"]},
        "serie_f": serie_f,
        "serie_g": serie_g,
        "tabla": tabla,
        "resumen": resumen,
    })


if __name__ == "__main__":
    print("Servidor de la Graficadora en  http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
