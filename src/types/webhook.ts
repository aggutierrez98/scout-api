// Payload que llega de whatsapp-comprobantes
export interface IWebhookComprobantePayload {
  evento: 'comprobante_recibido';
  timestamp: string;
  datos: IWebhookComprobanteDatos;
}

export type NivelConfianza = 'ALTA' | 'MEDIA' | 'BAJA';

export type TipoConflicto =
  | 'SIN_IDENTIFICACION'
  | 'SIN_SCOUTS_VINCULADOS'
  | 'SCOUT_AMBIGUO'
  | 'OBLIGACION_NO_CLARA'
  | 'CUENTA_INVALIDA'
  | 'DATOS_INCOMPLETOS';


export interface ObligacionSugerida {
  id: string;
  scoutId: string;
  tipo: 'CUOTA_MENSUAL' | 'AFILIACION';
  periodo: string;
  montoPendiente: number;
  scoreMatch: number;
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
  // Campos de contexto enriquecido resueltos por whatsapp-comprobantes
  scoutId?: string | null;
  familiarId?: string | null;
  scoutIds?: string[];
  obligacionId?: string | null;
  obligacionesSugeridas?: ObligacionSugerida[];
  confianza?: NivelConfianza;
  metodoResolucion?: string;
}

// Resultado del procesamiento del webhook
export interface IWebhookResult {
  pagoId: string | null;
  scoutId: string | null;
  monto: number | null;
  concepto: string | null;
  fechaPago: string | null;
  enRevision: boolean;
  revisionId?: string;
}
