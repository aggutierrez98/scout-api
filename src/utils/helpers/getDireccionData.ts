export const separarCalleYNumero = (direccion: string) => {
    const regex = /(.*?)(\d+.*)$/;
    const match = direccion.match(regex);

    if (!match) {
        return { calle: direccion, numero: "" };
    }

    return {
        calle: match[1].trim(),
        numero: match[2].trim(),
    };
}