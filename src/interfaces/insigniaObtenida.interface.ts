import { ProgresionEnum, TipoInsigniaEnum } from "../utils";

export interface IInsignaObt {
	id: number;
	scoutId: number;
	insignia: TipoInsigniaEnum;
	progresion: ProgresionEnum;
	fechaObtencion: Date;
}
