pragma solidity ^0.4.18;

contract TokenNotifier {

    function receiveApproval(address from, uint256 _amount, address _token, bytes _data) public;
}