"use client";

import { useState } from "react";
import deployedContracts from "../../../../contracts/deployedContracts";
import { useWallet } from "../../../../hooks/useWallet";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import { getContractStore } from "~~/services/contractStore";

const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
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

      console.log("Network ID:", numericNetworkId);
      console.log("Contract Address:", contractaddress);

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
    <div className="flex items-center flex-col flex-grow pt-10">
      <h1 className="block text-4xl font-bold">Create Your NFT</h1>
      <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
        <div className="mb-6">
          <label className="block font-semibold mb-2 text-base-content">Name</label>
          <input
            type="text"
            placeholder="Enter NFT Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2 text-base-content">Description</label>
          <textarea
            placeholder="Enter NFT Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={4}
          ></textarea>
        </div>
        <div
          className={`mb-6 border-2 ${isDragActive ? "border-blue-500" : "border-gray-300"} rounded-lg p-4 text-center`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="text-base-content">
            Drag and drop an image here, or{" "}
            <label htmlFor="file-upload" className="cursor-pointer text-blue-500 underline">
              browse
            </label>
          </p>
          <input id="file-upload" type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
          {image && <p className="mt-2 text-base-content">{image.name}</p>}
        </div>
        <button
          onClick={handleImageUpload}
          disabled={!provider}
          className="w-full btn btn-primary font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {provider ? "Mint NFT" : "Connect Wallet to Mint"}
        </button>
        {status && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">{status}</p>
          </div>
        )}
        <div className="mt-4 text-center">
          {!account && (
            <button onClick={connectWallet} className="text-blue-600 hover:underline font-semibold">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
