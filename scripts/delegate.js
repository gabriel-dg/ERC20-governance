const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Delegating from:", deployer.address);

  // Get token address from environment variables
  const tokenAddress = process.env.TOKEN_ADDRESS;
  if (!tokenAddress) {
    console.error("Please set TOKEN_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("Token address:", tokenAddress);

  // Connect to the deployed token contract
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.attach(tokenAddress);

  // Delegate votes to self (deployer)
  console.log("Delegating votes to:", deployer.address);
  const tx = await token.delegate(deployer.address);

  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");

  // Wait for transaction to be mined
  await tx.wait();
  console.log("Delegation successful!");

  // Check current voting power
  const votes = await token.getVotes(deployer.address);
  console.log(
    `Current voting power: ${ethers.utils.formatUnits(votes, 18)} votes`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
