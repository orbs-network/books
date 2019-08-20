const Orbs = require("orbs-client-sdk")
const expect = require("expect.js")
const fs = require("fs")
const { BookIndex } = require("./bookIndex")

const endpoint = process.env.ORBS_NODE_ADDRESS || "http://localhost:8080"
const chain = Number(process.env.ORBS_VCHAIN) || 42
const client = new Orbs.Client(endpoint, chain, Orbs.NetworkType.NETWORK_TYPE_TEST_NET)


function getContractCode(contractName){
	return fs.readFileSync(`${__dirname}/../contracts/` + contractName)
}

async function deploy(acc, code, contractName){
	const [tx, txid] = client.createTransaction(acc.publicKey, acc.privateKey, "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)])
	return await client.sendTransaction(tx);
}

async function setupContract(){
	const acc = Orbs.createAccount()
	const bookIndex = new BookIndex(acc, client)
	const deployResp = await deploy(acc, getContractCode("bookIndex.go"), bookIndex.name)
	return [bookIndex, deployResp]
}

describe("the book index", () => {
	it("should deploy successfully", async () => {
		const [_, deployResp] = await setupContract()
		expect(deployResp.executionResult).to.be("SUCCESS")
	})

	it("should store a valid book", async () => {
		const [bookIndex, _] = await setupContract()
		const acc = Orbs.createAccount()
		const exampleJsonBook = "[" + fs.readFileSync(`${__dirname}/books/9300.json`).toString() + "]"

		const receipt = await bookIndex.dumpBooks(exampleJsonBook)
		expect(receipt.executionResult).to.be("SUCCESS")
	})

	it("should throw when an invalid json object is sent", async () => {
		const [bookIndex, _] = await setupContract()
		const acc = Orbs.createAccount()
		const invalidJsonBook = fs.readFileSync(`${__dirname}/books/9300Invalid.json`).toString()        

		const receipt = await bookIndex.dumpBooks(invalidJsonBook)
		expect(receipt.executionResult).to.be("ERROR_SMART_CONTRACT")
	})

	// TODO return empty no update
	// it("")

	it("should store and retreive the same book", async () => {
		const [bookIndex, _] = await setupContract()
		const acc = Orbs.createAccount()
		const exampleJsonBook = "[" + fs.readFileSync(`${__dirname}/books/9300.json`).toString() + "]"
		const receipt = await bookIndex.dumpBooks(exampleJsonBook)

		const result = await bookIndex.returnUpdate(0)
		expect(result.outputArguments[0].value).to.be(exampleJsonBook.toString())
	})

	it("should dump multiple books and retreive the same", async () => {
		const [bookIndex, _] = await setupContract()
		const acc = Orbs.createAccount()
		const two = 2
		var exampleJsonBooks = "[" + fs.readFileSync(`${__dirname}/books/9300.json`).toString() + ","
		exampleJsonBooks += fs.readFileSync(`${__dirname}/books/9406.json`).toString() + "]"
		
		const receipt = await bookIndex.dumpBooks(exampleJsonBooks)
		expect(receipt.executionResult).to.be("SUCCESS")

		const counter = await bookIndex.getCounter()
		expect(Number(counter.outputArguments[0].value)).to.be(two)

		const ret = await bookIndex.returnUpdate(0)
		expect(ret.outputArguments[0].value).to.be(exampleJsonBooks)
	})

	it("should dump books even if it is not empty and retreive the same", async () => {
		const [bookIndex, _] = await setupContract()
		const acc = Orbs.createAccount()
		const exampleJsonBook = "[" + fs.readFileSync(`${__dirname}/books/9300.json`).toString() + "]"
		const secondBook = "[" + fs.readFileSync(`${__dirname}/books/9406.json`).toString() + "]"
		const two = 2
		const expectedJson = "[" + fs.readFileSync(`${__dirname}/books/9300.json`).toString()
								 + fs.readFileSync(`${__dirname}/books/9406.json`).toString() + "]"


		await bookIndex.dumpBooks(exampleJsonBook)
		const result = await bookIndex.dumpBooks(secondBook)
		expect(result.executionResult).to.be("SUCCESS")

		const counter = await bookIndex.getCounter()
		expect(Number(counter.outputArguments[0].value)).to.be(two)

		const ret = await bookIndex.returnUpdate(0)
		//expect(ret.outputArguments[0].value).to.be(expectedJson)
	})

	it("starts off the counter from 0", async () => {
		const [bookIndex, _] = await setupContract()
		const acc = Orbs.createAccount()
		const zero = 0

		const result = await bookIndex.getCounter()
		expect(Number(result.outputArguments[0].value)).to.be(zero)
	})

	it("counts the number of books in the registry and returns the correct number", async () => {
		const [bookIndex, _] = await setupContract()
		const acc = Orbs.createAccount()
		var exampleJsonBooks = "[" + fs.readFileSync(`${__dirname}/books/9300.json`).toString() + ","
		exampleJsonBooks += fs.readFileSync(`${__dirname}/books/9406.json`).toString() + "]"
		await bookIndex.dumpBooks(exampleJsonBooks)
		const two = 2

		const result = await bookIndex.getCounter()
		expect(Number(result.outputArguments[0].value)).to.be(two)
	})
})
