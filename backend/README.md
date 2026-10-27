# Carpeta `backend/` — El cerebro en Python

Aquí vive **todo el código Python**. Se divide en dos partes:

1. **El motor matemático** (`motor/`): hace los cálculos.
2. **El servidor web** (`app.py`): expone esos cálculos para que la página web los use.

---

## Archivos

| Archivo | Qué hace |
|---------|----------|
| `app.py` | Servidor **Flask**. Recibe los parámetros que manda la página web, llama al motor y devuelve la respuesta (puntos de la gráfica, tabla, resumen). También entrega la página web. |
| `requirements.txt` | Lista de librerías necesarias. Solo hace falta **Flask**. |
| `motor/` | Paquete con la lógica matemática, separada por responsabilidad. Ver su propio README. |

---

## Rutas del servidor (API)

| Ruta | Método | Devuelve |
|------|--------|----------|
| `/` | GET | La página web (`index.html`). |
| `/api/funciones` | GET | La lista de funciones madre disponibles. |
| `/api/graficar` | POST | Los puntos de `f(x)` y `g(x)`, la tabla, el resumen y la fórmula. |

---

## Cómo arrancarlo

```bash
pip install -r requirements.txt
python app.py
```

El servidor queda escuchando en `http://127.0.0.1:5000`.

> **Idea clave:** el navegador **no** hace matemática. Solo pide los números a
> este backend de Python y los dibuja. Así cumplimos “la aplicación está hecha
> en Python” aunque la interfaz sea una página web.
