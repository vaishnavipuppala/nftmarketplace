import { ethers } from "ethers";
import { notification } from "~~/utils/scaffold-eth";

// Function to deploy NFT Collection contract
export const deployNFTCollection = async (nftFactory: any, name: string, symbol: string, imageURI: string, walletClient: any) => {
  try {
    // Call the smart contract to create the collection
    const tx = await nftFactory.createCollection(name, symbol, imageURI, {
      from: walletClient.account,
    });

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      notification.success("Collection created successfully!");
      return true;
    } else {
      notification.error("Transaction failed");
      return false;
    }
  } catch (error) {
    console.error("Error deploying NFT Collection:", error);
    notification.error("Failed to create NFT Collection");
    return false;
  }
};
