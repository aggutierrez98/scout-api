import { PrismaClient } from "@prisma/client";
import { MetodosPagoType } from "../types";
import { Decimal } from "@prisma/client/runtime/library";
import { getAge, getEntregaFromType } from "../utils";
const INTERVALO_DIAS_CUMPLEAÑOS = 30

const prisma = new PrismaClient().$extends({
    result: {
        scout: {
            edad: {
                needs: { fechaNacimiento: true },
                compute: (scout) => getAge(scout.fechaNacimiento),
            }
        },
        familiar: {
            edad: {
                needs: { fechaNacimiento: true },
                compute: (familiar) => getAge(familiar.fechaNacimiento)
            }
        },
        entregaRealizada: {
            tipoEntrega: {
                compute: ({ tipoEntrega }) => getEntregaFromType(tipoEntrega),
            },
        },
        pago: {
            id: {
                compute: (data) => data.uuid,
            },
            uuid: {
                compute: () => undefined,
            },
        },
        // // documentoPresentado: {
        // // 	id: {
        // // 		compute: (data) => data.uuid,
        // // 	},
        // // 	uuid: {
        // // 		compute: () => undefined,
        // // 	},
        // // },
        // // entregaRealizada: {
        // // 	id: {
        // // 		compute: (data) => data.uuid,
        // // 	},
        // // 	uuid: {
        // // 		compute: () => undefined,
        // // 	},
        // // },
        // // patrulla: {
        // // 	id: {
        // // 		compute: (data) => data.uuid,
        // // 	},
        // // 	uuid: {
        // // 		compute: () => undefined,
        // // 	},
        // // },
        // // familiar: {
        // // 	id: {
        // // 		compute: (data) => data.uuid,
        // // 	},
        // // 	uuid: {
        // // 		compute: () => undefined,
        // // 	},
        // // },
    },
});

interface ScoutBirthday {
    nombre: string,
    apellido: string,
    fechaNacimiento: Date,
    fechaCumpleanos: Date,
    edadCumple: number
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
interface ScoutDocumento {
    scout: {
        nombre: string
        apellido: string
    }
    documento: {
        nombre: string
    }
    fechaPresentacion: Date;
}

export const obtenerScoutsPorCumplirAños = async () => {
    let scoutsResp: ScoutBirthday[] = []
    try {
        scoutsResp = await prisma.$queryRaw`
            SELECT sc.nombre,sc.apellido,sc.fechaNacimiento,
            -- p.nombre as patrulla,
            DATE(CONCAT_WS('-',YEAR(CURDATE()), MONTH(fechaNacimiento), DAY(fechaNacimiento))) as fechaCumpleanos,
            TIMESTAMPDIFF(YEAR, fechaNacimiento, DATE_ADD(CURDATE(),INTERVAL ${INTERVALO_DIAS_CUMPLEAÑOS} DAY)) AS edadCumple
            FROM Scout sc
            -- LEFT JOIN Patrulla p
            -- ON (sc.patrullaId = p.uuid)
            WHERE DATE(CONCAT_WS('-', YEAR(CURDATE()), MONTH(fechaNacimiento), DAY(fechaNacimiento)))
            BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL ${INTERVALO_DIAS_CUMPLEAÑOS} DAY)
            AND estado = 'ACTIVO'
            ORDER BY fechaCumpleanos ASC;
        `
    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    if (!scoutsResp.length) return "No hay cumpleaños durante el proximo mes"

    const formattedBD = scoutsResp.map((scout) => `${scout.fechaCumpleanos.toLocaleDateString('es-AR', { timeZone: 'UTC' })} → _${scout.nombre} ${scout.apellido}_ cumple *${scout.edadCumple}* años`).join('\n');
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
            },
            orderBy: {
                fechaPago: "desc"
            }
        });

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    if (!paymentsLastWeek.length) return "No hay pagos de la ultima semana"

    const formattedBD = paymentsLastWeek.map((pago) => `_${pago.fechaPago.toLocaleDateString('es-AR', { timeZone: 'UTC' })}_ → *${pago.scout.nombre} ${pago.scout.apellido}*: ${pago.concepto} - $${pago.monto}`).join('\n');
    return `*Pagos de la semana*:\n${formattedBD}`
}

export const obtenerPagosScout = async (nombreScout: string, concepto?: string) => {
    let pagos: ScoutPago[] = []

    let nombre = ""
    let apellido = ""
    if (nombreScout?.includes(".")) [nombre, apellido] = nombreScout?.split(".")


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
                                    contains: nombre.length ? nombre : nombreScout
                                },
                            },
                            {
                                apellido: {
                                    contains: apellido.length ? apellido : nombreScout
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
            },
            orderBy: {
                fechaPago: "desc"
            }
        });

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    if (!pagos.length) return "No hay cuotas de grupo pagadas"

    const formattedBD = pagos.map((pago) => `_${pago.fechaPago.toLocaleDateString('es-AR', { timeZone: 'UTC' })}_ → *${pago.scout.nombre} ${pago.scout.apellido}*: ${pago.concepto} - $${pago.monto}`).join('\n');
    return `*Cuotas de grupo pagadas de ${nombreScout}*:\n${formattedBD}`
}


export const obtenerScouts = async (nombreScout?: string, nombrePatrulla?: string) => {

    let nombre = ""
    let apellido = ""
    if (nombreScout?.includes(".")) [nombre, apellido] = nombreScout?.split(".")


    if (nombreScout?.length) {
        const scout = await prisma.scout.findFirst({
            where: {
                OR:
                    [
                        {
                            nombre: {
                                contains: nombre.length ? nombre : nombreScout
                            },
                        },
                        {
                            apellido: {
                                contains: apellido.length ? apellido : nombreScout
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

        const formattedScout = `${scout.apellido} ${scout.nombre}\nSexo: ${scout.sexo === "M" ? "Masculino" : "Femenino"}\nDNI: ${scout.dni}\nPatrulla: ${scout.patrulla?.nombre}\nProgresion: ${scout.progresionActual}\nEdad: ${scout.edad} años\nFecha de nacimiento: ${scout.fechaNacimiento.toLocaleDateString('es-AR', { timeZone: 'UTC' })}`
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
}



export const obtenerDocumentosScout = async (nombreScout: string) => {
    let documentos: ScoutDocumento[] = []

    let nombre = ""
    let apellido = ""
    if (nombreScout.includes(".")) [nombre, apellido] = nombreScout.split(".")

    try {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        documentos = await prisma.documentoPresentado.findMany({
            where: {
                fechaPresentacion: {
                    gte: startOfYear,
                    lte: today,
                },
                scout: {
                    OR:
                        [
                            {
                                nombre: {
                                    contains: nombre.length ? nombre : nombreScout
                                },
                            },
                            {
                                apellido: {
                                    contains: apellido.length ? apellido : nombreScout
                                },
                            }
                        ]
                },
                // documento: {
                //     nombre: {
                //         contains: nombreDocumento
                //     }
                // }

            },
            include: {
                scout: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                },
                documento: {
                    select: {
                        nombre: true
                    }
                }
            },
            orderBy: {
                fechaPresentacion: "desc"
            }
        });

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    if (!documentos.length) return "No hay documentos entregados"

    const formattedBD = documentos.map((documento) => `_${documento.fechaPresentacion.toLocaleDateString('es-AR', { timeZone: 'UTC' })}_ → *${documento.scout.nombre} ${documento.scout.apellido}*: ${documento.documento.nombre}`).join('\n');
    return `*Documentos entregados por ${nombreScout}*:\n${formattedBD}`
}

export const obtenerDocumentosFaltantes = async (nombreScout: string) => {
    let resultStr = ""
    let nombre = ""
    let apellido = ""
    if (nombreScout.includes(".")) [nombre, apellido] = nombreScout.split(".")

    try {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const [documentosVencidos, documentosFaltantes] = await Promise.all([
            await prisma.documento.findMany({
                where: {
                    //Validar vencido solo vencido
                    vence: true,
                    documentoPresentado: {
                        none: {
                            AND: [
                                {
                                    fechaPresentacion: {
                                        gte: startOfYear,
                                        lte: today,
                                    },
                                },
                                {
                                    scout: {
                                        OR:
                                            [
                                                {
                                                    nombre: {
                                                        contains: nombre.length ? nombre : nombreScout
                                                    },
                                                },
                                                {
                                                    apellido: {
                                                        contains: apellido.length ? apellido : nombreScout
                                                    },
                                                }
                                            ]
                                    }
                                },
                            ]
                        },
                    },
                    NOT: {
                        documentoPresentado: {
                            none: {
                                scout: {
                                    OR:
                                        [
                                            {
                                                nombre: {
                                                    contains: nombre.length ? nombre : nombreScout
                                                },
                                            },
                                            {
                                                apellido: {
                                                    contains: apellido.length ? apellido : nombreScout
                                                },
                                            }
                                        ]
                                }
                            }
                        }
                    }
                }
            }),
            await prisma.documento.findMany({
                where: {
                    documentoPresentado: {
                        none: {
                            scout: {
                                OR:
                                    [
                                        {
                                            nombre: {
                                                contains: nombre.length ? nombre : nombreScout
                                            },
                                        },
                                        {
                                            apellido: {
                                                contains: apellido.length ? apellido : nombreScout
                                            },
                                        }
                                    ]
                            }
                        },

                    }
                }
            })
        ])

        if (!documentosVencidos.length && !documentosFaltantes.length) return `*El scout ${nombreScout}* no debe ningun documento`

        const strVencidos = documentosVencidos.length ? `*Vencidos:*\n${documentosVencidos.map(documento => `_${documento.nombre}_`).join('\n')}` : ""
        const strFaltantes = documentosFaltantes.length ? `*Faltantes:*\n${documentosFaltantes.map(documento => `_${documento.nombre}_`).join('\n')}` : ""

        resultStr = `*Documentos faltantes para ${nombreScout}*:\n${strVencidos}\n${strFaltantes}`

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    return resultStr
}


export const obtenerFamiliaresScout = async (nombreScout: string) => {

    let nombre = ""
    let apellido = ""
    if (nombreScout.includes(".")) [nombre, apellido] = nombreScout.split(".")

    let familiaresStr = ""

    try {
        const scout = await prisma.scout.findFirst({
            where: {
                OR:
                    [
                        {
                            nombre: {
                                contains: nombre.length ? nombre : nombreScout
                            },
                        },
                        {
                            apellido: {
                                contains: apellido.length ? apellido : nombreScout
                            },
                        }
                    ]
            }
        })

        if (!scout) return "Familiar no encontrado"

        let familiares = await prisma.familiar.findMany({
            where: {
                padreScout: {
                    some: {
                        scout: {
                            uuid: scout.uuid
                        }
                    }
                }
            },
            include: {
                padreScout: {
                    select: {
                        relacion: true,
                        scoutId: true
                    }
                }
            }
        });

        if (!familiares.length) return `No hay familiares para el scout ${nombreScout}`

        const famRelacion = familiares.map(familiar => ({ ...familiar, relacion: familiar.padreScout.find(padre => padre.scoutId === scout.uuid)?.relacion }));
        const formattedBD = famRelacion.map((familiar) => `*${familiar.relacion}*: _${familiar.nombre} ${familiar.apellido}_`).join('\n');
        familiaresStr = `*Familiares de ${nombreScout}*:\n${formattedBD}`

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    return familiaresStr
}

export const obtenerFamiliar = async (nombreFamiliar: string) => {
    let familiarStr = ""
    let nombre = ""
    let apellido = ""
    if (nombreFamiliar.includes(".")) [nombre, apellido] = nombreFamiliar.split(".")

    try {
        const familiar = await prisma.familiar.findFirst({
            where: {
                OR:
                    [
                        {
                            nombre: {
                                contains: nombre.length ? nombre : nombreFamiliar
                            },
                        },
                        {
                            apellido: {
                                contains: apellido.length ? apellido : nombreFamiliar
                            },
                        }
                    ]
            },
            include: {
                padreScout: {
                    select: {
                        relacion: true,
                        scout: {
                            select: {
                                nombre: true,
                                apellido: true,
                            }
                        }
                    }
                }
            }
        });

        if (!familiar) return `No se hallo familiar con nombre ${nombreFamiliar}`

        const formattedBD = `_${familiar.apellido} ${familiar.nombre}_\n_Sexo:_ ${familiar.sexo === "M" ? "Masculino" : "Femenino"}\n_DNI:_ ${familiar.dni}\n_Edad:_ ${familiar.edad} años\n_Estado Civil:_ ${familiar.estadoCivil}\n_Telefono:_ ${familiar.telefono}`
        const familia = familiar.padreScout.length ? `*Familia:*\n${familiar.padreScout.map(ps => `*${ps.relacion}* de _${ps.scout?.nombre} ${ps.scout?.apellido}_`).join('\n')}` : ""

        familiarStr = `*Info de familiar ${nombreFamiliar}*:\n${formattedBD}\n${familia}`

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    return familiarStr
}


export const obtenerEntregas = async (nombreScout: string, nombrePatrulla?: string) => {

    let nombre = ""
    let apellido = ""
    if (nombreScout.includes(".")) [nombre, apellido] = nombreScout.split(".")

    let entregasStr = ""

    try {
        const entregas = await prisma.entregaRealizada.findMany({
            where: {
                scout: {
                    OR:
                        [
                            {
                                nombre: {
                                    contains: nombre.length ? nombre : nombreScout
                                },
                            },
                            {
                                apellido: {
                                    contains: apellido.length ? apellido : nombreScout
                                },
                            }
                        ]
                }
            },
            include: {
                scout: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                }
            },
            orderBy: {
                fechaEntrega: "desc"
            },
        })

        if (nombrePatrulla?.length) {
            if (!entregas.length) return `No hay entregas para la patrulla ${nombrePatrulla}`
            const entregasPorScout = entregas.reduce((acumulator, { scout: { nombre, apellido }, fechaEntrega, tipoEntrega }) => {
                return {
                    ...acumulator,
                    [`${nombre} ${apellido}`]: [
                        //@ts-ignore
                        ...(acumulator[`${nombre} ${apellido}`] ?? []),
                        {
                            fechaEntrega,
                            tipoEntrega
                        }
                    ]
                };
            }, {});

            // @ts-ignore
            const formattedEntregas = Object.keys(entregasPorScout).map((key) => `\nEntregas de *${key}*:\n ${entregasPorScout[key].map((entrega) => `_${entrega.fechaEntrega.toLocaleDateString('es-AR', { timeZone: 'UTC' })}_: *${entrega.tipoEntrega}*`).join('\n')}`).join('\n');
            entregasStr = `*Entregas de insignias/camisa/reconocimientos de la patrulla ${nombrePatrulla}*:\n${formattedEntregas}`

        } else if (nombreScout.length) {
            if (!entregas.length) return `No hay entregas para el scout ${nombreScout}`

            const formattedBD = entregas.map((entrega) => `_${entrega.fechaEntrega.toLocaleDateString('es-AR', { timeZone: 'UTC' })}_: *${entrega.tipoEntrega}*`).join('\n');
            entregasStr = `*Entregas de insignias/camisa/reconocimientos de ${nombreScout}*:\n${formattedBD}`
        }

    } catch (error) {
        console.log("Error en consulta: ", error)
    }

    return entregasStr
}