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

## Glosario Rápido

| Término | Definición |
|---------|------------|
| **Rama** | Categoría por edad: Manada (6–10), Unidad/Scouts (10–14), Caminantes (14–17), Rovers/Pioneros (17–21) |
| **Patrulla / Equipo** | Grupo pequeño (5–8 scouts) dentro de una rama, con nombre de animal y lema |
| **Lobato / Lobezna** | Integrante de la rama Manada |
| **Scout** | Integrante de la rama Unidad; también nombre genérico de cualquier miembro |
| **Caminante** | Integrante de la rama Caminantes |
| **Rover / Pionero** | Integrante de la rama Rovers; scout en formación para ser dirigente |
| **Dirigente** | Adulto formado que lidera y acompaña a los scouts |
| **Progresión** | Etapas de avance personal: Huella → Senda → Rumbo → Travesía (varía por rama) |
| **Función** | Rol dentro del equipo: Guía, Subguía, Tesorero, Secretario, Vocal |
| **Especialidad** | Habilidad específica reconocida con insignia (Primeros Auxilios, Campismo, etc.) |
| **Entrega** | Ceremonia donde se otorgan insignias y reconocimientos |
| **Cuota** | Pago mensual del scout para financiar actividades del grupo |
| **Comprobante** | Recibo de pago procesado via WhatsApp webhook |

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
