# Proyecto Final — Graficadora de Transformación de Funciones

**Curso:** Precálculo · **Nivel:** Segundo Ciclo
**Modelo:** `g(x) = a · f( b (x − c) ) + d`

Aplicación que permite elegir una **función madre**, ingresar los parámetros de
transformación `a, b, c, d` y visualizar **al mismo tiempo** la función original
`f(x)` y la transformada `g(x)`, con su explicación analítica y una tabla de puntos.

El **cálculo matemático está hecho en Python** (backend Flask); el **frontend es
una página web** en HTML / CSS / JavaScript.

---

## Estructura del proyecto

```
Proyecto-Precalculo-Graficadora/
├── backend/            → TODO el Python (el "motor" + el servidor web)
│   ├── app.py          → servidor Flask: recibe peticiones y responde con los cálculos
│   ├── requirements.txt→ dependencias Python (Flask)
│   └── motor/          → núcleo matemático, separado por responsabilidad
│       ├── funciones.py        → las 6 funciones madre y sus dominios
│       ├── transformaciones.py → el modelo g(x), tabla de puntos y resumen
│       └── validacion.py       → limpieza y validación de las entradas
│
├── frontend/           → la página web (lo que ve el usuario)
│   ├── index.html      → estructura de la página
│   ├── css/estilos.css → apariencia (colores, diseño)
│   └── js/graficadora.js→ pide los cálculos al backend y dibuja la gráfica
│
└── docs/               → documentación extra para la exposición
```

Cada carpeta tiene su propio `README.md` explicando qué hace.

---

## Cómo ejecutarlo

1. Abrir una terminal dentro de la carpeta `backend`:
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```
2. Abrir el navegador en: **http://127.0.0.1:5000**
3. Elegir una función, escribir los parámetros y pulsar **“Graficar transformación”**.

> Requiere Python 3.9 o superior.

---

## ¿Cómo cumple cada requisito del enunciado?

| Requisito | Dónde se cumple |
|-----------|-----------------|
| Al menos 5 funciones base | `backend/motor/funciones.py` (hay 6) |
| Modelo `g(x)=a·f(b(x−c))+d` | `backend/motor/transformaciones.py` |
| Interpretación textual de a, b, c, d | `resumen_interpretativo()` |
| Gráfica: original punteada + transformada continua | `frontend/js/graficadora.js` |
| Ejes, cuadrícula, leyenda, títulos | configuración de Chart.js en el JS |
| Resumen interpretativo automático | panel “Resumen interpretativo” |
| Tabla de puntos (x, f(x), g(x)), ≥5 | `tabla_puntos()` + panel “Tabla” |
| Estructura modular (lógica/captura/render separados) | carpetas `motor/` y `frontend/` |
| Validación de entradas y dominios | `backend/motor/validacion.py` |
| Valores por defecto a=1, b=1, c=0, d=0 | `validacion.py` |
| Hecho en Python | todo `backend/` |
```
