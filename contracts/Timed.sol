pragma solidity ^0.4.13;

contract Timed {
    
    uint256 public startTime;           //seconds since Unix epoch time
    uint256 public endTime;             //seconds since Unix epoch time
    uint256 public avarageBlockTime;    //seconds

    // This check is an helper function for ÐApp to check the effect of the NEXT transaction, NOT simply the current state of the contract
    function isInTime() constant returns (bool _isInTime) {
        return block.timestamp >= (startTime - avarageBlockTime) && !isTimePassed();
    }

    // This check is an helper function for ÐApp to check the effect of the NEXT transacion, NOT simply the current state of the contract
    function isTimePassed() constant returns (bool _isTimePassed) {
        return block.timestamp + avarageBlockTime >= endTime;
    }

    modifier onlyIfInTime {
        require(block.timestamp >= startTime && block.timestamp <= endTime); _;
    }

    modifier onlyIfTimePassed {
        require(block.timestamp > endTime); _;
    }

    function Timed(uint256 _startTime, uint256 life, uint8 _avarageBlockTime) {
        startTime = _startTime;
        endTime = _startTime + life;
        avarageBlockTime = _avarageBlockTime;
    }
}