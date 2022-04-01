//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
contract Simple {
    
    uint256 public count;
    address  owner;

   constructor(){
        owner = msg.sender;
    }

    function increment() public{
        require(msg.sender == owner, "only owner");
        count+=1;
    }

    function getCount() public view returns(uint256){
        return count;
    }

    function getAdmin()public view returns(address) {
        return owner;
    }

    function updateAdmin(address user) public{
        require(msg.sender == owner, "not an owner");
        owner = user;
    }

}