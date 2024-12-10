"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import deployedContracts from "../../../contracts/deployedContracts";
import { useWallet } from "../../../hooks/useWallet";
import { ethers } from "ethers";
import FlipNumbers from "react-flip-numbers";
import { getContractStore } from "~~/services/contractStore";

interface AuctionDetails {
  seller: string;
  highestBidder: string;
  highestBid: string;
  endTime: number;
  settled: boolean;
}

export default function AuctionDetails({ params }: { params: { [key: string]: string } }) {
  const { provider, account } = useWallet();
  const [details, setDetails] = useState<AuctionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [nftContract, tokenId] = (params["nftContract-tokenId"] || "").split("-");
  const [bidAmount, setBidAmount] = useState("");
  const [remainingTime, setRemainingTime] = useState("00:00:00");

  const fetchAuctionDetails = async () => {
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

      const auctionDetails = await auctionContract.getAuction(nftContract, tokenId);
      setDetails({
        seller: auctionDetails.seller,
        highestBidder: auctionDetails.highestBidder,
        highestBid: ethers.formatEther(auctionDetails.highestBid),
        endTime: Number(auctionDetails.endTime),
        settled: auctionDetails.settled,
      });
    } catch (error) {
      console.error("Error fetching auction details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    if (!provider || !account || !details) {
      alert("Please connect your wallet");
      return;
    }

    if (parseFloat(bidAmount) <= parseFloat(details.highestBid)) {
      alert("Your bid must be higher than the current highest bid.");
      return;
    }

    if (isNaN(parseFloat(bidAmount)) || parseFloat(bidAmount) <= 0) {
      alert("Please enter a valid bid amount.");
      return;
    }

    try {
      setStatus("Placing bid...");
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

      const tx = await auctionContract.placeBid(nftContract, tokenId, {
        value: ethers.parseEther(bidAmount),
      });
      await provider.waitForTransaction(tx.hash);

      setStatus("Bid placed successfully!");
      fetchAuctionDetails();
    } catch (error) {
      console.error("Error placing bid:", error);
      setStatus("Failed to place bid.");
    }
  };

  const handleSettleAuction = async () => {
    if (!provider || !account || !details) {
      alert("Please connect your wallet");
      return;
    }

    try {
      setStatus("Settling auction...");
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

      const tx = await auctionContract.settleAuction(nftContract, tokenId);
      await provider.waitForTransaction(tx.hash);

      setStatus("Auction settled successfully!");
      fetchAuctionDetails();
    } catch (error) {
      console.error("Error settling auction:", error);
      setStatus("Failed to settle auction.");
    }
  };

  useEffect(() => {
    if (!details) return;

    const calculateRemainingTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = details.endTime - now;

      if (diff <= 0) {
        setRemainingTime("00:00:00");
        return;
      }

      const hours = String(Math.floor(diff / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const seconds = String(diff % 60).padStart(2, "0");

      setRemainingTime(`${hours}:${minutes}:${seconds}`);
    };

    calculateRemainingTime();
    const timer = setInterval(calculateRemainingTime, 1000);

    return () => clearInterval(timer);
  }, [details]);

  useEffect(() => {
    if (provider && nftContract && tokenId) {
      fetchAuctionDetails();
    }
  }, [provider, nftContract, tokenId]);

  const isAuctionEnded = details && details.endTime <= Math.floor(Date.now() / 1000);

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 flex flex-col items-center px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Auction Details</h1>

        {loading && <p className="text-center text-lg">Loading auction details...</p>}

        {!loading && details && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <p className="text-lg mb-4">
              <strong>Seller:</strong> {details.seller}
            </p>
            <p className="text-lg mb-4">
              <strong>Highest Bidder:</strong> {details.highestBidder}
            </p>
            <p className="text-lg mb-4">
              <strong>Highest Bid:</strong> {details.highestBid} ETH
            </p>
            <p className="text-lg mb-4">
              <strong>End Time:</strong> {new Date(details.endTime * 1000).toLocaleString()}
            </p>
            <p className="text-lg mb-4">
              <strong>Remaining Time:</strong> {remainingTime}
            </p>
            <p className="text-lg mb-4">
              <strong>Settled:</strong> {details.settled ? "Yes" : "No"}
            </p>
            {!details.settled &&
              (!isAuctionEnded ? (
                <div>
                  <input
                    type="text"
                    placeholder="Enter your bid in ETH"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full mb-4 p-2 rounded bg-gray-700 text-white"
                  />
                  <button onClick={handleBid} className="w-full p-2 bg-blue-600 rounded hover:bg-blue-500">
                    Place Bid
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSettleAuction}
                  className="w-full p-2 bg-green-600 rounded hover:bg-green-500 mt-4"
                >
                  Settle Auction
                </button>
              ))}
          </div>
        )}

        {!loading && !details && <p className="text-center text-lg">No details found for this auction.</p>}

        {status && <p className="text-center mt-4">{status}</p>}
      </div>
    </div>
  );
}
