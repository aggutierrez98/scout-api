export * from "./XLSXTypes";
export * from "./constantTypes";
export * from "./equipo";
export * from "./scout";
export * from "./user";
export * from "./documento";
export * from "./entrega";
export * from "./pago";
export * from "./familiar";
export * from "./notificacion";
export * from "./pushToken";
export * from "./tipoEvento";
export * from "./evento";
export * from "./nomina";
export * from "./pagoReglas";


export interface IInsignaObt {
    id: string;
    scoutId: string;
    tipoEntrega: string;
    progresion: string | null;
    fechaObtencion: Date;
}
