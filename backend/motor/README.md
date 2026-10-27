# Carpeta `motor/` — Núcleo matemático

Este paquete contiene **solo matemática**. No sabe nada de páginas web ni de
servidores. Está dividido en tres archivos según su responsabilidad, tal como
pide el enunciado (“la lógica matemática, la captura de datos y el renderizado
deben estar desacoplados”).

---

## Archivos

### `funciones.py` — Las funciones madre
Guarda el catálogo de las **6 funciones base** y el **dominio** de cada una:

| Clave | Función | Dominio |
|-------|---------|---------|
| `lineal` | f(x) = x | todos los reales |
| `cuadratica` | f(x) = x² | todos los reales |
| `cubica` | f(x) = x³ | todos los reales |
| `valor_absoluto` | f(x) = \|x\| | todos los reales |
| `raiz_cuadrada` | f(x) = √x | x ≥ 0 |
| `exponencial` | f(x) = aˣ | todos los reales (base a>0, a≠1) |

### `transformaciones.py` — El modelo de transformación
Implementa `g(x) = a · f(b(x − c)) + d` y produce:
- **`muestrear()`** → muchos puntos para dibujar la curva.
- **`tabla_puntos()`** → la tabla (x, f(x), g(x)) con al menos 5 filas.
- **`resumen_interpretativo()`** → describe en español qué hace cada parámetro
  (estiramiento, compresión, reflexión, traslación).
- **`formula_g()`** → escribe la fórmula de g(x) ya con los números puestos.

### `validacion.py` — Las entradas seguras
Se asegura de que los datos que escribe el usuario sean correctos:
- Si escribe letras donde van números, usa un **valor por defecto** (a=1, b=1, c=0, d=0).
- Evita errores de dominio (raíz de negativos, divisiones por cero).
- Valida que la base de la exponencial sea `> 0` y `≠ 1`.

---

## Por qué está separado así

Si mañana quisiéramos cambiar la interfaz (por ejemplo, una app de escritorio con
`matplotlib`), **este motor seguiría igual**: solo cambiaríamos quién lo llama.
Esa es la ventaja de tener la matemática desacoplada del resto.
