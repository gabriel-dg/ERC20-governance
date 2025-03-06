# Governance Token & Governor Project

> **Note:** This project is a fork of [Alchemy Platform's MintGovernance](https://github.com/alchemyplatform/MintGovernance) repository, created as part of the Alchemy University lesson on ERC20 Governor.

This project implements an on-chain governance system using OpenZeppelin's Governor contracts. It consists of an ERC20 token with voting capabilities and a governance contract that allows token holders to propose, vote on, and execute governance decisions.

## Overview

The project contains two main contracts:
- `MyToken`: An ERC20 token with voting capabilities (ERC20Votes)
- `MyGovernor`: A governance contract that manages the proposal and voting system

The governance process follows these steps:
1. Token holders delegate their voting power
2. Users with voting power create proposals
3. Token holders vote on proposals
4. If approved, proposals are queued and executed

## Setup

### Prerequisites
- Node.js and npm installed
- An Ethereum wallet with Holesky testnet ETH (for deploying and testing)

### Installation

1. Clone the repository
```shell
git clone <repository-url>
cd MintGovernance
```

2. Install dependencies
```shell
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
# RPC URLs
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
HOLESKY_URL=https://eth-holesky.g.alchemy.com/v2/YOUR_API_KEY

# Your private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Contract addresses (to be filled after deployment)
TOKEN_ADDRESS=
GOVERNOR_ADDRESS=

# Proposal ID (to be filled after creating a proposal)
PROPOSAL_ID=
```

## Network Configuration

The project is configured to work with Sepolia and Holesky testnet. 

## Deployment & Testing Process

Follow these steps in order to test the full governance lifecycle:

### 1. Deploy Contracts

Deploy the Governor and Token contracts:

```shell
npx hardhat run scripts/deploy.js --network holesky
```

After deployment, you'll see output like:
```
Governor deployed to 0x407CCCe8EC19dBC4c77bF9023746fE1E16305d28
Token deployed to 0x3281b0Ba4bF35a5C31d3dB26cDBd4e9123fe97cd
```

Update your `.env` file with these addresses:
```
TOKEN_ADDRESS=0x3281b0Ba4bF35a5C31d3dB26cDBd4e9123fe97cd
GOVERNOR_ADDRESS=0x407CCCe8EC19dBC4c77bF9023746fE1E16305d28
```

### 2. Delegate Voting Power

Delegate voting power to yourself to be able to create proposals and vote:

```shell
npx hardhat run scripts/delegate.js --network holesky
```

This will delegate all your token voting power to your address.

### 3. Create a Proposal

Create a governance proposal to mint tokens:

```shell
npx hardhat run scripts/propose.js --network holesky
```

After creation, you'll see output like:
```
Proposal ID: 53889872678364087395966941446189790935939775957304395936574097106009350359895
```

Update your `.env` file with this proposal ID:
```
PROPOSAL_ID=53889872678364087395966941446189790935939775957304395936574097106009350359895
```

The proposal will be in "Pending" state for 4 blocks (voting delay) before voting starts.

### 4. Vote on the Proposal

After the voting delay (4 blocks, about 1 minute on Holesky), vote on your proposal:

```shell
npx hardhat run scripts/vote.js --network holesky
```

The script will check if the proposal is active and cast a vote in favor of it. Voting will remain open for 240 blocks (about 1 hour on Holesky).

### 5. Execute the Proposal

After the voting period ends and if the proposal passes, execute it:

```shell
npx hardhat run scripts/execute.js --network holesky
```

You can run this script during the voting period to check the time remaining:
```
Current block: 123456
Voting ends at block: 123696
Blocks remaining: 240
Approximately 48 minutes remaining (estimate based on 12-second blocks)
```

Once voting ends and the proposal succeeds, this script will queue and execute it.

## Contract Details

### MyToken

- Standard ERC20 token with 18 decimals
- Implements ERC20Votes for voting capabilities
- Mints 10,000 tokens to the deployer during deployment
- Has a `mint` function that can only be called by the governor

### MyGovernor

- Implements OpenZeppelin Governor with the following settings:
  - Voting Delay: 4 blocks
  - Voting Period: 240 blocks
  - Proposal Threshold: 0 tokens
  - Quorum: 4% of total supply

## Script Details

- `deploy.js`: Deploys both contracts, setting up the correct references between them
- `delegate.js`: Delegates voting power from the token holder to themselves
- `propose.js`: Creates a proposal to mint 100 tokens to the proposer
- `vote.js`: Votes on an active proposal
- `execute.js`: Queues and executes a successful proposal, also shows valuable status information

## Troubleshooting

- **Insufficient Funds**: Make sure you have enough ETH in your wallet
- **Proposal Not Active**: Wait for the voting delay (4 blocks) to pass
- **Cannot Execute**: Wait for the voting period (240 blocks) to end
- **Transaction Errors**: Check the network status, or try with higher gas limits
