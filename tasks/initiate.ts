import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { addressTkns, addressDao } from "../config"

dotenv.config();

task("addProposal", "initiate election")
.addParam("minQ", "minimum quorum")
.addParam("target", "target contract")
.addParam("sig", "signature of a target function")
.setAction(async (taskArgs, hre) => {
  const provider = new hre.ethers.providers.JsonRpcProvider(process.env.BSC_URL) 
  const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY !== undefined ? process.env.PRIVATE_KEY : [], provider)

  const myContract = await hre.ethers.getContractAt('Election', addressDao, signer)

  const out = await myContract.initiateElection(taskArgs.minQ, taskArgs.target, taskArgs.sig);
  console.log(out)
});