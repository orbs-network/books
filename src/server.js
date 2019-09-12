const http = require("http");
const fs = require("fs")
const url = require("url")
const dynamo = require("./dynamo")

http.createServer(async (req, res) => {
	webUrl = url.parse(req.url)
	if(req.url == "/"){
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(fs.readFileSync("./src/webui/index.html").toString())
		res.end()
	}else if(req.url == "/background.png"){
		res.writeHead(200, {'Content-Type': 'image/png'});
		res.end(fs.readFileSync("./background.png"), 'binary')
	}else if(req.url == "/orbs-client-sdk-web.js"){
		res.writeHead(200, {'Content-Type': 'text/javascript'})
		res.write(fs.readFileSync("./node_modules/orbs-client-sdk/dist/orbs-client-sdk-web.js"))
		res.end()
	}else if(req.url == "/webClient.js"){
		res.writeHead(200, {'Content-Type': 'text/javascript'})
		res.write(fs.readFileSync("./src/webClient.js"))
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
			dynamo.searchBook(getParams(webUrl.query), writeTable, res, getParams(webUrl.query))
		}
	}else{
		res.end()
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

function writeTable(data, args){
	res = args[0]
	params = args[1]
	ret = `
		<html>
			<head>
				<title>Orbs Book Registry</title>
				<link rel='stylesheet' href='https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css' integrity='sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T' crossorigin='anonymous'>
			</head>
			<body style='text-align: center; background-image: url(\"background.png\"); background-color: rgb(0,0,50)'>
				<div style='color: white'>
					<h1 style='text-align: center'>Orbs Book Registry Project</h1>
					<div style='height: 30%'>
						<h3 style='height: 20%'>Books that match Title: '${params.title}' and Author: '${params.Author}'</h3>
						<div style='height: 60%'>
							<button style='vertical-align: middle' class='btn btn-primary' onclick='window.location.href=\"/\"'>Search again</button>
						</div>
					</div>
					<table style='text-align: center; color: white' id='result' class='table table-dark table-hover table-bordered'>
						<thead class='thead-dark'>
							<th>Orbs Rgistry Book ID</th>
							<th>Author</th>
							<th>Title</th>
							<th>Publication Date</th>
							<th>Publisher</th>
						</thead>
	`
						for(i = 0; i < data.Items.length; i++){
							ret += "<tr onclick='displayBook(" + data.Items[i].Id + ")'><td>" + data.Items[i].Id + "</td>"
							ret += "<td>" + data.Items[i].Author + "</td>"
							ret += "<td>" + data.Items[i].Title + "</td>"
							ret += "<td>" + data.Items[i].Issued + "</td>"
							ret += "<td>" + data.Items[i].Publisher + "</td></tr>"
						}

	ret += `
					</table>
					<p style='text-align: center; height: 20%'>Found ${data.Count} items out of ${data.ScannedCount}</p>
				</div>
			</body>
			<script src='orbs-client-sdk-web.js'></script>
			<script src='webClient.js'></script>
			<script>
				window.onload = () => {
					init()
				}	
			</script>
		</html>
	`
	
	res.write(ret)
	res.end()
}
