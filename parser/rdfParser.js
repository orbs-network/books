// this program takes rdf data from the gutenberg project about their collection
// and converts it to JSON data containing the interesting parts of the data.

const fs = require("fs");
const xmlParser = require("xml2json");

// returns the json representation of an rdf file from the gutenberg project
// if the file does not exist it returns null
function toJson(rdf) {
	// get rid of rdf bloat
	rdf = rdf.replace(new RegExp("dcterms:", "g"), "");
	rdf = rdf.replace(new RegExp("pgterms:", "g"), "");
	rdf = rdf.replace(new RegExp("rdf:", "g"), "");

	// turn rdf xml to JSON
	convertedJson = xmlParser.toJson(rdf);

	// create the JSON object and get rid of more rdf bloat
	data = JSON.parse(convertedJson);
	data = data["RDF"]["ebook"];

	// construct the main book object from the JSON data
	book = {
		Author: data.creator.agent.name,
		Issued: data["issued"]["$t"],
		Language: data["language"].Description.value["$t"],
		Rights: data["rights"],
		Subjects: data["subject"],
		Title: data["title"]
	};

	book.Publishers = [{
		Name: data["publisher"],
		MetadataLink: "https://www.gutenberg.org/" + data["about"],
		FileVersions: data["hasFormat"]
	}]

	// remove file format rdf and xml bloat
	for (i = 0; i < book.Publishers[0].FileVersions.length; i++) {
		// removing bloat
		book.Publishers[0].FileVersions[i] = {
			Link: book.Publishers[0].FileVersions[i].file.about,
			Format: book.Publishers[0].FileVersions[i].file.format
		};

		// removing more bloat
		if (book.Publishers[0].FileVersions[i].Format.length == undefined) {
			book.Publishers[0].FileVersions[i].Format = [
				book.Publishers[0].FileVersions[i].Format.Description.value["$t"]
			];
			continue;
		}

		// iterativley removing bloat
		for (j = 0; j < book.Publishers[0].FileVersions[i].Format.length; j++) {
			book.Publishers[0].FileVersions[i].Format[j] =
				book.Publishers[0].FileVersions[i].Format[j].Description.value["$t"];
		}
	}

	// more bloat removal
	if (book.Subjects.length == undefined) {
		book.Subjects = [book.Subjects.Description.value["$t"]];
	}

	for (i = 0; i < book.Subjects.length; i++) {
		book.Subjects[i] = book.Subjects[i].Description.value;
	}

	// return final book JSON representation
	return JSON.stringify(book);
}

function fileToJson(fileName) {
	return toJson(getRDFfile(fileName));
}

function getRDFfile(fileName) {
	return fs.readFileSync(fileName).toString();
}

// export the function for the library
module.exports = {
	toJson,
	fileToJson
};
