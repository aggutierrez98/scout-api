import { GoogleGenAI } from "@google/genai";
import { SecretsManager } from "../classes/SecretsManager";

const SYSTEM_PROMPT = `Eres un asistente especializado en extraer datos de documentos de autorización de scouts argentinos.
Devuelve SIEMPRE un objeto JSON válido con la estructura indicada. Si no puedes extraer un campo con certeza, usa null.
No incluyas texto adicional fuera del JSON. No uses bloques de código markdown.`;

const USER_PROMPT = `Extrae los siguientes datos del documento PDF adjunto y devuelve ÚNICAMENTE el JSON con esta estructura:
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
    "tipo": "string o null (tipo o nombre del documento)",
    "fechaVencimiento": "string en formato YYYY-MM-DD o null",
    "observaciones": "string o null"
  }
}`;

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
  pdfBuffer: Buffer
): Promise<AuthorizationDocumentScanResult> => {
  const { API_KEY } = SecretsManager.getInstance().getGoogleAISecrets();
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const base64Data = pdfBuffer.toString("base64");

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
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
              mimeType: "application/pdf",
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
