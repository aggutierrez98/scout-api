export const parseDMYtoDate = (string: string) => {
	const [d, m, y] = string.split(/\D/);
	return new Date(Number(y), Number(m) - 1, Number(d));
};
