pragma solidity ^0.4.13;

import "./SafeMathLib.sol";

contract TestLib {
    using SafeMathLib for uint256;
    
    uint256 readme = 1;

    function TestLib() {
        readme = readme.add(3);
    }

    function getReadme() constant returns (uint256) {
        return readme;
    }
}