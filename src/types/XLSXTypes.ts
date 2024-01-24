import { MetodosPagoType, TipoEntregaType } from './constantTypes';

export type ScoutXLSX = {
	Documento: string;
	Nombre: string;
	Sexo: string;
	"Fecha Nacimiento": string;
	Provincia: string;
	Localidad: string;
	Calle: string;
	"Codigo Postal": string;
	Telefono: string;
	Email: string;
	Religion: string;
	Funcion: string;
	Categoria: string;
	"Fecha Primer Afiliacion": string;
	Patrulla: string;
	Estado: string;
	Progresion: string;
	Padre: string
	Madre: string
	Tio: string
	Tia: string
	Hermano: string
	Hermana: string
	Abuelo: string
	Abuela: string
	Otro: string
};

export type FamiliarXLSX = {
	Documento: string;
	Nombre: string;
	Sexo: string;
	"Fecha Nacimiento": string;
	Provincia: string;
	Localidad: string;
	Email: string;
	Calle: string;
	"Codigo Postal": string;
	Telefono: string;
	"Estado Civil": "SOLTERO" | "CASADO" | "SEPARADO";
};

export enum RelacionFamiliarScoutEnum {
	PADRE = "Padre",
	MADRE = "Madre",
	TIO = "Tio",
	TIA = "Tia",
	HERMANO = "Hermano",
	HERMANA = "Hermana",
	OTRO = "Otro",
}

export enum ProgresionEnum {
	INTERRAMA = "Interrama",
	PISTA = "Pista",
	RUMBO = "Rumbo",
	TRAVESIA = "Travesia",
}

export enum FuncionEnum {
	JOVEN = "Joven Protagonista",
	JEFE = "Jefe de rama",
	SUBJEFE = "Subjefe de rama",
	AYUDANTE = "Ayudante de rama",
	COLABORADOR = "Colaborador",
}

export enum TipoInsigniaEnum {
	UNIFORME = "Unfirome Scout",
	GUIA = "Guia de patrulla",
	SUBGUIA = "Subguia de patrulla",
	PROGRESION = "Progresion",
	PROMESA = "Promesa Scout",
	ESPNATURALEZA = "Especialidad - Vida en la naturaleza",
	ESPARTE = "Especialidad - Arte, Expresion y Cultura",
	ESPSERVICIO = "Especialidad - Servicio a los demas",
	ESPESPIRITUALIDAD = "Especialidad - Espiritualidad",
	ESPDEPORTES = "Especialidad - Deportes",
	ESPCIENCIA = "Especialidad - Ciencia y Tecnologia",
	SUPERACION = "Maxima superacion personal",
}


export type PagoXLSX = {
	Concepto: string
	Fecha: string
	Monto: string
	"Metodo de pago": MetodosPagoType
	Rendido: string,
	Scout: string
}

export type DocumentoXLSX = {
	Fecha: string
	Scout: string
	Documento: string
}

export type EntregaXLSX = {
	Fecha: string
	"Tipo de entrega": TipoEntregaType
	Scout: string
}

export type UsuarioXLSX = {
	DNI: string
	UserId: string
}
