const { argString, argUint64 } = require("orbs-client-sdk")

class BookIndex {
    constructor(account, client){
        this.name = `bookIndex.${new Date().getTime()}`
        this.account = account
        this.client = client
    }

    async registerBooks(books){
        const [tx, txId] = this.client.createTransaction(
            this.account.publicKey,
            this.account.privateKey,
            this.name,
            "registerBooks",
            [argString(JSON.stringify(books))]
		)
		
		const result = await this.client.sendTransaction(tx)
		
		if(result.executionResult != "SUCCESS"){
			return new Error("transaction did not succeed!")
		}
		
		return JSON.parse(result.outputArguments[0].value)
    }

    async getBooks(start, limit){
        const [tx, txId] = this.client.createTransaction(
            this.account.publicKey,
            this.account.privateKey,
            this.name,
            "getBooks",
            [argUint64(start), argUint64(limit)]
		)
		
		const result = await this.client.sendTransaction(tx)

		if(result.executionResult != "SUCCESS"){
			return new Error("transaction did not succeed!")
		}
		
		if(result.outputArguments[0].value == ""){
			return null
		}

		return JSON.parse(result.outputArguments[0].value)
	}

	async getBook(id){
		const [tx, txId] = this.client.createTransaction(
			this.account.publicKey,
			this.account.privateKey,
			this.name,
			"getBook",
			[argUint64(id)]
		)

		const result = await this.client.sendTransaction(tx)

		if(result.executionResult != "SUCCESS"){
			return new Error("transaction did not succeed!")
		}

		return JSON.parse(result.outputArguments[0].value)
	}

    async totalBooks(){
        const [tx, txId] = this.client.createTransaction(
            this.account.publicKey,
            this.account.privateKey,
            this.name,
            "totalBooks",
            []
		)
		
		const result = await this.client.sendTransaction(tx)
		
		if(result.executionResult != "SUCCESS"){
			return new Error("transaction did not succeed!")
		}
		
		return Number(result.outputArguments[0].value)
    }
}

module.exports = {
    BookIndex
}