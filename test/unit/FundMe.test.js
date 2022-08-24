const { assert, expect } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
	? describe.skip
	: describe("FundMe", function () {
			let fundMe;
			let deployer;
			let mockV3Aggregator;
			//const sendValue = "1000000000000000000"; //1eth
			const sendValue = ethers.utils.parseEther("1");
			beforeEach(async () => {
				//deploy our fundMe contract using hardhat deploy
				// const accounts = await ethers.getSigners();
				// const accountZero = accounts[0];
				deployer = (await getNamedAccounts()).deployer;
				//fixture is used to deploy all contracts using tags
				await deployments.fixture(["all"]);
				fundMe = await ethers.getContract("FundMe", deployer);
				mockV3Aggregator = await ethers.getContract(
					"MockV3Aggregator",
					deployer
				);
			});

			describe("constructor", function () {
				it("sets the aggregaror addresses correctly", async () => {
					const response = await fundMe.getPriceFeed();
					assert.equal(response, mockV3Aggregator.address);
				});
			});

			describe("fund", function () {
				it("fails if you don't send enough funds", async () => {
					await expect(fundMe.fund()).to.be.revertedWith(
						"Min value must be 1 ETH"
					);
				});
				it("updated the amount funded data structure", async () => {
					await fundMe.fund({ value: sendValue });
					const response = await fundMe.getAddressToAmountFunded(
						deployer
					);
					assert.equal(response.toString(), sendValue.toString());
				});
				it("adds getFunder to array of getFunder", async () => {
					await fundMe.fund({ value: sendValue });
					const funder = await fundMe.getFunder(0);
					assert.equal(funder, deployer);
				});
			});

			describe("withdraw", function () {
				beforeEach(async () => {
					await fundMe.fund({ value: sendValue });
				});
				it("withdraw eth from single funder", async () => {
					//Arrange
					const startingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const startingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					//Act
					const transactionResponse = await fundMe.withdraw();
					const transactionReceipt = await transactionResponse.wait(
						1
					);

					const { gasUsed, effectiveGasPrice } = transactionReceipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const endingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					//Assert
					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingFundMeBalance
							.add(startingDeployerBalance)
							.toString(),
						endingDeployerBalance.add(gasCost).toString()
					);
				});
				it("withdraws funds from multiple getFunder", async () => {
					//Arrange
					const accounts = await ethers.getSigners();
					for (let i = 1; i < 6; i++) {
						const fundMeConnectedContract = fundMe.connect(
							accounts[i]
						);
						await fundMeConnectedContract.fund({
							value: sendValue,
						});
					}
					const startingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const startingDeployerBalance =
						await fundMe.provider.getBalance(deployer);

					//Act
					const transactionResponse = await fundMe.withdraw();
					const transactionReceipt = await transactionResponse.wait(
						1
					);
					const { gasUsed, effectiveGasPrice } = transactionReceipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const endingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					//Assert
					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingFundMeBalance
							.add(startingDeployerBalance)
							.toString(),
						endingDeployerBalance.add(gasCost).toString()
					);

					//make sure getFunder are reset properly
					await expect(fundMe.getFunder(0)).to.be.reverted;

					for (let i = 1; i < 6; i++) {
						assert.equal(
							await fundMe.getAddressToAmountFunded(
								accounts[i].address
							),
							0
						);
					}
				});

				it("only allows the owner to withdraw", async () => {
					const accounts = await ethers.getSigners();
					const attacker = accounts[1];
					const attackerConnectedContract = await fundMe.connect(
						attacker
					);
					await expect(
						attackerConnectedContract.withdraw()
					).to.be.revertedWith("FundMe__NotOwner");
				});

				it("cheaperWithdraw testing...", async () => {
					//Arrange
					const accounts = await ethers.getSigners();
					for (let i = 1; i < 6; i++) {
						const fundMeConnectedContract = fundMe.connect(
							accounts[i]
						);
						await fundMeConnectedContract.fund({
							value: sendValue,
						});
					}
					const startingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const startingDeployerBalance =
						await fundMe.provider.getBalance(deployer);

					//Act
					const transactionResponse = await fundMe.cheaperWithdraw();
					const transactionReceipt = await transactionResponse.wait(
						1
					);
					const { gasUsed, effectiveGasPrice } = transactionReceipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const endingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					//Assert
					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingFundMeBalance
							.add(startingDeployerBalance)
							.toString(),
						endingDeployerBalance.add(gasCost).toString()
					);

					//make sure getFunder are reset properly
					await expect(fundMe.getFunder(0)).to.be.reverted;

					for (let i = 1; i < 6; i++) {
						assert.equal(
							await fundMe.getAddressToAmountFunded(
								accounts[i].address
							),
							0
						);
					}
				});

				it("Cheaper withdraw testing...", async () => {
					//Arrange
					const startingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const startingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					//Act
					const transactionResponse = await fundMe.cheaperWithdraw();
					const transactionReceipt = await transactionResponse.wait(
						1
					);

					const { gasUsed, effectiveGasPrice } = transactionReceipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const endingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					//Assert
					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingFundMeBalance
							.add(startingDeployerBalance)
							.toString(),
						endingDeployerBalance.add(gasCost).toString()
					);
				});
			});
	  });
