import { OAS3Options } from "swagger-jsdoc";

export const userSchema: OAS3Options = {
    type: "object",
    properties: {
        id: {
            type: "integer",
            format: "int32"
        },
        uuid: {
            type: "string",
            maxLength: 10,
            uniqueItems: true
        },
        username: {
            type: "string",
            maxLength: 20,
            uniqueItems: true
        },
        password: {
            type: "string"
        },
        role: {
            type: "string",
            default: "EXTERNO"
        },
        active: {
            type: "boolean",
            default: true
        },
        scout: {
            $ref: "#/components/schemas/Scout"
        },
        scoutId: {
            type: "string",
            maxLength: 10,
            uniqueItems: true
        },
        fechaCreacion: { type: "date", readOnly: true },
        fechaActualizacion: { type: "date", readOnly: true },
    },
    required: [
        "username",
        "password",
    ],
};
