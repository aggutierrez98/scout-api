export type EstadoObligacionPagoType = "PENDIENTE" | "INCOMPLETO" | "AL_DIA";
export type TipoObligacionPagoType = "AFILIACION" | "CUOTA_MENSUAL";

export interface IReglaAfiliacionInput {
	funcionScout: string;
	monto: number;
	obligatoria?: boolean;
}

export interface IReglaCuotaMensualInput {
	mes: number;
	montoBase: number;
	cobrable?: boolean;
}

export interface IReglaDescuentoPagoAnualInput {
	habilitado: boolean;
	mesBonificado?: number | null;
}

export interface IReglaDescuentoFamiliarInput {
	cantidadMinima: number;
	cantidadMaxima?: number | null;
	montoPorScout: number;
}

export interface ICicloReglasPagoInput {
	anio: number;
	activo?: boolean;
	fechaInicio: Date | string;
	fechaFin: Date | string;
	afiliacion: IReglaAfiliacionInput[];
	cuotasMensuales: IReglaCuotaMensualInput[];
	descuentoPagoAnual: IReglaDescuentoPagoAnualInput;
	descuentosFamiliares: IReglaDescuentoFamiliarInput[];
	cbusAceptados?: string[];
}

export interface IPerdonarObligacionInput {
	motivo: string;
	montoCondonado?: number;
}
