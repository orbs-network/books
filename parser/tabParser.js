// this program takes rdf data from the gutenberg project about their collection
// and converts it to JSON data containing the interesting parts of the data.

const fs = require("fs");
const readline = require("readline");

file = fs.createReadStream("/Users/gil/Downloads/hathi_upd_20190701.txt");

reader = readline.createInterface({ input: file });

var books = [];
reader
	.on("line", line => {
		line = line.split("\t");
		book = {
			Author: line[25],
			Issued: line[16],
			Language: line[18],
			Rights: line[2],
			Subjects: [], // TODO maybe scrape from website
			Title: line[11]
		};

		book.Publishers = [
			{
				Name: line[12],
				MetadataLink: "https://catalog.hathitrust.org/Record/" + line[3],
				FileVersions: [
					{
						Link: "https://hdl.handle.net/2027/" + line[0],
						Format: ["application/epub"]
					},
					{
						Link: "https://babel.hathitrust.org/cgi/ssd?id=" + line[0],
						Format: ["text/plain"]
					}
				]
			}
		];

		if (book.Rights == "pd" || book.Rights == "pdus") {
			console.log(book);
			books.push(book);
		}
	})
	.on("close", err => {
		console.log("\ndone");
		console.log(books.length);
	});
