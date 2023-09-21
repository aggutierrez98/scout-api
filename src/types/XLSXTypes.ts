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
	ESPECSERVICIO = "Especialidad - Servicio a los demas",
	ESPESPIRITUALIDAD = "Especialidad - Espiritualidad",
	ESPDEPORTES = "Especialidad - Deportes",
	ESPCIENCIA = "Especialidad - Ciencia y Tecnologia",
	SUPERACION = "Maxima superacion personal",
}
