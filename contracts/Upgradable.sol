pragma solidity ^0.4.15;

import "./Owned.sol";

/**
 * The contract can be deprecated and the owner can set - only once - another address to advertise
 * to clients the existence of another more recent contract.
 */
contract Upgradable is Owned {

    string  public VERSION;
    bool    public deprecated;
    string  public newVersion;
    address public newAddress;

    function Upgradable(string _version) {
        VERSION = _version;
    }

    function setDeprecated(string _newVersion, address _newAddress) onlyOwner returns (bool success) {
        require(!deprecated);
        deprecated = true;
        newVersion = _newVersion;
        newAddress = _newAddress;
        return true;
    }
}