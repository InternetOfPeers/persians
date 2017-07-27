pragma solidity ^0.4.11;

import "./Persians.sol";

contract Battle {

    event PersiansAssigned(address indexed _from, address indexed _to, uint256 _value);

    address spartan = 0x94F72fa9d9e035a40F22f6e7ceDb78E697fF54C2;
    address persian = 0xF63D4Ec615898163CdE5EBC2Aa8d5768ccC92965;

    uint256 public persiansOnTheBattlefield;

    mapping (address => uint256) persianBalances;

    //
    function assignPersiansToBattle(uint256 _value) returns (bool success) {
        //Refer to the Persian Token contract
        PersianToken persian = PersianToken(persian);
        //Check if contract was previously allowed to move enough tokens
        if(persian.allowance(msg.sender, address(this)) < _value) return false;
        //Move tokens to this contract
        if(!persian.transferFrom(msg.sender, address(this), _value)) return false;
        //Increase the sender balance
        persianBalances[msg.sender] += _value;
        persiansOnTheBattlefield += _value;
        PersiansAssigned(msg.sender, address(this), _value);
        return true;
    }

}
