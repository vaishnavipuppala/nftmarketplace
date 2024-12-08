"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BookOpenIcon, FaceSmileIcon, PlusCircleIcon, ShoppingBagIcon, WrenchIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10 bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
        <div className="px-5 text-center">
          <h1 className="text-center">
            <span className="block text-3xl sm:text-4xl mb-2 font-light text-gray-600">Welcome to</span>
            <span className="block text-5xl sm:text-6xl font-extrabold text-blue-600 tracking-tight">
              NFT Collection Creator
            </span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row mt-4">
            <p className="my-2 font-medium text-gray-600">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>

          <p className="text-center text-lg font-semibold text-gray-700 mt-6">
            <FaceSmileIcon className="h-6 w-6 inline-block text-yellow-500 animate-spin-slow" /> Happy Image Minting{" "}
            <FaceSmileIcon className="h-6 w-6 inline-block text-yellow-500 animate-spin-slow" />
          </p>
        </div>

        <div className="flex-grow w-full mt-16 px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col bg-white px-10 py-10 text-center items-center max-w-xs rounded-3xl shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105">
              <PlusCircleIcon className="h-12 w-12 text-blue-500 mb-4 animate-bounce" />
              <p className="text-gray-600 font-medium">
                Create your own NFT collections using the{" "}
                <Link href="/createcollection" passHref className="link text-blue-600 hover:underline">
                  Create Collections
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-white px-10 py-10 text-center items-center max-w-xs rounded-3xl shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105">
              <BookOpenIcon className="h-12 w-12 text-green-500 mb-4 animate-pulse" />
              <p className="text-gray-600 font-medium">
                View your NFT collections on the{" "}
                <Link href="/viewcollection" passHref className="link text-green-600 hover:underline">
                  View Collections
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-white px-10 py-10 text-center items-center max-w-xs rounded-3xl shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105">
              <WrenchIcon className="h-12 w-12 text-purple-500 mb-4 animate-spin" />
              <p className="text-gray-600 font-medium">
                View all active auctions of NFTs on the{" "}
                <Link href="/viewauction" passHref className="link text-purple-600 hover:underline">
                  View Auctions
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-white px-10 py-10 text-center items-center max-w-xs rounded-3xl shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105">
              <ShoppingBagIcon className="h-12 w-12 text-orange-500 mb-4 animate-wiggle" />
              <p className="text-gray-600 font-medium">
                View all your purchased NFTs on the{" "}
                <Link href="/purchasednfts" passHref className="link text-orange-600 hover:underline">
                  View Purchased NFTs
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
