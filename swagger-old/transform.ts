import fs from "fs";
const resolve = require("json-refs").resolveRefs;
const YAML = require("js-yaml");
const root = YAML.safeLoad(fs.readFileSync("swagger.yaml").toString());
const options = {
	filter: ["relative", "remote"],
	loaderOptions: {
		//@ts-ignore
		processContent: function (res, callback) {
			callback(null, YAML.safeLoad(res.text));
		},
	},
};

//@ts-ignore
resolve(root, options).then(function (results) {
	//@ts-ignore
	if (program.outputFormat === "yaml") {
		console.log(YAML.safeDump(results.resolved));
		//@ts-ignore
	} else if (program.outputFormat === "json") {
		console.log(JSON.stringify(results.resolved, null, 2));
	}
});
