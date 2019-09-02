const http = require("http");
const fs = require("fs")
const url = require("url")
const uploader = require("./uploader")
const dynamo = require("./dynamo")

http.createServer(async (req, res) => {
	webUrl = url.parse(req.url)
	if(req.url == "/"){
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(fs.readFileSync("./src/webui/index.html").toString())
		res.end()
	}else if(webUrl.pathname == "/search"){
		res.writeHead(200, {'Content-Type': 'text/html'});
		if(webUrl.query == null){
			// TODO styliz
			res.write("Error, query is invalid")
			res.end()
		}else if(!getParams(webUrl.query)){
			// TODO stylize
			res.write("Error, query is invalid")
			res.end()
		}else{
			dynamo.searchBook(getParams(webUrl.query), writeToRes, res)
		}
	}

}).listen(5050)

function getParams(query){
	if(!query) return null
	params = query.split("&")
	if(params == [""])return null

	var ret = {};
	for(i = 0; i < params.length; i++){
		ret[params[i].split("=")[0]] = params[i].split("=")[1]
	}

	return ret
}

// TODO stylize the search results
function writeToRes(data, args){
	res = args[0]
	res.write(JSON.stringify(data))
	res.end()
}
