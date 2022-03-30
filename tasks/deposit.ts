import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { addressTkns, addressDao } from "../config"

dotenv.config();

task("deposit", "deposit tokens to dao")
.addParam("amount", "amount of money to accept")
.setAction(async (taskArgs, hre) => {
  const provider = new hre.ethers.providers.JsonRpcProvider(process.env.BSC_URL) 
  const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY !== undefined ? process.env.PRIVATE_KEY : [], provider)

  const myContract = await hre.ethers.getContractAt('Election', addressDao, signer)
  const tkns = await hre.ethers.getContractAt('Token', addressTkns, signer)

  const apprv = await tkns.approve(addressDao, taskArgs.amount)
  const out = await myContract.deposit(taskArgs.amount);
  console.log(apprv, out)
});