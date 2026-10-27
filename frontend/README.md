# Carpeta `frontend/` — La página web (lo que ve el usuario)

Aquí está la **interfaz**. Es una página web hecha con las tres tecnologías
clásicas del navegador. **No hace matemática**: le pide los cálculos al backend
de Python y solo se encarga de mostrarlos bonito.

---

## Archivos

| Archivo | Tecnología | Qué hace |
|---------|-----------|----------|
| `index.html` | HTML | La **estructura**: el menú de funciones, las cajas de parámetros, el lienzo de la gráfica, el resumen y la tabla. |
| `css/estilos.css` | CSS | La **apariencia**: colores, tipografía, distribución en dos columnas, diseño oscuro pensado para proyectar en clase. |
| `js/graficadora.js` | JavaScript | El **comportamiento**: toma lo que el usuario escribe, lo envía al backend (`/api/graficar`), recibe la respuesta y **dibuja la gráfica** con la librería Chart.js. |

---

## Flujo cuando el usuario pulsa “Graficar”

1. `graficadora.js` junta los valores (función, a, b, c, d, intervalo).
2. Los envía por `fetch` al servidor Python.
3. El Python responde con: puntos de f(x) y g(x), tabla, resumen y fórmula.
4. El JS dibuja:
   - **f(x) original** → línea **punteada** (naranja).
   - **g(x) transformada** → línea **continua y resaltada** (azul).
   - Más los ejes, la cuadrícula, la leyenda y los títulos.

---

## Sobre Chart.js

Se carga desde un CDN (una línea en el `index.html`). Es solo una **herramienta
de dibujo**: toda la lógica de las transformaciones sigue viviendo en Python.
Si no hay internet para el CDN, la página carga igual pero la gráfica no se
dibuja; en ese caso se puede descargar `chart.umd.min.js` y guardarlo localmente.
