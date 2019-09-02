var AWS = require("aws-sdk");
const fs = require("fs");
const bookIndex = require("./bookIndex");

AWS.config.region = "us-east-2";
var cred = new AWS.SharedIniFileCredentials({ profile: "default" });
AWS.config.update({ credentials: cred });

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

// upload a new book to dynamodb
async function uploadBook(id, title) {
	item = {
		TableName: "BookRegistry",
		Item: { Id: id, Title: title }
	};

	await ddb.put(item, (err, _) => {
		if (err) {
			console.log(err);
		}
	});
}

// scan for the books with title in dynamo db
function searchBook(title, callback) {
	var params = {
		TableName: "BookRegistry",
		ExpressionAttributeValues: {
			":t": title
		},
		FilterExpression: "contains (Title, :t)",
		ProjectionExpression: "Id, Title"
	};

	ddb.scan(params, (err, data) => {
		if (err) {
			console.log(err);
		} else {
			callback(data);
		}
	});
}

module.exports = {
	uploadBook,
	searchBook
};
