import { Aviso, Notificacion } from "@prisma/client";

export const mapAviso = <T extends Aviso>(aviso: T) => {
	const { uuid, id: _id, ...rest } = aviso;
	return {
		...rest,
		id: uuid,
	};
};

type NotificacionWithAviso = Notificacion & { aviso: Aviso };

export const mapNotificacion = <T extends NotificacionWithAviso>(notificacion: T) => {
	const { uuid, id: _id, aviso, avisoId: _avisoId, userId: _userId, ...rest } = notificacion;
	return {
		...rest,
		id: uuid,
		aviso: mapAviso(aviso),
	};
};
