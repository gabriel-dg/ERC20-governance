const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // Get voter account (same as deployer)
  const [voter] = await ethers.getSigners();
  console.log("Voter address:", voter.address);

  // Get contract addresses from environment variables
  const governorAddress = process.env.GOVERNOR_ADDRESS;
  if (!governorAddress) {
    console.error("Please set GOVERNOR_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("Governor address:", governorAddress);

  // Connect to the deployed governor contract
  const MyGovernor = await ethers.getContractFactory("MyGovernor");
  const governor = await MyGovernor.attach(governorAddress);

  // Get proposal ID - either from command line or from .env
  let proposalId;
  if (process.argv.length > 2) {
    proposalId = process.argv[2];
  } else if (process.env.PROPOSAL_ID) {
    proposalId = process.env.PROPOSAL_ID;
  } else {
    console.error(
      "Please provide a proposal ID as a command line argument or set PROPOSAL_ID in your .env file"
    );
    console.error(
      "Example: npx hardhat run scripts/vote.js --network holesky 123456789"
    );
    process.exit(1);
  }

  console.log("Proposal ID:", proposalId);

  // Check proposal state
  const state = await governor.state(proposalId);
  console.log("Current proposal state:", getProposalState(state));

  // Only allow voting if the proposal is active
  if (state !== 1) {
    // 1 = Active
    console.log("Cannot vote - proposal is not in active state");
    console.log(
      "Hint: Wait for the voting delay to pass. Current voting delay is",
      (await governor.votingDelay()).toString(),
      "blocks"
    );
    process.exit(1);
  }

  // Vote on the proposal (1 = support, 0 = against, 2 = abstain)
  const support = 1; // Support the proposal (Yes vote)
  const reason = "I support this proposal"; // Optional reason

  console.log(`Casting vote: ${getVoteType(support)} with reason: "${reason}"`);

  // Cast vote with reason
  const voteTx = await governor.castVoteWithReason(proposalId, support, reason);

  console.log("Vote transaction hash:", voteTx.hash);
  console.log("Waiting for confirmation...");

  // Wait for the transaction to be mined
  await voteTx.wait();

  console.log("Vote cast successfully!");

  // Display voting period info
  const votingPeriod = await governor.votingPeriod();
  console.log(
    `Voting period ends after ${votingPeriod} blocks from proposal becoming active`
  );
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

// Helper function to convert vote type to a readable string
function getVoteType(support) {
  const voteTypes = ["Against", "For", "Abstain"];
  return voteTypes[support] || "Unknown";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
