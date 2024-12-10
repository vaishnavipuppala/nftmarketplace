"use client";

import { useState } from "react";
import deployedContracts from "../../../../contracts/deployedContracts";
import { useWallet } from "../../../../hooks/useWallet";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import { getContractStore } from "~~/services/contractStore";

const PINATA_JWT = "YOUR_PINATA_JWT";
const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

export default function AddToCollection({ params }: { params: { contractaddress: string } }) {
  const { provider, connectWallet, account } = useWallet();
  const { contractaddress } = params;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });

  const handleImageUpload = async () => {
    if (!provider || !image || !name || !description) {
      alert("Please provide all required inputs and connect your wallet.");
      return;
    }

    setStatus("Preparing to mint NFT...");
    try {
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      const numericNetworkId = network.chainId;

      const contractStore = getContractStore(numericNetworkId, signer as unknown as ethers.Signer);
      const contract = contractStore.getCollectionContractFromAddress(contractaddress);

      if (!contract) {
        throw new Error("Failed to get collection contract for the provided address.");
      }

      setStatus("Uploading image to Pinata...");
      const renamedImage = new File([image], `${Date.now()}-${image.name}`, { type: image.type });
      const imageResponse = await pinata.upload.file(renamedImage);
      const imageUrl = `ipfs://${imageResponse.IpfsHash}`;

      setStatus("Uploading metadata to Pinata...");
      const metadata = { name, description, image: imageUrl };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const metadataFile = new File([metadataBlob], `${imageResponse.IpfsHash}_metadata.json`);
      const metadataResponse = await pinata.upload.file(metadataFile);
      const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;

      setStatus("Minting NFT...");
      const tx = await contract.mintToken(account, metadataUrl);
      setStatus("Waiting for transaction to be mined...");
      const receipt = await provider.waitForTransaction(tx.hash);

      if (receipt.status === 1) {
        setStatus("NFT minted successfully!");
      } else {
        setStatus("Transaction failed. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setStatus("Failed to upload image.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 flex flex-col items-center px-6">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-3xl">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-8">Create Your NFT</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Name</label>
            <input
              type="text"
              placeholder="Enter NFT Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <textarea
              placeholder="Enter NFT Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              rows={4}
            ></textarea>
          </div>

          <div
            className={`p-6 border-2 rounded-lg text-center ${
              isDragActive ? "border-purple-400" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p className="text-gray-600">
              Drag and drop an image here, or{" "}
              <label htmlFor="file-upload" className="cursor-pointer text-purple-600 underline">
                browse
              </label>
            </p>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            {image && <p className="mt-4 text-gray-700">{image.name}</p>}
          </div>

          <button
            onClick={handleImageUpload}
            disabled={!provider}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {provider ? "Mint NFT" : "Connect Wallet to Mint"}
          </button>

          {status && <p className="mt-4 text-center text-gray-600">{status}</p>}

          {!account && (
            <div className="text-center">
              <button
                onClick={connectWallet}
                className="text-purple-600 font-semibold underline hover:text-purple-800"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
