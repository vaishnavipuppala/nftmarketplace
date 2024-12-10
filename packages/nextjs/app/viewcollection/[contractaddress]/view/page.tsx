"use client";

import { useEffect, useState } from "react";
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
const PINATA_JWT = "YOUR_PINATA_JWT";
const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

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
      const numericNetworkId = network.chainId;

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
          const tokenURI = await contract.tokenURI(tokenId);
          const ipfsHash = tokenURI.replace("ipfs://", "");
          const metadataResponse = await pinata.gateways.get(ipfsHash);
          const metadata =
            typeof metadataResponse.data === "string" ? JSON.parse(metadataResponse.data) : metadataResponse.data;

          const formattedMetadata: NFT = {
            tokenId: tokenId.toString(),
            name: metadata.name || "Unknown Name",
            description: metadata.description || "No Description",
            image: metadata.image?.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") || "",
          };

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
    <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 flex flex-col items-center px-6">
      <h1 className="text-4xl font-extrabold text-white mt-10">Your NFT Collection</h1>

      {/* Loading state */}
      {loading && <p className="text-lg text-white mt-6">Loading NFTs...</p>}

      {/* No NFTs found */}
      {!loading && nfts.length === 0 && <p className="text-lg text-white mt-6">No NFTs found</p>}

      {/* NFT Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6 w-full max-w-6xl">
        {nfts.map((nft) => (
          <div
            key={nft.tokenId}
            className="bg-white shadow-lg rounded-lg p-6 text-center flex flex-col items-center transform transition hover:scale-105"
          >
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-48 object-cover rounded-lg mb-4 border border-gray-200 shadow-sm"
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{nft.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{nft.description}</p>
            <p className="text-sm text-gray-500">
              <strong>Token ID:</strong> {nft.tokenId}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
