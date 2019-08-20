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
	Format interface{}
}

type book struct {
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

var PUBLIC = sdk.Export(dumpBooks, returnUpdate, getCounter)
var SYSTEM = sdk.Export(_init)

var COUNTER_KEY = []byte("counter")

// TODO
// dumpBook() should require some kind of auth

func _init(){
	state.WriteUint64(COUNTER_KEY, 0)
}

// returns the number of books in the registry, it is also the counter
func getCounter() uint64 {
	return state.ReadUint64(COUNTER_KEY)
}

// makes sure the json is a valid book json
func _validBook(payload string) bool {
	var books []book
	
	// make sure it is a json array
	if (payload[0] != '[') || (payload[len(payload)-1] != ']') {
		return false
	}

	// get the object
	err := json.Unmarshal([]byte(payload), &books)
	if err != nil{
		return false
	}

	// make sure all fileds are not empty
	for _, v := range books {
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
	}
	return true
}

// insert to the contract a new book
func _updateBook(b book){
	// get the last address with a book
	counter := state.ReadUint64(COUNTER_KEY)

	// write to that address the JSON format of the book
	payload, err := json.Marshal(b)
	if err != nil {
		panic("error converting object to json")
	}
	state.WriteBytes([]byte(strconv.FormatUint(counter, 10)), payload)
	
	// increase the total number of books by 1, will also increase our next address by one	
	state.WriteUint64(COUNTER_KEY, counter + 1)
}

// TODO should require some kind of auth
// dump multiple books to the contract's storage
func dumpBooks(payload string){
	var books []book

	if !_validBook(payload){
		panic("not a valid json array of books")
	}

	err := json.Unmarshal([]byte(payload), &books)
	
	if err != nil{
		panic(err)
	}
	
	for _, v := range(books) {
	 	_updateBook(v)
	}
}

//get all new book entries since some given entry
// TODO lastEntry, limit
func returnUpdate(lastEntry uint64) string {
	// make sure the server is requesting valid adresses
	counter := state.ReadUint64(COUNTER_KEY)
	if lastEntry > counter {
		// panic if the address requested is invalid
		panic("the last entry the server counter must be lower than the current number of books")
	}

	// no new books were added
	if lastEntry == counter{
		return ""
	}

	// init all the books
	var books []book
	var ret []byte
	for i := lastEntry; i < counter; i++ {
		// read raw book json and append it to
		// TODO get rid of corrupt json data
		a := _getBook(uint64(i))
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

func _getBook(i uint64) (b book) {
	rawBytes := state.ReadBytes(_bookId(i))
	println("retrieving", _bookId(i))
	err := json.Unmarshal(rawBytes, &b)
	if err != nil{
		panic(err)
	}

	return
}

func _bookId(i uint64) []byte {
	return []byte(strconv.FormatUint(i, 10))
}