# Orbs Book Registry Project

The Orbs Book Registry Project is a Public Domain book registring service built on top of Orbs' blockchain infrastructure.
The purpose of this project is to publicaly verify metadata about books that are registered on the Public Domain.

## System architecture

The System consists of one main smart contract that logs all Public Domain books.
Servers can download metadata about Public Domain books and then serve it to clients.
The servers periodically check for new books that were registered on the smart contract and update their database accordingly.

## Adding and Updating the Registry

Everyone can add a new book or a new version of book that already exists. There is a set of curators that can remove books or version of a book from the registry.

## Client interface reference

### Importing the client interface

```js
const { BookIndex } = require("orbs-book-registry")
```

### Initializing a BookIndex client

```js
const Orbs = require("orbs-client-sdk")
const { BookIndex } = require("orbs-book-registry")

const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET)
const account = Orbs.createAccount()

bookIndex = new BookIndex(account, client, contractName)
```

The `BookIndex` constructor initiates the smart contract client (it does not deploy it to the Orbs network)

`BookIndex` constructor takes in as parameters:
* `account`: the Orbs account that will send all smart contract interaction transactions.
* `client`: the Orbs client object that connects to the network.
* `name`: the name the `BookIndex` contract was deployed with.

### Registering new books

The contract will only register new books that comply with the JSON format of the contract struct `book`.

Here is the structure of a valid book JSON format.
```js
{
	"Author": ...,
	"Issued": ...,
	"Language": ...,
	"Publishers": [
		{
			"Name": ...,
			"MetadataLink": ...,
			"FileVersions": [
				"Link": ...,
				"Format": ...,
			], ...
		}
	],
	"Rights": ...,
	"Subjects": [...],
	"Title": ...
}
```

To learn more about the [JSON format](parser/README.md).

---

To register new books you can use the `BookIndex.registerBooks()`:

```js
const ids = await bookIndex.registerBooks(books)
```

The `BookIndex.registerBooks()` function takes in as parameters:
* `books`: a single book object satisfying the JSON format, or an array of book objects.

and returns:
* an array of book ids that were added to the smart contract's state.

### Retrieving books' metadata

To retrieve a single books' metadata you can use `bookIndex.getBook()`:

```js
const books = await bookIndex.getBook(id)
```

The `BookIndex.getBook()` function takes in as parameters:
* `id`: the id of the book to retrieve

and returns:
* a book object that was retrieved

To retrieve multiple books' metadata you can use `BookIndex.getBooks()`:

```js
const books = await bookIndex.getBooks(start, limit)
```

The `BookIndex.getBooks()` function takes in as parameters:
* `start`: the bookId from which to start retrieve book objects.
* `limit`: the maximum number of books to retrieve.

and returns:
* an array of book objects that were retrieved.

---

Note: if you request to download a book that does not exist both functions will return

```js
Error("no such book id")
```

### Getting the total number of books that were registered

To get the total number of books that were registered you can use `BookIndex.totalBooks()`:

```js
const totalBooks = await bookIndex.totalBooks()
```

### Errors

All functions will return an `Error` if the Orbs transaction will return an error,
this can be caused because the contract was not deployed or the transaction was not executed successfuly.

## Testing this project

Running tests requires [gamma-cli](https://github.com/orbs-network/gamma-cli) - Orbs local blockchain.

```
npm test
```
