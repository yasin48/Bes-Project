import { network } from "hardhat";
import { formatUnits, getAddress } from "viem";

async function main() {
  console.log("🚀 Deploying CommunalScoreToken...");

  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();

  // Set initial supply (1 million tokens)
  const initialSupply = 1000000n; // Multiplied by 10^18 in the constructor
  const envOwner = process.env.OWNER_ADDRESS || deployer.account.address;
  const initialOwner = getAddress(envOwner as `0x${string}`);

  console.log(`📊 Initial Supply: ${initialSupply} CST tokens`);
  console.log(`🔢 Total Supply: ${initialSupply * 10n ** 18n} wei`);
  console.log(`👤 Deployer: ${deployer.account.address}`);
  console.log(`👑 Initial Owner: ${initialOwner}`);

  // Deploy the contract
  const token = await viem.deployContract("CommunalScoreToken", [initialSupply, initialOwner]);
  console.log(`✅ CommunalScoreToken deployed to: ${token.address}`);

  // Get deployment info
  const name = await token.read.name();
  const symbol = await token.read.symbol();
  const decimals = await token.read.decimals();
  const totalSupply = await token.read.totalSupply();
  const owner = await token.read.owner();

  console.log("\n📋 Token Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${formatUnits(totalSupply, decimals)} ${symbol}`);
  console.log(`   Owner: ${owner}`);

  // Verify the deployment
  console.log("\n🔍 Verifying deployment...");
  const ownerBalance = await token.read.balanceOf([owner]);
  
  if (ownerBalance === totalSupply) {
    console.log("✅ Verification successful! Owner has all initial tokens.");
  } else {
    console.log("❌ Verification failed! Token distribution incorrect.");
    console.log(`   Expected: ${totalSupply}`);
    console.log(`   Actual: ${ownerBalance}`);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log(`📝 Contract Address: ${token.address}`);
  console.log(`🔗 Network: ${network.name}`);
  
  // Save deployment info for future reference
  const deploymentInfo = {
    network: network.name,
    contractAddress: token.address,
    contractName: "CommunalScoreToken",
    deployer: deployer.account.address,
    owner: owner,
    initialSupply: initialSupply.toString(),
    totalSupply: formatUnits(totalSupply, decimals),
    deploymentTime: new Date().toISOString()
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

// Handle errors
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
