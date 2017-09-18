pragma solidity ^0.4.15;

import "./TokenERC20.sol";
import "./Timed.sol";
import "./SafeMathLib.sol";

contract Battle is Timed {
    using SafeMathLib for uint256;

    string  public constant VERSION               = "1.0.0";
    
    uint256 public constant MAX_PERSIANS          = 300000 * 10**18;  // 300.000
    uint256 public constant MAX_SPARTANS          = 300 * 10**18;     // 300
    uint256 public constant MAX_IMMORTALS         = 100;              // 100
    uint256 public constant MAX_ATHENIANS         = 100 * 10**18;     // 100

    uint8   public constant BATTLE_POINT_DECIMALS = 18;

    // MAIN NET
    // persians            = 0xaec98a708810414878c3bcdf46aad31ded4a4557;
    // immortals           = 0xED19698C0abdE8635413aE7AD7224DF6ee30bF22;
    // spartans            = 0x163733bcc28dbf26B41a8CfA83e369b5B3af741b;
    // athenians           = 0x17052d51e954592c1046320c2371abab6c73ef10;
    
    address public persians;
    address public immortals;
    address public spartans;
    address public athenians;

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
    function Battle(uint256 _startTime, uint256 _life, uint8 _avarageBlockTime, address _persians, address _immortals, address _spartans, address _athenians) Timed(_startTime, _life, _avarageBlockTime) {
        persians = _persians;
        immortals = _immortals;
        spartans = _spartans;
        athenians = _athenians;
    }

    /**** PHASE #1 ******/

    function assignPersiansToBattle(uint256 _warriors) onlyIfInTime external returns (bool success) {
        assignWarriorsToBattle(msg.sender, persians, _warriors, MAX_PERSIANS);
        // Persians are divisible with 18 decimals and their value is 1 BP
        WarriorsAssignedToBattlefield(msg.sender, persians, _warriors / 10**18);
        return true;
    }

    function assignSpartansToBattle(uint256 _warriors) onlyIfInTime external returns (bool success) {
        assignWarriorsToBattle(msg.sender, spartans, _warriors, MAX_SPARTANS);
        // Spartans are divisible with 18 decimals and their value is 1.000 BP
        WarriorsAssignedToBattlefield(msg.sender, spartans, (_warriors / 10**18) * 1000);
        return true;
    }

    function assignImmortalsToBattle(uint256 _warriors) onlyIfInTime external returns (bool success) {
        assignWarriorsToBattle(msg.sender, immortals, _warriors, MAX_IMMORTALS);
        // Immortals are not divisible and their value is 100 BP
        WarriorsAssignedToBattlefield(msg.sender, immortals, _warriors * 100);
        return true;
    }

    function assignAtheniansToBattle(uint256 _warriors) onlyIfInTime external returns (bool success) {
        assignWarriorsToBattle(msg.sender, athenians, _warriors, MAX_ATHENIANS);
        // Athenians are divisible with 18 decimals and their value is 100 BP
        WarriorsAssignedToBattlefield(msg.sender, athenians, (_warriors / 10**18) * 100);
        return true;
    }

    /**** PHASE #2 ******/

    function victoryIsOurs() onlyIfTimePassed external returns (bool success) {
        // Persians win
        if (getPersiansBattlePoints() > getGreeksBattlePoints()) retrieveWarriorsAndSlaves(persians, spartans);
        // Spartans win
        else if (getPersiansBattlePoints() < getGreeksBattlePoints()) retrieveWarriorsAndSlaves(spartans, persians);
        // It's a draw
        else retireveWarriors(msg.sender, persians, 10);
        return true;
    }

    // When the battle is over, Immortals can be sent back to the former owner
    function retrieveImmortals() onlyIfTimePassed external returns (bool success) {
        retireveWarriors(msg.sender, immortals, 0);
        return true;
    }

    // When the battle is over, Athenians can be sent back to the former owner
    function retrieveAthenians() onlyIfTimePassed external returns (bool success) {
        retireveWarriors(msg.sender, athenians, 0);
        return true;
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
        if (!isTimePassed()) {
            return "The battle is still in progress";
        }
        if (isDraw()) {
            return "The battle ended in a draw!";
        }
        return getPersiansBattlePoints() > getGreeksBattlePoints() ? "Persians" : "Greeks";
    }

    /**** DEV FUNCTIONS ******/

    function setTime(uint256 _startTime, uint256 life, uint8 _avarageBlockTime) {
        startTime = _startTime;
        endTime = _startTime + life;
        avarageBlockTime = _avarageBlockTime;
    }
    
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
