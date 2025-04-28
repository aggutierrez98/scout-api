import { Familiar, Scout as PrismaScout } from "@prisma/client";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";

interface ConstructorProps extends BaseConstructorProps {
    // scoutId?: string
    familiarId: string
    fechaPago: Date
    listaPagos: {
        monto: number
        concepto: string
    }[]
}

// type ScoutWithFamiliaresType = PrismaScout & { familiarScout: { relacion: string, familiar: Familiar }[] }

interface Data {
    // scoutId?: string,
    familiarId: string
    fechaPago: Date,
    familiar: Familiar
    listaPagos: {
        monto: string
        concepto: string
    }[],
}


export class ReciboPago extends PdfDocument {
    data: Data

    constructor({ familiarId, data, ...props }: ConstructorProps) {
        super(props)
        this.data = { familiarId, ...data }
    }

    async getData() {

        const familiar = await prismaClient.familiar.findUnique({
            where: {
                uuid: this.data.familiarId
            }
        })

        if (!familiar) throw new AppError({
            name: "NOT_FOUND",
            httpCode: HttpCode.BAD_REQUEST,
            description: "No se encontraron datos del familiar"
        });

        this.data = {
            ...this.data,
            familiar
        }
    }

    mapData() {
        const { fechaPago, listaPagos, familiar } = this.data
        const nombreFamiliar = `${familiar.apellido} ${familiar.nombre}`
        const montoTotal = listaPagos.reduce((acc, { monto }) => acc + Number(monto), 0).toString()

        // TODO: Pasar numero de monto a letras
        const montoEscrito = "ciento cincuenta y cinco"
        // TODO: Generar numero de recibo (coleccion y base de ids)
        const numeroRecibo = "1000"

        const pagosData = listaPagos.reduce((acc, pago, index) => ({
            ...acc,
            [`Concepto_pago_${index + 1}`]: pago.concepto,
            [`Monto_pago_${index + 1}`]: pago.monto,
        }), {})

        return {
            ...pagosData,
            'Numero_recibo': numeroRecibo,
            'Numero_recibo_2': numeroRecibo,
            'Fecha_recibo': fechaPago.toLocaleDateString(),
            'Persona_recibo': nombreFamiliar,
            'Monto_total': montoTotal,
            'Monto_total_2': montoTotal,
            'Suma_monto': montoEscrito,
            'Suma_monto_2': "",
            // 'Firma_aclaracion': "",
        }
    }

    get uploadFolder() {
        return `recibos/${this.data.familiarId}/`
    }

    async sign() { }
}
