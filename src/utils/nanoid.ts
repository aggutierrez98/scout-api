// const urlAlphabet =
// 	"useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
// const random = (bytes: Iterable<number>) =>
// 	crypto.getRandomValues(new Uint8Array(bytes));
// const customRandom = (
// 	// rome-ignore lint/suspicious/noExplicitAny:
// 	alphabet: string | any[],
// 	size: number,
// 	// rome-ignore lint/suspicious/noExplicitAny:
// 	getRandom: { (bytes: any): Uint8Array; (arg0: number): any },
// ) => {
// 	const mask = (2 << (Math.log(alphabet.length - 1) / Math.LN2)) - 1;
// 	const step = -~((1.6 * mask * size) / alphabet.length);
// 	return () => {
// 		let id = "";
// 		while (true) {
// 			const bytes = getRandom(step);
// 			let j = step;
// 			while (j--) {
// 				id += alphabet[bytes[j] & mask] || "";
// 				if (id.length === size) return id;
// 			}
// 		}
// 	};
// };
export const nanoid = (size = 21) => {
	let id = "";
	const bytes = global.crypto.getRandomValues(new Uint8Array(size));
	// rome-ignore lint/style/noParameterAssign:
	while (size--) {
		const byte = bytes[size] & 63;
		if (byte < 36) {
			// `0-9a-z`
			id += byte.toString(36);
		} else if (byte < 62) {
			// `A-Z`
			id += (byte - 26).toString(36).toUpperCase();
		} else if (byte < 63) {
			id += "_";
		} else {
			id += "-";
		}
	}
	return id;
};
