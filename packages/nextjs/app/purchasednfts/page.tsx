"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import deployedContracts from "../../contracts/deployedContracts";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import { getContractStore } from "~~/services/contractStore";

interface NFT {
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
}

const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

export default function PurchasedNFTs() {
  const { provider, account } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });

  const fetchNFTs = async () => {
    if (!provider || !account) {
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

      const registryContract = contractStore.getRegistryContract();
      if (!registryContract) {
        console.error("Failed to get registry contract");
        return;
      }

      const auctionContract = contractStore.getAuctionContract();
      if (!auctionContract) {
        console.error("Failed to get auction contract");
        return;
      }

      const collections = await registryContract.getAllCollections();
      for (const collection of collections) {
        const collectionContract = contractStore.getCollectionContractFromAddress(collection);
        if (!collectionContract) {
          console.error("Failed to get collection contract");
          return;
        }

        const tokenIds: ethers.BigNumberish[] = await collectionContract.getTokensOfOwner(account);
        const fetchedNFTs: NFT[] = [];

        for (const tokenId of tokenIds) {
          console.log("tokenId", tokenId);
          console.log("collection", collection);
          const auctionedNFTs = await auctionContract.isAuctionSettled(collection, tokenId);
          console.log("auctionedNFTs", auctionedNFTs);
          if (!auctionedNFTs) {
            continue;
          }
          const tokenURI = await collectionContract.tokenURI(tokenId);
          const metadataIpfs = tokenURI.replace("ipfs://", "");
          const metadataFile = await pinata.gateways.get(metadataIpfs);
          const metadata = typeof metadataFile.data === "string" ? JSON.parse(metadataFile.data) : metadataFile.data;
          const formattedMetadata: NFT = {
            contractAddress: collection,
            tokenId: tokenId.toString(),
            name: metadata.name || "Unknown Name",
            description: metadata.description || "No Description",
            image: metadata.image?.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") || "",
          };
          fetchedNFTs.push(formattedMetadata);
        }
        setNfts(fetchedNFTs);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuction = (contractAddress: string, tokenId: string) => {
    router.push(`/createauction?contractaddress=${contractAddress}&tokenid=${tokenId}`);
  };

  useEffect(() => {
    if (provider && account) {
      fetchNFTs();
    }
  }, [provider, account]);

  return (
    <>
     <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 flex flex-col items-center px-6">
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
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={() => handleCreateAuction(nft.contractAddress, nft.tokenId)}
                  className="btn btn-primary"
                >
                  Auction
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}