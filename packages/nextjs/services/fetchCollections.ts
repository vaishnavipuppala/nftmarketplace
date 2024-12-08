import { ethers } from "ethers";
import deployedContracts from "../contracts/deployedContracts";
import { Web3Provider } from "@ethersproject/providers";
import { PinataSDK } from "pinata-web3";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT!;
const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL!;

const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY_URL,
});

interface NFTMetadata {
  tokenId: string;
  name: string;
  description: string;
  image: string;
}

export const fetchCollections = async (
  provider: Web3Provider,
  account: string
): Promise<NFTMetadata[]> => {
  if (!PINATA_GATEWAY_URL) {
    throw new Error("PINATA_GATEWAY_URL is not defined. Check your environment variables.");
  }

  try {
    console.log("Fetching collections for account:", account);
    const signer = provider.getSigner();
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.chainId);

    const networkId = network.chainId.toString();
    const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
    const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;

    if (!contractInfo) {
      throw new Error(`NFTCollection contract is not deployed on network ${networkId}`);
    }

    const contract = new ethers.Contract(
      contractInfo.address,
      contractInfo.abi,
      signer as unknown as ethers.Signer
    );

    const tokenIds: ethers.BigNumberish[] = await contract.getTokensOfOwner(account);
    console.log("Token IDs:", tokenIds);

    const collections = await Promise.all(
      tokenIds.map(async (tokenId) => {
        try {
          console.log("Fetching metadata for token ID:", tokenId);

          const tokenURI = await contract.tokenURI(tokenId);
          console.log("Token URI:", tokenURI);

          // Format IPFS URL
          const metadataIpfs = tokenURI.replace("ipfs://", "");
          const metadataUrl = `${PINATA_GATEWAY_URL}/${metadataIpfs}`;
          console.log("Metadata URL:", metadataUrl);

          const metadataResponse = await fetch(metadataUrl);
          if (!metadataResponse.ok) {
            throw new Error(`Failed to fetch metadata for token ID: ${tokenId}`);
          }

          const metadata = await metadataResponse.json();
          console.log("Metadata:", metadata);

          return {
            tokenId: tokenId.toString(),
            name: metadata.name || "Unknown Name",
            description: metadata.description || "No Description",
            image: metadata.image?.replace("ipfs://", `${PINATA_GATEWAY_URL}/`) || "",
          };
        } catch (error) {
          console.error("Error fetching metadata for token ID:", tokenId, error);
          return null;
        }
      })
    );

    return collections.filter(Boolean) as NFTMetadata[];
  } catch (error) {
    console.error("Error fetching collections:", error);
    throw error;
  }
};
