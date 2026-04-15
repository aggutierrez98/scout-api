// Miembro tal como viene de la API de cruz-del-sur
export interface CruzDelSurMember {
	tipoDocumento: string;
	documento: string;        // DNI
	nombre: string;
	apellido?: string;
	sexo: string;
	fechaNacimiento: string;  // "DD/MM/YYYY" o "YYYY-MM-DD"
	provincia?: string;
	localidad?: string;
	calle?: string;           // dirección
	codigoPostal?: string;
	estadoCivil?: string;
	telefono?: string;
	email?: string;
	religion?: string;
	religionDescripcion?: string;
	estudios?: string;
	titulo?: string;
	empresa?: string;
	discapacidad?: string;
	detalleDiscapacidad?: string;
	nacionalidad?: string;
	funcion?: string;         // "Jefe de Manada", "Scout", etc.
	categoria?: string;
	rama?: string;            // "Scouts", "Lobatos y Lobeznas", etc.
	zona?: string;
	distrito?: string;
	codigo?: string;
	organismo?: string;
	fechaPrimerAfiliacion?: string;
}

// Payload del webhook enviado por cruz-del-sur
export interface NominaWebhookPayload {
	event: "members.exported";
	timestamp: string;
	total: number;
	trigger: "scheduled" | "on-demand";
	data: CruzDelSurMember[];
}

// Resultado del proceso de sincronización
export interface NominaSyncResult {
	procesados: number;        // miembros en la nómina
	actualizados: number;      // scouts existentes actualizados a ACTIVO
	desactivados: number;      // scouts marcados como INACTIVO por no aparecer en nómina
	noEncontrados: number;     // miembros de nómina sin match en nuestro sistema
	errores: number;
	timestamp: string;
}
