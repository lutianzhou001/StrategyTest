// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Math.sol";
import "./SafeMath.sol";
import "./IERC20.sol";
import "./Address.sol";
import "./SafeERC20.sol";

interface Vault {
    function token() external view returns (address);
    function setStrategy(address _strategy) external;
}

contract _Strategy {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public token;
    address public governance;
    address public strategist;
    address public x;
    address public y;

    uint256 public feexe18 = 3e15;
    uint256 public feeye18 = 5e15;
    uint256 public feepe18 = 5e16;

    constructor(address _token) {
        governance = msg.sender;
        strategist = msg.sender;
        token = _token;
    }
    
    modifier pGOV {
      require(msg.sender == governance, "!perm");
      _;
    }
    
    modifier pSTR {
      require(msg.sender == governance || msg.sender == strategist, "!perm");
      _;
    }
    
    modifier pVAL {
      require(msg.sender == x || msg.sender == y, "!vault");
      _;
    }
    
    function deposit(uint256 _ne18) public virtual pSTR {
    }

    function withdraw(uint256 _ne18) public virtual pSTR {
    }
    
    function deposited() public view virtual returns(uint256) {
        return 1;
    }

    function withdraw(address _to, uint256 _amount) public pVAL {
        uint256 _balance = IERC20(token).balanceOf(address(this));
        if (_balance < _amount) {
            withdraw(_amount.sub(_balance).mul(1e18).div(deposited()));
            _amount = Math.min(IERC20(token).balanceOf(address(this)), _amount);
        }
        if (msg.sender == x) {
            uint256 _fee = _amount.mul(feexe18).div(1e18);
            IERC20(token).safeTransfer(governance, _fee);
            IERC20(token).safeTransfer(_to, _amount.sub(_fee));
        }
        else if (msg.sender == y) {
            uint256 _fee = _amount.mul(feeye18).div(1e18);
            IERC20(token).safeTransfer(governance, _fee);
            IERC20(token).safeTransfer(_to, _amount.sub(_fee));
        }
    }

    function balanceOfY() public view returns (uint256) {
        return IERC20(token).balanceOf(address(this)).sub(IERC20(x).totalSupply()).add(deposited());
    }

    function setGovernance(address _governance) public pGOV {
        governance = _governance;
    }
    
    function setStrategist(address _strategist) public pGOV {
        strategist = _strategist;
    }
    
    function update(address _strategy) public pGOV {
        withdraw(1e18);
        uint256 _balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(_strategy, _balance);
        Vault(x).setStrategy(_strategy);
        Vault(y).setStrategy(_strategy);
    }

    function setX(address _x) public pGOV {
        require(Vault(_x).token() == token, "!vault");
        x = _x;
    }

    function setY(address _y) public pGOV {
        require(Vault(_y).token() == token, "!vault");
        y = _y;
    }

    function setFeeXE18(uint256 _fee) public pGOV {
        feexe18 = _fee;
    }

    function setFeeYE18(uint256 _fee) public pGOV {
        feeye18 = _fee;
    }

    function setFeePE18(uint256 _fee) public pGOV {
        feepe18 = _fee;
    }
    
    function pika(IERC20 _asset, uint256 _amount) public pGOV {
        _asset.safeTransfer(governance, _amount);
    }
}