import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { addressDao } from "../config"

dotenv.config();

task("finish", "finish election")
.addParam("name", "name of an event")
.setAction(async (taskArgs, hre) => {
  const provider = new hre.ethers.providers.JsonRpcProvider(process.env.BSC_URL) 
  const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY !== undefined ? process.env.PRIVATE_KEY : [], provider)

  const myContract = await hre.ethers.getContractAt('Election', addressDao, signer)

  const out = await myContract.finishElection(taskArgs.name);
  console.log(out)
});