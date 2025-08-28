import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CommunalScoreTokenModule = buildModule("CommunalScoreToken", (m) => {
  // Deploy the CommunalScoreToken contract
  const token = m.contract("CommunalScoreToken", [1000000]); // 1 million initial supply

  return { token };
});

export default CommunalScoreTokenModule;


