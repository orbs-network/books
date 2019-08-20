const { argString, argUint64 } = require("orbs-client-sdk")

class BookIndex {
    constructor(account, client){
        this.name = `bookIndex.${new Date().getTime()}`
        this.account = account
        this.client = client
    }

    async dumpBooks(payload){
        const [tx, txId] = this.client.createTransaction(
            this.account.publicKey,
            this.account.privateKey,
            this.name,
            "dumpBooks",
            [argString(payload)]
        )
        return this.client.sendTransaction(tx)
    }

    async returnUpdate(lastEntry){
        const [tx, txId] = this.client.createTransaction(
            this.account.publicKey,
            this.account.privateKey,
            this.name,
            "returnUpdate",
            [argUint64(lastEntry)]
        )
        return this.client.sendTransaction(tx)
    }

    async getCounter(){
        const [tx, txId] = this.client.createTransaction(
            this.account.publicKey,
            this.account.privateKey,
            this.name,
            "getCounter",
            []
        )
        return this.client.sendTransaction(tx)
    }
}

module.exports = {
    BookIndex
}