// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Math.sol";
import "./SafeMath.sol";
import "./IERC20.sol";
import "./Address.sol";
import "./SafeERC20.sol";

interface ILendingPoolV2 {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
    function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external returns (uint256);
    function getReserveNormalizedIncome(address asset) external view returns (uint256);
}

contract Impl_WETH_AaveV2 {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address constant token = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address constant lendingpool = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address constant atoken = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);


    function dohardwork(bytes memory _data) public {
    }

    function deposit(uint256 _ne18) public {
        uint256 _amount = IERC20(token).balanceOf(address(this));
        _amount = _amount.mul(_ne18).div(1e18);
        IERC20(token).safeApprove(lendingpool, 0);
        IERC20(token).safeApprove(lendingpool, _amount);
        ILendingPoolV2(lendingpool).deposit(token, _amount, address(this), 0);
    }

    function withdraw(uint256 _ne18) public {
        uint256 _amount = IERC20(atoken).balanceOf(address(this));
        _amount = _amount.mul(_ne18).div(1e18);
        IERC20(token).safeApprove(lendingpool, 0);
        IERC20(atoken).safeApprove(lendingpool, _amount);
        ILendingPoolV2(lendingpool).withdraw(token, _amount, address(this));
    }

    function deposited() public view returns(uint256) {
        return IERC20(atoken).balanceOf(address(this));
    }

}