import { getContractFactory } from "@nomiclabs/hardhat-ethers/types";
import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { AbiCoder, Interface, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { addressTkns } from "../config";

describe("Token contract", function () {

  let simple;
  let election;
  let erc20;
  let erc20Contract: Contract;
  let electionContract: Contract;
  let simpleContract: Contract;

  let ERC20owner: Signer;
  let ERC20user: Signer;
  let DaoChairman: Signer;
  let DaoUser: Signer;
  let SimpleOwner: Signer;


  beforeEach(async function () {



    erc20 = await ethers.getContractFactory("Token");
    [ERC20owner, ERC20user] = await ethers.getSigners();
    erc20Contract = await erc20.deploy("Test", "tst");

    election = await ethers.getContractFactory("Election");
    [DaoChairman, DaoUser] = await ethers.getSigners();
    electionContract = await election.deploy(erc20Contract.address);

    simple = await ethers.getContractFactory("Simple");
    [SimpleOwner] = await ethers.getSigners();

    simpleContract = await simple.deploy();

    simpleContract.connect(SimpleOwner).updateAdmin(electionContract.address);

    electionContract.on("electionEnded", async(id, success, data) =>{
      console.log(id,success,data)
    }
    )



  });

  describe("deposit tkns", function () {

    it("upload some tokens", async function () {
      await erc20Contract.connect(ERC20owner).mint(await DaoUser.getAddress(), parseEther("50"))
      await erc20Contract.connect(DaoUser).approve(electionContract.address, parseEther("50"))
      await electionContract.connect(DaoUser).depositTokens(parseEther("50"))
      expect(await electionContract.connect(DaoUser).getDeposit()).to.equal(parseEther("50"))
      



    });
    
  });

  describe("Proposal flow", function () {

    it("add, vote for, finish", async function () {
      const sig  = new Interface(["function increment() public"])
      console.log(sig.getSighash("increment()"))
      await erc20Contract.connect(ERC20owner).mint(await DaoUser.getAddress(), parseEther("50"))
      await erc20Contract.connect(ERC20owner).mint(await DaoChairman.getAddress(), parseEther("10"))

      await erc20Contract.connect(DaoUser).approve(electionContract.address, parseEther("50"))
      await erc20Contract.connect(DaoChairman).approve(electionContract.address, parseEther("10"))

      await electionContract.connect(DaoUser).depositTokens(parseEther("50"))
      await electionContract.connect(DaoChairman).depositTokens(parseEther("10"))

      await expect(electionContract.connect(DaoUser).initiateElection(parseEther("20"), simpleContract.address, sig.getSighash("increment()"))).to.be.revertedWith("u r not a chairman")


      await electionContract.connect(DaoChairman).initiateElection(parseEther("20"), simpleContract.address, sig.getSighash("increment()"))

      expect(await electionContract.getQuorum(1)).to.equal(parseEther("20"))

      await electionContract.connect(DaoUser).vote(true, 1)
      await electionContract.connect(DaoChairman).vote(false, 1)

      expect(await electionContract.getFor(1)).to.equal(parseEther("50"))
      expect(await electionContract.getAgainst(1)).to.equal(parseEther("10"))

      await expect(electionContract.finishElection(1)).to.be.revertedWith("Election not finished yet")

      await ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);

      await electionContract.connect(DaoUser).finishElection(1)


      
      
      
      
      //--------------

      expect(await simpleContract.getCount()).to.equal(1)




    });

    it("add, vote against, finish", async function () {
      const sig  = new Interface(["function increment() public"])
      await erc20Contract.connect(ERC20owner).mint(await DaoUser.getAddress(), parseEther("50"))
      await erc20Contract.connect(ERC20owner).mint(await DaoChairman.getAddress(), parseEther("10"))

      await erc20Contract.connect(DaoUser).approve(electionContract.address, parseEther("50"))
      await erc20Contract.connect(DaoChairman).approve(electionContract.address, parseEther("10"))

      await electionContract.connect(DaoUser).depositTokens(parseEther("50"))
      await electionContract.connect(DaoChairman).depositTokens(parseEther("10"))

      await expect(electionContract.connect(DaoUser).initiateElection(parseEther("20"), simpleContract.address, sig.getSighash("increment()"))).to.be.revertedWith("u r not a chairman")


      await electionContract.connect(DaoChairman).initiateElection(parseEther("20"), simpleContract.address, sig.getSighash("increment()"))

      expect(await electionContract.getQuorum(1)).to.equal(parseEther("20"))

      await electionContract.connect(DaoUser).vote(false, 1)
      await electionContract.connect(DaoChairman).vote(true, 1)

      expect(await electionContract.getFor(1)).to.equal(parseEther("10"))
      expect(await electionContract.getAgainst(1)).to.equal(parseEther("50"))

      await expect(electionContract.finishElection(1)).to.be.revertedWith("Election not finished yet")

      await ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);

      

      await electionContract.finishElection(1)

      
      
      
      
      //--------------

      expect(await simpleContract.getCount()).to.equal(0)
    });

  });

  describe("utils test", function () {

    it("withdraw", async function () {
      await erc20Contract.connect(ERC20owner).mint(await DaoUser.getAddress(), parseEther("50"))
      await erc20Contract.connect(ERC20owner).mint(await DaoChairman.getAddress(), parseEther("10"))

      await erc20Contract.connect(DaoUser).approve(electionContract.address, parseEther("50"))
      await erc20Contract.connect(DaoChairman).approve(electionContract.address, parseEther("10"))

      await electionContract.connect(DaoUser).depositTokens(parseEther("50"))
      await electionContract.connect(DaoChairman).depositTokens(parseEther("10"))

      //await erc20Contract.connect(electionContract.address).approve(await DaoUser.getAddress(), parseEther("50"))


      await expect(electionContract.connect(DaoUser).withdraw(parseEther("70"))).to.be.revertedWith("Not enough tkns to wd")
      await electionContract.connect(DaoUser).withdraw(parseEther("10"))
      expect(await electionContract.connect(DaoUser).getDeposit()).to.equal(parseEther("40"))





    });
    it("updateChairman", async function () {
      await expect(electionContract.connect(DaoUser).updateChairman(await DaoUser.getAddress())).to.be.revertedWith("only admin")
      await electionContract.updateChairman(await DaoUser.getAddress())

      expect(await electionContract.getChairman()).to.equal(await DaoUser.getAddress())

    });
  });

  describe("not a core contracts", function () {

    it("simple contract check", async function () {
      await expect(simpleContract.connect(DaoUser).updateAdmin(await DaoUser.getAddress())).to.be.revertedWith("not an owner")
      //await simpleContract.connect(electionContract.address).updateAdmin(await DaoUser.getAddress())
      //expect(await simpleContract.connect(electionContract.address).getAdmin()).to.equal(await DaoUser.getAddress())

    });
    it("erc20 token check", async function () {
      await erc20Contract.connect(ERC20owner).mint(await DaoUser.getAddress(), parseEther("50"))
      expect(await erc20Contract.connect(ERC20owner).balanceOf(await DaoUser.getAddress())).to.equal(parseEther("50"))
      await erc20Contract.connect(ERC20owner).burn(await DaoUser.getAddress(), parseEther("10"))
      expect(await erc20Contract.connect(ERC20owner).balanceOf(await DaoUser.getAddress())).to.equal(parseEther("40"))



      await erc20Contract.connect(ERC20owner).updateAdmin(ERC20user.getAddress())
      expect(await erc20Contract.connect(ERC20user).getAdmin()).to.equal(await ERC20user.getAddress())



      await expect(erc20Contract.connect(ERC20owner).mint(await DaoChairman.getAddress(), parseEther("50"))).to.be.revertedWith("only admin")

      await expect(erc20Contract.connect(ERC20owner).burn(await DaoUser.getAddress(), parseEther("1"))).to.be.revertedWith("only admin")

      await expect(erc20Contract.connect(ERC20owner).updateAdmin(await DaoChairman.getAddress())).to.be.revertedWith("only admin")






    });
  });

});