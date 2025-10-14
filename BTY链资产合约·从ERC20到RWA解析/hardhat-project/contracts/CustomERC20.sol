// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CustomERC20
 * @dev 简化的ERC20代币合约，支持设置币种信息和增发
 */
contract CustomERC20 is ERC20, Ownable {
    bool public mintable;
    
    /**
     * @dev 构造函数
     * @param name 代币名称
     * @param symbol 代币符号
     * @param initialSupply 初始供应量
     * @param _mintable 是否支持增发
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        bool _mintable
    ) public ERC20(name, symbol) {
        mintable = _mintable;
        
        // 铸造初始供应量给部署者
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply * (10 ** 18));
        }
    }
        
    /**
     * @dev 增发代币（只有owner可以调用）
     * @param to 接收地址
     * @param amount 增发数量
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(mintable, "Token is not mintable");
        _mint(to, amount);
    }
    
    /**
     * @dev 启用增发功能（只有owner可以调用）
     */
    function enableMinting() public onlyOwner {
        mintable = true;
    }
    
    /**
     * @dev 禁用增发功能（只有owner可以调用）
     */
    function disableMinting() public onlyOwner {
        mintable = false;
    }
}
