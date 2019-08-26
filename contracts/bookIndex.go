package main

import (
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/address"
	"strconv"
	"encoding/json"
	"bytes"
)

// TODO add ISBN and other format IDs
// TODO addPublisher, removePublisher(_onlyCurator)
// TODO addFileVersion, removeFileVersion(_onlyCurator)

// type declarations for JSON parsing
type FileVersion struct {
	Link string
	Format []string
}

type Publisher struct {
	Name string
	MetadataLink string
	FileVersions []FileVersion
}

type book struct {
	ID uint64
	Author string
	Issued string
	Language string
	Publishers []Publisher
	Rights string
	Subjects []string
	Title string
}

var PUBLIC = sdk.Export(registerBooks, getBooks, totalBooks, getOwner, changeOwner, addCurator, removeCurator)
var SYSTEM = sdk.Export(_init)

var COUNTER_KEY = []byte("counter")
var OWNER_KEY = []byte("owner")
var CURATOR_KEY = []byte("curator.")

func _init(){
	state.WriteBytes(OWNER_KEY, address.GetSignerAddress())
}

// return the current owner's address
func getOwner() []byte {
	return state.ReadBytes(OWNER_KEY)
}

// changes the current owner's address
func changeOwner(newOwner []byte){
	_onlyOwner()
	address.ValidateAddress(newOwner)
	state.WriteBytes(OWNER_KEY, newOwner)
}

// add a new curator to the list
func addCurator(newCurator []byte){
	_onlyOwner()
	address.ValidateAddress(newCurator)
	state.WriteUint32(append(CURATOR_KEY, newCurator...), 0xffffffff)
}

func removeCurator(curator []byte){
	_onlyOwner()
	address.ValidateAddress(curator)
	state.Clear(append(CURATOR_KEY, curator...))
}

// returns the number of books in the registry, it is also the counter
func totalBooks() uint64 {
	return state.ReadUint64(COUNTER_KEY)
}

// register multiple books to the contract's storage
func registerBooks(payload string) string {
	_onlyOwner()

	var books []book
	err := json.Unmarshal([]byte(payload), &books)
	if err != nil{
		panic(err)
	}

	initTotalBooks := totalBooks()

	// insert book one by one
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
	counter := totalBooks()
	if start > counter {
		// panic if the address requested is invalid
		panic("no such book id")
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

// restricts the execution of this to only the owner of this contract
func _onlyOwner(){
	if !bytes.Equal(address.GetSignerAddress(), getOwner()) {
		panic("this function is restricted!")
	}
}

// restricts the execution of this to only a member of the curator list
func _onlyCurator(){
	if state.ReadUint32(append(CURATOR_KEY, address.GetSignerAddress()...)) != 0xffffffff {
		panic("this function is restricted!")
	}
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

// returns a byte representation of a uint64
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
	if v.Issued == ""{
		return false
	}
	if v.Language == "" {
		return false
	}
	if v.Publishers == nil {
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
