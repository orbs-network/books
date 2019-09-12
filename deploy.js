const Orbs = require("orbs-client-sdk");
const fs = require("fs");

const endpoint = process.env.ORBS_NODE_ADDRESS || "http://localhost:8080";
const chain = Number(process.env.ORBS_VCHAIN) || 42;
const client = new Orbs.Client(
	endpoint,
	chain,
	Orbs.NetworkType.NETWORK_TYPE_TEST_NET
);

function getContractCode(contractName) {
	return fs.readFileSync(`${__dirname}/contracts/` + contractName);
}

async function deploy(acc, code, contractName) {
	const [tx, txid] = client.createTransaction(
		acc.publicKey,
		acc.privateKey,
		"_Deployments",
		"deployService",
		[Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)]
	);
	return await client.sendTransaction(tx);
}

async function setupContract() {
	const acc = Orbs.createAccount();
	const deployResp = await deploy(
		acc,
		getContractCode("bookIndex.go"),
		"BookDemo v0.0"
	);

	return deployResp;
}

setupContract().then(console.log, console.log)