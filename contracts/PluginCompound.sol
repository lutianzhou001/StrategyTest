// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./IWETH.sol";
import "./SafeERC20.sol";
import "./SafeMath.sol";
import "./Address.sol";

interface CERC20 {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function balanceOf(address _owner) external view returns (uint256);
    function exchangeRateStored() external view returns (uint256);
}

contract PluginCompound {

    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public governance;
    address public strategy;
    address public want;
    address public cerc20;

    constructor(address _cerc20, address _want) {
        governance = msg.sender;
        want = _want;
        cerc20 = _cerc20;
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
        IERC20(want).approve(cerc20, _amount);
        CERC20(cerc20).mint(_amount);
        IERC20(cerc20).safeTransfer(strategy, _amount);
    }

    function withdraw() public {
        require(msg.sender == governance || msg.sender == strategy, "!perm");
        uint256 _amount = CERC20(cerc20).balanceOf(address(this));
        uint256 _redeemResult = CERC20(cerc20).redeemUnderlying(_amount);
        require(_redeemResult == 0, "redeemResult error");
        IERC20(want).safeTransfer(strategy,_amount);
    }

    function collect() public {
        require(msg.sender == governance || msg.sender == strategy, "!perm");
        // left
    }
}