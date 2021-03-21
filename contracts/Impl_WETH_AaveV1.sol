// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Math.sol";
import "./SafeMath.sol";
import "./IERC20.sol";
import "./Address.sol";
import "./SafeERC20.sol";
import "./IWETH.sol";

interface ILendingPoolAddressesProvider {
    function getLendingPool() external view returns (address);
    function getLendingPoolCore() external view returns (address);
    function getPriceOracle() external view returns (address);
}

interface ILendingPool {
    function deposit(address, uint256, uint16) external payable;
}

interface IAaveToken {
    function redeem(uint256) external;
}

contract Impl_WETH_AaveV1 {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address constant token = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address constant lendingpool = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address constant atoken = address(0x030bA81f1c18d280636F32af80b9AAd02Cf0854e);
    address public constant provider = address(0x24a42fD28C976A61Df5D00D0599C34c4f90748c8);
    address public constant eth = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    function dohardwork(bytes memory _data) public {
    }

    function deposit(uint256 _ne18) public {
        uint256 _amount = IERC20(token).balanceOf(address(this));
        _amount = _amount.mul(_ne18).div(1e18);
        IWETH(token).withdraw(_amount);
        address pool = ILendingPoolAddressesProvider(provider).getLendingPool();
        require(pool != address(0), "!pool");
        _amount = address(this).balance;
        ILendingPool(pool).deposit{value: _amount}(eth, _amount, 0);
    }

    function withdraw(uint256 _ne18) public {
        uint256 _amount = IERC20(atoken).balanceOf(address(this));
        _amount = _amount.mul(_ne18).div(1e18);
        IAaveToken(atoken).redeem(_amount);
        IWETH(token).deposit{value: address(this).balance}();
    }

    function deposited() public view returns(uint256) {
        return IERC20(atoken).balanceOf(address(this));
    }
}