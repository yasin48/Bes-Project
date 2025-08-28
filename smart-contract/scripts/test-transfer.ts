import { network } from "hardhat";
import { parseUnits, formatUnits } from "viem";

async function main() {
  console.log("🧪 Testing Manual Token Transfer...");

  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();

  // Contract details
  const contractAddress = "0xd9cf1ec86e208a409d3de638e72686bb114f4750";
  const adminWallet = "0x33673Fb2Bd33Fe285D27eEc3E9D0Dc1F70E8Be65";
  const userWallet = "0x4E8E7dE766744a071E117dF951856Dd3378a0183";
  const tokenAmount = 100; // 100 CST tokens

  console.log(`📊 Transfer Details:`);
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   From (Admin): ${adminWallet}`);
  console.log(`   To (User): ${userWallet}`);
  console.log(`   Amount: ${tokenAmount} CST tokens`);
  console.log(`   Deployer: ${deployer.account.address}`);
  console.log(`   Network: ${network.name}`);

  // Verify we're using the right wallet
  if (deployer.account.address.toLowerCase() !== adminWallet.toLowerCase()) {
    console.log(`❌ ERROR: Deployer wallet mismatch!`);
    console.log(`   Expected: ${adminWallet}`);
    console.log(`   Actual: ${deployer.account.address}`);
    return;
  }

  try {
    // Get contract instance
    const contract = await viem.getContractAt("CommunalScoreToken", contractAddress);

    // Check admin balance before
    const adminBalanceBefore = await contract.read.balanceOf([adminWallet]);
    console.log(`\n💰 Balances Before Transfer:`);
    console.log(`   Admin: ${formatUnits(adminBalanceBefore, 18)} CST`);

    const userBalanceBefore = await contract.read.balanceOf([userWallet]);
    console.log(`   User: ${formatUnits(userBalanceBefore, 18)} CST`);

    // Convert amount to Wei (18 decimals)
    const amountWei = parseUnits(tokenAmount.toString(), 18);
    console.log(`\n🔄 Converting ${tokenAmount} CST to Wei: ${amountWei}`);

    // Execute redeem function
    console.log(`\n🚀 Executing redeem transaction...`);
    const tx = await contract.write.redeem([
      userWallet as `0x${string}`,
      amountWei,
      "Manual test transfer"
    ]);

    console.log(`📝 Transaction Hash: ${tx}`);

    // Wait for confirmation
    console.log(`⏳ Waiting for transaction confirmation...`);
    const receipt = await viem.waitForTransactionReceipt({ hash: tx });
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

    // Check balances after
    const adminBalanceAfter = await contract.read.balanceOf([adminWallet]);
    const userBalanceAfter = await contract.read.balanceOf([userWallet]);

    console.log(`\n💰 Balances After Transfer:`);
    console.log(`   Admin: ${formatUnits(adminBalanceAfter, 18)} CST`);
    console.log(`   User: ${formatUnits(userBalanceAfter, 18)} CST`);

    // Calculate differences
    const adminDiff = adminBalanceBefore - adminBalanceAfter;
    const userDiff = userBalanceAfter - userBalanceBefore;

    console.log(`\n📈 Transfer Summary:`);
    console.log(`   Admin sent: ${formatUnits(adminDiff, 18)} CST`);
    console.log(`   User received: ${formatUnits(userDiff, 18)} CST`);
    
    if (userDiff === amountWei) {
      console.log(`🎉 SUCCESS! Transfer completed successfully!`);
    } else {
      console.log(`❌ ERROR: Amount mismatch!`);
    }

    // Get transaction details from Etherscan
    console.log(`\n🔗 View on Etherscan:`);
    console.log(`   https://sepolia.etherscan.io/tx/${tx}`);

  } catch (error) {
    console.error(`❌ Transfer failed:`, error);
    
    // Check if it's a specific error
    if (error instanceof Error) {
      if (error.message.includes("Insufficient tokens")) {
        console.log(`💡 Tip: Admin wallet may not have enough tokens`);
      } else if (error.message.includes("Ownable")) {
        console.log(`💡 Tip: Make sure you're using the contract owner wallet`);
      }
    }
  }
}

// Handle errors
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
