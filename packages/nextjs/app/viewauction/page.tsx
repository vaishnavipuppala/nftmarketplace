"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import deployedContracts from "../../contracts/deployedContracts";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import { getContractStore } from "~~/services/contractStore";

const PINATA_JWT = "YOUR_PINATA_JWT";
const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

interface Auction {
  nftContract: string;
  tokenId: string;
  image?: string;
}

export default function ViewAuctions() {
  const { provider } = useWallet();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });

  const fetchActiveAuctions = async () => {
    if (!provider) {
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

      const auctionContract = contractStore.getAuctionContract();
      if (!auctionContract) {
        console.error("Failed to get auction contract");
        return;
      }

      const activeAuctions = await auctionContract.getAllActiveAuctions();
      const formattedAuctions: Auction[] = await Promise.all(
        activeAuctions.map(async (auction: any) => {
          const collectionContract = contractStore.getCollectionContractFromAddress(auction.nftContract);
          let image = "";

          if (collectionContract) {
            try {
              const tokenURI = await collectionContract.tokenURI(auction.tokenId);
              const metadataIpfs = tokenURI.replaceAll("ipfs://", "");
              const metadataFile = await pinata.gateways.get(metadataIpfs);
              const metadata =
                typeof metadataFile.data === "string" ? JSON.parse(metadataFile.data) : metadataFile.data;
              image = metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") || "";
            } catch (error) {
              console.error(`Failed to fetch tokenURI for ${auction.nftContract} - ${auction.tokenId}`, error);
            }
          }

          return {
            nftContract: auction.nftContract,
            tokenId: auction.tokenId.toString(),
            image,
          };
        }),
      );

      setAuctions(formattedAuctions);
    } catch (error) {
      console.error("Error fetching active auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (provider) {
      fetchActiveAuctions();
    }
  }, [provider]);

  const handleViewDetails = (nftContract: string, tokenId: string) => {
    router.push(`/viewauction/${nftContract}-${tokenId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 flex flex-col items-center px-6">
      <h1 className="text-4xl font-extrabold text-white mb-8">Active Auctions</h1>

      {loading && <p className="text-lg text-gray-300">Loading auctions...</p>}

      {!loading && auctions.length === 0 && (
        <p className="text-lg text-gray-300">No active auctions found</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6 w-full max-w-6xl">
        {auctions.map((auction) => (
          <div
            key={`${auction.nftContract}-${auction.tokenId}`}
            className="bg-white shadow-xl rounded-lg overflow-hidden transform transition hover:scale-105"
          >
            {auction.image ? (
              <img
                src={auction.image}
                alt={`NFT from ${auction.nftContract} with Token ID ${auction.tokenId}`}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gray-200">
                <span className="text-gray-500">No Image Available</span>
              </div>
            )}
            <div className="p-4">
              <p className="text-sm text-gray-500">
                <strong>Contract Address:</strong> {auction.nftContract}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Token ID:</strong> {auction.tokenId}
              </p>
              <button
                onClick={() => handleViewDetails(auction.nftContract, auction.tokenId)}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
