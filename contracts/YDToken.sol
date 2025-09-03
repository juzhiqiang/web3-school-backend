// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YDToken
 * @dev Web3 School 代币合约实现
 */
contract YDToken is ERC20, Ownable {

    // 初始发行总量
    uint256 public constant TOTAL_SUPPLY = 10_000_000 * 10**18; // 1000万 YD、

    // 代币缩写
    string public constant SYMBOL = "YD";
    // 代币名称
    string public constant NAME = "YD Token";
    
    constructor() ERC20(NAME, SYMBOL) {
        // 发行初始总量代币给合约部署者
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

    /**
     * @dev 重写decimals函数，设置代币小数位为18位
     */
    function decimals() public view virtual override returns (uint8) {
        return 18;

    }
}
