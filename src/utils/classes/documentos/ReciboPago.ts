import { Familiar } from "@prisma/client";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { montoALetras } from "../../lib/numero-a-letras";

interface ConstructorProps extends BaseConstructorProps {
    familiarId: string
    fechaPago: Date
    pago: {
        monto: number
        concepto: string
    }
    numeroRecibo: number
}

interface Data {
    familiarId: string
    fechaPago: Date
    familiar: Familiar
    pago: {
        monto: number
        concepto: string
    }
    numeroRecibo: number
}


export class ReciboPago extends PdfDocument {
    data: Data

    constructor({ familiarId, fechaPago, pago, numeroRecibo, data, ...props }: ConstructorProps) {
        super(props)
        this.data = { familiarId, fechaPago, pago, numeroRecibo, ...data }
    }

    async getData() {
        const familiar = await prismaClient.familiar.findUnique({
            where: { uuid: this.data.familiarId }
        })

        if (!familiar) throw new AppError({
            name: "NOT_FOUND",
            httpCode: HttpCode.BAD_REQUEST,
            description: "No se encontraron datos del familiar"
        });

        this.data = { ...this.data, familiar }
    }

    mapData() {
        const { fechaPago, pago, familiar, numeroRecibo } = this.data
        const nombreFamiliar = `${familiar.apellido} ${familiar.nombre}`
        const montoStr = pago.monto.toString()
        const montoEscrito = montoALetras(pago.monto)
        const numeroReciboStr = numeroRecibo.toString().padStart(6, '0')

        return {
            'Concepto_pago_1': pago.concepto,
            'Monto_pago_1': montoStr,
            'Numero_recibo': numeroReciboStr,
            'Numero_recibo_2': numeroReciboStr,
            'Fecha_recibo': fechaPago.toLocaleDateString('es-AR'),
            'Persona_recibo': nombreFamiliar,
            'Monto_total': montoStr,
            'Monto_total_2': montoStr,
            'Suma_monto': montoEscrito,
            'Suma_monto_2': "",
        }
    }

    get uploadFolder() {
        return `recibos/${this.data.familiarId}/`
    }

    async sign() { }
}
