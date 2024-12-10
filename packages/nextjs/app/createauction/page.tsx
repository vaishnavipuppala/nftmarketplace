"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import deployedContracts from "../../contracts/deployedContracts";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import { getContractStore } from "~~/services/contractStore";

const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

function CreateAuctionComponent() {
  const { provider, account } = useWallet();
  const [startingBid, setStartingBid] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [status, setStatus] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [creatingAuction, setCreatingAuction] = useState(false);

  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });

  const searchParams = useSearchParams();
  const contractaddress = searchParams.get("contractaddress");
  const tokenid = searchParams.get("tokenid");

  const fetchAuctionImage = async () => {
    if (!contractaddress || !tokenid || !provider) {
      return;
    }

    try {
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      const networkId = network.chainId.toString();
      const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
      const contractStore = getContractStore(numericNetworkId, signer as unknown as ethers.Signer);

      const collectionContract = contractStore.getCollectionContractFromAddress(contractaddress);
      if (!collectionContract) {
        console.error("Failed to get collection contract.");
        return;
      }

      const tokenURI = await collectionContract.tokenURI(tokenid);
      const metadataIpfs = tokenURI.replaceAll("ipfs://", "");
      const metadataFile = await pinata.gateways.get(metadataIpfs);
      const metadata = typeof metadataFile.data === "string" ? JSON.parse(metadataFile.data) : metadataFile.data;
      const imageUrl = metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") || "";
      setImageUrl(imageUrl);
    } catch (error) {
      console.error("Failed to fetch auction image:", error);
    }
  };

  useEffect(() => {
    fetchAuctionImage();
  }, [contractaddress, tokenid, provider]);

  const handleCreateAuction = async () => {
    if (!provider || !account || !startingBid || !hours || !minutes || !seconds || !contractaddress || !tokenid) {
      alert("Please provide all required inputs and connect your wallet.");
      return;
    }
    if (parseInt(startingBid) <= 0) {
      alert("Starting bid must be greater than 0.");
      return;
    }
    if (parseInt(hours) <= 0 && parseInt(minutes) <= 0 && parseInt(seconds) <= 0) {
      alert("Duration must be greater than 0.");
      return;
    }

    try {
      setStatus("Creating auction...");
      setCreatingAuction(true);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      const networkId = network.chainId.toString();
      const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
      const contractStore = getContractStore(numericNetworkId, signer as unknown as ethers.Signer);

      const collectionContract = contractStore.getCollectionContractFromAddress(contractaddress);
      if (!collectionContract) {
        console.error("Failed to get collection contract.");
        return;
      }

      const isApproved = await collectionContract.isApprovedForAll(
        account,
        deployedContracts[numericNetworkId].NFTAuction.address,
      );
      if (!isApproved) {
        setStatus("Setting approval for auction contract...");
        const tx = await collectionContract.setApprovalForAll(
          deployedContracts[numericNetworkId].NFTAuction.address,
          true,
        );
        await provider.waitForTransaction(tx.hash);
      }

      setStatus("Creating auction...");
      const auctionContract = contractStore.getAuctionContract();
      if (!auctionContract) {
        console.error("Failed to get auction contract.");
        return;
      }
      const duration = parseInt(hours) * 60 * 60 + parseInt(minutes) * 60 + parseInt(seconds);
      const tx = await auctionContract.createAuction(
        contractaddress,
        tokenid,
        ethers.parseEther(startingBid),
        duration,
      );
      const receipt = await provider.waitForTransaction(tx.hash);
      if (receipt.status !== 1) {
        console.error("Failed to create auction.");
        return;
      }
      setStatus("Auction created successfully!");
    } catch (error) {
      setStatus("Failed to create auction!");
      console.error("Failed to create auction:", error);
    }
  };

  return (
    <>
     <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 flex flex-col items-center px-6">
      <div className="flex flex-col items-center pt-10">
        <h1 className="block text-4xl font-bold text-base-content mb-6">Create Auction</h1>
        <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
          <div className="flex flex-col items-start mb-6 w-full max-w-lg">
            <p className="text-lg text-base-content text-center">
              <strong>Contract Address:</strong> {contractaddress?.slice(0, 8)}...{contractaddress?.slice(-6)}
            </p>
            <p className="text-lg text-base-content text-center">
              <strong>Token ID:</strong> {tokenid}
            </p>
          </div>
          {imageUrl && (
            <div className="flex justify-center items-center mb-6">
              <img src={imageUrl} alt="NFT Image" className="w-full h-64 object-cover rounded-lg shadow-md" />
            </div>
          )}
          <div className="mb-6">
            <label className="block font-semibold mb-2">Starting Bid</label>
            <div className="flex items-center mb-6">
              <input
                type="number"
                placeholder="Enter Collection Name"
                value={startingBid}
                onChange={e => setStartingBid(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <span className="ml-2 text-base-content">ETH</span>
            </div>
          </div>
          <div className="mb-6">
            <label className="block font-semibold mb-2">Duration</label>
            <div className="flex items-center">
              <input
                type="number"
                placeholder="HH"
                value={hours}
                onChange={e => setHours(e.target.value)}
                className="w-full px-4 py-2 border rounded-l-lg text-center"
              />
              <span className="px-2 py-2 font-semibold">:</span>
              <input
                type="number"
                placeholder="MM"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                className="w-full px-4 py-2 border text-center"
              />
              <span className="px-2 py-2 font-semibold">:</span>
              <input
                type="number"
                placeholder="SS"
                value={seconds}
                onChange={e => setSeconds(e.target.value)}
                className="w-full px-4 py-2 border rounded-r-lg text-center"
              />
            </div>
          </div>
          <button
            onClick={handleCreateAuction}
            disabled={creatingAuction}
            className={`w-full btn btn-primary font-bold flex items-center justify-center ${
              creatingAuction ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {creatingAuction ? "Creating Auction..." : "Create Auction"}
          </button>
          {status && <p className="text-sm text-center mt-4">{status}</p>}
        </div>
      </div>
    </div>
    </>
  );
}

export default function CreateAuction() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateAuctionComponent />
    </Suspense>
  );
}