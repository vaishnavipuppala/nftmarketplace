"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import deployedContracts from "../../../../contracts/deployedContracts";
import { useWallet } from "../../../../hooks/useWallet";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import { getContractStore } from "~~/services/contractStore";

interface NFT {
  tokenId: string;
  name: string;
  description: string;
  image: string;
}
const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
console.log("pinata gateway url:", PINATA_GATEWAY_URL);
export default function ViewImagesFromCollection({ params }: { params: { contractaddress: string } }) {
  const { provider, account } = useWallet();
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const { contractaddress } = params;
  const [loading, setLoading] = useState(false);

  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });

  const fetchCollectionImages = async () => {
    if (!account || !provider) {
      alert("Please connect your wallet");
      return;
    }

    setLoading(true);

    try {
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      const networkId = network.chainId.toString();
      const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
      const contractStore = getContractStore(numericNetworkId, signer as unknown as ethers.Signer);

      const contract = contractStore.getCollectionContractFromAddress(contractaddress);
      if (!contract) {
        console.error("Failed to get collection contract for address:", contractaddress);
        setLoading(false);
        return;
      }
      const tokenIds: ethers.BigNumberish[] = await contract.getTokensOfOwner(account);
      const fetchedNFTs: NFT[] = [];

      for (const tokenId of tokenIds) {
        try {
          console.log("Fetching NFT with token ID:", tokenId);

          // Fetch the token URI
          const tokenURI = await contract.tokenURI(tokenId);
          console.log("Token URI:", tokenURI);

          // Extract IPFS hash from the token URI
          const ipfsHash = tokenURI.replaceAll("ipfs://", "");
          console.log("Extracted IPFS Hash:", ipfsHash);

          // Fetch metadata from Pinata using the constructed URL
          const metadataResponse = await pinata.gateways.get(ipfsHash);

          const metadata =
            typeof metadataResponse.data === "string" ? JSON.parse(metadataResponse.data) : metadataResponse.data;
          console.log("Metadata data:", metadata);

          // Format NFT metadata
          const formattedMetadata: NFT = {
            tokenId: tokenId.toString(),
            name: metadata.name || "Unknown Name",
            description: metadata.description || "No Description",
            image: metadata.image?.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") || "",
          };

          // Push formatted NFT metadata into the array
          fetchedNFTs.push(formattedMetadata);
        } catch (error) {
          console.error(`Error fetching metadata for token ID ${tokenId}:`, error);
        }
      }

      setNFTs(fetchedNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && provider) {
      fetchCollectionImages();
    }
  }, [account, provider]);

  return (
    <>
      <div className="flex flex-col items-center pt-10">
        <h1 className="block text-4xl font-bold text-base-content mb-6">Your NFTs</h1>

        {/* Loading state */}
        {loading && <p className="text-lg font-semibold text-base-content">Loading NFTs...</p>}

        {/* No NFTs found */}
        {!loading && nfts.length === 0 && <p className="text-lg font-semibold text-base-content">No NFTs found</p>}

        {/* NFT Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6 w-full max-w-5xl">
          {nfts.map(nft => (
            <div
              key={nft.tokenId}
              className="bg-base-100 shadow-md rounded-xl p-6 text-center flex flex-col items-center"
            >
              <img src={nft.image} alt={nft.name} className="w-full h-auto rounded-lg mb-4" />
              <h3 className="text-xl font-semibold text-base-content mb-2">{nft.name}</h3>
              <p className="text-sm text-base-content mb-2">{nft.description}</p>
              <p className="text-sm text-gray-500">
                <strong>Token ID:</strong> {nft.tokenId}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
