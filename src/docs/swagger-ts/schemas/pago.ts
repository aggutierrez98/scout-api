import { OAS3Options } from "swagger-jsdoc";
import { VALID_METODOS_PAGO } from "../../../utils";

export const userSchema: OAS3Options = {
    type: "object",
    properties: {
        id: {
            type: "integer",
            format: "int32",
            default: "autoincrement"
        },
        uuid: {
            type: "string",
            maxLength: 10,
            uniqueItems: true
        },
        concepto: {
            type: "string",
            maxLength: 100
        },
        monto: {
            type: "number",
            format: "decimal",
            maximum: 99999999.99,
            minimum: 0
        },
        rendido: {
            type: "boolean",
            default: false
        },
        metodoPago: {
            type: "string",
            enum: VALID_METODOS_PAGO,
        },
        scout: {
            $ref: "#/components/schemas/Scout"
        },
        scoutId: {
            type: "string",
            maxLength: 10
        },
        fechaPago: {
            type: "string",
            format: "date-time"
        },
        fechaCreacion: { type: "date", readOnly: true },
        fechaActualizacion: { type: "date", readOnly: true },
    },
    required: [
        "concepto",
        "monto",
        "metodoPago",
        "scoutId",
        "fechaPago",
    ],
};
