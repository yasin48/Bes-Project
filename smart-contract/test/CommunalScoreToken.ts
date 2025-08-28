import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseUnits, formatUnits, zeroAddress, getAddress } from "viem";

import { network } from "hardhat";

describe("CommunalScoreToken", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, user1, user2, nonOwner] = await viem.getWalletClients();

  const INITIAL_SUPPLY = 1000000n; // 1 million tokens
  const TOKEN_NAME = "Communal Score Token";
  const TOKEN_SYMBOL = "CST";
  const TOKEN_DECIMALS = 18;

  describe("Deployment", function () {
    it("Should set the correct name, symbol, and decimals", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      const name = await token.read.name();
      const symbol = await token.read.symbol();
      const decimals = await token.read.decimals();
      
      assert.equal(name, TOKEN_NAME);
      assert.equal(symbol, TOKEN_SYMBOL);
      assert.equal(decimals, TOKEN_DECIMALS);
    });

    it("Should assign the total supply to the owner", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      const totalSupply = await token.read.totalSupply();
      const ownerBalance = await token.read.balanceOf([owner.account.address]);
      const expectedSupply = parseUnits(INITIAL_SUPPLY.toString(), TOKEN_DECIMALS);
      
      assert.equal(totalSupply, expectedSupply);
      assert.equal(ownerBalance, totalSupply);
    });

    it("Should set the deployer as the owner", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      const contractOwner = await token.read.owner();
      assert.equal(getAddress(contractOwner), getAddress(owner.account.address));
    });
  });

  describe("Redeem Function", function () {
    const redeemAmount = parseUnits("100", TOKEN_DECIMALS);
    const reason = "Community participation reward";

    it("Should allow owner to redeem tokens to users", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      const initialOwnerBalance = await token.read.balanceOf([owner.account.address]);
      const initialUserBalance = await token.read.balanceOf([user1.account.address]);

      await viem.assertions.emitWithArgs(
        token.write.redeem([user1.account.address, redeemAmount, reason]),
        token,
        "TokensRedeemed",
        [getAddress(user1.account.address), redeemAmount, reason],
      );

      const finalOwnerBalance = await token.read.balanceOf([owner.account.address]);
      const finalUserBalance = await token.read.balanceOf([user1.account.address]);

      assert.equal(finalOwnerBalance, initialOwnerBalance - redeemAmount);
      assert.equal(finalUserBalance, initialUserBalance + redeemAmount);
    });

    it("Should reject redemption from non-owner", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      try {
        await token.write.redeem([user1.account.address, redeemAmount, reason], {
          account: nonOwner.account,
        });
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert.ok(error.message.includes("OwnableUnauthorizedAccount"));
      }
    });

    it("Should reject redemption to zero address", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      try {
        await token.write.redeem([zeroAddress, redeemAmount, reason]);
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert.ok(error.message.includes("Cannot redeem to zero address"));
      }
    });

    it("Should reject redemption with zero amount", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      try {
        await token.write.redeem([user1.account.address, 0n, reason]);
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert.ok(error.message.includes("Amount must be greater than 0"));
      }
    });

    it("Should reject redemption when owner has insufficient balance", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      const totalSupply = await token.read.totalSupply();
      const excessiveAmount = totalSupply + parseUnits("1", TOKEN_DECIMALS);

      try {
        await token.write.redeem([user1.account.address, excessiveAmount, reason]);
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert.ok(error.message.includes("Insufficient tokens in owner account"));
      }
    });
  });

  describe("Mint Function", function () {
    const mintAmount = parseUnits("500", TOKEN_DECIMALS);
    const reason = "Additional token creation";

    it("Should allow owner to mint new tokens", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      const initialTotalSupply = await token.read.totalSupply();
      const initialUserBalance = await token.read.balanceOf([user1.account.address]);

      await viem.assertions.emitWithArgs(
        token.write.mint([user1.account.address, mintAmount, reason]),
        token,
        "TokensMinted",
        [getAddress(user1.account.address), mintAmount, reason],
      );

      const finalTotalSupply = await token.read.totalSupply();
      const finalUserBalance = await token.read.balanceOf([user1.account.address]);

      assert.equal(finalTotalSupply, initialTotalSupply + mintAmount);
      assert.equal(finalUserBalance, initialUserBalance + mintAmount);
    });

    it("Should reject minting from non-owner", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      try {
        await token.write.mint([user1.account.address, mintAmount, reason], {
          account: nonOwner.account,
        });
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert.ok(error.message.includes("OwnableUnauthorizedAccount"));
      }
    });

    it("Should reject minting to zero address", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      try {
        await token.write.mint([zeroAddress, mintAmount, reason]);
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert.ok(error.message.includes("Cannot mint to zero address"));
      }
    });

    it("Should reject minting with zero amount", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      try {
        await token.write.mint([user1.account.address, 0n, reason]);
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert.ok(error.message.includes("Amount must be greater than 0"));
      }
    });
  });

  describe("Standard ERC-20 Functions", function () {
    it("Should return correct total supply", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      const totalSupply = await token.read.totalSupply();
      const expectedSupply = parseUnits(INITIAL_SUPPLY.toString(), TOKEN_DECIMALS);
      assert.equal(totalSupply, expectedSupply);
    });

    it("Should return correct balance for accounts", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      const ownerBalance = await token.read.balanceOf([owner.account.address]);
      const userBalance = await token.read.balanceOf([user1.account.address]);
      
      assert.ok(ownerBalance > 0n);
      assert.equal(userBalance, 0n);
    });

    it("Should allow token transfers between accounts", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      const transferAmount = parseUnits("50", TOKEN_DECIMALS);
      
      await viem.assertions.emitWithArgs(
        token.write.transfer([user1.account.address, transferAmount]),
        token,
        "Transfer",
        [getAddress(owner.account.address), getAddress(user1.account.address), transferAmount],
      );

      const userBalance = await token.read.balanceOf([user1.account.address]);
      assert.equal(userBalance, transferAmount);
    });
  });

  describe("Ownership Functions", function () {
    it("Should allow owner to transfer ownership", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      await viem.assertions.emitWithArgs(
        token.write.transferOwnership([user1.account.address]),
        token,
        "OwnershipTransferred",
        [getAddress(owner.account.address), getAddress(user1.account.address)],
      );

      const newOwner = await token.read.owner();
      assert.equal(getAddress(newOwner), getAddress(user1.account.address));
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      
      try {
        await token.write.transferOwnership([user1.account.address], {
          account: nonOwner.account,
        });
        assert.fail("Expected transaction to revert");
      } catch (error) {
        assert.ok(error.message.includes("OwnableUnauthorizedAccount"));
      }
    });
  });

  describe("Integration Tests", function () {
    it("Should handle multiple redemptions correctly", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      const amount1 = parseUnits("100", TOKEN_DECIMALS);
      const amount2 = parseUnits("200", TOKEN_DECIMALS);

      await token.write.redeem([user1.account.address, amount1, "First reward"]);
      await token.write.redeem([user2.account.address, amount2, "Second reward"]);

      const user1Balance = await token.read.balanceOf([user1.account.address]);
      const user2Balance = await token.read.balanceOf([user2.account.address]);
      
      assert.equal(user1Balance, amount1);
      assert.equal(user2Balance, amount2);
    });

    it("Should handle mint and redeem operations together", async function () {
      const token = await viem.deployContract("CommunalScoreToken", [INITIAL_SUPPLY]);
      const mintAmount = parseUnits("1000", TOKEN_DECIMALS);
      const redeemAmount = parseUnits("500", TOKEN_DECIMALS);

      // Mint new tokens
      await token.write.mint([owner.account.address, mintAmount, "Additional supply"]);
      
      // Redeem some tokens to user
      await token.write.redeem([user1.account.address, redeemAmount, "User reward"]);

      const finalUserBalance = await token.read.balanceOf([user1.account.address]);
      assert.equal(finalUserBalance, redeemAmount);
    });
  });
});
