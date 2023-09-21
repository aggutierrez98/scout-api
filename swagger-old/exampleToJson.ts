const path = require("path");
const yamljs = require("yamljs");
const resolveRefs = require("json-refs").resolveRefs;

/**
 * Return JSON with resolved references
 * @param {array | object} root - The structure to find JSON References within (Swagger spec)
 * @returns {Promise.<JSON>}
 */

//@ts-ignore
const multiFileSwagger = (root) => {
	const options = {
		filter: ["relative", "remote"],
		loaderOptions: {
			//@ts-ignore
			processContent: function (res, callback) {
				callback(null, yamljs.parse(res.text));
			},
		},
	};

	return resolveRefs(root, options).then(
		//@ts-ignore
		function (results) {
			return results.resolved;
		},
		//@ts-ignore
		function (err) {
			console.log(err.stack);
		},
	);
};

const swaggerDocument = multiFileSwagger(
	//@ts-ignore
	yamljs.load(path.resolve(__dirname, "./swagger.yaml")),
);

export default swaggerDocument;
