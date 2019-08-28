const Orbs = require("orbs-client-sdk");
const expect = require("expect.js");
const fs = require("fs");
const { BookIndex } = require("../src/bookIndex");

const endpoint = process.env.ORBS_NODE_ADDRESS || "http://localhost:8080";
const chain = Number(process.env.ORBS_VCHAIN) || 42;
const client = new Orbs.Client(
	endpoint,
	chain,
	Orbs.NetworkType.NETWORK_TYPE_TEST_NET
);

function getContractCode(contractName) {
	return fs.readFileSync(`${__dirname}/../contracts/` + contractName);
}

async function deploy(acc, code, contractName) {
	const [tx, txid] = client.createTransaction(
		acc.publicKey,
		acc.privateKey,
		"_Deployments",
		"deployService",
		[Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)]
	);
	return await client.sendTransaction(tx);
}

async function setupContract() {
	const acc = Orbs.createAccount();
	const bookIndex = new BookIndex(
		acc,
		client,
		`bookIndex.${new Date().getTime()}`
	);
	const deployResp = await deploy(
		acc,
		getContractCode("bookIndex.go"),
		bookIndex.name
	);
	return [bookIndex, deployResp];
}

function getExampleBook(gutenbergId) {
	return JSON.parse(
		fs.readFileSync(`${__dirname}/books/${gutenbergId}.json`).toString()
	);
}

function getExampleBookWithId(gutenbergId, id) {
	const exampleBook = getExampleBook(gutenbergId);
	exampleBook.ID = id;
	return exampleBook;
}

describe("the book index", () => {
	it("deploys successfully", async () => {
		const [_, deployResp] = await setupContract();
		expect(deployResp.executionResult).to.be("SUCCESS");
	});

	it("registers and retrieves books", async () => {
		const [bookIndex, _] = await setupContract();

		// insert two books
		const result = await bookIndex.registerBooks([getExampleBook(9300)]);
		expect(result).to.be.eql([0]);

		const result1 = await bookIndex.registerBooks([getExampleBook(9406)]);
		expect(result1).to.be.eql([1]);

		// invalid json, returns an error
		const result2 = await bookIndex.registerBooks([getExampleBook(-1)]);
		expect(result2).to.be.a(Error);

		// no new books to add
		const resul2 = await bookIndex.getBooks(2, 2);
		expect(resul2).to.be(null);

		// return the same book object with an ID
		const result3 = await bookIndex.getBook(0);
		const exampleBookWithId = getExampleBookWithId(9300, 0);
		expect(result3).to.be.eql(exampleBookWithId);

		// return error if id is not found
		const result4 = await bookIndex.getBook(3);
		expect(result4).to.be.eql(Error("no such book id"));
	});

	it("batch registers books and retrieves books", async () => {
		const [bookIndex, _] = await setupContract();
		const two = 2;

		const result = await bookIndex.registerBooks([
			getExampleBook(9300),
			getExampleBook(9406)
		]);
		expect(result).to.be.eql([0, 1]);

		const counter = await bookIndex.totalBooks();
		expect(counter).to.be(two);

		const ret = await bookIndex.getBooks(0, 2);
		expect(ret[0]).to.be.eql(getExampleBookWithId(9300, 0));
		expect(ret[1]).to.be.eql(getExampleBookWithId(9406, 1));
	});

	it("adds a publisher and version", async () => {
		const [bookIndex, _] = await setupContract();
		const books = await bookIndex.registerBooks([
			getExampleBook(9300),
			getExampleBook(9406)
		]);

		const publisher = {
			Name: "John Doe",
			FileVersions: [
				{
					Link: "Hello World",
					Format: ["Hello Format"]
				}
			],
			MetadataLink: "Meta Hello"
		};

		// add a publisher to a book
		const result = await bookIndex.addPublisherToBook(0, publisher);
		expect(result).to.not.be.an(Error);
		const result1 = await bookIndex.getBook(0);
		book = getExampleBookWithId(9300, 0);
		book.Publishers.push(publisher);
		expect(result1).to.be.eql(book);

		const version = {
			Link: "Hello world",
			Format: ["Hello Book"]
		};

		// add a version to a book
		const result2 = await bookIndex.addFileVersionToBook(
			0,
			publisher.Name,
			version
		);
		expect(result2).to.not.be.an(Error);
		book = getExampleBookWithId(9300, 0);
		book.Publishers.push(publisher);
		book.Publishers[1].FileVersions.push(version);
		const result3 = await bookIndex.getBook(0);

		expect(result3).to.be.eql(book);
	});

	it("rejects publisher and version addition that already exist", async () => {
		const [bookIndex, _] = await setupContract();
		const books = await bookIndex.registerBooks([
			getExampleBook(9300),
			getExampleBook(9406)
		]);
		const publisher = {
			Name: "John Doe",
			FileVersions: [
				{
					Link: "Hello World",
					Format: ["Hello Format"]
				}
			],
			MetadataLink: "Meta Hello"
		};

		// reject publisher that already exists
		await bookIndex.addPublisherToBook(0, publisher);
		const result = await bookIndex.addPublisherToBook(0, publisher);
		expect(result).to.be.eql(
			Error("this publisher already exists for this book")
		);

		const version = {
			Link: "Hello world",
			Format: ["Hello Format"]
		};

		// reject version that already exists
		await bookIndex.addFileVersionToBook(0, publisher.Name, version);
		const result1 = await bookIndex.addFileVersionToBook(
			0,
			publisher.Name,
			version
		);
		expect(result1).to.be.eql(
			Error("this publisher already exists for this book")
		);
	});

	it("removes a publisher or version only by a curator", async () => {
		const [bookIndex, _] = await setupContract();
		const owner = bookIndex.account;
		const books = await bookIndex.registerBooks([
			getExampleBook(9300),
			getExampleBook(9406)
		]);
		const publisher = {
			Name: "John Doe",
			FileVersions: [
				{
					Link: "Hello World",
					Format: ["Hello Format"]
				},
				{
					Link: "Bye World",
					Format: ["Bye Format"]
				}
			],
			MetadataLink: "Meta Hello"
		};
		await bookIndex.addPublisherToBook(0, publisher);

		const curator = Orbs.createAccount();
		await bookIndex.addCurator(curator.address);

		// reject remove not by curator
		const result = await bookIndex.removePublisherFromBook(0, publisher.Name);
		expect(result).to.be.eql(Error("this function is restricted!"));

		// accept remove by curator
		bookIndex.account = curator;
		const result1 = await bookIndex.removePublisherFromBook(0, publisher.Name);
		expect(result1).to.not.be.an(Error);

		// reject remove not by curator
		bookIndex.account = owner;
		const result2 = await bookIndex.removeFileVersionFromBook(
			0,
			publisher.Name,
			"Bye World"
		);
		expect(result2).to.be.eql(Error("this function is restricted!"));

		// accept remove by curator
		bookIndex.account = curator;
		const result3 = await bookIndex.removeFileVersionFromBook(
			0,
			getExampleBook(9300).Publishers[0].Name,
			"Bye World"
		);
		expect(result3).to.not.be.an(Error);
	});

	it("counts the number of books in the registry", async () => {
		const [bookIndex, _] = await setupContract();
		const zero = 0;
		const two = 2;

		const result = await bookIndex.totalBooks();
		expect(result).to.be(zero);

		await bookIndex.registerBooks([getExampleBook(9300), getExampleBook(9406)]);
		const result1 = await bookIndex.totalBooks();
		expect(result1).to.be(two);
	});

	it("manages the owner of the contract", async () => {
		const [bookIndex, _] = await setupContract();

		// returns the owner
		const result = await bookIndex.getOwner();
		expect(result).to.be.eql(bookIndex.account.address.toLowerCase());

		// change the owner
		const acc = Orbs.createAccount();
		await bookIndex.changeOwner(acc.address);
		const owner = await bookIndex.getOwner();
		expect(owner).to.be(acc.address.toLowerCase());

		// rejects owner changes without owner permission
		bookIndex.account = Orbs.createAccount();
		const result1 = await bookIndex.changeOwner(acc.address);
		expect(result1).to.be.eql(Error("this function is restricted!"));
	});

	it("manages curators", async () => {
		const [bookIndex, _] = await setupContract();

		curator = Orbs.createAccount();
		const result = await bookIndex.addCurator(curator.address);
		expect(result).to.not.be.an(Error);

		const result1 = await bookIndex.removeCurator(curator.address);
		expect(result).to.not.be.an(Error);
	});

	it("owner restricts curator functions", async () => {
		const [bookIndex, _] = await setupContract();

		curator = Orbs.createAccount();
		bookIndex.account = Orbs.createAccount();
		const result = await bookIndex.addCurator(curator.address);
		expect(result).to.be.an(Error);

		const result1 = await bookIndex.removeCurator(curator.address);
		expect(result).to.be.an(Error);
	});

	it("removes empty entries", async () => {
		const [bookIndex, _] = await setupContract();
		const owner = bookIndex.account
		const curator = Orbs.createAccount()
		await bookIndex.addCurator(curator.address)

		const books = await bookIndex.registerBooks([
			getExampleBook(9300),
			getExampleBook(9406)
		]);
		const publisher = {
			Name: "John Doe",
			FileVersions: [
				{
					Link: "Hello World",
					Format: ["Hello Format"]
				}
			],
			MetadataLink: "Meta Hello"
		};

		// remove a publisher by removeing a file version
		bookIndex.account = curator
		await bookIndex.addPublisherToBook(0, publisher);
		await bookIndex.removeFileVersionFromBook(0, publisher.Name, "Hello World")

		const result = await bookIndex.getBook(0)
		expect(result).to.be.eql(getExampleBookWithId(9300, 0))
	
		// remove a book by removing a publisher
		await bookIndex.removePublisherFromBook(0, result.Publishers[0].Name)
		const result1 = await bookIndex.getBook(0)
		expect(result1).to.be.eql(Error("this book was removed"))

		// still returns next book
		const result2 = await bookIndex.getBook(1)
		expect(result2).to.be.eql(getExampleBookWithId(9406, 1))

		// be able to add new book and retrieve it
		await bookIndex.registerBooks([getExampleBook(9300)])
		const result3 = await bookIndex.getBook(2)
		expect(result3).to.be.eql(getExampleBookWithId(9300, 2))

		// return the correct amount of books
		bookIndex.account = owner
		const result4 = await bookIndex.totalBooks()
		expect(result4).to.be(2)

		// restricts removeBook to curators
		const result5 = await bookIndex.removeBook(2)
		expect(result5).to.be.eql(Error("this function is restricted!"))		

		// remove the whole book
		bookIndex.account = curator
		await bookIndex.removeBook(2)
		const result6 = await bookIndex.getBook(2)
		expect(result6).to.be.eql(Error("this book was removed"))

		// return the correct amount of book
		const result7 = await bookIndex.totalBooks()
		expect(result7).to.be(1)
	})
});
