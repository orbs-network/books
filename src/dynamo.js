var AWS = require("aws-sdk");
const fs = require("fs");
const bookIndex = require("./bookIndex");

AWS.config.region = "us-east-2";
//var cred = new AWS.SharedIniFileCredentials({ profile: "default" });
//AWS.config.update({ credentials: cred });

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

// upload a new book to dynamodb
async function uploadBooks(id, title, author, issued, publisher) {
	item = {
		TableName: "BookRegistry",
		Item: { Id: id, Title: title, Author: author, Issued: issued, Publisher: publisher}
	};
	
	await ddb.put(item, (err, _) => {
		if (err) {
			console.log(err);
		}
	});
}

// scan for the books with title in dynamo db
function searchBook(params, callback, ...args) {
	var paramsBoth = {
		TableName: "BookRegistry",
		ExpressionAttributeValues: {
			":t": params.title,
			":a": params.author
		},
		FilterExpression: "contains (Title, :t) AND contains (Author, :a)",
		ProjectionExpression: "Id, Title, Author, Issued, Publisher"
	};
	
	var paramsAuthor = {
		TableName: "BookRegistry",
		ExpressionAttributeValues: {
			":a": params.author
		},
		FilterExpression: "contains (Author, :a)",
		ProjectionExpression: "Id, Title, Author, Issued, Publisher"
	};
	
	var paramsTitle = {
		TableName: "BookRegistry",
		ExpressionAttributeValues: {
			":t": params.title,
		},
		FilterExpression: "contains (Title, :t)",
		ProjectionExpression: "Id, Title, Author, Issued, Publisher"
	};
	
	if((params.title != "" && params.title != undefined) && (params.author != "" && params.author != undefined)){
		filter = paramsBoth
	}else if(params.title != "" && params.title != undefined){
		filter = paramsTitle
	}else if(params.author != "" && params.author != undefined){
		filter = paramsAuthor
	}else{
		return
	}
	
	ddb.scan(filter, (err, data) => {
		if (err) {
			console.log(err);
		} else {
			callback(data, args);
		}
	});
}

module.exports = {
	uploadBooks,
	searchBook
};
