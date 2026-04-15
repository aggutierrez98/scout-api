#!/usr/bin/env node
/**
 * Bruno Reminder Hook — scout-api
 *
 * PostToolUse hook: detecta ediciones a archivos de endpoints
 * y emite un recordatorio dirigido con el archivo Bruno exacto a actualizar.
 *
 * Input: JSON via stdin con { tool_name, tool_input, tool_response }
 */

const BRUNO_BASE = "scouts/bruno/scout-api";

const RESOURCE_MAP = {
  scout:     { folder: "Scout",     label: "Scout" },
  familiar:  { folder: "Familiar",  label: "Familiar" },
  equipo:    { folder: "Equipo",    label: "Equipo" },
  entrega:   { folder: "Entrega",   label: "Entrega" },
  documento: { folder: "Documento", label: "Documento" },
  pago:      { folder: "Pago",      label: "Pago" },
  nomina:    { folder: "Nomina",    label: "Nómina" },
  webhook:   { folder: "Webhook",   label: "Webhook" },
  auth:      { folder: "Auth",      label: "Auth" },
};

// Archivos que, si se editan, requieren actualizar Bruno
const ENDPOINT_PATH_RE = /src\/(routes|controllers|validators)\/([\w-]+)\.ts$/;

let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path ?? "";

    const match = filePath.match(ENDPOINT_PATH_RE);
    if (!match) return; // No es un archivo de endpoint — silencio

    const layer    = match[1]; // routes | controllers | validators
    const resource = match[2]; // scout | pago | webhook | ...

    const entry = RESOURCE_MAP[resource];
    if (!entry) return; // Recurso no mapeado a Bruno — silencio

    const brunoFolder = `${BRUNO_BASE}/${entry.folder}/`;

    process.stdout.write(
      `\n⚠️  BRUNO — Actualizá la colección\n` +
      `  Archivo editado : ${filePath}\n` +
      `  Carpeta Bruno   : ${brunoFolder}\n` +
      `  Acción requerida: revisá los .bru en esa carpeta y reflejá cualquier cambio de URL, body, params o auth.\n` +
      `  Skill de referencia: .claude/skills/bruno.md\n`
    );
  } catch (_) {
    // JSON inválido o input vacío — ignorar silenciosamente
  }
});
