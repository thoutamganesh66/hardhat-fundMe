//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
	function getPrice(AggregatorV3Interface priceFeed)
		internal
		view
		returns (uint256)
	{
		//ABI
		//Address 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
		// AggregatorV3Interface priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
		// (uint80 roundID, uint price,uint startedAt,uint timeStamp,uint80 answeredInRound)=priceFeed.latestRoundData();
		(, int256 price, , , ) = priceFeed.latestRoundData();
		//ETH interms of USD
		//3000.00000000
		return uint256(price * 1e10);
	}

	/*
    function getVersion() internal view returns(uint256){
        AggregatorV3Interface priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
        return priceFeed.version();
    }
*/
	function getConversionRate(
		uint256 ethAmount,
		AggregatorV3Interface priceFeed
	) internal view returns (uint256) {
		uint256 ethPrice = getPrice(priceFeed);
		uint256 ethAmountInUSD = (ethPrice * ethAmount) / 1e18;
		return ethAmountInUSD;
	}
}
