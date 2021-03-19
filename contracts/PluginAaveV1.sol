// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./IWETH.sol";
import "./SafeERC20.sol";
import "./SafeMath.sol";
import "./Address.sol";

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

contract PluginAaveV1 {

    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public atoken;
    address public governance;
    address public strategy;
    address public want;

    constructor(address _atoken) {
        governance = msg.sender;
        atoken = _atoken;
    }

    address public constant weth = address(
        0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    );

    address public constant eth = address(
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
    );

    address public constant aeth = address(
        0x3a3A65aAb0dd2A17E3F1947bA16138cd37d08c04
    );

    address public constant provider = address(
        0x24a42fD28C976A61Df5D00D0599C34c4f90748c8
    );

    modifier pGOV {
      require(msg.sender == governance, "!perm");
      _;
    }

    function setGovernance(address _governance) public pGOV {
            governance = _governance;
    }

    function setStrategy(address _strategy) public pGOV {
            strategy = _strategy;
    }

    function deposit() public {
        require(msg.sender == governance || msg.sender == strategy, "!perm");
        uint256 _amount = IERC20(want).balanceOf(address(this));
        IWETH(weth).withdraw(_amount);
        address pool = ILendingPoolAddressesProvider(provider).getLendingPool();
        require(pool != address(0), "!pool");
        _amount = address(this).balance;
        ILendingPool(pool).deposit{value: _amount}(eth, _amount, 0);
        // IERC20(aeth).safeTransfer(strategy, _amount);
    }

    function withdraw() public {
        require(msg.sender == governance || msg.sender == strategy, "!perm");
        uint256 _amount = IERC20(aeth).balanceOf(address(this));
        IAaveToken(aeth).redeem(_amount);
        IWETH(weth).deposit{value: address(this).balance}();
        IERC20(weth).safeTransfer(strategy, _amount);
    }
}