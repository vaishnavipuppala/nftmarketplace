// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }
"use client";

import { useState } from "react";
import deployedContracts from "../../contracts/deployedContracts";
import { useWallet } from "../../hooks/useWallet";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import { getContractStore } from "~~/services/contractStore";

// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

// "use client";
// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";
// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state
//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });
//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };
//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };
//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }
//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }
//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }
//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }
//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);
//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };
//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>
//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

// "use client";

// import { useState } from "react";
// import deployedContracts from "../../contracts/deployedContracts";
// import { useWallet } from "../../hooks/useWallet";
// import { ethers } from "ethers";
// import { PinataSDK } from "pinata-web3";

// const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

// export default function CreateCollection() {
//   const { provider, account } = useWallet();
//   const [name, setName] = useState("");
//   const [symbol, setSymbol] = useState("");
//   const [file, setFile] = useState<File | null>(null);  // File state can be null initially
//   const [status, setStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false); // Track dragging state

//   const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });

//   // Handle file processing
//   const processFile = (file: File | null) => {
//     if (!file) {
//       alert("No file selected");
//       return;
//     }

//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file.");
//       return;
//     }
//     setFile(file); // Update file state
//   };

//   // Handle drag events
//   const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };

//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     const droppedFile = e.dataTransfer.files[0];
//     if (droppedFile) processFile(droppedFile);
//   };

//   const handleDeployCollection = async () => {
//     if (!provider || !file || !name || !symbol) {
//       alert("Please provide all required inputs and connect your wallet.");
//       return;
//     }

//     setStatus("Deploying new NFT collection contract...");
//     try {
//       const signer = provider.getSigner();
//       const network = await provider.getNetwork();
//       const networkId = network.chainId.toString();
//       const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
//       const contractInfo = deployedContracts[numericNetworkId]?.NFTCollection;
//       if (!contractInfo) {
//         alert(`NFTCollection contract is not deployed on network ${numericNetworkId}`);
//         return;
//       }

//       const factory = new ethers.ContractFactory(
//         contractInfo.abi,
//         contractInfo.bytecode,
//         signer as unknown as ethers.Signer
//       );
//       const contract = await factory.deploy(name, symbol);
//       const deploymentTx = contract.deploymentTransaction();
//       if (!deploymentTx) {
//         throw new Error("Deployment transaction not found. Deployment might have failed.");
//       }

//       const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
//       if (receipt.status === 1) {
//         console.log("✅ Contract deployed successfully at address:", contract.target);
//       } else {
//         console.error("❌ Deployment failed. Receipt status:", receipt?.status);
//       }

//       const contractAddress = receipt.contractAddress;
//       console.log("Creating metadata...");
//       const metadata = { name, symbol, contractAddress, createdBy: account };
//       const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
//       console.log("Metadata uploaded to Pinata:", metadataUrl);

//       console.log("Minting NFT...");
//       const deployedParentContract = new ethers.Contract(
//         contractInfo.address,
//         contractInfo.abi,
//         signer as unknown as ethers.Signer
//       );
//       const tx = await deployedParentContract.mintToken(account, metadataUrl);
//       const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
//       if (mintedCollectionReceipt.status === 1) {
//         console.log("✅ NFT minted successfully!");
//         setStatus(`Contract deployed successfully at ${contractAddress}`);
//       } else {
//         setStatus("Deployment failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error deploying contract:", error);
//       setStatus("Failed to deploy contract.");
//     }
//   };

//   return (
//     <div className="flex flex-col items-center pt-10">
//       <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
//       <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Collection Name</label>
//           <input
//             type="text"
//             placeholder="Enter Collection Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block font-semibold mb-2">Symbol</label>
//           <input
//             type="text"
//             placeholder="Enter Symbol"
//             value={symbol}
//             onChange={(e) => setSymbol(e.target.value)}
//             className="w-full px-4 py-2 border rounded-lg"
//           />
//         </div>

//         {/* Drag and drop area for file */}
//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
//             ${isDragging ? "border-primary bg-primary/10" : file ? "border-primary" : "border-gray-300"}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => document.getElementById("file-upload")?.click()}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           {file ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">{file.name}</span>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 className="w-12 h-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                 />
//               </svg>
//               <p className="text-gray-600">Drag and drop an image here or click to browse</p>
//               <p className="text-sm text-gray-500">Supported formats: PNG, JPG, GIF</p>
//             </div>
//           )}
//           <input
//             id="file-upload"
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={(e) => processFile(e.target.files?.[0] || null)}
//           />
//         </div>

//         <button
//           onClick={handleDeployCollection}
//           disabled={!provider || status.includes("Deploying")}
//           className={`w-full btn btn-primary font-bold flex items-center justify-center ${
//             status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {status.includes("Deploying") ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//               </svg>
//               Deploying...
//             </>
//           ) : (
//             "Deploy Collection"
//           )}
//         </button>
//         {status && <p className="mt-6">{status}</p>}
//       </div>
//     </div>
//   )
// }

const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

export default function CreateCollection() {
  const { provider, account } = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [status, setStatus] = useState("");

  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY_URL });

  const handleDeployCollection = async () => {
    if (!provider || !name || !symbol) {
      alert("Please provide all required inputs and connect your wallet.");
      return;
    }

    setStatus("Deploying new NFT collection contract...");
    try {
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      const networkId = network.chainId.toString();
      const numericNetworkId = parseInt(networkId, 10) as keyof typeof deployedContracts;
      const contractStore = getContractStore(numericNetworkId, signer as unknown as ethers.Signer);
      const factory = contractStore.getCollectionContractFactory();
      if (!factory) {
        console.error("Failed to get collection contract factory.");
        return;
      }
      const contract = await factory.deploy(name, symbol);
      const deploymentTx = contract.deploymentTransaction();
      if (!deploymentTx) {
        throw new Error("Deployment transaction not found. Deployment might have failed.");
      }
      const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
      if (receipt.status === 1) {
        console.log("✅ Contract deployed successfully at address:", contract.target);
      } else {
        console.error("❌ Deployment failed. Receipt status:", receipt?.status);
      }
      const contractAddress = receipt.contractAddress;

      console.log("Creating metadata...");
      const metadata = { name, symbol, contractAddress, createdBy: account };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const metadataFile = new File([metadataBlob], `${contractAddress}_metadata.json`);
      const metadataResponse = await pinata.upload.file(metadataFile);
      const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;
      console.log("Metadata uploaded to Pinata:", metadataUrl);

      const registryConract = contractStore.getRegistryContract();
      if (!registryConract) {
        console.error("Failed to get registry contract.");
        return;
      }
      await registryConract.registerCollection(contractAddress, account, name, symbol);

      console.log("Minting NFT...");
      const deployedParentContract = contractStore.getCollectionContract();
      if (!deployedParentContract) {
        console.error("Failed to get parent contract.");
        return;
      }

      const tx = await deployedParentContract.mintToken(account, metadataUrl);
      const mintedCollectionReceipt = await provider.waitForTransaction(tx.hash);
      if (mintedCollectionReceipt.status === 1) {
        console.log("✅ NFT minted successfully!");
        setStatus(`Contract deployed successfully at ${contractAddress}`);
      } else {
        setStatus("Deployment failed. Please try again.");
      }
    } catch (error) {
      console.error("Error deploying contract:", error);
      setStatus("Failed to deploy contract.");
    }
  };

  return (
    <div className="flex flex-col items-center pt-10">
      <h1 className="block text-4xl font-bold">Create Your NFT Collection</h1>
      <div className="shadow-md p-8 w-full max-w-lg flex flex-col bg-base-100 rounded-3xl">
        <div className="mb-6">
          <label className="block font-semibold mb-2">Collection Name</label>
          <input
            type="text"
            placeholder="Enter Collection Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2">Symbol</label>
          <input
            type="text"
            placeholder="Enter Symbol"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          onClick={handleDeployCollection}
          disabled={!provider || status.includes("Deploying")}
          className={`w-full btn btn-primary font-bold flex items-center justify-center ${
            status.includes("Deploying") ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {status.includes("Deploying") ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Deploying...
            </>
          ) : (
            "Deploy Collection"
          )}
        </button>
        {status && <p className="mt-6">{status}</p>}
      </div>
    </div>
  );
}
