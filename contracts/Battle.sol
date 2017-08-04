pragma solidity ^0.4.11;

import "./TokenERC20.sol";

contract Battle {

    //Battle counters
    mapping (address => uint256) public warriorsOnTheBattlefield;
    mapping (address => mapping (address => uint256)) public balances;

    //Token addresses
    address public constant persiansAddress = 0xF63D4Ec615898163CdE5EBC2Aa8d5768ccC92965;  //0xaec98a708810414878c3bcdf46aad31ded4a4557 MainNet
    address public constant immortalsAddress = 0xED19698C0abdE8635413aE7AD7224DF6ee30bF22;  //0xED19698C0abdE8635413aE7AD7224DF6ee30bF22 MainNet
    address public constant spartansAddress = 0x94F72fa9d9e035a40F22f6e7ceDb78E697fF54C2;  //0x163733bcc28dbf26B41a8CfA83e369b5B3af741b MainNet
    address public constant atheniansAddress = 0x17052d51E954592C1046320c2371AbaB6C73Ef10; //0x17052d51e954592c1046320c2371abab6c73ef10 MainNet

    //Battle events
    event PersiansAssigned(address indexed _from, uint256 _battlePointsIncrementForecast);
    event ImmortalsAssigned(address indexed _from, uint256 _battlePointsIncrementForecast);
    event SpartansAssigned(address indexed _from, uint256 _battlePointsIncrementForecast);
    event AtheniansAssigned(address indexed _from, uint256 _battlePointsIncrementForecast);

    //
    function assignPersiansToBattle(uint256 _value) returns (bool success) {
        if(assignWarriorsToBattle(persiansAddress, _value)) {
            PersiansAssigned(msg.sender, _value / 10**18);
            return true;
        } 
        return false;
    }

    function assignImmortalsToBattle(uint256 _value) returns (bool success) {
        if(assignWarriorsToBattle(immortalsAddress, _value)) {
            ImmortalsAssigned(msg.sender, (_value / 10**18) * 100);
            return true;
        } 
        return false;
    }

    function assignSpartansToBattle(uint256 _value) returns (bool success) {
        if(assignWarriorsToBattle(spartansAddress, _value)) {
            SpartansAssigned(msg.sender, (_value / 10**18) * 1000);
            return true;
        } 
        return false;
    }

    function assignAtheniansToBattle(uint256 _value) returns (bool success) {
        if(assignWarriorsToBattle(atheniansAddress, _value)) {
            AtheniansAssigned(msg.sender, (_value / 10**18) * 100);
            return true;
        } 
        return false;
    }

    function assignWarriorsToBattle(address faction, uint256 _value) internal returns (bool success) {
        if(TokenERC20(faction).allowance(msg.sender, address(this)) < _value) return false;
        if(!TokenERC20(faction).transferFrom(msg.sender, address(this), _value)) return false;
        balances[faction][msg.sender] += _value;
        warriorsOnTheBattlefield[faction] += _value;
    }

}
