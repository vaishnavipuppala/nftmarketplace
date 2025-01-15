# Decentralized NFT Marketplace

## Project Overview
This project is a decentralized NFT marketplace built to enable users to create NFT collections and auction their NFTs. The platform operates entirely on the blockchain with no backend, ensuring transparency and decentralization.

---

## Features

### Part 1: NFT Collection Creator
- **Create NFT Collections**: Users can upload images from an IPFS URL to create their NFT collections.
- **View NFT Collections**: Displays all created NFTs in a single view for easy accessibility.
- **Decentralized Smart Contracts**:
  - Each NFT collection deploys a unique ERC-721 smart contract.
  - Uses OpenZeppelin’s ERC-721 implementation for robust standards compliance.

### Part 2: NFT Auction
- **Auction NFTs**: Users can auction their NFTs directly from the user interface.
- **Decentralized Auctions**:
  - Fully decentralized, with no backend reliance.
  - Supports various auction types (e.g., English Auction, Dutch Auction).
- **Real-Time Updates**: Updates auction status and bidding information in real-time.

---

## Tools and Technologies Used
- **Frameworks and Libraries**:
  - [ScaffoldEth](https://scaffoldeth.io/): Pre-configured setup for Ethereum development.
  - [Next.js](https://nextjs.org/): Frontend framework for building the web app.
  - [Wagmi](https://wagmi.sh/): Ethereum React hooks library for seamless wallet integration.
- **Smart Contract Development**:
  - [Foundry](https://book.getfoundry.sh/): Toolchain for building and testing smart contracts.
  - [OpenZeppelin ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721): Standard implementation for NFT contracts.
- **Infrastructure**:
  - [Tenderly](https://docs.tenderly.co/virtual-testnets): Virtual testnet for deploying and testing smart contracts.
  - [IPFS](https://ipfs.tech/): Decentralized storage for NFT metadata.
- **Deployment**:
  - [Vercel](https://vercel.com/): Hosting platform for the decentralized web app.

---

## Installation and Setup

### Prerequisites
- Node.js and npm installed.
- A crypto wallet (e.g., MetaMask) for interacting with the app.
- Access to a Tenderly testnet.

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Add your IPFS gateway URL and Tenderly configuration to `.env.local`.
4. Deploy contracts:
   ```bash
   forge script Deploy --rpc-url <tenderly-rpc-url>
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Access the app at [http://localhost:3000](http://localhost:3000).

---

## Usage

### Part 1: Creating an NFT Collection
1. Enter the IPFS URL containing your images.
2. Click **Create Collection**.
3. View all NFTs in the created collection on the homepage.

### Part 2: Auctioning NFTs
1. Select an NFT from your collection.
2. Set up an auction by providing auction details (e.g., starting price, auction type).
3. Allow other users to place bids through the interface.
4. End the auction and transfer ownership to the highest bidder.


