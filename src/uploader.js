const Orbs = require("orbs-client-sdk");
const fs = require("fs");
const { BookIndex, setupContract } = require("./bookIndex");
const dynamo = require("./dynamo");

const endpoint = process.env.ORBS_NODE_ADDRESS || "http://localhost:8080";
const chain = Number(process.env.ORBS_VCHAIN) || 42;
const client = new Orbs.Client(
	endpoint,
	chain,
	Orbs.NetworkType.NETWORK_TYPE_TEST_NET
);

async function registerBooks(books) {
	//const [bookIndex, _] = await setupContract(client, "BookDemo01")
	
	bookIndex = new BookIndex(Orbs.createAccount(), client, "BookDemo01")

	const lastId = await bookIndex.lastId()
	
	// TODO only for testing
	// if max id is more or equal to book length do nothing
	if(books.length <= lastId){
		console.log("no reason to update!")
		return
	}

	// register to smart contract and dynamodb as well
	const receipt = await bookIndex.registerBooks(books);

	for (i = 0; i < receipt.length; i++) {
		// register to dynamodb
		await dynamo.uploadBooks(receipt[i], books[i].Title, books[i].Author, books[i].Issued, books[i].Publishers[0].Name);
	}
}

// exclude = [JSON.parse(fs.readFileSync("/Users/gil/Downloads/gutenberg/9164.json")),
// 		 JSON.parse(fs.readFileSync("/Users/gil/Downloads/gutenberg/8914.json")),
// 		 JSON.parse(fs.readFileSync("/Users/gil/Downloads/gutenberg/9086.json")),
// 		 JSON.parse(fs.readFileSync("/Users/gil/Downloads/gutenberg/913.json")),
// 		 JSON.parse(fs.readFileSync("/Users/gil/Downloads/gutenberg/909.json")),
// 		 JSON.parse(fs.readFileSync("/Users/gil/Downloads/gutenberg/9025.json")),
// 		 JSON.parse(fs.readFileSync("/Users/gil/Downloads/gutenberg/58706.json")),
// 		 JSON.parse(fs.readFileSync("/Users/gil/Downloads/gutenberg/58700.json")),
// 		 JSON.parse(fs.readFileSync("/Users/gil/Downloads/gutenberg/58701.json")),		
// 		]

async function getBookBatch(dirPath, start, limit, callback){
	books = []
	await fs.readdir(dirPath, async (err, files) => {
		if(err){
			console.log(err)
		}else{
			for(i = start; i < start + limit; i++){
				books.push(JSON.parse(fs.readFileSync(dirPath + files[i])))
			}
			callback(books)
		}
	})
}

getBookBatch("/Users/gil/Downloads/gutenberg/", 100, 100, registerBooks)


// log of BookDemo01
// gutenberg 100,100
module.exports = {
	registerBooks
};
