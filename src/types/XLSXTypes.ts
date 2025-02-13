import { DocDataXLSX, DocumentoXLSX } from "./documento";
import { EntregaXLSX } from "./entrega";
import { FamiliarXLSX } from "./familiar";
import { PagoXLSX } from "./pago";
import { ScoutXLSX } from "./scout";
import { UsuarioXLSX } from "./user";
import { EquipoXLSX } from './equipo';

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
	GUIA = "Guia de equipo",
	SUBGUIA = "Subguia de equipo",
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

export type SheetIndexType = "familiares" | "scouts" | "entregas" | "usuarios" | "pagos" | "documentos" | "docs-data" | "equipos"
export type SpreadsheetDataMap = {
	familiares: FamiliarXLSX[];
	scouts: ScoutXLSX[];
	entregas: EntregaXLSX[];
	usuarios: UsuarioXLSX[];
	pagos: PagoXLSX[];
	documentos: DocumentoXLSX[];
	'docs-data': DocDataXLSX[];
	equipos: EquipoXLSX[];
};