import { PrismaClient, Scout } from "@prisma/client";
import { IScout, MetodosPagoType } from "../types";
import { Decimal } from "@prisma/client/runtime/library";
import { getAge } from "../utils";
const INTERVALO_DIAS = 30

const prisma = new PrismaClient().$extends({
    result: {
        scout: {
            edad: {
                needs: { fechaNacimiento: true },
                compute(scout) {
                    return getAge(scout.fechaNacimiento)
                },
            }
        },
        // documentoPresentado: {
        // 	id: {
        // 		compute: (data) => data.uuid,
        // 	},
        // 	uuid: {
        // 		compute: () => undefined,
        // 	},
        // },
        // entregaRealizada: {
        // 	id: {
        // 		compute: (data) => data.uuid,
        // 	},
        // 	uuid: {
        // 		compute: () => undefined,
        // 	},
        // },
        // patrulla: {
        // 	id: {
        // 		compute: (data) => data.uuid,
        // 	},
        // 	uuid: {
        // 		compute: () => undefined,
        // 	},
        // },
        // familiar: {
        // 	id: {
        // 		compute: (data) => data.uuid,
        // 	},
        // 	uuid: {
        // 		compute: () => undefined,
        // 	},
        // },
        pago: {
            id: {
                compute: (data) => data.uuid,
            },
            uuid: {
                compute: () => undefined,
            },
        }
    },
});

interface ScoutBirthday {
    nombre: string,
    apellido: string,
    fechaNacimiento: Date,
    fechaCumpleanos: Date,
    edadCumple: number
    // patrulla: string | null,
}
interface ScoutPago {
    scout: {
        nombre: string
        apellido: string
    }
    concepto: string;
    monto: number | Decimal | string;
    metodoPago: MetodosPagoType;
    fechaPago: Date;
}

export const obtenerScoutsPorCumplirAños = async () => {
    let scoutsResp: ScoutBirthday[] = []
    try {
        scoutsResp = await prisma.$queryRaw`
            SELECT sc.nombre,sc.apellido,sc.fechaNacimiento,
            -- p.nombre as patrulla,
            DATE(CONCAT_WS('/',YEAR(CURDATE()), MONTH(fechaNacimiento), DAY(fechaNacimiento))) as fechaCumpleanos,
            TIMESTAMPDIFF(YEAR, fechaNacimiento, NOW())+1 AS edadCumple
            FROM Scout sc
            -- LEFT JOIN Patrulla p
            -- ON (sc.patrullaId = p.uuid)
            WHERE DATE(CONCAT_WS('-', YEAR(CURDATE()), MONTH(fechaNacimiento), DAY(fechaNacimiento)))
            BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL ${INTERVALO_DIAS} DAY)
            AND estado = 'ACTIVO'
            ORDER BY fechaCumpleanos ASC;
        `
    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    if (!scoutsResp.length) return "No hay cumpleaños durante el proximo mes"

    const formattedBD = scoutsResp.map((scout) => `${scout.fechaCumpleanos.toLocaleDateString()} → _${scout.nombre} ${scout.apellido}_ cumple *${scout.edadCumple}* años`).join('\n');
    return `*Cumpleaños del proximo mes*:\n${formattedBD}`
}

export const obtenerCumpleañosHoy = async () => {
    let scoutsResp: ScoutBirthday[] = []

    try {
        const date = new Date();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        scoutsResp = await prisma.$queryRaw`
            SELECT nombre,apellido,fechaNacimiento,
            TIMESTAMPDIFF(YEAR, fechaNacimiento, NOW()) AS edadCumple
            FROM Scout
            WHERE EXTRACT(MONTH FROM fechaNacimiento) = ${month} AND EXTRACT(DAY FROM fechaNacimiento) = ${day} AND estado = 'ACTIVO';
        `

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    if (!scoutsResp.length) return null

    const formattedBD = scoutsResp.map((scout) => `_${scout.nombre} ${scout.apellido}_ → cumple *${scout.edadCumple}* años`).join('\n');
    return `*Cumpleaños de hoy*:\n${formattedBD}`
}

export const obtenerPagosSemana = async () => {
    let paymentsLastWeek: ScoutPago[] = []

    try {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 150);

        paymentsLastWeek = await prisma.pago.findMany({
            where: {
                fechaPago: {
                    gte: lastWeek,
                    lte: today,
                },
            },
            include: {
                scout: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    if (!paymentsLastWeek.length) return "No hay pagos de la ultima semana"

    const formattedBD = paymentsLastWeek.map((pago) => `_${pago.fechaPago.toLocaleDateString()}_ → *${pago.scout.nombre} ${pago.scout.apellido}*: ${pago.concepto} - $${pago.monto}`).join('\n');
    return `*Pagos de la semana*:\n${formattedBD}`
}

export const obtenerPagosScout = async (nombreScout: string, concepto?: string) => {
    let pagos: ScoutPago[] = []

    try {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        pagos = await prisma.pago.findMany({
            where: {
                fechaPago: {
                    gte: startOfYear,
                    lte: today,
                },
                scout: {
                    OR:
                        [
                            {
                                nombre: {
                                    contains: nombreScout
                                },
                            },
                            {
                                apellido: {
                                    contains: nombreScout
                                },
                            }
                        ]
                },
                concepto: {
                    contains: concepto || "CUOTA GRUPO"
                }
            },
            include: {
                scout: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    if (!pagos.length) return "No hay cuotas de grupo pagadas"

    const formattedBD = pagos.map((pago) => `_${pago.fechaPago.toLocaleDateString()}_ → *${pago.scout.nombre} ${pago.scout.apellido}*: ${pago.concepto} - $${pago.monto}`).join('\n');
    return `*Cuotas de grupo pagadas de ${nombreScout}*:\n${formattedBD}`
}


export const obtenerScouts = async (nombreScout?: string, nombrePatrulla?: string) => {

    if (nombreScout?.length) {
        const scout = await prisma.scout.findFirst({
            where: {
                OR:
                    [
                        {
                            nombre: {
                                contains: nombreScout
                            },
                        },
                        {
                            apellido: {
                                contains: nombreScout
                            },
                        }
                    ],
                estado: "ACTIVO"
            },
            include: {
                patrulla: {
                    select: {
                        nombre: true
                    }
                }
            }
        })
        if (!scout) return "No hay scout registrado con ese nombre"

        const formattedScout = `${scout.apellido} ${scout.nombre}\nSexo: ${scout.sexo === "M" ? "Masculino" : "Femenino"}\nDNI: ${scout.dni}\nPatrulla: ${scout.patrulla?.nombre}\nProgresion: ${scout.progresionActual}\nEdad: ${scout.edad} años\nFecha de nacimiento: ${scout.fechaNacimiento.toLocaleDateString()}`
        return `*Info de scout ${nombreScout}*:\n${formattedScout}`

    } else {
        let resultString = ""

        try {
            const scouts = await prisma.scout.findMany({
                where: {
                    patrulla: nombrePatrulla?.length ? {
                        nombre: {
                            contains: nombrePatrulla
                        }
                    } : undefined,
                    estado: nombrePatrulla?.length ? "ACTIVO" : undefined
                },
                include: {
                    patrulla: {
                        select: {
                            nombre: true
                        }
                    },
                },
                orderBy: {
                    apellido: "asc"
                }
            });

            if (nombrePatrulla?.length) {
                const formattedScouts = scouts.map((scout) => `_${scout.apellido} ${scout.nombre}_ → ${scout.progresionActual} - ${scout.edad} años`).join('\n');
                resultString = `*Patrulla ${nombrePatrulla}*:\nCantidad de scouts: ${scouts.length}\n${formattedScouts}`
            } else {
                const cantidadActivos = scouts.filter((scout) => scout.estado === "ACTIVO").length
                const cantidadInactivos = scouts.filter((scout) => scout.estado === "INACTIVO").length

                const cantidadPorPatrulla = scouts.reduce((acumulator, { patrulla }) => {
                    const nombrePatrulla = patrulla?.nombre ?? "Sin Patrulla"
                    return {
                        ...acumulator,
                        //@ts-ignore
                        [nombrePatrulla]: (acumulator[nombrePatrulla] || 0) + 1
                    };
                }, {});

                //@ts-ignore
                const cantPatrString = Object.keys(cantidadPorPatrulla).map((key) => `${key}: ${cantidadPorPatrulla[key]}`).join('\n');
                resultString = `*Resultados de Scouts*:\nCantidad total de scouts: ${scouts.length}\nCantidad activos: ${cantidadActivos}\nCantidad inactivos: ${cantidadInactivos}\n${cantPatrString}`
            }


        } catch (error) {
            console.log("Error en consulta: ", error)
        }

        return resultString
    }

    // const formattedBD = scouts.map((pago) => `_${pago.fechaPago.toLocaleDateString()}_ → *${pago.scout.nombre} ${pago.scout.apellido}*: ${pago.concepto} - $${pago.monto}`).join('\n');
    // return `*Cuotas de grupo pagadas de ${nombreScout}*:\n${formattedBD}`
}

