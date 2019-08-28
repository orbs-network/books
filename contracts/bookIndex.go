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

var PUBLIC = sdk.Export(registerBooks,
						getBooks,
						totalBooks,
						getOwner,
						changeOwner,
						addCurator,
						removeCurator,
						addPublisherToBook,
						addFileVersionToBook,
						removeBook,
						removePublisherFromBook,
						removeFileVersionFromBook)

var SYSTEM = sdk.Export(_init)

var COUNTER_KEY = []byte("counter")
var REMOVED_KEY = []byte("removed")
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

// remove a curator from the list
func removeCurator(curator []byte){
	_onlyOwner()
	address.ValidateAddress(curator)
	state.Clear(append(CURATOR_KEY, curator...))
}

// returns the number of books in the registry, it is also the counter
func totalBooks() uint64 {
	return _getCounter() - _getRemoved()
}

// register multiple books to the contract's storage
func registerBooks(payload string) string {
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

// add a new publisher to a book in the registry
func addPublisherToBook(id uint64, publisher string){
	book := _getBook(id)

	var p Publisher
	err := json.Unmarshal([]byte(publisher), &p)
	if err != nil{
		panic(err)
	}

	// check that the publisher object is valid
	if !_isValidPublisher(p) {
		panic("not a valid Publisher object")
	}

	// check that the publisher does not exist
	if _, found := _getPublisherIndex(id, p.Name); found{
		panic("this publisher already exists for this book")
	}

	// add the new publisher
	book.Publishers = append(book.Publishers, p)
	
	// get json string
	payload, err := json.Marshal(book)
	if err != nil {
		panic("error converting object to json")
	}

	// write json data to state
	state.WriteBytes(_bookId(id), payload)
}

// add a new file version to a publisher in a book
func addFileVersionToBook(id uint64, publisherName string, version string){
	book := _getBook(id)
	
	var v FileVersion
	err := json.Unmarshal([]byte(version), &v)
	if err != nil{
		panic(err)
	}
	
	// check that the fileversion object is valid
	if !_isValidFileVersion(v) {
		panic("not a valid FileVersion object")
	}
	
	// get the pulblisher index
	index, success := _getPublisherIndex(id, publisherName)
	if !success {
		panic("no such publisher")
	}
	
	// check that this file version for this publisher for this book does not exist yet
	if _, found := _getFileVersionIndex(id, publisherName, v.Link); found{
		panic("this version already exists for this publisher for this book")
	}
	
	// get the publisher index
	book.Publishers[index].FileVersions = append(book.Publishers[index].FileVersions, v)
	
	// get json string
	payload, err := json.Marshal(book)
	if err != nil {
		panic("error converting object to json")
	}
	
	// write json data to state
	state.WriteBytes(_bookId(id), payload)
}

// a curator can remove a whole book
func removeBook(id uint64){
	_onlyCurator()
	state.WriteUint64(REMOVED_KEY, _getRemoved() + 1)
	state.Clear(_bookId(id))
}

// a curator can remove a publisher from a book entry
func removePublisherFromBook(id uint64, publisherName string){
	_onlyCurator()
	
	book := _getBook(id)
	numPublishers := len(book.Publishers)
	if index, found := _getPublisherIndex(id, publisherName); found{
		if numPublishers == 1 {
			// the book will be empty, remove it
			removeBook(id)
			return
		}
		// remove the indexth publisher
		book.Publishers = append(book.Publishers[:index], book.Publishers[index+1:]...)

		// write the new book to state
		payload, err := json.Marshal(book)
		if err != nil {
			panic("error converting object to json")
		}
		state.WriteBytes(_bookId(id), payload)
	}else{
		panic("no such publisher for this book")
	}
}

// a curator can remove a version from a bulisher from a book entry
func removeFileVersionFromBook(id uint64, publisherName string, version string){
	_onlyCurator()
	
	book := _getBook(id)

	if indexPublisher, foundPublisher := _getPublisherIndex(id, publisherName); foundPublisher{
		numVersions := len(book.Publishers[indexPublisher].FileVersions)
		if index, found := _getFileVersionIndex(id, publisherName, version); found {
			if numVersions == 1{
				removePublisherFromBook(id, publisherName)
				return
			}
			// remove indexth version
			book.Publishers[indexPublisher].FileVersions = append(book.Publishers[indexPublisher].FileVersions[:index],
																  book.Publishers[indexPublisher].FileVersions[index+1:]...)
		
			// write the new book to state
			payload, err := json.Marshal(book)
			if err != nil {
				panic("error converting object to json")
			}
			state.WriteBytes(_bookId(id), payload)
		}
	}else{
		panic("no such publisher for this book")
	}
}

// get all new book entries since some given entry
func getBooks(start uint64, limit uint64) string {
	// make sure the server is requesting valid adresses
	counter := _getCounter()
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

// return the max amount of book in the registry
func _getCounter() uint64 {
	return state.ReadUint64(COUNTER_KEY)
}

// return the amount of book removed from the registry
func _getRemoved() uint64 {
	return state.ReadUint64(REMOVED_KEY)
}

// returns a single book
func _getBook(i uint64) (b book) {
	rawBytes := state.ReadBytes(_bookId(i))

	// book was removed
	if string(rawBytes) == "" {
		panic("this book was removed")
	}

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
	state.WriteBytes(_bookId(counter), payload)
	
	// increase the total number of books by 1, will also increase our next address by one	
	state.WriteUint64(COUNTER_KEY, counter + 1)
}

// returns the (index, true) in array of the publishers with a given name, (0, false)
func _getPublisherIndex(id uint64, publisherName string) (uint64, bool) {
	book := _getBook(id)
	
	// search for the publisher
	for i, v := range(book.Publishers){
		if v.Name == publisherName {
			// found the publisher
			return uint64(i), true
		}
	}

	// publisher not found
	return 0, false
}

// returns the (index, true) in array of the file versions with a given name, (0, false)
func _getFileVersionIndex(id uint64, publisherName string, link string) (uint64, bool) {
	book := _getBook(id)

	// search for the publisher
	index, _ := _getPublisherIndex(id, publisherName)
	for i, v := range(book.Publishers[index].FileVersions){
		if v.Link == link {
			return uint64(i), true
		}
	}

	// version not found
	return 0, false
}

// makes sure the book object is a valid book object
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

// makes sure the Publisher object is a valid publisher object
func _isValidPublisher(v Publisher) bool {
	if v.Name == "" {
		return false
	}
	if v.FileVersions == nil {
		return false
	}
	if v.MetadataLink == "" {
		return false
	}
	return true
}

// makes sure the Publisher object is a valid publisher object
func _isValidFileVersion(v FileVersion) bool {
	if v.Format == nil {
		return false
	}
	if v.Link == "" {
		return false
	}
	return true
}