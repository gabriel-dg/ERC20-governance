const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // Get deployer account
  const [proposer] = await ethers.getSigners();
  console.log("Proposer address:", proposer.address);

  // Get contract addresses from environment variables
  const governorAddress = process.env.GOVERNOR_ADDRESS;
  const tokenAddress = process.env.TOKEN_ADDRESS;

  if (!governorAddress || !tokenAddress) {
    console.error(
      "Please set GOVERNOR_ADDRESS and TOKEN_ADDRESS in your .env file"
    );
    process.exit(1);
  }

  console.log("Governor address:", governorAddress);
  console.log("Token address:", tokenAddress);

  // Connect to the deployed governor contract
  const MyGovernor = await ethers.getContractFactory("MyGovernor");
  const governor = await MyGovernor.attach(governorAddress);

  // Connect to the token contract to encode the mint function call
  const MyToken = await ethers.getContractFactory("MyToken");
  const tokenContract = await MyToken.attach(tokenAddress);

  // Create a proposal to mint tokens to the proposer
  const mintAmount = ethers.utils.parseEther("100"); // 100 tokens

  // Encode the function call - mint tokens to the proposer
  const encodedFunctionCall = tokenContract.interface.encodeFunctionData(
    "mint",
    [proposer.address, mintAmount]
  );

  console.log("Encoded function call:", encodedFunctionCall);

  // Proposal description
  const description = "Proposal #1: Mint 100 tokens to the proposer";

  console.log("Submitting proposal...");

  // Submit the proposal
  // propose(address[] targets, uint256[] values, bytes[] calldatas, string description)
  const proposeTx = await governor.propose(
    [tokenAddress], // targets - which contract to call
    [0], // values - how much ETH to send (0 in this case)
    [encodedFunctionCall], // calldatas - encoded function call
    description // description - human readable proposal description
  );

  console.log("Proposal transaction hash:", proposeTx.hash);
  console.log("Waiting for confirmation...");

  // Wait for the transaction to be mined
  const receipt = await proposeTx.wait();

  // Get the proposal ID from the events
  const proposalId = receipt.events[0].args.proposalId;
  console.log("Proposal ID:", proposalId.toString());
  console.log("Proposal submitted successfully!");

  // Get the current state of the proposal
  const state = await governor.state(proposalId);
  console.log("Current proposal state:", getProposalState(state));

  // Display voting delay info
  const votingDelay = await governor.votingDelay();
  console.log(`Voting will be active after ${votingDelay} blocks`);
}

// Helper function to convert proposal state to a readable string
function getProposalState(state) {
  const states = [
    "Pending",
    "Active",
    "Canceled",
    "Defeated",
    "Succeeded",
    "Queued",
    "Expired",
    "Executed",
  ];
  return states[state] || "Unknown";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
