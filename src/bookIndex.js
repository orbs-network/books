const Orbs = require("orbs-client-sdk");

class BookIndex {
	constructor(account, client, name) {
		this.name = name;
		this.account = account;
		this.client = client;
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

		return JSON.parse(result.outputArguments[0].value);
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
}

module.exports = {
	BookIndex
};
