'use strict'

var Battle = artifacts.require('./Battle.sol');
var SimpleToken = artifacts.require("./SimpleToken.sol");
const assertJump = require('./helpers/assertJump');

/*
    // result.tx => transaction hash, string
    // result.logs => array of trigger events (1 item in this case)
    // result.receipt => receipt object
*/

contract('Battle', function (accounts) {

    const NOW = Math.floor(new Date().getTime() / 1000);
    const YESTERDAY = NOW - (3600 * 24);
    const WAD = Math.pow(10, 18);

    const persian_1 = accounts[1];        // 150.000 Persians
    const persian_2 = accounts[2];        // 120.000 Persians
    const immortal_1 = accounts[3];       //      50 Immortals
    const immortal_2 = accounts[4];       //      40 Immortals
    const spartan_1 = accounts[5];        //     150 Spartans
    const spartan_2 = accounts[6];        //     120 Spartans
    const athenian_1 = accounts[7];       //      50 Athenians
    const athenian_2 = accounts[8];       //      40 Athenians
    const all_warriors_1 = accounts[9];   // 130.000 Persians
                                          //     110 Immortals
                                          //     130 Spartans
                                          //     110 Athenians

    const BP_PERSIAN = 1;                 //     1 Battle Point
    const BP_IMMORTAL = 100;              //   100 Battle Points
    const BP_SPARTAN = 1000;              // 1.000 Battle Points
    const BP_ATHENIAN = 100;              //   100 Battle Points

    var battle, persians, immortals, spartans, athenians;   // Contract instances

    before("Distribute all tokens and deploy battle contract", function () {
        return SimpleToken.new("Persian", "PRS", 18, 300000 * WAD + 100000 * WAD).then(function (instance) {
            persians = instance;
            persians.transfer(persian_1, 150000 * WAD);
            persians.transfer(persian_2, 120000 * WAD);
            return persians.transfer(all_warriors_1, 30000 * WAD + 100000 * WAD);
        }).then(function () {
            return SimpleToken.new("Immortal", "IMT", 0, 100 + 100).then(function (instance) {
                immortals = instance;
                immortals.transfer(immortal_1, 50);
                immortals.transfer(immortal_2, 40)
                return immortals.transfer(all_warriors_1, 10 + 100);
            })
        }).then(function () {
            return SimpleToken.new("Spartan", "300", 18, 300 * WAD + 100 * WAD).then(function (instance) {
                spartans = instance;
                spartans.transfer(spartan_1, 150 * WAD);
                spartans.transfer(spartan_2, 120 * WAD);
                return spartans.transfer(all_warriors_1, 30 * WAD + 100 * WAD);
            })
        }).then(function () {
            return SimpleToken.new("Athenian", "100", 18, 100 * WAD + 100 * WAD).then(function (instance) {
                athenians = instance;
                athenians.transfer(athenian_1, 50 * WAD);
                athenians.transfer(athenian_2, 40 * WAD);
                return athenians.transfer(all_warriors_1, 10 * WAD + 100 * WAD);
            })
        }).then(function () {
            let startBattle = NOW;
            let endBattle = startBattle + (60 * 60 * 24);
            let avarageBlockTime = 24;
            return Battle.new(startBattle, endBattle, avarageBlockTime, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
                battle = instance;
            });
        });
    });

    it('Battle should be in progress', async function () {
        let winningFaction = await battle.getWinningFaction();
        assert.equal(winningFaction, 'The battle is still in progress', 'the battle should be in progress, found '+ winningFaction);
    });

    it('Should return error because allowance is too few', async function () {
        //This account has not persian tokens, hence not enough allowance
        try {
            await battle.assignPersiansToBattle(20 * Math.pow(10, 18), { from: immortal_1 });
            assert.fail("it should have thrown an exception because there's not enough allowance.");
        } catch (error) {
            assertJump(error);
        }

        //This account has not persian tokens, hence not enough allowance
        try {
            await battle.assignPersiansToBattle(20 * Math.pow(10, 18), { from: persian_1 });
            assert.fail("it should have thrown an exception because there's not enough allowance.");
        } catch (error) {
            assertJump(error);
        }

        //This account has not allowed enough tokens
        try {
            await persians.approve(battle.address, 10 * Math.pow(10, 18), { from: immortal_1 });
            await battle.assignPersiansToBattle(20 * Math.pow(10, 18), { from: immortal_1 });
            assert.fail("it should have thrown an exception because there's not enough allowance.");
        } catch (error) {
            assertJump(error);
        }
    })

    async function prepareBattlefield(){
        //Assign 150.000 persians to battle
        let tokens = web3.toBigNumber(150000).mul(WAD);
        let expectedPersiansBP = tokens.mul(BP_PERSIAN);
        await persians.approve(battle.address, tokens, { from: persian_1 });
        await battle.assignPersiansToBattle(tokens, { from: persian_1 });
        let persiansBP = await battle.getPersiansBattlePoints.call();
        assert(expectedPersiansBP.equals(persiansBP), 'persians battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        //Assign other 55.000 persians to battle
        tokens = web3.toBigNumber(55000).mul(WAD);
        expectedPersiansBP = expectedPersiansBP.plus(tokens.mul(BP_PERSIAN));
        await persians.approve(battle.address, tokens, { from: persian_2 });
        await battle.assignPersiansToBattle(tokens, { from: persian_2 });
        persiansBP = await battle.getPersiansBattlePoints.call();
        assert(expectedPersiansBP.equals(persiansBP), 'persians battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        //Assign 20 immortals: their force is added to the persians side.
        tokens = web3.toBigNumber(20);
        expectedPersiansBP = expectedPersiansBP.plus(tokens.mul(WAD).mul(BP_IMMORTAL));
        await immortals.approve(battle.address, tokens, { from: immortal_1 });
        await battle.assignImmortalsToBattle(tokens, { from: immortal_1 });
        persiansBP = await battle.getPersiansBattlePoints.call();
        assert(expectedPersiansBP.equals(persiansBP), 'immortals battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        //Assign other 15 immortals: their force is added to the persians side.
        tokens = web3.toBigNumber(15);
        expectedPersiansBP = expectedPersiansBP.plus(tokens.mul(WAD).mul(BP_IMMORTAL));
        await immortals.approve(battle.address, tokens, { from: immortal_2 });
        await battle.assignImmortalsToBattle(tokens, { from: immortal_2 });
        persiansBP = await battle.getPersiansBattlePoints.call();
        assert(expectedPersiansBP.equals(persiansBP), 'immortals battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        //Adding persians or immortals to the battle don't impact the greeks army
        let expectedGreeksBP = web3.toBigNumber(0);
        let greeksBP = await battle.getGreeksBattlePoints.call();
        assert(greeksBP.equals(expectedGreeksBP), 'greeks army should have 0 battle points');

        //Adding spartans or athenians to the battle don't impact the persian army
        let greeksInTheField = web3.toBigNumber(4).mul(WAD);
        await spartans.approve(battle.address, greeksInTheField, { from: all_warriors_1 });
        await battle.assignSpartansToBattle(greeksInTheField, { from: all_warriors_1 });
        assert(expectedPersiansBP.equals(persiansBP), 'found spartans intruders in the persians army! Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);
        await athenians.approve(battle.address, greeksInTheField, { from: all_warriors_1 });
        await battle.assignAtheniansToBattle(greeksInTheField, { from: all_warriors_1 });
        assert(expectedPersiansBP.equals(persiansBP), 'found spartans intruders in the persians army! Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);
        let currentGreeksBP = await battle.getGreeksBattlePoints.call();

        //Assign 150 spartans to battle
        tokens = web3.toBigNumber(150).mul(WAD);
        expectedGreeksBP = tokens.mul(BP_SPARTAN).plus(currentGreeksBP);
        await spartans.approve(battle.address, tokens, { from: spartan_1 });
        await battle.assignSpartansToBattle(tokens, { from: spartan_1 });
        greeksBP = await battle.getGreeksBattlePoints.call();
        assert(expectedGreeksBP.equals(greeksBP), 'greeks battle points are not calculated correctly. Expected: ' + expectedGreeksBP + ' -- Found: ' + greeksBP);

        //Assign other 55 spartans to battle
        tokens = web3.toBigNumber(55).mul(WAD);
        expectedGreeksBP = expectedGreeksBP.plus(tokens.mul(BP_SPARTAN));
        await spartans.approve(battle.address, tokens, { from: spartan_2 });
        await battle.assignSpartansToBattle(tokens, { from: spartan_2 });
        greeksBP = await battle.getGreeksBattlePoints.call();
        assert(expectedGreeksBP.equals(greeksBP), 'greeks battle points are not calculated correctly. Expected: ' + expectedGreeksBP + ' -- Found: ' + greeksBP);

        //Assign 20 athenians: their force is added to the greek side.
        tokens = web3.toBigNumber(20).mul(WAD);
        expectedGreeksBP = expectedGreeksBP.plus(tokens.mul(BP_ATHENIAN));
        await athenians.approve(battle.address, tokens, { from: athenian_1 });
        await battle.assignAtheniansToBattle(tokens, { from: athenian_1 });
        greeksBP = await battle.getGreeksBattlePoints.call();
        assert(expectedGreeksBP.equals(greeksBP), 'greeks battle points are not calculated correctly. Expected: ' + expectedGreeksBP + ' -- Found: ' + greeksBP);

        //Assign 15.09 athenians: their force is added to the greek side.
        tokens = web3.toBigNumber(15.09).mul(WAD);
        expectedGreeksBP = expectedGreeksBP.plus(tokens.mul(BP_ATHENIAN));
        await athenians.approve(battle.address, tokens, { from: athenian_2 });
        await battle.assignAtheniansToBattle(tokens, { from: athenian_2 });
        greeksBP = await battle.getGreeksBattlePoints.call();
        assert(expectedGreeksBP.equals(greeksBP), 'greeks battle points are not calculated correctly. Expected: ' + expectedGreeksBP + ' -- Found: ' + greeksBP);

        //Adding spartans or athenians to the battle don't impact the persian army
        persiansBP = await battle.getPersiansBattlePoints.call();
        assert(persiansBP.equals(expectedPersiansBP), 'spartans army should have ' + expectedPersiansBP + ' battle points, but they have ' + persiansBP + ' battle points');

        // Prepare battlefield for future tests
        await persians.approve(battle.address, 11 * WAD, { from: all_warriors_1 });
        await battle.assignPersiansToBattle(11 * WAD, { from: all_warriors_1 });
        await immortals.approve(battle.address, 2, { from: all_warriors_1 });
        await battle.assignImmortalsToBattle(2, { from: all_warriors_1 });
    }

    it('Should set battle points based on warriors assigned to the battlefield', async function () {
        await prepareBattlefield();
    });

    it('Should not be able to assign too much troops to the battlefield', async function () {
        let tooMuchPersians = 900000 * WAD;
        let tooMuchImmortals = 900;
        let tooMuchSpartans = 900 * WAD;
        let tooMuchAthenians = 900 * WAD;
        await persians.approve(battle.address, tooMuchPersians, { from: all_warriors_1 });
        await immortals.approve(battle.address, tooMuchImmortals, { from: all_warriors_1 });
        await spartans.approve(battle.address, tooMuchSpartans, { from: all_warriors_1 });
        await athenians.approve(battle.address, tooMuchAthenians, { from: all_warriors_1 });

        try {
            await battle.assignPersiansToBattle(tooMuchPersians, { from: all_warriors_1 });
            assert.fail("it should have thrown an exception because too much warriors have been assigned to battlefiled.");
        } catch (error) {
            assertJump(error);
        }

        try {
            await battle.assignImmortalsToBattle(tooMuchImmortals, { from: all_warriors_1 });
            assert.fail("it should have thrown an exception because too much warriors have been assigned to battlefiled.");
        } catch (error) {
            assertJump(error);
        }

        try {
            await battle.assignSpartansToBattle(tooMuchSpartans, { from: all_warriors_1 });
            assert.fail("it should have thrown an exception because too much warriors have been assigned to battlefiled.");
        } catch (error) {
            assertJump(error);
        }

        try {
            await battle.assignAtheniansToBattle(tooMuchAthenians, { from: all_warriors_1 });
            assert.fail("it should have thrown an exception because too much warriors have been assigned to battlefiled.");
        } catch (error) {
            assertJump(error);
        }
    });

    it('Battle should be ended', async function () {
        await battle.setTime(NOW, 0, 0);
        let ended = await battle.isEnded();
        assert(ended, 'The battle should be ended');
    });

    it('Should not be able to add warriors when battle is over', async function () {
        let warriors = 100;
        await persians.approve(battle.address, warriors, { from: all_warriors_1 });
        await immortals.approve(battle.address, warriors, { from: all_warriors_1 });
        await spartans.approve(battle.address, warriors, { from: all_warriors_1 });
        await athenians.approve(battle.address, warriors, { from: all_warriors_1 });

        try {
            await battle.assignPersiansToBattle(warriors, { from: all_warriors_1 });
            assert.fail("it should have thrown an exception because the battle is over.");
        } catch (error) {
            assertJump(error);
        }

        try {
            await battle.assignImmortalsToBattle(warriors, { from: all_warriors_1 });
            assert.fail("it should have thrown an exception because the battle is over.");
        } catch (error) {
            assertJump(error);
        }

        try {
            await battle.assignSpartansToBattle(warriors, { from: all_warriors_1 });
            assert.fail("it should have thrown an exception because the battle is over.");
        } catch (error) {
            assertJump(error);
        }

        try {
            await battle.assignAtheniansToBattle(warriors, { from: all_warriors_1 });
            assert.fail("it should have thrown an exception because the battle is over.");
        } catch (error) {
            assertJump(error);
        }
    });

    /*** SCENARIO 1 - Greeks won!   ***********************************************

    Current battlefield:
        205.011 Persians        205.011 BP
             37 Immortals         3.700 BP
                                208.011 BP

            209 Spartans        209.000 BP
          39.09 Athenians         3.909 BP
                                212.909 BP
            
    Troops sent:
        persian_1   150.000    Persians    (150.000 owned)
        persian_2    55.000    Persians    (120.000 owned)
        immortal_1       20    Immortals   (     50 owned)
        immortal_2       15    Immortals   (     40 owned)
        spartan_1       150    Spartans    (    150 owned)
        spartan_2        55    Spartans    (    120 owned)
        athenian_1       20    Athenians   (     50 owned)
        athenian_2       15,09 Athenians   (     40 owned)
        -----------------------------------------------
        all_warriors_1   11    Persians    (130.000 owned)
                          2    Immortals   (    110 owned)
                          4    Spartans    (    130 owned)
                          4    Athenians   (    110 owned)
        -----------------------------------------------

    ******************************************************************************/

    it('Greeks won!', async function () {
        let persiansOnTheBattlefield = await battle.warriorsOnTheBattlefield(persians.address);
        let immortalsOnTheBattlefield = await battle.warriorsOnTheBattlefield(immortals.address);
        let spartansOnTheBattlefield = await battle.warriorsOnTheBattlefield(spartans.address);
        let atheniansOnTheBattlefield = await battle.warriorsOnTheBattlefield(athenians.address);
        let persianSlaves = await battle.getTotalSlaves(persians.address);
        let spartanSlaves = await battle.getTotalSlaves(spartans.address);
        let persiansBP = await battle.getPersiansBattlePoints();
        let greeksBP = await battle.getGreeksBattlePoints();
        let winningFaction = await battle.getWinningFaction();
        assert(persiansOnTheBattlefield.equals(205011 * WAD), 'Persians on the battlefield should be 205.011, found ' + persiansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(37), 'Immortals on the battlefield should be 37, found ' + immortalsOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(209 * WAD), 'Spartans on the battlefield should be 209, found ' + spartansOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(39.09 * WAD), 'Athenians on the battlefield should be 39.09, found ' + atheniansOnTheBattlefield);
        assert(persianSlaves.equals(184509.9 * WAD), 'Persian slaves should be 184.509,9 (205.011 - 20.501,1), found ' + persianSlaves);
        assert(spartanSlaves.equals(188.1 * WAD), 'Spartan slaves should be 188,1 (209 - 20,9), found ' + spartanSlaves);
        assert(persiansBP.equals(208711 * WAD), 'Persians BP should be 208.711 (205.011 + 3.700), found ' + persiansBP);
        assert(greeksBP.equals(212909 * WAD), 'Greeks BP should be 212.909 (209.000 + 3.909, found ' + greeksBP);
        assert.equal(winningFaction, 'Greeks', 'Greeks should have won. Winning faction: '+ winningFaction);
    });

    it('Greeks won! > Should redeem survived Spartan warriors and Persian slaves', async function () {
        let player = spartan_1;
        // Check balances
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentPersiansBalance = await persians.balanceOf(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(150 * WAD), player + ' should have 150 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(playerBP.equals(150000 * WAD), player + ' should have 150.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentSpartansBalance = await spartans.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(135 * WAD), player + ' should have 135 Spartans (150 - 10% dead = 135 survivors), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.greaterThan(129992.0858 * WAD) && currentPersiansBalance.lessThan(129992.09 * WAD), player + ' should have about 129.992,0858~ Persians slaves, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = spartan_2;
        // Check balances        
        currentSpartansBalance = await spartans.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(65 * WAD), player + ' should have 65 Spartans, found ' + currentSpartansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(55 * WAD), player + ' should have 55 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(playerBP.equals(55000 * WAD), player + ' should have 55.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentSpartansBalance = await spartans.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(114.5 * WAD), player + ' should have 114.5 Spartans (65 + (55 - 10% dead = 49,5 survivors)), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.greaterThan(47663.7648 * WAD) && currentPersiansBalance.lessThan(47663.7649 * WAD), player + ' should have about 47.663,7648~ Persians slaves, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Greeks won! > Can\'t redeem Spartan warriors and Persian slaves twice', async function () {
        let player = spartan_1;
        // Redeem warriors again        
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentPersiansBalance = await persians.balanceOf(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        assert(currentSpartansBalance.equals(135 * WAD), player + ' should have 135 Spartans (150 - 10% dead = 135 survivors), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.greaterThan(129992.0858 * WAD) && currentPersiansBalance.lessThan(129992.09 * WAD), player + ' should have about 129992,0858~ Persians slaves, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);

        player = spartan_2;
        // Redeem warriors again        
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        currentSpartansBalance = await spartans.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        assert(currentSpartansBalance.equals(114.5 * WAD), player + ' should have 114,5 Spartans (65 + (55 - 10% dead = 49,5 survivors)), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.greaterThan(47663.7648 * WAD) && currentPersiansBalance.lessThan(47663.7649 * WAD), player + ' should have about 47663,7648~ Persians slaves, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
    });

    it('Greeks won! > Should redeem all Athenians and Persian slaves', async function () {
        let player = athenian_1;
        // Check balances
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let currentPersiansBalance = await persians.balanceOf(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentAtheniansBalance.equals(30 * WAD), player + ' should have 30 Athenians, found ' + currentAtheniansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(atheniansOnTheBattlefield.equals(20 * WAD), player + ' should have 20 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(2000 * WAD), player + ' should have 2.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentAtheniansBalance = await athenians.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentAtheniansBalance.equals(50 * WAD), player + ' should have 50 Athenians, found ' + currentAtheniansBalance);
        assert(currentPersiansBalance.greaterThan(1733.2 * WAD) && currentPersiansBalance.lessThan(1733.23 * WAD), player + ' should have about 1733,22~ Persians slaves, found ' + currentPersiansBalance);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = athenian_2;
        // Check balances
        currentAtheniansBalance = await athenians.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentAtheniansBalance.equals(24.91 * WAD), player + ' should have 24,91 Athenians, found ' + currentAtheniansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(atheniansOnTheBattlefield.equals(15.09 * WAD), player + ' should have 15,09 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(1509 * WAD), player + ' should have 1.509 Battle Points, found ' + playerBP);
        // Redeem warriors
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentAtheniansBalance = await athenians.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentAtheniansBalance.equals(40 * WAD), player + ' should have 50 Athenians, found ' + currentAtheniansBalance);
        assert(currentPersiansBalance.greaterThan(1307.72 * WAD) && currentPersiansBalance.lessThan(1307.73 * WAD), player + ' should have about 1307,720383~ Persians slaves, found ' + currentPersiansBalance);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Greeks won! > Can\'t redeem Athenian warriors and Persian slaves twice', async function () {
        let player = athenian_1;
        // Redeem warriors again        
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let currentPersiansBalance = await persians.balanceOf(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentAtheniansBalance.equals(50 * WAD), player + ' should have 50 Athenians, found ' + currentAtheniansBalance);
        assert(currentPersiansBalance.greaterThan(1733.2 * WAD) && currentPersiansBalance.lessThan(1733.23 * WAD), player + ' should have about 1733.22~ Persians slaves, found ' + currentPersiansBalance);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = athenian_2;
        // Redeem warriors again        
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        currentAtheniansBalance = await athenians.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentAtheniansBalance.equals(40 * WAD), player + ' should have 50 Athenians, found ' + currentAtheniansBalance);
        assert(currentPersiansBalance.greaterThan(1307.72 * WAD) && currentPersiansBalance.lessThan(1307.73 * WAD), player + ' should have about 1307,720383~ Persians slaves, found ' + currentPersiansBalance);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Greeks won! > Should redeem survived Spartans, Persian slaves, all Athenians and all Immortals', async function () {
        let player = all_warriors_1;
        // Check balances        
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(126 * WAD), player + ' should have 126 Spartans, found ' + currentSpartansBalance);
        assert(currentPersiansBalance.equals(129989 * WAD), player + ' should have 129.989 Persians, found ' + currentPersiansBalance);
        assert(currentImmortalsBalance.equals(108), player + ' should have 108 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(106 * WAD), player + ' should have 106 Athenians, found ' + currentAtheniansBalance);
        assert(spartansOnTheBattlefield.equals(4 * WAD), player + ' should have 4 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(persiansOnTheBattlefield.equals(11 * WAD), player + ' should have 11 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(2), player + ' should have 2 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(4 * WAD), player + ' should have 4 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(4400 * WAD), player + ' should have 4.400 Battle Points (4.000 by Spartans + 400 by Athenians), found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentSpartansBalance = await spartans.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentAtheniansBalance = await athenians.balanceOf(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(129.6 * WAD), player + ' should have 129.6 Spartans (126 + (4 - 10% dead = 3.6 survivors)), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.greaterThan(129989 * WAD + 3813.101184 * WAD) && currentPersiansBalance.lessThan(129989 * WAD + 3813.11 * WAD), player + ' should have about 3466.455622~ Persians slaves, found ' + currentPersiansBalance);
        assert(currentImmortalsBalance.equals(110), player + ' should have 110 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(110 * WAD), player + ' should have 110 Athenians, found ' + currentAtheniansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(persiansOnTheBattlefield.equals(11 * WAD), player + ' should have 11 Persians (dead) on the battlefield, found ' + persiansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Greeks won! > Can\'t redeem survived Spartans, Persian slaves, all Athenians and all Immortals twice', async function () {
        let player = all_warriors_1;
        // Redeem warriors again        
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(129.6 * WAD), player + ' should have 129.6 Spartans (126 + (4 - 10% dead = 3.6 survivors)), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.greaterThan(129989 * WAD + 3813.101184 * WAD) && currentPersiansBalance.lessThan(129989 * WAD + 3813.11 * WAD), player + ' should have about 3466.455622~ Persians slaves, found ' + currentPersiansBalance);
        assert(currentImmortalsBalance.equals(110), player + ' should have 110 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(110 * WAD), player + ' should have 110 Athenians, found ' + currentAtheniansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(persiansOnTheBattlefield.equals(11 * WAD), player + ' should have 11 Persians (dead) on the battlefield, found ' + persiansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Greeks won! > Can\'t redeem Persians', async function() {
        let player = persian_1;
        // Check balances
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(0), player + ' should have 0 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(0), player + ' should have 0 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(150000 * WAD), player + ' should have 150.000 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(150000 * WAD), player + ' should have 150.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentAtheniansBalance = await athenians.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(0), player + ' should have 0 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(0), player + ' should have 0 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(150000 * WAD), player + ' should have 150.000 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(150000 * WAD), player + ' should have 150.000 Battle Points, found ' + playerBP);
    });

    it('Greeks won! > Should redeem all Immortals without Spartan slaves', async function() {
        let player = immortal_1;
        // Check balances
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(30), player + ' should have 30 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(0), player + ' should have 0 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(20), player + ' should have 20 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(2000 * WAD), player + ' should have 2.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentAtheniansBalance = await athenians.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(50), player + ' should have 50 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(0), player + ' should have 0 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    /*** SCENARIO 2 - Persians won!   ********************************************

    Current battlefield:
        228.122 Persians        228.122 BP
             37 Immortals         3.700 BP
                                231.822 BP

            209 Spartans        209.000 BP
          39.09 Athenians         3.909 BP
                                212.909 BP
            
    Troops sent:
        persian_1   150.000    Persians    (150.000 owned)
        persian_2    78.111    Persians    (120.000 owned)
        immortal_1       20    Immortals   (     50 owned)
        immortal_2       15    Immortals   (     40 owned)
        spartan_1       150    Spartans    (    150 owned)
        spartan_2        55    Spartans    (    120 owned)
        athenian_1       20    Athenians   (     50 owned)
        athenian_2       15,09 Athenians   (     40 owned)
        -----------------------------------------------
        all_warriors_1   11    Persians    (130.000 owned)
                          2    Immortals   (    110 owned)
                          4    Spartans    (    130 owned)
                          4    Athenians   (    110 owned)
        -----------------------------------------------

    ******************************************************************************/
    
    it('Persians won! (Set new battle and battlefield)', async function(){
        await SimpleToken.new("Persian", "PRS", 18, 300000 * WAD + 100000 * WAD).then(function (instance) {
            persians = instance;
            persians.transfer(persian_1, 150000 * WAD);
            persians.transfer(persian_2, 120000 * WAD);
            return persians.transfer(all_warriors_1, 30000 * WAD + 100000 * WAD);
        }).then(function () {
            return SimpleToken.new("Immortal", "IMT", 0, 100 + 100).then(function (instance) {
                immortals = instance;
                immortals.transfer(immortal_1, 50);
                immortals.transfer(immortal_2, 40)
                return immortals.transfer(all_warriors_1, 10 + 100);
            })
        }).then(function () {
            return SimpleToken.new("Spartan", "300", 18, 300 * WAD + 100 * WAD).then(function (instance) {
                spartans = instance;
                spartans.transfer(spartan_1, 150 * WAD);
                spartans.transfer(spartan_2, 120 * WAD);
                return spartans.transfer(all_warriors_1, 30 * WAD + 100 * WAD);
            })
        }).then(function () {
            return SimpleToken.new("Athenian", "100", 18, 100 * WAD + 100 * WAD).then(function (instance) {
                athenians = instance;
                athenians.transfer(athenian_1, 50 * WAD);
                athenians.transfer(athenian_2, 40 * WAD);
                return athenians.transfer(all_warriors_1, 10 * WAD + 100 * WAD);
            })
        }).then(function () {
            let startBattle = NOW;
            let endBattle = startBattle + (60 * 60 * 24);
            let avarageBlockTime = 24;
            return Battle.new(startBattle, endBattle, avarageBlockTime, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
                battle = instance;
            });
        });

        await prepareBattlefield();

        // Assign other 23.111 persians to battle
        let tokens = web3.toBigNumber(23111).mul(WAD);
        let expectedPersiansBP = web3.toBigNumber(231822).mul(WAD);
        await persians.approve(battle.address, tokens, { from: persian_2 });
        await battle.assignPersiansToBattle(tokens, { from: persian_2 });
        let persiansBP = await battle.getPersiansBattlePoints();
        assert(expectedPersiansBP.equals(persiansBP), 'persians battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        // End the battle
        await battle.setTime(NOW, 0, 0);
        let ended = await battle.isEnded();
        assert(ended, 'The battle should be ended');

        // Check the battlefield
        let persiansOnTheBattlefield = await battle.warriorsOnTheBattlefield(persians.address);
        let immortalsOnTheBattlefield = await battle.warriorsOnTheBattlefield(immortals.address);
        let spartansOnTheBattlefield = await battle.warriorsOnTheBattlefield(spartans.address);
        let atheniansOnTheBattlefield = await battle.warriorsOnTheBattlefield(athenians.address);
        let persianSlaves = await battle.getTotalSlaves(persians.address);
        let spartanSlaves = await battle.getTotalSlaves(spartans.address);
        persiansBP = await battle.getPersiansBattlePoints();
        let greeksBP = await battle.getGreeksBattlePoints();
        let winningFaction = await battle.getWinningFaction();
        assert(persiansOnTheBattlefield.equals(228122 * WAD), 'Persians on the battlefield should be 228.122, found ' + persiansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(37), 'Immortals on the battlefield should be 37, found ' + immortalsOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(209 * WAD), 'Spartans on the battlefield should be 209, found ' + spartansOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(39.09 * WAD), 'Athenians on the battlefield should be 39.09, found ' + atheniansOnTheBattlefield);
        assert(persianSlaves.equals(205309.8 * WAD), 'Persian slaves should be 205.309,8 (228.122 - 22.812,2), found ' + persianSlaves);
        assert(spartanSlaves.equals(188.1 * WAD), 'Spartan slaves should be 188,1 (209 - 20,9), found ' + spartanSlaves);
        assert(persiansBP.equals(231822 * WAD), 'Persians BP should be 231.822 (228.122 + 3.700), found ' + persiansBP);
        assert(greeksBP.equals(212909 * WAD), 'Greeks BP should be 212.909 (209.000 + 3.909, found ' + greeksBP);
        assert.equal(winningFaction, 'Persians', 'Persians should have won. Winning faction: '+ winningFaction);
    });
    
    it('Persians won! > Should redeem survived Persian warriors and Spartan slaves', async function () {
        let player = persian_1;
        // Check balances
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(150000 * WAD), player + ' should have 150.000 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(150000 * WAD), player + ' should have 150.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(135000 * WAD), player + ' should have 135.000 Persians (150.000 - 10% dead = 135.000 survivors), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.greaterThan(121.70 * WAD) && currentSpartansBalance.lessThan(121.71 * WAD), player + ' should have about 121,7097601~ Spartan slaves, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = persian_2;
        // Check balances        
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(41889 * WAD), player + ' should have 41.889 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(78111 * WAD), player + ' should have 78.111 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(78111 * WAD), player + ' should have 78.111 Battle Points, found ' + playerBP);
        // Redeem warriors
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(112188.9 * WAD), player + ' should have 112.188,9 Persians (41.889 + (78.111 - 10% dead = 70.299,9 survivors)), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.greaterThan(63.37 * WAD) && currentSpartansBalance.lessThan(63.38 * WAD), player + ' should have about 63,37914046~ Spartan slaves, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Persians won! > Can\'t redeem Persian warriors and Spartan slaves twice', async function () {
        let player = persian_1;
        // Redeem warriors again
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        assert(currentPersiansBalance.equals(135000 * WAD), player + ' should have 135.000 Persians (150.000 - 10% dead = 135.000 survivors), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.greaterThan(121.70 * WAD) && currentSpartansBalance.lessThan(121.71 * WAD), player + ' should have about 121,7097601~ Spartan slaves, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);

        player = persian_2;
        // Redeem warriors again        
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        assert(currentPersiansBalance.equals(112188.9 * WAD), player + ' should have 112.188,9 Persians (41.889 + (78.111 - 10% dead = 70.299,9 survivors)), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.greaterThan(63.37 * WAD) && currentSpartansBalance.lessThan(63.38 * WAD), player + ' should have about 63,37914046~ Spartan slaves, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
    });

    it('Persians won! > Should redeem all Immortals and Spartan slaves', async function () {
        let player = immortal_1;
        // Check balances
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentImmortalsBalance.equals(30), player + ' should have 30 Immortals, found ' + currentImmortalsBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Persians, found ' + currentSpartansBalance);
        assert(immortalsOnTheBattlefield.equals(20), player + ' should have 20 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(playerBP.equals(2000 * WAD), player + ' should have 2.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentImmortalsBalance.equals(50), player + ' should have 50 Immortals, found ' + currentImmortalsBalance);
        assert(currentSpartansBalance.greaterThan(1.62 * WAD) && currentSpartansBalance.lessThan(1.63 * WAD), player + ' should have about 1,622796801~ Spartans slaves, found ' + currentSpartansBalance);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = immortal_2;
        // Check balances
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentImmortalsBalance.equals(25), player + ' should have 25 Immortals, found ' + currentImmortalsBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Persians, found ' + currentSpartansBalance);
        assert(immortalsOnTheBattlefield.equals(15), player + ' should have 15 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(playerBP.equals(1500 * WAD), player + ' should have 1.500 Battle Points, found ' + playerBP);
        // Redeem warriors
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentImmortalsBalance.equals(40), player + ' should have 40 Immortals, found ' + currentImmortalsBalance);
        assert(currentSpartansBalance.greaterThan(1.21 * WAD) && currentSpartansBalance.lessThan(1.22 * WAD), player + ' should have about 1,217097601~ Spartans slaves, found ' + currentSpartansBalance);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Persians won! > Can\'t redeem Immortal warriors and Persian slaves twice', async function () {
        let player = immortal_1;
        // Redeem warriors again        
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentImmortalsBalance.equals(50), player + ' should have 50 Immortals, found ' + currentImmortalsBalance);
        assert(currentSpartansBalance.greaterThan(1.62 * WAD) && currentSpartansBalance.lessThan(1.63 * WAD), player + ' should have about 1,622796801~ Spartans slaves, found ' + currentSpartansBalance);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = immortal_2;
        // Redeem warriors again        
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentImmortalsBalance.equals(40), player + ' should have 40 Immortals, found ' + currentImmortalsBalance);
        assert(currentSpartansBalance.greaterThan(1.21 * WAD) && currentSpartansBalance.lessThan(1.22 * WAD), player + ' should have about 1,217097601~ Spartans slaves, found ' + currentSpartansBalance);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Persians won! > Should redeem survived Persians, Spartan slaves, all Immortals and all Athenians', async function () {
        let player = all_warriors_1;
        // Check balances        
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(129989 * WAD), player + ' should have 129.989 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(126 * WAD), player + ' should have 126 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(108), player + ' should have 108 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(106 * WAD), player + ' should have 106 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(11 * WAD), player + ' should have 11 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(4 * WAD), player + ' should have 4 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(2), player + ' should have 2 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(4 * WAD), player + ' should have 4 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(211 * WAD), player + ' should have 211 Battle Points (11 by Persians + 200 by Immortals), found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentAtheniansBalance = await athenians.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(129998.9 * WAD), player + ' should have 129.998,9 Persians (129989 + (11 - 10% dead = 9.9 survivors)), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.greaterThan(126 * WAD + 0.17120506 * WAD) && currentSpartansBalance.lessThan(126 * WAD + 0.18 * WAD), player + ' should have about 126,171205063~ Spartan slaves, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(110), player + ' should have 110 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(110 * WAD), player + ' should have 110 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(4 * WAD), player + ' should have 0 Spartans (dead) on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Persians won! > Can\'t redeem survived Persians, Spartan slaves, all Immortals and all Athenians twice', async function () {
        let player = all_warriors_1;
        // Redeem warriors again        
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(129998.9 * WAD), player + ' should have 129.998,9 Persians (129989 + (11 - 10% dead = 9.9 survivors)), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.greaterThan(126 * WAD + 0.17120506 * WAD) && currentSpartansBalance.lessThan(126 * WAD + 0.18 * WAD), player + ' should have about 126,171205063~ Spartan slaves, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(110), player + ' should have 110 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(110 * WAD), player + ' should have 110 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(4 * WAD), player + ' should have 4 Spartans (dead) on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('Persians won! > Can\'t redeem Spartans', async function() {
        let player = spartan_1;
        // Check balances
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(0), player + ' should have 0 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(0), player + ' should have 0 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(150 * WAD), player + ' should have 150 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(150000 * WAD), player + ' should have 150.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentAtheniansBalance = await athenians.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(0), player + ' should have 0 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(0), player + ' should have 0 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(150 * WAD), player + ' should have 150 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(150000 * WAD), player + ' should have 150.000 Battle Points, found ' + playerBP);
    });

    it('Persians won! > Should redeem all Athenians without Persian slaves', async function() {
        let player = athenian_1;
        // Check balances
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(0), player + ' should have 0 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(30 * WAD), player + ' should have 30 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(20 * WAD), player + ' should have 20 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(2000 * WAD), player + ' should have 2.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentAtheniansBalance = await athenians.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(0), player + ' should have 0 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(50 * WAD), player + ' should have 50 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    /*** SCENARIO 3 - It's a draw!   *********************************************

    Current battlefield:
        209.209 Persians        209.209 BP
             37 Immortals         3.700 BP
                                212.909 BP

            209 Spartans        209.000 BP
          39.09 Athenians         3.909 BP
                                212.909 BP
            
    Troops sent:
        persian_1   150.000    Persians    (150.000 owned)
        persian_2    59.198    Persians    (120.000 owned)
        immortal_1       20    Immortals   (     50 owned)
        immortal_2       15    Immortals   (     40 owned)
        spartan_1       150    Spartans    (    150 owned)
        spartan_2        55    Spartans    (    120 owned)
        athenian_1       20    Athenians   (     50 owned)
        athenian_2       15,09 Athenians   (     40 owned)
        -----------------------------------------------
        all_warriors_1   11    Persians    (130.000 owned)
                          2    Immortals   (    110 owned)
                          4    Spartans    (    130 owned)
                          4    Athenians   (    110 owned)
        -----------------------------------------------

    ******************************************************************************/

    it('It\'s a draw! (Set new battle and battlefield)', async function(){
        await SimpleToken.new("Persian", "PRS", 18, 300000 * WAD + 100000 * WAD).then(function (instance) {
            persians = instance;
            persians.transfer(persian_1, 150000 * WAD);
            persians.transfer(persian_2, 120000 * WAD);
            return persians.transfer(all_warriors_1, 30000 * WAD + 100000 * WAD);
        }).then(function () {
            return SimpleToken.new("Immortal", "IMT", 0, 100 + 100).then(function (instance) {
                immortals = instance;
                immortals.transfer(immortal_1, 50);
                immortals.transfer(immortal_2, 40)
                return immortals.transfer(all_warriors_1, 10 + 100);
            })
        }).then(function () {
            return SimpleToken.new("Spartan", "300", 18, 300 * WAD + 100 * WAD).then(function (instance) {
                spartans = instance;
                spartans.transfer(spartan_1, 150 * WAD);
                spartans.transfer(spartan_2, 120 * WAD);
                return spartans.transfer(all_warriors_1, 30 * WAD + 100 * WAD);
            })
        }).then(function () {
            return SimpleToken.new("Athenian", "100", 18, 100 * WAD + 100 * WAD).then(function (instance) {
                athenians = instance;
                athenians.transfer(athenian_1, 50 * WAD);
                athenians.transfer(athenian_2, 40 * WAD);
                return athenians.transfer(all_warriors_1, 10 * WAD + 100 * WAD);
            })
        }).then(function () {
            let startBattle = NOW;
            let endBattle = startBattle + (60 * 60 * 24);
            let avarageBlockTime = 24;
            return Battle.new(startBattle, endBattle, avarageBlockTime, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
                battle = instance;
            });
        });

        await prepareBattlefield();

        // Assign other 4.198 persians to battle
        let tokens = web3.toBigNumber(4198).mul(WAD);
        let expectedPersiansBP = web3.toBigNumber(212909).mul(WAD);
        await persians.approve(battle.address, tokens, { from: persian_2 });
        await battle.assignPersiansToBattle(tokens, { from: persian_2 });
        let persiansBP = await battle.getPersiansBattlePoints();
        assert(expectedPersiansBP.equals(persiansBP), 'Persian battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        // End the battle
        await battle.setTime(NOW, 0, 0);
        let ended = await battle.isEnded();
        assert(ended, 'The battle should be ended');

        // Check the battlefield
        let persiansOnTheBattlefield = await battle.warriorsOnTheBattlefield(persians.address);
        let immortalsOnTheBattlefield = await battle.warriorsOnTheBattlefield(immortals.address);
        let spartansOnTheBattlefield = await battle.warriorsOnTheBattlefield(spartans.address);
        let atheniansOnTheBattlefield = await battle.warriorsOnTheBattlefield(athenians.address);
        let persianSlaves = await battle.getTotalSlaves(persians.address);
        let spartanSlaves = await battle.getTotalSlaves(spartans.address);
        persiansBP = await battle.getPersiansBattlePoints();
        let greeksBP = await battle.getGreeksBattlePoints();
        let winningFaction = await battle.getWinningFaction();
        assert(persiansOnTheBattlefield.equals(209209 * WAD), 'Persians on the battlefield should be 209.209, found ' + persiansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(37), 'Immortals on the battlefield should be 37, found ' + immortalsOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(209 * WAD), 'Spartans on the battlefield should be 209, found ' + spartansOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(39.09 * WAD), 'Athenians on the battlefield should be 39.09, found ' + atheniansOnTheBattlefield);
        assert(persianSlaves.equals(188288.1 * WAD), 'Persian slaves should be 188.288,1 (209.209 - 20.920,9), found ' + persianSlaves);
        assert(spartanSlaves.equals(188.1 * WAD), 'Spartan slaves should be 188,1 (209 - 20,9), found ' + spartanSlaves);
        assert(persiansBP.equals(212909 * WAD), 'Persians BP should be 212.909 (209.209 + 3.700), found ' + persiansBP);
        assert(greeksBP.equals(212909 * WAD), 'Greeks BP should be 212.909 (209.000 + 3.909, found ' + greeksBP);
        assert.equal(winningFaction, 'The battle ended in a draw!', 'It should be a draw! It is '+ winningFaction);
    });

    it('It\'s a draw! > Should redeem survived Persian warriors without Spartan slaves', async function () {
        let player = persian_1;
        // Check balances
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(150000 * WAD), player + ' should have 150.000 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(150000 * WAD), player + ' should have 150.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(135000 * WAD), player + ' should have 135.000 Persians (150.000 - 10% dead = 135.000 survivors), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = persian_2;
        // Check balances        
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(60802 * WAD), player + ' should have 60.802 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(59198 * WAD), player + ' should have 59.198 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(59198 * WAD), player + ' should have 59.198 Battle Points, found ' + playerBP);
        // Redeem warriors
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.greaterThan(114080.1 * WAD) && currentPersiansBalance.lessThan(114080.3 * WAD), player + ' should have 114.080,2~ Persians (60.802 + (59.198 - 10% dead = 53.278,2 survivors)), found ' + currentPersiansBalance);        
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('It\'s a draw! > Can\'t redeem survived Persian warriors twice', async function () {
        let player = persian_1;
        // Redeem warriors again
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(135000 * WAD), player + ' should have 135.000 Persians (150.000 - 10% dead = 135.000 survivors), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = persian_2;
        // Redeem warriors again
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.greaterThan(114080.1 * WAD) && currentPersiansBalance.lessThan(114080.3 * WAD), player + ' should have 114.080,2~ Persians (60.802 + (59.198 - 10% dead = 53.278,2 survivors)), found ' + currentPersiansBalance);        
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('It\'s a draw! > Should redeem all Immortals without Spartan slaves', async function() {
        let player = immortal_1;
        // Check balances
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(30), player + ' should have 30 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(0), player + ' should have 0 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(20), player + ' should have 20 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(2000 * WAD), player + ' should have 2.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentAtheniansBalance = await athenians.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(50), player + ' should have 50 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(0), player + ' should have 0 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('It\'s a draw! > Can\'t redeem Immortal warriors twice', async function () {
        let player = immortal_1;
        // Redeem warriors again        
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentImmortalsBalance.equals(50), player + ' should have 50 Immortals, found ' + currentImmortalsBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = immortal_2;
        // Redeem warriors again        
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        playerBP = await battle.getPersiansBattlePointsBy(player);
        assert(currentImmortalsBalance.equals(40), player + ' should have 40 Immortals, found ' + currentImmortalsBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('It\'s a draw! > Should redeem survived Spartan warriors without Persian slaves', async function () {
        let player = spartan_1;
        // Check balances
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentPersiansBalance = await persians.balanceOf(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(150 * WAD), player + ' should have 150 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(playerBP.equals(150000 * WAD), player + ' should have 150.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentSpartansBalance = await spartans.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(135 * WAD), player + ' should have 135 Spartans (150 - 10% dead = 135 survivors), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = spartan_2;
        // Check balances        
        currentSpartansBalance = await spartans.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(65 * WAD), player + ' should have 65 Spartans, found ' + currentSpartansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(55 * WAD), player + ' should have 55 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(playerBP.equals(55000 * WAD), player + ' should have 55.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentSpartansBalance = await spartans.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentSpartansBalance.equals(114.5 * WAD), player + ' should have 114.5 Spartans (65 + (55 - 10% dead = 49,5 survivors)), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('It\'s a draw! > Can\'t redeem Spartan warriors twice', async function () {
        let player = spartan_1;
        // Redeem warriors again        
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentPersiansBalance = await persians.balanceOf(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        assert(currentSpartansBalance.equals(135 * WAD), player + ' should have 135 Spartans (150 - 10% dead = 135 survivors), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);

        player = spartan_2;
        // Redeem warriors again        
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        currentSpartansBalance = await spartans.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        assert(currentSpartansBalance.equals(114.5 * WAD), player + ' should have 114,5 Spartans (65 + (55 - 10% dead = 49,5 survivors)), found ' + currentSpartansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
    });

    it('It\'s a draw! > Should redeem all Athenians without Persian slaves', async function() {
        let player = athenian_1;
        // Check balances
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(0), player + ' should have 0 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(30 * WAD), player + ' should have 30 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(20 * WAD), player + ' should have 20 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(2000 * WAD), player + ' should have 2.000 Battle Points, found ' + playerBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentAtheniansBalance = await athenians.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(0), player + ' should have 0 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(0), player + ' should have 0 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(50 * WAD), player + ' should have 50 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('It\'s a draw! > Can\'t redeem Athenian warriors twice', async function () {
        let player = athenian_1;
        // Redeem warriors again        
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let currentPersiansBalance = await persians.balanceOf(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentAtheniansBalance.equals(50 * WAD), player + ' should have 50 Athenians, found ' + currentAtheniansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);

        player = athenian_2;
        // Redeem warriors again        
        redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        currentAtheniansBalance = await athenians.balanceOf(player);
        currentPersiansBalance = await persians.balanceOf(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentAtheniansBalance.equals(40 * WAD), player + ' should have 50 Athenians, found ' + currentAtheniansBalance);
        assert(currentPersiansBalance.equals(0), player + ' should have 0 Persians, found ' + currentPersiansBalance);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerBP.equals(0), player + ' should have 0 Battle Points, found ' + playerBP);
    });

    it('It\'s a draw! > Should redeem survived Persians, survived Spartan, all Immortals and all Athenians', async function () {
        let player = all_warriors_1;
        // Check balances
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerPersiansBP = await battle.getPersiansBattlePointsBy(player);
        let playerGreeksBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentPersiansBalance.equals(129989 * WAD), player + ' should have 129.989 Persians, found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(126 * WAD), player + ' should have 126 Spartans, found ' + currentSpartansBalance);
        assert(currentImmortalsBalance.equals(108), player + ' should have 108 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(106 * WAD), player + ' should have 106 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(11 * WAD), player + ' should have 11 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(4 * WAD), player + ' should have 4 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(2), player + ' should have 2 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(4 * WAD), player + ' should have 4 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerPersiansBP.equals(211 * WAD), player + ' should have 211 Battle Points (11 by Persians + 200 by Immortals), found ' + playerPersiansBP);
        assert(playerGreeksBP.equals(4400 * WAD), player + ' should have 4400 Battle Points (4000 by Spartans + 400 by Athenians), found ' + playerGreeksBP);
        // Redeem warriors
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances
        currentPersiansBalance = await persians.balanceOf(player);
        currentSpartansBalance = await spartans.balanceOf(player);
        currentImmortalsBalance = await immortals.balanceOf(player);
        currentAtheniansBalance = await athenians.balanceOf(player);
        persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        playerPersiansBP = await battle.getPersiansBattlePointsBy(player);
        playerGreeksBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentPersiansBalance.equals(129998.9 * WAD), player + ' should have 129.998,9 Persians (129989 + (11 - 10% dead = 9.9 survivors)), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(129.6 * WAD), player + ' should have 129.6 Spartans (126 + (4 - 10% = 3.6 survivors)), found ' + currentSpartansBalance);        
        assert(currentImmortalsBalance.equals(110), player + ' should have 110 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(110 * WAD), player + ' should have 110 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerPersiansBP.equals(0), player + ' should have 0 Battle Points, found ' + playerPersiansBP);
        assert(playerGreeksBP.equals(0), player + ' should have 0 Battle Points, found ' + playerGreeksBP);
    });

    it('It\'s a draw! > Can\'t redeem survived Persians, survived Spartan, all Immortals and all Athenians twice', async function () {
        let player = all_warriors_1;
        // Redeem warriors again        
        let redeem = await battle.redeemWarriors({ from: player });
        assert(redeem, 'Redeem failed');
        // Check new balances, nothing should have changed
        let currentPersiansBalance = await persians.balanceOf(player);
        let currentSpartansBalance = await spartans.balanceOf(player);
        let currentImmortalsBalance = await immortals.balanceOf(player);
        let currentAtheniansBalance = await athenians.balanceOf(player);
        let persiansOnTheBattlefield = await battle.getPersiansOnTheBattlefield(player);
        let spartansOnTheBattlefield = await battle.getSpartansOnTheBattlefield(player);
        let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield(player);
        let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield(player);
        let playerPersiansBP = await battle.getPersiansBattlePointsBy(player);
        let playerGreeksBP = await battle.getGreeksBattlePointsBy(player);
        assert(currentPersiansBalance.equals(129998.9 * WAD), player + ' should have 129.998,9 Persians (129989 + (11 - 10% dead = 9.9 survivors)), found ' + currentPersiansBalance);
        assert(currentSpartansBalance.equals(129.6 * WAD), player + ' should have 129.6 Spartans (126 + (4 - 10% = 3.6 survivors)), found ' + currentSpartansBalance);        
        assert(currentImmortalsBalance.equals(110), player + ' should have 110 Immortals, found ' + currentImmortalsBalance);
        assert(currentAtheniansBalance.equals(110 * WAD), player + ' should have 110 Athenians, found ' + currentAtheniansBalance);
        assert(persiansOnTheBattlefield.equals(0), player + ' should have 0 Persians on the battlefield, found ' + persiansOnTheBattlefield);
        assert(spartansOnTheBattlefield.equals(0), player + ' should have 0 Spartans on the battlefield, found ' + spartansOnTheBattlefield);
        assert(immortalsOnTheBattlefield.equals(0), player + ' should have 0 Immortals on the battlefield, found ' + immortalsOnTheBattlefield);
        assert(atheniansOnTheBattlefield.equals(0), player + ' should have 0 Athenians on the battlefield, found ' + atheniansOnTheBattlefield);
        assert(playerPersiansBP.equals(0), player + ' should have 0 Battle Points, found ' + playerPersiansBP);
        assert(playerGreeksBP.equals(0), player + ' should have 0 Battle Points, found ' + playerGreeksBP);
    });

});