package main

import (
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	"strconv"
	"encoding/json"
)

// type declarations for JSON parsing
type FileFormat struct {
	Link string
	Format []string
}

type book struct {
	ID uint64
	Author string
	FileFormats []FileFormat
	Issued string
	Language string
	Link string
	Publisher string
	Rights string
	Subjects []string
	Title string
}

var PUBLIC = sdk.Export(registerBooks, getBooks, totalBooks)
var SYSTEM = sdk.Export(_init)

var COUNTER_KEY = []byte("counter")

func _init(){

}

// returns the number of books in the registry, it is also the counter
func totalBooks() uint64 {
	return state.ReadUint64(COUNTER_KEY)
}

// TODO should require some kind of auth
// register multiple books to the contract's storage
func registerBooks(payload string) string {
	var books []book
	err := json.Unmarshal([]byte(payload), &books)
	if err != nil{
		panic(err)
	}

	initTotalBooks := totalBooks()

	var ret []uint64
	for i, b := range books {
		if !_isValidBook(b) {
			panic("not a valid json array of books")
		}
		_insertBook(b)
		ret = append(ret, uint64(i) + initTotalBooks)
	}

	// return a json array because []uint64 is not supported
	booksRet, err := json.Marshal(ret)
	if err != nil {
		panic(err)
	}

	return string(booksRet)
}

// get all new book entries since some given entry
func getBooks(start uint64, limit uint64) string {
	// make sure the server is requesting valid adresses
	counter := state.ReadUint64(COUNTER_KEY)
	if start > counter {
		// panic if the address requested is invalid
		panic("the last entry the server counter must be lower than the current number of books")
	}

	// no new books were added
	if start == counter{
		return ""
	}

	// init all the books
	var books []book
	var ret []byte
	for i := uint64(0); i < limit && i < counter; i++ {
		// read raw book json and append it to
		// TODO get rid of corrupt json data
		a := _getBook(uint64(i + start))
		// create an object array
		books = append(books, a)
	}

	// convert the object array to json array
	ret, err := json.Marshal(books) 
	if err != nil {
		panic(err)
	}

	// return the new json array of books that were added
	return string(ret)
}

// returns a single book
func _getBook(i uint64) (b book) {
	rawBytes := state.ReadBytes(_bookId(i))

	err := json.Unmarshal(rawBytes, &b)
	if err != nil{
		panic(err)
	}

	return
}

func _bookId(i uint64) []byte {
	return []byte(strconv.FormatUint(i, 10))
}

// insert to the contract a new book
func _insertBook(b book){
	// get the last address with a book
	counter := state.ReadUint64(COUNTER_KEY)
	b.ID = counter

	// write to that address the JSON format of the book
	payload, err := json.Marshal(b)
	if err != nil {
		panic("error converting object to json")
	}
	state.WriteBytes([]byte(strconv.FormatUint(counter, 10)), payload)
	
	// increase the total number of books by 1, will also increase our next address by one	
	state.WriteUint64(COUNTER_KEY, counter + 1)
}

// makes sure the json is a valid book json
func _isValidBook(v book) bool {
	if v.Author == "" {
		return false
	}
	if v.FileFormats == nil {
		return false
	}
	if v.Issued == ""{
		return false
	}
	if v.Language == "" {
		return false
	}
	if v.Link == "" {
		return false
	}
	if v.Publisher == "" {
		return false
	}
	if v.Rights == "" {
		return false
	}
	if v.Subjects == nil {
		return false
	}
	if v.Title == ""{
		return false
	}
	return true
}
