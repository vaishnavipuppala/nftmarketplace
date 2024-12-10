"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import deployedContracts from "~~/contracts/deployedContracts";
import { getContractStore } from "~~/services/contractStore";

const PINATA_JWT = "YOUR_PINATA_JWT";
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
