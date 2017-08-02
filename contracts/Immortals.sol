pragma solidity ^0.4.11;

import "./ImmortalToken.sol";

contract Immortals is ImmortalToken {

    uint256 public tokenAssigned = 0;

    event Assigned(address _contributor, uint256 _immortals);

    function () payable {
		//Assign immortals based on ethers sent
        require(tokenAssigned < totalSupply && msg.value >= 0.5 ether);
		uint256 immortals = msg.value / 0.5 ether;
		require(safeAdd(tokenAssigned, immortals) <= totalSupply);
		balances[msg.sender] = safeAdd(balances[msg.sender], immortals);
		tokenAssigned = safeAdd(tokenAssigned, immortals);
		assert(balances[msg.sender] <= totalSupply);
		//Send remainder to sender
		msg.sender.transfer(msg.value % 0.5 ether);
		//Send ethers to owner
		owner.transfer(this.balance);
		assert(this.balance == 0);
		Assigned(msg.sender, immortals);
    }
}
