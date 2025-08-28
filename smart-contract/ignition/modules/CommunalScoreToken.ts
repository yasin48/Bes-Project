import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CommunalScoreTokenModule = buildModule("CommunalScoreToken", (m) => {
  // Params
  const owner = m.getParameter("owner", "0x0000000000000000000000000000000000000001");
  const initialSupply = m.getParameter("initialSupply", 1000000);

  // Deploy the CommunalScoreToken contract
  const token = m.contract("CommunalScoreToken", [initialSupply, owner]);

  return { token };
});

export default CommunalScoreTokenModule;


