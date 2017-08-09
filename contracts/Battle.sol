pragma solidity ^0.4.13;

import "./TokenERC20.sol";
import "./Timed.sol";
import "./SafeMathLib.sol";

contract Battle is Timed {
    using SafeMathLib for uint256;

    uint256  constant public maxPersians         = 300000 * 10**18;  // 300.000
    uint256 public constant maxSpartans         = 300 * 10**18;     // 300
    uint256 public constant maxImmortals        = 100;              // 100
    uint256 public constant maxAthenians        = 100 * 10*18;      // 100

    uint8   public constant battlePointDecimals = 18;

    string  public constant version             = '1.0.0';

    address public constant persians            = 0xF63D4Ec615898163CdE5EBC2Aa8d5768ccC92965;   //0xaec98a708810414878c3bcdf46aad31ded4a4557 MainNet
    address public constant immortals           = 0xED19698C0abdE8635413aE7AD7224DF6ee30bF22;   //0xED19698C0abdE8635413aE7AD7224DF6ee30bF22 MainNet
    address public constant spartans            = 0x94F72fa9d9e035a40F22f6e7ceDb78E697fF54C2;   //0x163733bcc28dbf26B41a8CfA83e369b5B3af741b MainNet
    address public constant athenians           = 0x17052d51E954592C1046320c2371AbaB6C73Ef10;   //0x17052d51e954592c1046320c2371abab6c73ef10 MainNet

    mapping (address => mapping (address => uint256))   public  warriors;                       // Troops currently allocated by each player
    mapping (address => uint256)                        public  warriorsOnTheBattlefield;       // Total troops fighting in the battle
    mapping (address => uint256)                        public  warriorsIntoAde;                // Total casualties, increased after each warriors redeem

    event WarriorsAssignedToBattlefield (address indexed from, address faction, uint256 battlePointsIncrementForecast);
    event WarriorsBackToHome            (address indexed to, address faction, uint256 survivedWarriors);

    /*******************************************************************************************
    When the battle ends in a draw:
        (*) 10% of troops of both sides lie on the ground
        (*) 90% of them can be retrieved by each former owner
        (*) No slaves are assigned
    
    When the battle ends with a winning factions:
        (*) 10% of troops of both sides lie on the ground
        (*) 90% of them can be retrieved by each former owner
        (*) Surviving warriors of the loosing faction are assigned as slaves to winners
    
    Immortals and Athenians are support troops: there will be no casualties in their row, and they can
    be retrieved without losses.
    
    Only Persians and Spartans can be slaves. Immortals and Athenians WILL NOT be sent back as slaves to winners.
    *******************************************************************************************/
    function Battle(uint256 _startTime, uint256 _life, uint8 _avarageBlockTime) Timed(_startTime, _life, _avarageBlockTime) { }

    /**** PHASE #1 ******/

    function assignPersiansToBattle(uint256 _warriors) onlyIfInTime external {
        assignWarriorsToBattle(msg.sender, persians, _warriors, maxPersians);
        // Persians are divisible with 18 decimals and their value is 1 BP
        WarriorsAssignedToBattlefield(msg.sender, persians, _warriors / 10**18);
    }

    function assignSpartansToBattle(uint256 _warriors) onlyIfInTime external {
        assignWarriorsToBattle(msg.sender, spartans, _warriors, maxSpartans);
        // Spartans are divisible with 18 decimals and their value is 1.000 BP
        WarriorsAssignedToBattlefield(msg.sender, spartans, (_warriors / 10**18) * 1000);
    }

    function assignImmortalsToBattle(uint256 _warriors) onlyIfInTime external {
        assignWarriorsToBattle(msg.sender, immortals, _warriors, maxImmortals);
        // Immortals are not divisible and their value is 100 BP
        WarriorsAssignedToBattlefield(msg.sender, immortals, _warriors * 100);
    }

    function assignAtheniansToBattle(uint256 _warriors) onlyIfInTime external {
        assignWarriorsToBattle(msg.sender, athenians, _warriors, maxAthenians);
        // Athenians are divisible with 18 decimals and their value is 100 BP
        WarriorsAssignedToBattlefield(msg.sender, athenians, (_warriors / 10**18) * 100);
    }

    /**** PHASE #2 ******/

    function victoryIsOurs() onlyIfTimePassed {
        // Persians win
        if (getPersiansBattlePoints() > getGreeksBattlePoints()) retrieveWarriorsAndSlaves(persians, spartans);
        // Spartans win
        else if (getPersiansBattlePoints() < getGreeksBattlePoints()) retrieveWarriorsAndSlaves(spartans, persians);
        // It's a draw
        else retireveWarriors(msg.sender, persians, 10);
    }

    // When the battle is over, Immortals can be sent back to the former owner
    function retrieveImmortals() onlyIfTimePassed {
        retireveWarriors(msg.sender, immortals, 0);
    }

    // When the battle is over, Athenians can be sent back to the former owner
    function retrieveAthenians() onlyIfTimePassed {
        retireveWarriors(msg.sender, athenians, 0);
    }

    /*** PRIVATE FUNCTIONS ***/

    function assignWarriorsToBattle(address _player, address _faction, uint256 _warriors, uint256 _maxWarriors) private {
        require(warriorsOnTheBattlefield[_faction].add(_warriors) <= _maxWarriors);
        assert(TokenERC20(_faction).transferFrom(_player, address(this), _warriors));
        warriors[_player][_faction] = warriors[_player][_faction].add(_warriors);
        warriorsOnTheBattlefield[_faction] = warriorsOnTheBattlefield[_faction].add(_warriors);
    }

    function retrieveWarriorsAndSlaves(address _winners, address _loosers) private {
        uint256 slaveWarriors = getSlaves(msg.sender, _winners, _loosers);
        retireveWarriors(msg.sender, _winners, 10);
        sendWarriors(msg.sender, _loosers, slaveWarriors);
    }

    function retireveWarriors(address _player, address _faction, uint8 _deadAmount) private {
        if (_deadAmount > 0) {
            uint256 _deadWarriors = warriors[_player][_faction].div(_deadAmount);
            warriorsIntoAde[_faction] = warriorsIntoAde[_faction].add(_deadWarriors);
            warriors[_player][_faction] = warriors[_player][_faction].sub(_deadWarriors);
        }
        uint256 _warriors = warriors[_player][_faction];
        require(_warriors > 0);
        warriors[_player][_faction] = 0;
        sendWarriors(_player, _faction, _warriors);
        WarriorsBackToHome(_player, _faction, _warriors);
    }

    function sendWarriors(address _player, address _faction, uint256 _warriors) private {
        assert(TokenERC20(_faction).transfer(_player, _warriors));
    }

    /*** DAPP HELPERS AND CONSTANT FUNCTIONS ***/

    function getPersiansBattlePoints() constant returns (uint _battlePoints) {
        return ((warriorsOnTheBattlefield[persians]) + (warriorsOnTheBattlefield[immortals] * 10**18 * 100));
    }

    function getGreeksBattlePoints() constant returns (uint _battlePoints) {
        return ((warriorsOnTheBattlefield[spartans] * 1000) + (warriorsOnTheBattlefield[athenians] * 100));
    }

    // This method returns sensible values for two combinations of parameters: (persians, spartans) and (spartans, persians)
    function getSlaves(address _player, address _winningFaction, address _looserFaction) constant returns (uint256 _slaves) {
        return ((_winningFaction == persians && _looserFaction == spartans) || (_winningFaction == spartans && _looserFaction == persians)) ?
            (warriorsOnTheBattlefield[_looserFaction] - (warriorsOnTheBattlefield[_looserFaction] / 10)) / (warriorsOnTheBattlefield[_winningFaction] / warriors[_player][_winningFaction]) : 0;
    }

    function isDraw() constant returns (bool _draw) {
        return (getPersiansBattlePoints() == getGreeksBattlePoints());
    }
    
    function getWinningFaction() constant returns (string _winningFaction) {
        if (!isTimePassed()) return "The battle is still in progress";
        if (isDraw()) return "The battle ended in a draw!";
        return getPersiansBattlePoints() > getGreeksBattlePoints() ? "Persians" : "Greeks";
    }

    /**** DEV FUNCTIONS ******/

    function setPersiansWin() {
        warriorsOnTheBattlefield[persians] = 3000 * 10**18;  //3000
        warriorsOnTheBattlefield[immortals] = 2; //200
        warriorsOnTheBattlefield[spartans] = 2 * 10**18; //2000
        warriorsOnTheBattlefield[athenians] = 3 * 10**18; //300
    }

    function setGreeksWin() {
        warriorsOnTheBattlefield[persians] = 300 * 10**18;  //300
        warriorsOnTheBattlefield[immortals] = 2; //200
        warriorsOnTheBattlefield[spartans] = 27003 * 10**14; //2700.3
        warriorsOnTheBattlefield[athenians] = 3 * 10**18; //300
    }

    function setDraw() {
        warriorsOnTheBattlefield[persians] = 2200 * 10**18;  //2200
        warriorsOnTheBattlefield[immortals] = 2; //200
        warriorsOnTheBattlefield[spartans] = 2 * 10**18; //2000
        warriorsOnTheBattlefield[athenians] = 4 * 10**18; //400
    }

}
