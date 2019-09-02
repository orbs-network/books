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
	// register to smart contract and dynamodb as well
	const receipt = await bookIndex.registerBooks(books);

	for (i = 0; i < receipt.length; i++) {
		// register to dynamodb
		dynamo.uploadBook(receipt[i], books[i].Title);
	}
}

module.exports = {
	registerBooks
};
