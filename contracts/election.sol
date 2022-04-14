// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract Election {
    address public chairman;
    //address private _boundedTkn;
    IERC20 private _boundedTkn;

    using Counters for Counters.Counter;
    Counters.Counter private _itemsIds;
    

    struct overseer {
        uint256 deposit;
        uint256 lockedUntil;
    }

    struct theQuestion{
        uint256 endTime;
        uint256 minQuorum;
        uint256 positive;
        uint256 negative;
        address targetContract;
        bytes4 funcSig;
    }

    event electionEnded(
        uint256 indexed id,
        bool success,
        bytes data
    );
    mapping(uint256 => theQuestion) public nameToQuestion;
    mapping (address => overseer) public addressToVoter;

    constructor(address tokens) {
        chairman = msg.sender;
        _boundedTkn = IERC20(tokens);
    }

    function updateChairman(address newAdmin) external {
        require(msg.sender == chairman, 'only admin');
        chairman = newAdmin;
    }

    function depositTokens(uint256 amount) public{
      //_boundedTkn.transferFrom(msg.sender, address(this), amount);
      SafeERC20.safeTransfer(_boundedTkn, address(this), amount);
      addressToVoter[msg.sender].deposit += amount;
    }

    function initiateElection(uint256 minQ, address target, bytes4 signature) public {
        require(msg.sender == chairman, "u r not a chairman");
        _itemsIds.increment();
        //bytes4 tmp = bytes4(keccak256(abi.encodeWithSignature(signature)));
        nameToQuestion[_itemsIds.current()] = theQuestion(
            block.timestamp + 3 days,
            minQ,
            0,
            0,
            target,
            signature 
        );

    }

    function vote(bool answer, uint256 id) public{
        if(answer == true){
            nameToQuestion[id].positive += addressToVoter[msg.sender].deposit;
        }else{
            nameToQuestion[id].negative += addressToVoter[msg.sender].deposit;
        }
        addressToVoter[msg.sender].lockedUntil = nameToQuestion[id].endTime > addressToVoter[msg.sender].lockedUntil ? nameToQuestion[id].endTime : addressToVoter[msg.sender].lockedUntil;
    }

    function finishElection(uint256 id) public returns(bytes memory) {
        bool success;
        bytes memory data;
        require(nameToQuestion[id].endTime < block.timestamp, "Election not finished yet");
        //require((nameToQuestion[name].positive + nameToQuestion[name].negative) > nameToQuestion[name].minQuorum, "Not enough quorum");
        if(nameToQuestion[id].positive > nameToQuestion[id].negative && (nameToQuestion[id].positive + nameToQuestion[id].negative) > nameToQuestion[id].minQuorum){
            (success, data) = nameToQuestion[id].targetContract.call(abi.encode(nameToQuestion[id].funcSig));
            //require(success == true, "not true");
            
        } else {
            success = false;
            data = "";
        }
        emit electionEnded(id, success, data);
        return data;
    }

    function withdraw(uint256 amount) public{
        require(amount < addressToVoter[msg.sender].deposit, "Not enough tkns to wd");
        require(addressToVoter[msg.sender].lockedUntil < block.timestamp, "locked period is not finished yet");
        //_boundedTkn.approve(spender, amount);
        //_boundedTkn.transferFrom(address(this), msg.sender, amount);
        SafeERC20.safeTransferFrom(_boundedTkn, address(this), msg.sender, amount);

        addressToVoter[msg.sender].deposit -= amount;

    } 
    //there are some problems problems with test, so i need geters 

    function getDeposit() public view returns(uint256) {
        return addressToVoter[msg.sender].deposit;
    }

    function getQuorum(uint256 id) public view returns(uint256){
        return nameToQuestion[id].minQuorum;
    }

    function getFor(uint256 id) public view returns(uint256) {
        return nameToQuestion[id].positive;
    }

    function getAgainst(uint256 id) public view returns(uint256) {
        return nameToQuestion[id].negative;
    }

    function getEndTime(uint256 id) public view returns(uint256){
        return nameToQuestion[id].endTime;
    }

    function getLockPeriod(address addr) public view returns(uint256){
        return addressToVoter[addr].lockedUntil;
    }

    function getChairman() public view returns(address){
        return chairman;
    }
}