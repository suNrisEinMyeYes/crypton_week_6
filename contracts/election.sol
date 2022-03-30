// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Election {
    address public chairmen;
    //address private _boundedTkn;
    IERC20 private _boundedTkn;
    

    struct overseer {
        address voter;
        uint256 deposit;
        uint256 lockedUntil;
      
    }

    struct theQuestion{
        uint256 endTime;
        uint256 minQuorum;
        uint256 positive;
        uint256 negative;
        address targetContract;
        string name;
        string description;
        string funcSig;
        
    }

    event electionEnded(
        string name,
        bool success,
        bytes data
    );
    mapping(string => theQuestion) private nameToQuestion;
    mapping (address => overseer) private addressToVoter;

    constructor(address tokens) {
        chairmen = msg.sender;
        _boundedTkn = IERC20(tokens);
    }

    function updateChairmen(address newAdmin) external {
        require(msg.sender == chairmen, 'only admin');
        chairmen = newAdmin;
    }

    function depositTokens(uint256 amount) public{
      _boundedTkn.transferFrom(msg.sender, address(this), amount);
      addressToVoter[msg.sender].deposit = addressToVoter[msg.sender].deposit == 0 ? amount : addressToVoter[msg.sender].deposit + amount;
    }

    function initiateElection(uint256 minQ, string memory name, string calldata description, address target, string memory signature) public {
        require(msg.sender == chairmen, "u r not a chairmen");
        nameToQuestion[name] = theQuestion(
            block.timestamp + 3 days,
            minQ,
            0,
            0,
            target,
            name,
            description,
            signature
        );

    }

    function vote(string memory name, bool answer) public{
        if(answer == true){
            nameToQuestion[name].positive += addressToVoter[msg.sender].deposit;
        }else{
            nameToQuestion[name].negative += addressToVoter[msg.sender].deposit;
        }
        addressToVoter[msg.sender].lockedUntil = nameToQuestion[name].endTime > addressToVoter[msg.sender].lockedUntil ? nameToQuestion[name].endTime : addressToVoter[msg.sender].lockedUntil;
    }

    function finishElection(string memory name) public{
        require(nameToQuestion[name].endTime < block.timestamp, "Election not finished yet");
        //require((nameToQuestion[name].positive + nameToQuestion[name].negative) > nameToQuestion[name].minQuorum, "Not enough quorum");
        (bool success, bytes memory data) = nameToQuestion[name].targetContract.call(abi.encodeWithSignature(nameToQuestion[name].funcSig));
        emit electionEnded(name, success, data);
    }

    function withdraw(uint256 amount) public{
        require(amount < addressToVoter[msg.sender].deposit, "Not enough tkns to wd");
        _boundedTkn.transferFrom(address(this), msg.sender, amount);
        addressToVoter[msg.sender].deposit -= amount;

    }


    

  

  
}