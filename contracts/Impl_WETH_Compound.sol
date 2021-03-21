// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Math.sol";
import "./SafeMath.sol";
import "./IERC20.sol";
import "./Address.sol";
import "./SafeERC20.sol";
import "./IWETH.sol";

interface Icompound {
    function claimComp(address holder) external;
}

interface CETH {
    function mint() external payable;
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function balanceOf(address _owner) external view returns (uint256);
    function exchangeRateStored() external view returns (uint256);
}

contract Impl_WETH_Compound {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address constant compound = address(0xbe7616B06f71e363A310Aa8CE8aD99654401ead7);
    address constant ctoken = address(0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5);
    address constant token = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    
    function dohardwork(bytes memory _data) public {
       Icompound(compound).claimComp(address(this));
    }

    function deposit(uint256 _ne18) public {
        uint256 _amount = IERC20(token).balanceOf(address(this));
        _amount = _amount.mul(_ne18).div(1e18);
        IWETH(token).withdraw(_amount);
        CETH cToken = CETH(ctoken);
        cToken.mint{value: address(this).balance}();
    }

    function withdraw(uint256 _ne18) public {
        uint256 _amount = IERC20(ctoken).balanceOf(address(this));
        _amount = _amount.mul(_ne18).div(1e18);
        CETH cToken = CETH(ctoken);
        uint256 _redeemResult = cToken.redeemUnderlying(_amount);
        // https://compound.finance/developers/ctokens#ctoken-error-codes
        require(_redeemResult == 0, "redeemResult error");
        IWETH(token).deposit{value: address(this).balance}();
    }

    function deposited() public view returns(uint256) {
        return IERC20(ctoken).balanceOf(address(this));
    }
}