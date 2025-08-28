import { network } from "hardhat";
import { parseUnits, formatUnits } from "viem";

async function main() {
  console.log("🧪 Testing Manual Token Transfer...");

  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();

  // Contract details
  const contractAddress = "0x494431f194ae0ad6328af03ac850c38a0aa639f9";
  const adminWallet = "0x6106a06a2f340f11574154a4dd6ba629d3e94402";
  const userWallet = "0x08E8d6FB87CE65a250C0647A2505F085dc994423";
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
