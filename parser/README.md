# Book Registry JSON Format

This JSON format is defining a general eBook's metadata. It is designed to bridge between most public eBooks libraries data formats.

## The Format

The format's requirements are to have a book's metadata with links to download the book itself from different sources.

- `Author`: `string` - The author of this book.
- `Issued`: `string` - The date that this book was published on.
- `Language`: `string` - The language this book is written in.
- `Publishers`: `Publisher[]` - an array containing all the publisher of this book. each `Publisher` contains a `Name`: `string`, `MetadataLink`: `string` and `FileVersions` array of object containing a `Link`: `string` and `Format`: `string` format type.
- `Rights`: `string` - The rights or license which this book was published under.
- `Subjects`: `string[]` - An array of strings that this book is about, can also be categories.
- `Title`: `string` - The title of this book.

---

## Metadata Extraction & Parsing

Currently this project supports the [Project Gutenberg Public Domain Library](http://www.gutenberg.org/wiki/Main_Page). They provide a [full dataset](http://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.zip) of all the books they provide. This dataset is in RDF format and a [parser](rdfParser.js) exsists that converts the Project Gutenberg RDF format to this JSON format.

This project also supports the [HathiTrust Digital Library](https://www.hathitrust.org/). They provide a [full dataset]() of all the books they provide. This dataset is in tab delimited format and a [parser]() exists that converts the HathiTrust tab delimited format to this JSON format.

Note: some fields are empty as they were not provided in the datasets. you can always add a value to a missing field with the [client API](README.md).

## RDF Parser

### Importing the RDF Parser

```js
const rdfParser = require("rdfParser");
```

### Converting a String to JSON Format

To convert any string of RDF format to the JSON format you can use the `rdfParser.toJson()`:

```js
const jsonString = rdfParser.toJson(payload);
```

The `rdfParser.toJson()` function takes in as parameters:

- `payload`: the rdf payload to convert to the JSON format.

and returns:

- a JSON string representing the book from RDF format.

### Converting a File to JSON Format

To convert the contents of an RDF file to the JSON format you can use the `rdfParser.fileToJson()`:

```js
const jsonString = rdfParser.fileToJson(filePath);
```

The `rdfParser.toJson()` function takes in as parameters:

- `filePath`: the file path to the rdf file to convert to the JSON format.

and returns:

- a JSON string representing the book from RDF format.
