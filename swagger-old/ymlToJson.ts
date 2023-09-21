import fs from "fs";

import YAML from "yamljs";
import path from "path";
const file = fs.readFileSync(path.join(__dirname, "./swagger.yaml"), "utf-8");
const swaggerDocument = YAML.parse(file);

// const swaggerDocument = require("./index.json");

export default swaggerDocument;
