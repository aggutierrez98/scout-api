const UNIDADES = [
    '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
];

const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

// 21-29 son palabras compuestas únicas en español
const VEINTIS = [
    '', 'veintiún', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
    'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];

const CENTENAS = [
    '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
];

function convertirDecenas(n: number): string {
    if (n === 0) return '';
    if (n < 20) return UNIDADES[n];
    if (n < 30) return VEINTIS[n - 20];

    const d = Math.floor(n / 10);
    const u = n % 10;
    return u > 0 ? `${DECENAS[d]} y ${UNIDADES[u]}` : DECENAS[d];
}

function convertirCentenas(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cien';

    const c = Math.floor(n / 100);
    const resto = n % 100;
    const cStr = c > 0 ? CENTENAS[c] : '';
    const restoStr = resto > 0 ? convertirDecenas(resto) : '';

    return [cStr, restoStr].filter(Boolean).join(' ');
}

function numerosALetras(n: number): string {
    if (n <= 0) return '';

    if (n >= 1_000_000) {
        const m = Math.floor(n / 1_000_000);
        const resto = n % 1_000_000;
        const mStr = m === 1 ? 'un millón' : `${numerosALetras(m)} millones`;
        return [mStr, resto > 0 ? numerosALetras(resto) : ''].filter(Boolean).join(' ');
    }

    if (n >= 1_000) {
        const m = Math.floor(n / 1_000);
        const resto = n % 1_000;
        // "mil" solo, nunca "un mil"
        const mStr = m === 1 ? 'mil' : `${numerosALetras(m)} mil`;
        return [mStr, resto > 0 ? convertirCentenas(resto) : ''].filter(Boolean).join(' ');
    }

    return convertirCentenas(n);
}

export function montoALetras(monto: number): string {
    const [enteroPart, decimalPart] = monto.toFixed(2).split('.');
    const entero = parseInt(enteroPart, 10);
    const centavos = parseInt(decimalPart, 10);

    const enteroStr = entero === 0 ? 'cero' : numerosALetras(entero);

    return centavos > 0
        ? `${enteroStr} con ${centavos}/100`
        : enteroStr;
}
