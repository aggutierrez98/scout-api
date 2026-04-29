import { GoogleGenAI } from "@google/genai";
import { SecretsManager } from "../classes/SecretsManager";

const SYSTEM_PROMPT = `Eres un asistente especializado en extraer datos de documentos de autorización de scouts argentinos.
Devuelve SIEMPRE un objeto JSON válido con la estructura indicada. Si no puedes extraer un campo con certeza, usa null.
No incluyas texto adicional fuera del JSON. No uses bloques de código markdown.

REGLA CRÍTICA — orden de datos en el documento:
En casi todos estos documentos, los primeros datos que aparecen (nombre, apellido, DNI, fecha de nacimiento, teléfono, email, parentesco) corresponden al FAMILIAR (padre, madre o tutor).
Los datos del SCOUT (el niño o joven) aparecen DESPUÉS. NUNCA asignes al scout los datos que aparecen en la sección del familiar, aunque sean los primeros que encontrás en el documento.
`;

const USER_PROMPT = `Extrae los siguientes datos del documento adjunto y devuelve ÚNICAMENTE el JSON con esta estructura:
{
  "scout": {
    "nombre": "string o null",
    "apellido": "string o null",
    "dni": "string o null",
    "fechaNacimiento": "string en formato YYYY-MM-DD o null"
  },
  "familiar": {
    "nombre": "string o null",
    "apellido": "string o null",
    "dni": "string o null",
    "telefono": "string o null",
    "email": "string o null",
    "parentesco": "string o null (ej: Padre, Madre, Tutor)"
  },
  "documento": {
    "tipo": "string o null (ver tabla de mapeo abajo)",
    "fechaVencimiento": "string en formato YYYY-MM-DD o null",
    "observaciones": "string o null"
  }
}

TABLA DE MAPEO DE TIPOS DE DOCUMENTO:
Si el título del documento coincide (total o parcialmente) con alguno de los siguientes, usa EXACTAMENTE el valor de la columna "Nombre en sistema":

| Título en el documento | Nombre en sistema |
|---|---|
| AUTORIZACIÓN ANUAL PARA SALIDAS CERCANAS | Autorizacion de salidas cercanas |
| AUTORIZACIÓN USO DE IMAGEN NIÑOS, NIÑAS Y JÓVENES MENORES DE 18 AÑOS | Autorizacion de uso de imagen |
| AUTORIZACIÓN DE INGRESO DE NIÑOS, NIÑAS Y JÓVENES MENORES DE 18 AÑOS | Autorizacion ingreso de menores de edad |
| AUTORIZACIÓN PARA RETIRO DE BENEFICIARIOS | Autorizacion para retiro de jovenes |
| AUTORIZACIÓN DE PADRES / MADRES / TUTORES PARA SALIDAS, ACANTONAMIENTOS Y/O CAMPAMENTOS | Autorizacion para salidas acantonamientos campamentos |
| LEGAJO MIEMBRO BENEFICIARIO | Caratula legajo |
| DECLARACIÓN JURADA PARA PARTICIPACIÓN DE JÓVENES MAYORES DE 18 AÑOS EN SALIDAS – ACANTONAMIENTOS – CAMPAMENTOS | Declaracion Jurada de participacion de jovenes mayores de 18 Salidas Acantonamientos Campamentos |
| DECLARACIÓN JURADA DE SALUD | Declaracion Jurada de Salud |

Si el documento no coincide con ninguno de los anteriores, intentá describir brevemente el tipo. Si no podés determinarlo, usá null.`;

export interface AuthorizationDocumentScanResult {
  scout: {
    nombre: string | null;
    apellido: string | null;
    dni: string | null;
    fechaNacimiento: string | null;
  };
  familiar: {
    nombre: string | null;
    apellido: string | null;
    dni: string | null;
    telefono: string | null;
    email: string | null;
    parentesco: string | null;
  };
  documento: {
    tipo: string | null;
    fechaVencimiento: string | null;
    observaciones: string | null;
  };
}

export const scanAuthorizationDocument = async (
  fileBuffer: Buffer,
  mimeType: "application/pdf" | "image/jpeg" = "application/pdf"
): Promise<AuthorizationDocumentScanResult> => {
  const { API_KEY } = SecretsManager.getInstance().getGoogleAISecrets();
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const base64Data = fileBuffer.toString("base64");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    config: {
      systemInstruction: SYSTEM_PROMPT,
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          { text: USER_PROMPT },
        ],
      },
    ],
  });

  const rawText = response.text ?? "";
  const cleaned = rawText
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  return JSON.parse(cleaned) as AuthorizationDocumentScanResult;
};
