// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YDToken
 * @dev Web3 School 的奖励代币
 */
contract YDToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 10_000_000 * 10**18; // 1000万 YD
    
    constructor() ERC20("YD Token", "YD") {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
    
    /**
     * @dev 铸造新代币（仅限所有者）
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev 销毁代币
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
