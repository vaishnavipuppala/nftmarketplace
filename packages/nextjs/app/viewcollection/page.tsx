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
console.log("PINATA_JWT:", process.env.NEXT_PUBLIC_PINATA_JWT);
console.log("RPC URL:", process.env.NEXT_PUBLIC_RPC_URL);

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
      const networkId = network.chainId.toString();
      const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
      const contractStore = getContractStore(numericNetworkId, signer as unknown as ethers.Signer);
      const registryConract = contractStore.getRegistryContract();
      if (!registryConract) {
        console.error("Failed to get registry contract.");
        return;
      }
      const collectionContractAddresses: string[] = await registryConract.getCollectionsByOwner(account);
      if (!collectionContractAddresses.length) {
        console.log("No collections found for this account.");
        return [];
      }

      for (const contractAddress of collectionContractAddresses) {
        const collectionMetadata = await registryConract.getCollectionMetadata(contractAddress);
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
    <>
      <div className="flex flex-col items-center pt-10">
        <h1 className="block text-4xl font-bold text-base-content mb-6">Your NFTs</h1>

        {/* Loading state */}
        {loading && <p className="text-lg font-semibold text-base-content">Loading NFTs...</p>}

        {/* No NFTs found */}
        {!loading && collections.length === 0 && (
          <p className="text-lg font-semibold text-base-content">No NFTs found</p>
        )}

        {/* NFT Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6 w-full max-w-5xl">
          {collections.map(collection => (
            <div
              key={collection.contractAddress}
              className="bg-base-100 shadow-md rounded-xl p-6 text-center flex flex-col items-center"
            >
              <h3 className="text-xl font-semibold text-base-content mb-2">{collection.name}</h3>
              <p className="text-sm text-base-content mb-2">{collection.symbol}</p>
              <div className="flex space-x-4 mt-4">
                {/* Add Button */}
                <button onClick={() => handleAdd(collection.contractAddress)} className="btn btn-primary">
                  Add
                </button>
                {/* View Button */}
                <button onClick={() => handleView(collection.contractAddress)} className="btn btn-secondary">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
