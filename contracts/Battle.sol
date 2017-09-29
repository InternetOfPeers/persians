pragma solidity ^0.4.15;

import "./TokenERC20.sol";
import "./Timed.sol";
import "./SafeMathLib.sol";

contract Battle is Timed {
    using SafeMathLib for uint256;

    string  public constant VERSION                 = "1.0.0";
    
    uint256 public constant MAX_PERSIANS            = 300000 * 10**18;  // 300.000
    uint256 public constant MAX_SPARTANS            = 300 * 10**18;     // 300
    uint256 public constant MAX_IMMORTALS           = 100;              // 100
    uint256 public constant MAX_ATHENIANS           = 100 * 10**18;     // 100

    uint256 public constant D18                     = 10**18;           // Common decimal positions
    uint8   public constant BP_PERSIAN              = 1;                // Each Persian worths 1 Battle Point
    uint8   public constant BP_IMMORTAL             = 100;              // Each Immortal worths 100 Battle Points
    uint16  public constant BP_SPARTAN              = 1000;             // Each Spartan worths 1000 Battle Points
    uint8   public constant BP_ATHENIAN             = 100;              // Each Athenians worths 100 Battle Points

    uint8   public constant BATTLE_POINT_DECIMALS   = 18;
    uint8   public constant BATTLE_CASUALTIES       = 10;               //Percentage of Persian and Spartan casualties
    
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
        (*) 10% of main troops of both sides lie on the ground
        (*) 90% of them can be retrieved by each former owner
        (*) No slaves are assigned
    
    When the battle ends with a winning factions:
        (*) 10% of main troops of both sides lie on the ground
        (*) 90% of them can be retrieved by each former owner
        (*) Surviving warriors of the loosing faction are assigned as slaves to winners
        (*) Slaves are computed based on the BP contributed by each sender
    
    Persians and Spartans are main troops.

    Immortals and Athenians are support troops: there will be no casualties in their row, and they can
    be retrieved without losses by original senders.
    
    Only Persians and Spartans can be slaves. Immortals and Athenians WILL NOT be sent back as slaves to winners.

    Main Net Addresses
    Persians            = 0xaEc98A708810414878c3BCDF46Aad31dEd4a4557;
    Immortals           = 0x22E5F62D0FA19974749faa194e3d3eF6d89c08d7;
    Spartans            = 0x163733bcc28dbf26B41a8CfA83e369b5B3af741b;
    Athenians           = 0x17052d51E954592C1046320c2371AbaB6C73Ef10;
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
        WarriorsAssignedToBattlefield(msg.sender, persians, _warriors.div(D18));
        return true;
    }

    function assignSpartansToBattle(uint256 _warriors) onlyIfInTime external returns (bool success) {
        assignWarriorsToBattle(msg.sender, spartans, _warriors, MAX_SPARTANS);
        // Spartans are divisible with 18 decimals and their value is 1.000 BP
        WarriorsAssignedToBattlefield(msg.sender, spartans, _warriors.div(D18).mul(BP_SPARTAN));
        return true;
    }

    function assignImmortalsToBattle(uint256 _warriors) onlyIfInTime external returns (bool success) {
        assignWarriorsToBattle(msg.sender, immortals, _warriors, MAX_IMMORTALS);
        // Immortals are not divisible and their value is 100 BP
        WarriorsAssignedToBattlefield(msg.sender, immortals, _warriors.mul(BP_IMMORTAL));
        return true;
    }

    function assignAtheniansToBattle(uint256 _warriors) onlyIfInTime external returns (bool success) {
        assignWarriorsToBattle(msg.sender, athenians, _warriors, MAX_ATHENIANS);
        // Athenians are divisible with 18 decimals and their value is 100 BP
        WarriorsAssignedToBattlefield(msg.sender, athenians, _warriors.div(D18).mul(BP_ATHENIAN));
        return true;
    }

    /**** PHASE #2 ******/

    function redeemWarriors() onlyIfTimePassed external returns (bool success) {

        if (getPersiansBattlePoints() > getGreeksBattlePoints()) {
            // Persians won, compute slaves
            uint256 slaveWarriors = computeSlaves(msg.sender, spartans);
            if (slaveWarriors > 0) {
                // Send back Spartan slaves
                sendWarriors(msg.sender, spartans, slaveWarriors);
            }
            // Send back Persians but casualties
            retrieveWarriors(msg.sender, persians, BATTLE_CASUALTIES);
        } else if (getPersiansBattlePoints() < getGreeksBattlePoints()) {
            // TODO Greeks won, send back Persian slaves
            
            // Send back Spartans but casualties
            retrieveWarriors(msg.sender, spartans, BATTLE_CASUALTIES);
        }
        // Send back Immortals untouched
        retrieveWarriors(msg.sender, immortals, 0);
        // Send back Athenians untouched
        retrieveWarriors(msg.sender, athenians, 0);
        return true;
    }

    /*** PRIVATE FUNCTIONS ***/

    function assignWarriorsToBattle(address _player, address _faction, uint256 _warriors, uint256 _maxWarriors) private {
        require(warriorsOnTheBattlefield[_faction].add(_warriors) <= _maxWarriors);
        assert(TokenERC20(_faction).transferFrom(_player, address(this), _warriors));
        warriors[_player][_faction] = warriors[_player][_faction].add(_warriors);
        warriorsOnTheBattlefield[_faction] = warriorsOnTheBattlefield[_faction].add(_warriors);
    }

    function retrieveWarriors(address _player, address _faction, uint8 _deadPercentage) private {
        if (warriors[_player][_faction] > 0) {
            uint256 _deadWarriors = 0;
            if (_deadPercentage > 0) {
                _deadWarriors = warriors[_player][_faction].per(_deadPercentage);
                warriorsIntoAde[_faction] = warriorsIntoAde[_faction].add(_deadWarriors);
            }
            uint256 _warriors = warriors[_player][_faction].sub(_deadWarriors);
            warriors[_player][_faction] = 0;
            sendWarriors(_player, _faction, _warriors);
            WarriorsBackToHome(_player, _faction, _warriors);
        }
    }

    function sendWarriors(address _player, address _faction, uint256 _warriors) private {
        assert(TokenERC20(_faction).transfer(_player, _warriors));
    }

    // // This method returns sensible values for two combinations of parameters: (persians, spartans) and (spartans, persians)
    // function getSlaves(address _player, address _winningFaction, address _looserFaction) constant returns (uint256 slaves) {
    //     return ((_winningFaction == persians && _looserFaction == spartans) || (_winningFaction == spartans && _looserFaction == persians)) ?
    //         (warriorsOnTheBattlefield[_looserFaction] - (warriorsOnTheBattlefield[_looserFaction] / 10)) / (warriorsOnTheBattlefield[_winningFaction] / warriors[_player][_winningFaction]) : 0;
    // }

    /*** CONSTANT FUNCTIONS AND DAPP HELPERS ***/

    function computeSlaves(address _player, address _loosingMainTroops) constant returns (uint256 slaves) {
        uint256 _slaves = 0;
        address _winningMainTroops;
        address _winningSupportTroops;
        address _loosingSupportTroops;
        if (_loosingMainTroops == spartans) {
            _winningMainTroops = persians;
            _winningSupportTroops = immortals;
            _loosingSupportTroops = athenians;
        } else {
            _winningMainTroops = spartans;
            _winningSupportTroops = athenians;
            _loosingSupportTroops = immortals;
        }
        
        // uint256 _looserWarriors = warriorsOnTheBattlefield[_loosingFaction].sub(warriorsOnTheBattlefield[_loosingFaction].div(100).mul(BATTLE_CASUALTIES));

        return _slaves;
        //    (warriorsOnTheBattlefield[_looserFaction] - (warriorsOnTheBattlefield[_looserFaction] / 10)) / (warriorsOnTheBattlefield[_winningFaction] / warriors[_player][_winningFaction]) : 0;
    }


    function getPersiansOnTheBattlefield(address _player) constant returns (uint persiansOnTheBattlefield) {
        return warriors[_player][persians];
    }

    function getImmortalsOnTheBattlefield(address _player) constant returns (uint immortalsOnTheBattlefield) {
        return warriors[_player][immortals];
    }

    function getSpartansOnTheBattlefield(address _player) constant returns (uint spartansOnTheBattlefield) {
        return warriors[_player][spartans];
    }

    function getAtheniansOnTheBattlefield(address _player) constant returns (uint atheniansOnTheBattlefield) {
        return warriors[_player][athenians];
    }

    function getPersiansBattlePoints() constant returns (uint battlePoints) {
        return (warriorsOnTheBattlefield[persians].mul(BP_PERSIAN) + warriorsOnTheBattlefield[immortals].mul(D18).mul(BP_IMMORTAL));
    }

    function getGreeksBattlePoints() constant returns (uint battlePoints) {
        return (warriorsOnTheBattlefield[spartans].mul(BP_SPARTAN) + warriorsOnTheBattlefield[athenians].mul(BP_ATHENIAN));
    }
    
    function isInProgress() constant returns (bool inProgress) {
        return !isTimeExpired();        
    }

    function isEnded() constant returns (bool ended) {
        return isTimeExpired();
    }

    function isDraw() constant returns (bool draw) {
        return (getPersiansBattlePoints() == getGreeksBattlePoints());
    }

    function getWinningFaction() constant returns (string winningFaction) {
        if (!isTimeExpired()) {
            return "The battle is still in progress";
        }
        if (isDraw()) {
            return "The battle ended in a draw!";
        }
        return getPersiansBattlePoints() > getGreeksBattlePoints() ? "Persians" : "Greeks";
    }

    /****           DEV FUNCTIONS               *******/
    /**** REMOVE THESE FUNCTIONS BEFORE DEPLOY  *******/
    /**** REMOVE THESE FUNCTIONS BEFORE DEPLOY  *******/
    /**** REMOVE THESE FUNCTIONS BEFORE DEPLOY  *******/
    /**** REMOVE THESE FUNCTIONS BEFORE DEPLOY  *******/
    /****             REALLY!                   *******/

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
