# Scouts de Argentina — Dominio y NotebookLM

## Cuándo usar este skill

Consultá NotebookLM ANTES de diseñar modelos, endpoints, reglas de negocio o lógica de permisos cuando la pregunta involucre:

- Reglas de negocio no obvias (qué puede hacer cada rol, cómo funciona un proceso)
- Terminología de la organización (ramas, funciones, cargos, insignias)
- Validaciones o restricciones del dominio (quién puede hacer qué, bajo qué condiciones)
- Diseño de entidades que representen conceptos scouts reales
- Dudas sobre si un feature aplica a una rama/nivel en particular

No es necesario para: operaciones CRUD genéricas, configuración de infraestructura, tooling, o cuando el contexto de dominio ya es claro.

## Notebooks disponibles

| Tipo de consulta | Notebook | ID |
|------------------|----------|----|
| **Normas y reglamentos**: estatutos, reglamentos, roles institucionales, permisos, uniformes, ética, administración, finanzas, afiliación, seguros | `Scouts Argentina - Normas y Reglamentos` | `scouts-argentina---normas-y-reglamentos` |
| **Guías de programa**: metodología educativa, ramas (Lobatos/Scouts/Caminantes/Rovers), ciclo de programa, progresión personal, actividades, campamentos, protección infantil, participación juvenil | `Scouts Argentina - Guías de Programa` | `scouts-argentina---guías-de-programa` |

## Cómo consultar

```bash
# Normas / reglamentos / roles / admin
python3 ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "tu pregunta aquí" \
  --notebook-id "scouts-argentina---normas-y-reglamentos"

# Programa educativo / ramas / actividades
python3 ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "tu pregunta aquí" \
  --notebook-id "scouts-argentina---guías-de-programa"
```

O activar el skill interactivo con `/notebooklm` y seguir el flujo.
