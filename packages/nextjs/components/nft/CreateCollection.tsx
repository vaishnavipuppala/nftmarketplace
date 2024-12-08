// "use client";
// import { useState, useRef, DragEvent } from "react";
// import { notification } from "~~/utils/scaffold-eth";
// import { usePublicClient, useWalletClient } from "wagmi";
// import { PinataSDK } from "pinata-web3";
// import { useScaffoldContract } from "~~/hooks/scaffold-eth";

// const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YmJhZGY2Zi05NmFlLTRhYzQtOWZkNy03MjQ5MTQwMDhlZmUiLCJlbWFpbCI6InB1cHBhbGEubkBub3J0aGVhc3Rlcm4uZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjZhYzIyY2I3ZDJhY2YyMjU3NDM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjMyYTUxZmE1Njg1Zjc2MGNhYzUyNzk0YzMxODg1YzZlZjQ2OTFlOTE1MjZmNjQ5MGRjYWVjYzdjNmM0YzlmYSIsImV4cCI6MTc2NDY0Mjc1OH0.eX4ISG4PxiCsWkSUAXE5T4E1WGj98b5wjPHwuHyPQw0";
// const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL!;

// const pinata = new PinataSDK({
//   pinataJwt: PINATA_JWT,
//   pinataGateway: PINATA_GATEWAY_URL,
// });

// export default function CreateCollection() {
//   const [formData, setFormData] = useState({
//     name: "",
//     symbol: "",
//     image: null as File | null,
//     imagePreview: "",
//     description: "",
//     externalLink: "",
//     royaltyPercentage: 0,
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);
//   const [mintedTokens, setMintedTokens] = useState<string[]>([]);

//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const { data: walletClient } = useWalletClient();
//   const publicClient = usePublicClient();
//   const { data: nftCollection } = useScaffoldContract({
//     contractName: "NFTCollection",
//   });

//   const uploadToPinata = async (file: File) => {
//     try {
//       const upload = await pinata.upload.file(file);
//       return upload?.IpfsHash ? `ipfs://${upload.IpfsHash}` : null;
//     } catch (error) {
//       console.error('Pinata upload failed:', error);
//       throw error;
//     }
//   };

//   const handleMintNFT = async () => {
//     // Comprehensive input validation
//     if (!nftCollection || !walletClient || !publicClient) {
//       notification.error("Please connect your wallet");
//       return;
//     }

//     const { name, symbol, image, description, externalLink, royaltyPercentage } = formData;
//     if (!name || !symbol || !image) {
//       notification.error("Please fill in required fields");
//       return;
//     }

//     try {
//       setIsLoading(true);

//       // Upload image to Pinata
//       const imageUrl = await uploadToPinata(image);

//       // Create comprehensive metadata
//       const metadata = {
//         name,
//         symbol,
//         image: imageUrl,
//         description,
//         external_url: externalLink,
//         seller_fee_basis_points: Math.round(royaltyPercentage * 100), // Convert percentage to basis points
//         attributes: [
//           { trait_type: "Creator", value: walletClient.account.address },
//           { trait_type: "Royalty", value: `${royaltyPercentage}%` }
//         ]
//       };

//       const metadataBlob = new Blob([JSON.stringify(metadata)], {
//         type: "application/json",
//       });
//       const metadataFile = new File([metadataBlob], `${name}_metadata.json`);

//       // Upload metadata to Pinata
//       const metadataResponse = await pinata.upload.file(metadataFile);
//       const metadataUrl = `ipfs://${metadataResponse.IpfsHash}`;

//       // Estimate and execute contract interaction
//       const gasEstimate = await publicClient.estimateContractGas({
//         address: nftCollection.address,
//         abi: nftCollection.abi,
//         functionName: "mintToken",
//         args: [walletClient.account.address, metadataUrl],
//         account: walletClient.account.address,
//       });

//       const { request } = await publicClient.simulateContract({
//         address: nftCollection.address,
//         abi: nftCollection.abi,
//         functionName: "mintToken",
//         args: [walletClient.account.address, metadataUrl],
//         account: walletClient.account.address,
//         gas: gasEstimate,
//       });

//       const transactionHash = await walletClient.writeContract(request);
//       const receipt = await publicClient.waitForTransactionReceipt({
//         hash: transactionHash,
//       });

//       if (Number(receipt.status) === 1) {
//         notification.success("NFT minted successfully!");

//         // Reset form
//         setFormData({
//           name: "",
//           symbol: "",
//           image: null,
//           imagePreview: "",
//           description: "",
//           externalLink: "",
//           royaltyPercentage: 0,
//         });

//         // Update minted tokens
//         setMintedTokens((prev) => [...prev, metadataUrl]);
//       } else {
//         throw new Error("Transaction failed");
//       }
//     } catch (error: any) {
//       console.error("Failed to mint NFT:", error);

//       if (error.message.includes("insufficient funds")) {
//         notification.error("Wallet has insufficient funds for gas fees");
//       } else {
//         notification.error(error.message || "Failed to mint NFT");
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const processImage = (file: File) => {
//     if (!file.type.startsWith("image/")) {
//       notification.error("Please select an image file");
//       return;
//     }

//     const previewUrl = URL.createObjectURL(file);
//     setFormData((prev) => ({
//       ...prev,
//       image: file,
//       imagePreview: previewUrl,
//     }));
//   };

//   const handleDrop = (e: DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);

//     const file = e.dataTransfer.files?.[0];
//     if (file) processImage(file);
//   };

//   const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) processImage(file);
//   };

//   return (
//     <div className="flex flex-col gap-4 py-8 px-6 bg-base-100 shadow-lg rounded-2xl max-w-xl w-full mx-auto">
//       <h2 className="text-2xl font-bold text-center mb-4">Create NFT Collection</h2>

//       <div className="space-y-4">
//         <div className="form-control">
//           <label className="label">
//             <span className="label-text font-bold">Collection Name *</span>
//           </label>
//           <input
//             type="text"
//             placeholder="Collection Name"
//             className="input input-bordered w-full"
//             value={formData.name}
//             onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//             required
//           />
//         </div>

//         <div className="form-control">
//           <label className="label">
//             <span className="label-text font-bold">Symbol *</span>
//           </label>
//           <input
//             type="text"
//             placeholder="Symbol"
//             className="input input-bordered w-full"
//             value={formData.symbol}
//             onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
//             required
//           />
//         </div>

//         <div className="form-control">
//           <label className="label">
//             <span className="label-text font-bold">Description</span>
//           </label>
//           <textarea
//             placeholder="Describe your NFT collection"
//             className="textarea textarea-bordered w-full"
//             value={formData.description}
//             onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//           />
//         </div>

//         {/* <div className="form-control">
//           <label className="label">
//             <span className="label-text font-bold">External Link</span>
//           </label>
//           <input
//             type="url"
//             placeholder="Website or project link"
//             className="input input-bordered w-full"
//             value={formData.externalLink}
//             onChange={(e) => setFormData(prev => ({ ...prev, externalLink: e.target.value }))}
//           />
//         </div> */}

//         {/* <div className="form-control">
//           <label className="label">
//             <span className="label-text font-bold">Royalty Percentage</span>
//           </label>
//           <input
//             type="number"
//             placeholder="Royalty %"
//             min="0"
//             max="10"
//             className="input input-bordered w-full"
//             value={formData.royaltyPercentage}
//             onChange={(e) => setFormData(prev => ({
//               ...prev,
//               royaltyPercentage: parseFloat(e.target.value) || 0
//             }))}
//           />
//         </div> */}

//         <div
//           className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
//             ${isDragging ? 'border-primary bg-primary/10' : formData.imagePreview ? 'border-primary' : 'border-gray-300'}
//             hover:border-primary hover:bg-primary/5`}
//           onClick={() => fileInputRef.current?.click()}
//           onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
//           onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
//           onDrop={handleDrop}
//         >
//           {formData.imagePreview ? (
//             <div className="flex flex-col items-center gap-2">
//               <img
//                 src={formData.imagePreview}
//                 alt="Preview"
//                 className="max-h-40 object-contain rounded"
//               />
//               <span className="text-sm text-gray-600">
//                 Click or drag to change image
//               </span>
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
//               <p className="text-gray-600">Drag and drop or click to upload</p>
//             </div>
//           )}
//           <input
//             ref={fileInputRef}
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={handleImageUpload}
//           />
//         </div>

//         <button
//           className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
//           onClick={handleMintNFT}
//           disabled={isLoading || !formData.name || !formData.symbol || !formData.image}
//         >
//           Create NFT Collection
//         </button>
//       </div>

//       {mintedTokens.length > 0 && (
//         <div className="mt-6">
//           <h3 className="text-xl font-semibold mb-2">Minted Tokens</h3>
//           <div className="space-y-2 max-h-40 overflow-y-auto">
//             {mintedTokens.map((token, index) => (
//               <a
//                 key={index}
//                 href={token}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="block text-blue-600 truncate hover:underline"
//               >
//                 {token}
//               </a>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
