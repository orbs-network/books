const Orbs = require("orbs-client-sdk");
const fs = require("fs");

class BookIndex {
	constructor(account, client, name) {
		this.name = name;
		this.account = account;
		this.client = client;
	}

	async getOwner() {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"getOwner",
			[]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.executionResult);
		}

		return Orbs.encodeHex(result.outputArguments[0].value);
	}

	async changeOwner(newAddress) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"changeOwner",
			[Orbs.argAddress(newAddress)]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async addCurator(newCurator) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"addCurator",
			[Orbs.argAddress(newCurator)]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async removeCurator(curator) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"removeCurator",
			[Orbs.argAddress(curator)]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async registerBooks(books) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"registerBooks",
			[Orbs.argString(JSON.stringify(books))]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}

		return JSON.parse(result.outputArguments[0].value);
	}

	async addPublisherToBook(bookId, publisher) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"addPublisherToBook",
			[Orbs.argUint64(bookId), Orbs.argString(JSON.stringify(publisher))]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async addFileVersionToBook(id, publisherName, version) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"addFileVersionToBook",
			[
				Orbs.argUint64(id),
				Orbs.argString(publisherName),
				Orbs.argString(JSON.stringify(version))
			]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async addSubjectToBook(id, subject) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"addSubjectToBook",
			[Orbs.argUint64(id), Orbs.argString(subject)]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async removeBook(id) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"removeBook",
			[Orbs.argUint64(id)]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async removePublisherFromBook(id, publisherName) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"removePublisherFromBook",
			[Orbs.argUint64(id), Orbs.argString(publisherName)]
		);
		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async removeFileVersionFromBook(id, publisherName, link) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"removeFileVersionFromBook",
			[Orbs.argUint64(id), Orbs.argString(publisherName), Orbs.argString(link)]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async removeSubjectFromBook(id, subject) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"removeSubjectFromBook",
			[Orbs.argUint64(id), Orbs.argString(subject)]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}
	}

	async getBooks(start, limit) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"getBooks",
			[Orbs.argUint64(start), Orbs.argUint64(limit)]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			if (result.outputArguments[0].value == "no such book id") {
				return new Error("no such book id");
			}
			return new Error(result.outputArguments[0].value);
		}

		if (result.outputArguments[0].value == "") {
			return null;
		}

		return JSON.parse(result.outputArguments[0].value);
	}

	async getBook(id) {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"getBooks",
			[Orbs.argUint64(id), Orbs.argUint64(1)]
		);

		const result = await this.client.sendTransaction(tx);
		if (result.executionResult != "SUCCESS") {
			if (result.outputArguments[0].value == "no such book id") {
				return new Error("no such book id");
			}
			return new Error(result.outputArguments[0].value);
		}

		if (result.outputArguments[0].value == "") {
			return null;
		}

		return JSON.parse(result.outputArguments[0].value)[0];
	}

	async totalBooks() {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"totalBooks",
			[]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}

		return Number(result.outputArguments[0].value);
	}

	async lastId() {
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"lastId",
			[]
		);

		const result = await this.client.sendTransaction(tx);

		if (result.executionResult != "SUCCESS") {
			return new Error(result.outputArguments[0].value);
		}

		return Number(result.outputArguments[0].value);
	}
}

function getContractCode(contractName) {
	return fs.readFileSync(`${__dirname}/../contracts/` + contractName);
}

async function deploy(client, acc, code, contractName) {
	const [tx, txid] = client.createTransaction(
		acc.publicKey,
		acc.privateKey,
		"_Deployments",
		"deployService",
		[Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)]
	);
	return await client.sendTransaction(tx);
}

async function setupContract(client, contractName) {
	const acc = Orbs.createAccount();
	const bookIndex = new BookIndex(acc, client, contractName);
	const deployResp = await deploy(
		client,
		acc,
		getContractCode("bookIndex.go"),
		bookIndex.name
	);
	return [bookIndex, deployResp];
}

module.exports = {
	BookIndex,
	setupContract
};
