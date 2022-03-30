//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
contract Simple {
    
    uint public count;
    address payable owner;

   constructor(){
        owner = payable(msg.sender);
    }

    function increment() public{
        require(msg.sender == owner, "only owner");
        count+=1;
    }

}