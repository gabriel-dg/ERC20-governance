const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // Get executor account (same as deployer)
  const [executor] = await ethers.getSigners();
  console.log("Executor address:", executor.address);

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

  // Connect to the token contract
  const MyToken = await ethers.getContractFactory("MyToken");
  const tokenContract = await MyToken.attach(tokenAddress);

  // Get proposal ID from .env or command line
  let proposalId;
  if (process.argv.length > 2) {
    proposalId = process.argv[2];
  } else if (process.env.PROPOSAL_ID) {
    proposalId = process.env.PROPOSAL_ID;
  } else {
    console.error(
      "Please provide a proposal ID as a command line argument or set PROPOSAL_ID in your .env file"
    );
    process.exit(1);
  }

  console.log("Proposal ID:", proposalId);

  // Check proposal state
  const state = await governor.state(proposalId);
  const stateStr = getProposalState(state);
  console.log("Current proposal state:", stateStr);

  // Get the proposal details to recreate the proposal hash
  // We get this by getting the proposal description hash
  // Recover the same parameters we used for proposal creation
  const proposalDescription = "Proposal #1: Mint 100 tokens to the proposer";
  const mintAmount = ethers.utils.parseEther("100"); // 100 tokens
  const encodedFunctionCall = tokenContract.interface.encodeFunctionData(
    "mint",
    [executor.address, mintAmount]
  );

  const descriptionHash = ethers.utils.id(proposalDescription);

  // Handle different proposal states
  if (state === 4) {
    // Succeeded
    console.log("Proposal succeeded! Proceeding to execution...");

    // Skip queue and directly execute for non-timelocked governors
    console.log("Executing proposal...");
    try {
      const executeTx = await governor.execute(
        [tokenAddress],
        [0],
        [encodedFunctionCall],
        descriptionHash
      );

      console.log("Execute transaction hash:", executeTx.hash);
      console.log("Waiting for confirmation...");

      await executeTx.wait();
      console.log("Proposal executed successfully!");

      // Check if tokens were minted
      const balance = await tokenContract.balanceOf(executor.address);
      console.log("Your token balance:", ethers.utils.formatUnits(balance, 18));
    } catch (error) {
      console.error("Execution failed.");
      console.error("Error details:", error.message);
    }
  } else if (state === 7) {
    // Already Executed
    console.log("Proposal has already been executed!");
    // Check if tokens were minted
    const balance = await tokenContract.balanceOf(executor.address);
    console.log("Your token balance:", ethers.utils.formatUnits(balance, 18));
  } else if (state === 1) {
    // Still Active
    console.log(
      "Proposal is still in voting period. Please wait for voting to end."
    );
    console.log("Check the current block number and when voting ends:");

    const currentBlock = await ethers.provider.getBlockNumber();

    try {
      // Use proposalDeadline for OpenZeppelin Governor
      const endBlock = await governor.proposalDeadline(proposalId);

      console.log("Current block:", currentBlock);
      console.log("Voting ends at block:", endBlock.toString());
      console.log("Blocks remaining:", endBlock.sub(currentBlock).toString());

      // Estimate time left based on ~12 second Holesky blocks
      const secondsLeft = endBlock.sub(currentBlock).mul(12).toNumber();
      const minutesLeft = Math.floor(secondsLeft / 60);
      console.log(
        `Approximately ${minutesLeft} minutes remaining (estimate based on 12-second blocks)`
      );
    } catch (error) {
      console.error("Could not determine when voting ends.");
      console.error("Error details:", error.message);
    }
  } else {
    console.log("Proposal cannot be executed in its current state.");

    if (state === 3) {
      // Defeated
      console.log(
        "Proposal was defeated in voting. Create a new proposal if needed."
      );
    } else if (state === 2) {
      // Canceled
      console.log("Proposal was canceled.");
    } else if (state === 6) {
      // Expired
      console.log("Proposal expired without being executed.");
    }
  }
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
