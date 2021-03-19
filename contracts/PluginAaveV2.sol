// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20.sol";

interface ILendingPoolV2 {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
    function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external returns (uint256);
    function getReserveNormalizedIncome(address asset) external view returns (uint256);
}

contract PluginAaveV1 {

    address public atoken;
    address public governance;
    address public strategy;
    address public lendingpool;
    address public want;

    constructor(address _atoken, address _lendingpool, address _want) {
        governance = msg.sender;
        atoken = _atoken;
        want = _want;
        lendingpool = _lendingpool;
    }

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
        IERC20(want).approve(lendingpool, _amount);
        ILendingPoolV2(lendingpool).deposit(want, _amount, strategy, 0);
    }

    function withdraw() public {
        require(msg.sender == governance || msg.sender == strategy, "!perm");
        uint256 _amount = IERC20(atoken).balanceOf(address(this));
        IERC20(atoken).approve(lendingpool, _amount);
        ILendingPoolV2(lendingpool).withdraw(want, _amount, strategy);
    }
}