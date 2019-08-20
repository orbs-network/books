package main

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func TestJSON(t *testing.T) {
	bookJSON := `{"Author":"Barr, Robert","FileFormats":[{"Link":"http://www.gutenberg.org/files/9300/9300-h/9300-h.htm","Format":"text/html; charset=utf-8"},{"Link":"http://www.gutenberg.org/files/9300/9300-0.zip","Format":["text/plain; charset=utf-8","application/zip"]},{"Link":"http://www.gutenberg.org/files/9300/9300-8.txt","Format":"text/plain; charset=iso-8859-1"},{"Link":"http://www.gutenberg.org/files/9300/9300.zip","Format":["application/zip","text/plain; charset=us-ascii"]},{"Link":"http://www.gutenberg.org/ebooks/9300.rdf","Format":"application/rdf+xml"},{"Link":"http://www.gutenberg.org/files/9300/9300-0.txt","Format":"text/plain; charset=utf-8"},{"Link":"http://www.gutenberg.org/ebooks/9300.epub.images","Format":"application/epub+zip"},{"Link":"http://www.gutenberg.org/ebooks/9300.kindle.noimages","Format":"application/x-mobipocket-ebook"},{"Link":"http://www.gutenberg.org/ebooks/9300.kindle.images","Format":"application/x-mobipocket-ebook"},{"Link":"http://www.gutenberg.org/files/9300/9300-h.zip","Format":["application/zip","text/html; charset=utf-8"]},{"Link":"http://www.gutenberg.org/files/9300/9300.txt","Format":"text/plain; charset=us-ascii"},{"Link":"http://www.gutenberg.org/files/9300/9300-8.zip","Format":["text/plain; charset=iso-8859-1","application/zip"]},{"Link":"http://www.gutenberg.org/ebooks/9300.epub.noimages","Format":"application/epub+zip"}],"Issued":"2005-11-01","Language":"en","Link":"http://www.gutenberg.org/ebooks/9300","Publisher":"Project Gutenberg","Rights":"Public domain in the USA.","Subjects":["PS","Detective and mystery stories","Women journalists -- Fiction"],"Title":"Jennie Baxter, Journalist"}`
	require.False(t, _validBook(bookJSON))
}