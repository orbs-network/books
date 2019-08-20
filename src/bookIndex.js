const { argString, argUint64 } = require("orbs-client-sdk")

// TODO handle errors
// TODO refactor to match the contract interface
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
        return this.client.sendTransaction(tx)
    }

    async getBooks(start, limit){
        const [tx, txId] = this.client.createTransaction(
            this.account.publicKey,
            this.account.privateKey,
            this.name,
            "getBooks",
            [argUint64(start), argUint64(limit)]
		)
		const result = await this.client.sendTransaction(tx);
        return JSON.parse(result.outputArguments[0].value);
    }

    async totalBooks(){
        const [tx, txId] = this.client.createTransaction(
            this.account.publicKey,
            this.account.privateKey,
            this.name,
            "totalBooks",
            []
        )
        return this.client.sendTransaction(tx)
    }
}

module.exports = {
    BookIndex
}