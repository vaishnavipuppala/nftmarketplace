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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbFx...";
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
    <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 flex flex-col items-center px-6">
      <h1 className="text-4xl font-extrabold text-white mt-6">Your NFT Collection</h1>

      {/* Loading state */}
      {loading && <p className="text-xl font-medium text-white mt-6">Fetching your NFTs...</p>}

      {/* No NFTs */}
      {!loading && nfts.length === 0 && <p className="text-xl font-medium text-white mt-6">No NFTs found</p>}

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 w-full max-w-6xl">
        {nfts.map((nft) => (
          <div
            key={nft.tokenId}
            className="bg-white shadow-xl rounded-xl p-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300"
          >
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">{nft.name}</h3>
            <p className="text-gray-600 text-center mb-4">{nft.description}</p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>Token ID:</strong> {nft.tokenId}
            </p>
            <button
              onClick={() => handleCreateAuction(nft.contractAddress, nft.tokenId)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-200"
            >
              Create Auction
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
