import { z } from "zod";

const ObligacionSugeridaSchema = z.object({
  id: z.string(),
  scoutId: z.string(),
  tipo: z.enum(['CUOTA_MENSUAL', 'AFILIACION']),
  periodo: z.string(),
  montoPendiente: z.number(),
  scoreMatch: z.number(),
});

const WebhookComprobanteDatosSchema = z.object({
  es_comprobante: z.boolean(),
  monto: z.number().nullable(),
  fecha: z.string().nullable(),
  hora: z.string().nullable(),
  cbu_alias_destino: z.string().nullable(),
  banco_emisor: z.string().nullable(),
  cuit_emisor: z.string().nullable(),
  nombre_emisor: z.string().nullable(),
  numero_comprobante: z.string().nullable(),
  concepto: z.string().nullable(),
  whatsapp_remitente: z.string(),
  whatsapp_chat_id: z.string(),
  whatsapp_mensaje_texto: z.string().nullable(),
  whatsapp_timestamp: z.string(),
  scoutId: z.string().nullable().optional(),
  familiarId: z.string().nullable().optional(),
  scoutIds: z.array(z.string()).optional(),
  obligacionId: z.string().nullable().optional(),
  obligacionesSugeridas: z.array(ObligacionSugeridaSchema).optional(),
  confianza: z.enum(['ALTA', 'MEDIA', 'BAJA']).optional(),
  metodoResolucion: z.string().optional(),
});

export const PostWebhookComprobanteSchema = z.object({
  body: z.object({
    evento: z.literal('comprobante_recibido'),
    timestamp: z.string(),
    datos: WebhookComprobanteDatosSchema,
  }),
});

export type PostWebhookComprobanteInput = z.infer<typeof PostWebhookComprobanteSchema>;
