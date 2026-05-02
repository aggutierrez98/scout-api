export const normalizeText = (text: string): string =>
	text.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
