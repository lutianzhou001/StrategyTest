// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Math.sol";
import "./SafeMath.sol";
import "./IERC20.sol";
import "./Address.sol";
import "./SafeERC20.sol";
import "./IWETH.sol";
import "./IUniswapV2Pair.sol";
import "./IUniswapV2Router01.sol";


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
    address constant comp = address(0xc00e94Cb662C3520282E6f5717214004A7f26888);
    address constant ctoken = address(0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5);
    address constant token = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address constant uniswap = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    address constant pair = address(0xCFfDdeD873554F362Ac02f8Fb1f02E5ada10516f);
    address constant uniswapFactory = address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

    function dohardwork(bytes memory _data) public {
      address[] memory path;
      path[0] = comp;
      path[1] = token;
      (uint8 option,uint256 _ne18) = abi.decode(_data, (uint8,uint256));
      if ( option == 0 ) {
          Icompound(compound).claimComp(address(this));
      } else if ( option == 1 ) {
          uint256 _amount = IERC20(comp).balanceOf(address(this));
          if (_amount == 0) {
              return;
          }
          IERC20(comp).safeApprove(uniswap,0);
          IERC20(comp).safeApprove(uniswap,_amount.mul(_ne18).div(1e18));
          IUniswapV2Router01(uniswap).swapExactTokensForTokens(_amount.mul(_ne18).div(1e18),0,path,address(this),17777777);
      } else if ( option == 2 ) {
          uint256 _amount = IERC20(comp).balanceOf(address(this));
          if (_amount == 0) {
              return;
          }
          uint256[] memory exchanged = IUniswapV2Router01(uniswap).getAmountsOut(_amount.mul(_ne18).div(1e18),path);
          IERC20(token).safeTransferFrom(msg.sender,address(this),exchanged[1]);
          IERC20(comp).safeTransfer(msg.sender,_amount.mul(_ne18).div(1e18));
      } else if (option == 3 ){
          // reserved logic here incase of other options like pika.
          return;
      }
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