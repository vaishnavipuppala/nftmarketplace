
import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import * as tenderly from "@tenderly/hardhat-tenderly";
tenderly.setup({ automaticVerifications: false});

interface ExtendedHardhatUserConfig extends HardhatUserConfig {
  tenderly?: {
    project: string;
    username: string;
    privateVerification: boolean;
  };
}
const deployerPrivateKey = 
process.env.DEPLOYER_PRIVATE_KEY ?? "0xe25613b9ffb95e270eb34d9c18d38fe2ae5235da7fda40494639915cde48d940";

const tenderlyRpcUrl = process.env.TENDERLY_RPC_URL || "";
console.log("Tenderly RPC URL:", tenderlyRpcUrl);

const config: ExtendedHardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "virtual_sepolia",
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  networks: {
   
    virtual_sepolia: {
      url: tenderlyRpcUrl, 
      chainId: 11155111,
      accounts: [deployerPrivateKey],
      gasPrice: "auto",
    },
    
  },
  tenderly: {
    project: "nftmarketplace1",
    username: "vaishnavi16",
    privateVerification: true
  },
};

export default config;