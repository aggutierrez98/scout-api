import { ServicioObligacionesPago } from "./servicioObligacionesPago";

export class ServicioPagosPendientes {
	private servicioObligacionesPago = new ServicioObligacionesPago();

	listarPendientesGlobales = async () => {
		return this.servicioObligacionesPago.listarPendientes({
			user: { role: "ADMINISTRADOR" },
			filters: {},
		});
	};

	listarPendientesNotificables = async () => {
		return this.servicioObligacionesPago.listarPendientes({
			user: { role: "ADMINISTRADOR" },
			filters: {},
		});
	};
}
