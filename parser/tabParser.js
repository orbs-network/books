// this program takes rdf data from the gutenberg project about their collection
// and converts it to JSON data containing the interesting parts of the data.

const fs = require("fs");
const readline = require("readline");

parseFile("/Users/gil/Downloads/hathi_full_20190701.txt", "/Users/gil/Downloads/hathi/")

function parseFile(path, dirPath){
	// read the mega file
	file = fs.createReadStream(path);
	
	// create the parser
	reader = readline.createInterface({ input: file });
	
	var books = [];
	var counter = 0
	reader
		.on("line", line => {
			line = line.split("\t");
	
			// parse the line with tab delimiters
			book = {
				Author: line[25],
				Issued: line[16],
				Language: line[18],
				Rights: line[2],
				Subjects: [], // TODO maybe scrape from website
				Title: line[11]
			};
	
			// add the publisher
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
	
			// we are only interested in public domain books
			if ((book.Rights == "pd" || book.Rights == "pdus") && book.Publishers[0].Name != "") {
				try{
					if(!fs.existsSync(dirPath + book.Title.replace("/", "") + "json")){
						fs.writeFileSync(dirPath + book.Title.replace("/", "") + "json", JSON.stringify(book))
						counter++
						console.log(counter + " " + book.Title)
					}
				}catch{

				}
			}
		})
		.on("close", err => {
			console.log("\ndone");
			console.log(counter)
		});
}

module.exports = {
	parseFile
}
