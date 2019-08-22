const { BookIndex } = require("./src/bookIndex");
const { toJson, fileToJson } = require("./parser/rdfParser");

module.exports = {
	BookIndex,
	toJson,
	fileToJson
};
