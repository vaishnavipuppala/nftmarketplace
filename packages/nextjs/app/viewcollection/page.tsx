"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import deployedContracts from "~~/contracts/deployedContracts";
import { getContractStore } from "~~/services/contractStore";

const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL!;

const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });

interface NFTCollection {
  name: string;
  symbol: string;
  contractAddress: string;
  createdBy: string;
}

export default function ViewCollections() {
  const { provider, account } = useWallet();
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchAllCollections = async () => {
    if (!account || !provider) {
      alert("Please connect your wallet");
      return;
    }

    setLoading(true);

    const fetchedCollections: NFTCollection[] = [];
    try {
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      const numericNetworkId = network.chainId;

      const contractStore = getContractStore(numericNetworkId, signer as unknown as ethers.Signer);
      const registryContract = contractStore.getRegistryContract();
      if (!registryContract) {
        console.error("Failed to get registry contract.");
        return;
      }
      const collectionContractAddresses: string[] = await registryContract.getCollectionsByOwner(account);
      if (!collectionContractAddresses.length) {
        console.log("No collections found for this account.");
        return [];
      }

      for (const contractAddress of collectionContractAddresses) {
        const collectionMetadata = await registryContract.getCollectionMetadata(contractAddress);
        fetchedCollections.push({
          name: collectionMetadata.name,
          symbol: collectionMetadata.symbol,
          contractAddress,
          createdBy: account,
        });
      }
      setCollections(fetchedCollections);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && provider) {
      fetchAllCollections();
    }
  }, [account, provider]);

  const handleAdd = (contractAddress: string) => {
    router.push(`/viewcollection/${contractAddress}/add`);
  };

  const handleView = (contractAddress: string) => {
    router.push(`/viewcollection/${contractAddress}/view`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 flex flex-col items-center px-6">
      <h1 className="text-4xl font-extrabold text-white mt-10">Your NFT Collections</h1>

      {/* Loading state */}
      {loading && <p className="text-lg text-white mt-6">Loading your NFT collections...</p>}

      {/* No NFTs found */}
      {!loading && collections.length === 0 && (
        <p className="text-lg text-white mt-6">No NFT collections found.</p>
      )}

      {/* Collection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6 w-full max-w-6xl">
        {collections.map((collection) => (
          <div
            key={collection.contractAddress}
            className="bg-white shadow-lg rounded-lg p-6 text-center flex flex-col items-center transform transition hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{collection.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{collection.symbol}</p>
            <p className="text-sm text-gray-500">
              <strong>Contract:</strong> {collection.contractAddress}
            </p>
            <div className="flex space-x-4 mt-4">
              {/* Add Button */}
              <button
                onClick={() => handleAdd(collection.contractAddress)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition"
              >
                Add
              </button>
              {/* View Button */}
              <button
                onClick={() => handleView(collection.contractAddress)}
                className="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
