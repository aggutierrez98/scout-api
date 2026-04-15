// Payload que llega de whatsapp-comprobantes
export interface IWebhookComprobantePayload {
  evento: 'comprobante_recibido';
  timestamp: string;
  datos: IWebhookComprobanteDatos;
}

export interface IWebhookComprobanteDatos {
  es_comprobante: boolean;
  monto: number | null;
  fecha: string | null;
  hora: string | null;
  cbu_alias_destino: string | null;
  banco_emisor: string | null;
  cuit_emisor: string | null;
  nombre_emisor: string | null;
  numero_comprobante: string | null;
  concepto: string | null;
  whatsapp_remitente: string;
  whatsapp_chat_id: string;
  whatsapp_mensaje_texto: string | null;
  whatsapp_timestamp: string;
}

// Resultado del procesamiento del webhook
export interface IWebhookResult {
  pagoId: string;
  scoutId: string;
  monto: number;
  concepto: string;
  fechaPago: string;
}
