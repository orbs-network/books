var client = {}
var account = {}
ORBS_NODE_ADDRESS = "https://node1.demonet.orbs.com/vchains/1000"
ORBS_VCHAIN = 1000

function init(){
	const endpoint = ORBS_NODE_ADDRESS || "http://localhost:8080";
	const chain = Number(ORBS_VCHAIN) || 42;
	client = new Orbs.Client(
		endpoint,
		chain,
		Orbs.NetworkType.NETWORK_TYPE_TEST_NET
	);
	account = Orbs.createAccount()
}

async function getBook(id){
	const [tx, _] = client.createTransaction(
		account.publicKey,
		account.privateKey,
		"BookDemo01",
		"getBooks",
		[Orbs.argUint64(id), Orbs.argUint64(1)]
	);

	const result = await client.sendTransaction(tx);

	if (result.executionResult != "SUCCESS") {
		if (result.outputArguments[0].value == "no such book id") {
			return new Error("no such book id");
		}
		return new Error(result.outputArguments[0].value);
	}

	if (result.outputArguments[0].value == "") {
		return null;
	}

	return JSON.parse(result.outputArguments[0].value)[0];
}

async function displayBook(bookId){
	book = await getBook(bookId)

	// YES YES POSSIBLE XSS attack if someone publishes to smart contract <scriptbook>
	ret = `
		<div style="color: white">
			<h1 style="text-align: center">Orbs Book Registry Project</h1>
			<br>
			<h4 style="text-align: center">This is the Orbs Book Registry project.<br>Its main goal is to register and verify Public Domain Books on the Orbs blockchain.<br>You can search for books on this page.</h4>
			<br>
			<br>
			<p>Title: ${book.Title}</p>
			<p>Author: ${book.Author}</p>
			<p>Publication Date: ${book.Issued}</p>
			`
			for(i = 0; i < book.Publishers.length; i++){
				ret += `
				<table class='table table-bordered'>
					<tr>
						<p>Publisher: ${book.Publishers[i].Name}</p>
						<a href='${book.Publishers[i].MetadataLink}'>Link to book on Publisher's website</p>`
						for(j = 0; j < book.Publishers[i].FileVersions.length; j++){
							ret += `
								<a href='${book.Publishers[i].FileVersions[j].Link}'>book in ${book.Publishers[i].FileVersions[j].Format.join(" ")} format</a>
								<br>
							`
						}
					ret += `	
					</tr>
				</table>
				<br>
				`
			}
	ret +=  `
			<p>Regisrty ID: ${bookId}</p>
		</div>
		<style>
			a {
				color: white;
			}
		</style>
	`

	document.body.innerHTML = ret
}