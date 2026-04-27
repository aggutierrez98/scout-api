export interface UsuarioBackupXLSX {
	uuid: string;
	username: string;
	password: string;
	role: string;
	active: string;
	scoutId: string;
	familiarId: string;
}

export interface ReciboPagoXLSX {
	uuid: string;
	numeroRecibo: string;
	pagoId: string;
	uploadPath: string;
}

export interface CicloReglasPagoXLSX {
	uuid: string;
	anio: string;
	activo: string;
	fechaInicio: string;
	fechaFin: string;
}

export interface ReglaAfiliacionXLSX {
	uuid: string;
	cicloId: string;
	funcionScout: string;
	monto: string;
	obligatoria: string;
}

export interface ReglaCuotaMensualXLSX {
	uuid: string;
	cicloId: string;
	mes: string;
	montoBase: string;
	cobrable: string;
}

export interface ReglaDescuentoAnualXLSX {
	uuid: string;
	cicloId: string;
	habilitado: string;
	mesBonificado: string;
}

export interface ReglaDescuentoFamiliarXLSX {
	uuid: string;
	cicloId: string;
	cantidadMinima: string;
	cantidadMaxima: string;
	montoPorScout: string;
}

export interface PushTokenBackupXLSX {
	uuid: string;
	userId: string;
	platform: string;
	token: string;
	active: string;
}

export interface TipoEventoXLSX {
	uuid: string;
	nombre: string;
	activo: string;
}

export interface EventoBackupXLSX {
	uuid: string;
	nombre: string;
	descripcion: string;
	tipoEventoId: string;
	lugarNombre: string;
	lugarDireccion: string;
	lugarLocalidad: string;
	lugarPartido: string;
	lugarProvincia: string;
	lugarLatitud: string;
	lugarLongitud: string;
	centroSaludCercanoNombre: string;
	centroSaludCercanoDireccion: string;
	centroSaludCercanoLocalidad: string;
	comisariaCercanaNombre: string;
	comisariaCercanaDireccion: string;
	comisariaCercanaLocalidad: string;
	fechaHoraInicio: string;
	fechaHoraFin: string;
	costo: string;
	activo: string;
}

export interface EventoParticipanteXLSX {
	uuid: string;
	eventoId: string;
	scoutId: string;
	tipoParticipante: string;
}

export interface FamiliarScoutXLSX {
	id: string;
	familiarId: string;
	scoutId: string;
	relacion: string;
}

export interface ScoutBackupXLSX {
	uuid: string;
	nombre: string;
	apellido: string;
	fechaNacimiento: string;
	dni: string;
	sexo: string;
	localidad: string;
	direccion: string;
	codigoPostal: string;
	afiliado: string;
	telefono: string;
	nacionalidad: string;
	provincia: string;
	mail: string;
	progresionActual: string;
	religion: string;
	rama: string;
	equipoId: string;
	funcion: string;
	estado: string;
	userId: string;
}

export interface DocumentoBackupXLSX {
	uuid: string;
	nombre: string;
	requiereRenovacionAnual: string;
	requeridoParaIngreso: string;
	completableDinamicamente: string;
	googleDriveFileId: string;
	requiereDatosFamiliar: string;
	requiereFirmaFamiliar: string;
}

export interface DocumentoPresentadoBackupXLSX {
	uuid: string;
	documentoId: string;
	scoutId: string;
	familiarId: string;
	uploadId: string;
	fechaPresentacion: string;
}

export interface FamiliarBackupXLSX {
	uuid: string;
	nombre: string;
	apellido: string;
	fechaNacimiento: string;
	dni: string;
	sexo: string;
	localidad: string;
	direccion: string;
	codigoPostal: string;
	mail: string;
	telefono: string;
	nacionalidad: string;
	provincia: string;
	estadoCivil: string;
}

export interface EquipoBackupXLSX {
	uuid: string;
	nombre: string;
	lema: string;
	rama: string;
}

export interface PagoBackupXLSX {
	uuid: string;
	scoutId: string;
	concepto: string;
	monto: string;
	rendido: string;
	metodoPago: string;
	fechaPago: string;
}

export interface EntregaBackupXLSX {
	uuid: string;
	scoutId: string;
	tipoEntrega: string;
	fechaEntrega: string;
}
