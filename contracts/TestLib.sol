pragma solidity ^0.4.13;

import "./SafeMathLib.sol";

contract TestLib  {
    using SafeMathLib for uint256;
    
    uint256 a = 1;

    function TestLib() {
        a = a.add(3);
    }
}