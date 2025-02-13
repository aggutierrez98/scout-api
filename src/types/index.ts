export * from "./XLSXTypes";
export * from "./constantTypes";
export * from "./equipo";
export * from "./scout";
export * from "./user";
export * from "./documento";
export * from "./entrega";
export * from "./pago";
export * from "./familiar";
export * from "./constantTypes";


export interface IInsignaObt {
    id: string;
    scoutId: string;
    tipoEntrega: string;
    progresion: string | null;
    fechaObtencion: Date;
}

