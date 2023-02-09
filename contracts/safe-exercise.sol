// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract OurSaves {
  address[] private family;
  address public owner;

  constructor (address[] memory familyAddresses) {
    family = familyAddresses;
    owner = msg.sender;
  }

  event Received(address sender, uint value);
  event Withdrawed(address withdrawer, uint amount);

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
  
  modifier onlyFamily {
    bool isRelative = (msg.sender == owner);
    for (uint i = 0; !isRelative && i < family.length; i++) {
      if (family[i] == msg.sender) {
        isRelative = true;
      }
    }

    require(isRelative, "Only family members can withdraw");
    _;
  }

  modifier hasFunds (uint amount) {
    require(amount <= address(this).balance, "The account doesn't have enough funds");
    _;
  }

  function withdraw(uint amount) public payable onlyFamily hasFunds(amount) {
    payable (msg.sender).transfer(amount);
    emit Withdrawed(msg.sender, amount);
  }
}