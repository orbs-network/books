const expect = require("expect.js");
const fs = require("fs");
const rdfParser = require("../parser/rdfParser");

describe("the rdf to json converter", () => {
  it("converts rdf file to json file", async () => {
    const validRDFfilePath = "/Users/gil/Downloads/cache/epub/9300/pg9300.rdf";
    expect(rdfParser.fileToJson).withArgs(validRDFfilePath).to.not.throwException();
  });

  it("throws if file does not exist", async () => {
    expect(rdfParser.fileToJson).withArgs("").to.throwError();
  });
});
