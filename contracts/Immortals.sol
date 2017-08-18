pragma solidity ^0.4.13;

import "./ImmortalToken.sol";

contract Immortals is ImmortalToken {

    uint256 public tokenAssigned = 0;

    event Assigned(address _contributor, uint256 _immortals);

    function () payable {
		//Assign immortals based on ethers sent
        require(tokenAssigned < totalSupply && msg.value >= 0.5 ether);
		uint256 immortals = msg.value / 0.5 ether;
		uint256 remainder = 0;
		//Find the remainder
		if (safeAdd(tokenAssigned, immortals) > totalSupply) {
			immortals = totalSupply - tokenAssigned;
			remainder = msg.value - (immortals * 0.5 ether);
		} else {
			remainder = (msg.value % 0.5 ether);
		}	
		require(safeAdd(tokenAssigned, immortals) <= totalSupply);
		balances[msg.sender] = safeAdd(balances[msg.sender], immortals);
		tokenAssigned = safeAdd(tokenAssigned, immortals);
		assert(balances[msg.sender] <= totalSupply);
		//Send remainder to sender
		msg.sender.transfer(remainder);
		//Send ethers to owner
		owner.transfer(this.balance);
		assert(this.balance == 0);
		Assigned(msg.sender, immortals);
    }
}
