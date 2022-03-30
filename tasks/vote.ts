import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { addressTkns, addressDao } from "../config"

dotenv.config();

task("vote", "give an opinion")
.addParam("name", "name of an event")
.addParam("answer", "your opinion")

.setAction(async (taskArgs, hre) => {
  const provider = new hre.ethers.providers.JsonRpcProvider(process.env.BSC_URL) 
  const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY !== undefined ? process.env.PRIVATE_KEY : [], provider)

  const myContract = await hre.ethers.getContractAt('Election', addressDao, signer)

  const out = await myContract.vote(taskArgs.name, taskArgs.answer);
  console.log(out)
});