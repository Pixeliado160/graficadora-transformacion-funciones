"""
Paquete 'motor' — núcleo matemático del proyecto.

Agrupa tres módulos desacoplados (requisito de estructura modular):
  - funciones.py        -> catálogo de funciones madre y sus dominios
  - transformaciones.py -> modelo general g(x)=a·f(b(x−c))+d, tabla y resumen
  - validacion.py       -> limpieza y validación de las entradas del usuario

El servidor Flask (app.py) solo habla con este paquete; nunca con los
detalles internos.
"""

from . import funciones, transformaciones, validacion  # noqa: F401
