// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CommunalScoreToken
 * @dev ERC-20 token for the Communal Score Crypto Project
 * This token represents community participation and can be redeemed by authorized parties
 */
contract CommunalScoreToken is ERC20, Ownable {
    
    // Events
    event TokensRedeemed(address indexed to, uint256 amount, string reason);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    
    /**
     * @dev Constructor that gives msg.sender all of initial tokens
     * @param initialSupply The initial token supply
     */
    constructor(uint256 initialSupply) 
        ERC20("Communal Score Token", "CST") 
        Ownable(msg.sender) 
    {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
    
    /**
     * @dev Redeem tokens to a specific address (only callable by owner)
     * @param to The address to send tokens to
     * @param amount The amount of tokens to redeem
     * @param reason Optional reason for the redemption
     */
    function redeem(address to, uint256 amount, string memory reason) 
        public 
        onlyOwner 
    {
        require(to != address(0), "Cannot redeem to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(owner()) >= amount, "Insufficient tokens in owner account");
        
        _transfer(owner(), to, amount);
        emit TokensRedeemed(to, amount, reason);
    }
    
    /**
     * @dev Mint new tokens to a specific address (only callable by owner)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     * @param reason Optional reason for the minting
     */
    function mint(address to, uint256 amount, string memory reason) 
        public 
        onlyOwner 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Get the total supply of tokens
     * @return The total token supply
     */
    function totalSupply() public view override returns (uint256) {
        return super.totalSupply();
    }
    
    /**
     * @dev Get the balance of tokens for a specific address
     * @param account The address to check balance for
     * @return The token balance
     */
    function balanceOf(address account) public view override returns (uint256) {
        return super.balanceOf(account);
    }
}


