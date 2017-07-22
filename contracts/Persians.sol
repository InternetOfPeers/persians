pragma solidity ^0.4.13;

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {
  function mul(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal constant returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal constant returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}


interface TokenERC20 {

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    function transfer(address _to, uint256 _value) returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success);
    function approve(address _spender, uint256 _value) returns (bool success);
    function allowance(address _owner, address _spender) constant returns (uint256 remaining);
    function balanceOf(address _owner) constant returns (uint256 balance);
}


interface TokenNotifier {

    function receiveApproval(address from, uint256 _amount, address _token, bytes _data);
}


contract Owned {

    address owner;
    
    function Owned() { owner = msg.sender; }

    modifier onlyOwner { require(msg.sender == owner); _; }
}


contract PersianToken is TokenERC20, Owned {
    using SafeMath for uint256;

    uint8 public decimals;
    uint256 public totalSupply;
    uint256 public estimatedTotalSupply;
    string public name;
    string public symbol;
    string public version;
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    function transfer(address _to, uint256 _value) returns (bool success) {
        if (balances[msg.sender] < _value) return false;
        balances[msg.sender].sub(_value);
        balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        if(balances[msg.sender] < _value || allowed[_from][msg.sender] < _value) return false;
        balances[_to].add(_value);
        balances[_from].sub(_value);
        allowed[_from][msg.sender].sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function approveAndCall(address _spender, uint256 _value, bytes _extraData) returns (bool success) {
        if(!approve(_spender, _value)) return false;
        TokenNotifier(_spender).receiveApproval(msg.sender, _value, this, _extraData);
        return true;
    }

    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
}


contract TokenICO is PersianToken {

    uint256 public icoStartBlock;
    uint256 public icoEndBlock;
    uint256 public totalContributions;
    mapping (address => uint256) public contributions;

    event Contributed(address indexed _contributor, uint256 _value, uint256 _estimatedTotalTokenBalance);

    function contribute() onlyDuringICO payable external returns (bool success) {
        totalContributions.add(msg.value);
        contributions[msg.sender].add(msg.value);
        Contributed(msg.sender, msg.value, estimateBalanceOf(msg.sender));
        return true;
    }

    function claimToken() onlyAfterICO external returns (bool success) {
        uint256 balance = estimateBalanceOf(msg.sender);
        balances[msg.sender] = balance;
        totalSupply.add(balance);
        contributions[msg.sender] = 0;
        return true;
    }

    function redeemEther() onlyAfterICO onlyOwner external  {
        owner.transfer(this.balance);
    }

    function estimateBalanceOf(address _owner) constant returns (uint256 estimatedTokens) {
        return contributions[_owner] > 0 ? estimatedTotalSupply.div(totalContributions).mul(contributions[_owner]) : 0;
    }

    function isICOEnded() constant returns (bool icoEnded) {
        return block.number > icoEndBlock;
    }

    function isICOOpen() constant returns (bool icoOpen) {
        return block.number >= icoStartBlock && block.number <= icoEndBlock;
    }

    modifier onlyDuringICO {
        require(block.number >= icoStartBlock && block.number <= icoEndBlock); _;
    }

    modifier onlyAfterICO {
        require(block.number > icoEndBlock); _;
    }
}


contract PersianTokenICO is TokenICO {

    function PersianTokenICO(uint256 _icoStartBlock, uint256 _icoEndBlock) {
        decimals = 18;
        // About 300.000 Persian will be generated from this ICO
        estimatedTotalSupply = 300000 * 10**18;
        //Total supply will be updated with the real redeemed tokens once the ICO is over
        totalSupply = 0;
        name = 'Persian';
        symbol = 'PRS';
        version = '1.0.0';
        icoStartBlock = _icoStartBlock;
        icoEndBlock = _icoEndBlock;
    }
  
    function () onlyDuringICO payable {
        totalContributions.add(msg.value);
        contributions[msg.sender].add(msg.value);
        Contributed(msg.sender, msg.value, estimateBalanceOf(msg.sender));
    }

}