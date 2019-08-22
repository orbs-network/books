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
  const bookIndex = new BookIndex(acc, client, `bookIndex.${new Date().getTime()}`);
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
  it("should deploy successfully", async () => {
    const [_, deployResp] = await setupContract();
    expect(deployResp.executionResult).to.be("SUCCESS");
  });

  it("should store a valid book", async () => {
    const [bookIndex, _] = await setupContract();

    const result = await bookIndex.registerBooks([getExampleBook(9300)]);
    expect(result).to.be.eql([0]);
  });

  it("should throw when an invalid json object is sent", async () => {
    const [bookIndex, _] = await setupContract();

    const result = await bookIndex.registerBooks([getExampleBook(-1)]);
    expect(result).to.be.a(Error);
  });

  it("should return no books when there are no new ones", async () => {
    const [bookIndex, _] = await setupContract();
    const books = await bookIndex.registerBooks([
      getExampleBook(9300),
      getExampleBook(9406)
    ]);

    const result = await bookIndex.getBooks(2, 2);
    expect(result).to.be(null);
  });

  it("should store and retrieve the same book", async () => {
    const [bookIndex, _] = await setupContract();
    const books = await bookIndex.registerBooks([getExampleBook(9300)]);

    const result = await bookIndex.getBooks(0, 1);
    const exampleBookWithId = getExampleBookWithId(9300, 0);
    expect(result[0]).to.be.eql(exampleBookWithId);
  });

  it("should dump multiple books and retrieve the same", async () => {
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

  it("should dump books even if it is not empty and retreive the same", async () => {
    const [bookIndex, _] = await setupContract();
    const two = 2;

    const result1 = await bookIndex.registerBooks([getExampleBook(9300)]);
    expect(result1).to.be.eql([0]);

    const result2 = await bookIndex.registerBooks([getExampleBook(9406)]);
    expect(result2).to.be.eql([1]);

    const counter = await bookIndex.totalBooks();
    expect(counter).to.be(two);

    const ret = await bookIndex.getBooks(0, 2);
    expect(ret[0]).to.be.eql(getExampleBookWithId(9300, 0));
    expect(ret[1]).to.be.eql(getExampleBookWithId(9406, 1));
  });

  it("starts off the counter from 0", async () => {
    const [bookIndex, _] = await setupContract();
    const zero = 0;

    const result = await bookIndex.totalBooks();
    expect(result).to.be(zero);
  });

  it("counts the number of books in the registry and returns the correct number", async () => {
    const [bookIndex, _] = await setupContract();
    await bookIndex.registerBooks([getExampleBook(9300), getExampleBook(9406)]);
    const two = 2;

    const result = await bookIndex.totalBooks();
    expect(result).to.be(two);
  });
});
