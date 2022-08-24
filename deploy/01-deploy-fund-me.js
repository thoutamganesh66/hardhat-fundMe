//imports
//main function
// calling of main function
/*
    But in hardhat deploys we are not going to have main function
    hence no calling of main function as well
*/
/*
function deployFunc(hre) {
	console.log("hello");
}

module.exports.default = deployFunc;
*/

// module.exports = async (hre) => {
// 	const { getNamedAccounts, deployments } = hre;
// 	//hre.getNamedAccounts()
// 	// hre.deployments
// };

const {
	networkConfig,
	developmentChains,
} = require("../helper-hardhat-config");
/*  above line is same as:
    const helperConfig = require("../heper-hardhat-config");
    const networkConfig = helperConfig.networkConfig;
*/
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;

	//if chainId is X , use address Y
	//if chainId is Z , use address A
	// const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
	console.log(`chainId: ${chainId}`);
	let ethUsdPriceFeedAddress;
	if (developmentChains.includes(network.name)) {
		const ethUsdAggregator = await deployments.get("MockV3Aggregator");
		ethUsdPriceFeedAddress = ethUsdAggregator.address;
	} else {
		console.log("deployingg to chainId 4");
		ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
	}

	//what happens when we want to change chains??
	//when going for localhost or hardhat network we want to use a mock

	const args = [ethUsdPriceFeedAddress];
	const fundMe = await deploy("FundMe", {
		from: deployer,
		args: args,
		log: true,
		waitConfirmations: network.config.blockConfirmations || 1,
	});

	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		//verify
		await verify(fundMe.address, args);
	}
	log("----------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
