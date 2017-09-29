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

    var persian_1 = accounts[1];
    var persian_2 = accounts[2];
    var immortal_1 = accounts[3];
    var immortal_2 = accounts[4];
    var spartan_1 = accounts[5];
    var spartan_2 = accounts[6];
    var athenian_1 = accounts[7];
    var athenian_2 = accounts[8];
    var all_warriors_1 = accounts[9];

    const NOW = Math.floor(new Date().getTime() / 1000);
    const YESTERDAY = NOW - (3600 * 24);
    const D18 = Math.pow(10, 18);
    const BP_PERSIAN = 1;
    const BP_IMMORTAL = 100;
    const BP_SPARTAN = 1000;
    const BP_ATHENIAN = 100;

    var battle, persians, immortals, spartans, athenians;

    before("distribute all tokens and deploy battle contract", function () {
        return SimpleToken.new("Persian", "PRS", 18, 300000 * D18).then(function (instance) {
            persians = instance;
            persians.transfer(persian_1, 150000 * D18);
            persians.transfer(persian_2, 120000 * D18);
            return persians.transfer(all_warriors_1, 30000 * D18);
        }).then(function () {
            return SimpleToken.new("Immortal", "IMT", 0, 100).then(function (instance) {
                immortals = instance;
                immortals.transfer(immortal_1, 50);
                immortals.transfer(immortal_2, 40)
                return immortals.transfer(all_warriors_1, 10);;
            })
        }).then(function () {
            return SimpleToken.new("Spartan", "300", 18, 300 * D18).then(function (instance) {
                spartans = instance;
                spartans.transfer(spartan_1, 150 * D18);
                spartans.transfer(spartan_2, 120 * D18);
                return spartans.transfer(all_warriors_1, 30 * D18);
            })
        }).then(function () {
            return SimpleToken.new("Athenian", "100", 18, 100 * D18).then(function (instance) {
                athenians = instance;
                athenians.transfer(athenian_1, 50 * D18);
                athenians.transfer(athenian_2, 40 * D18);
                return athenians.transfer(all_warriors_1, 10 * D18);
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

    it('should give error because allowance is too few', async function () {
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

    it('should set persians battle points based on warriors assigned to the battlefield', async function () {
        //Assign 150.000 persians to battle
        let tokens = web3.toBigNumber(150000).mul(D18);
        let expectedPersiansBP = tokens.mul(BP_PERSIAN);
        await persians.approve(battle.address, tokens, { from: persian_1 });
        await battle.assignPersiansToBattle(tokens, { from: persian_1 });
        let persiansBP = await battle.getPersiansBattlePoints.call();
        assert(expectedPersiansBP.equals(persiansBP), 'persians battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        //Assign other 50.000 persians to battle
        tokens = web3.toBigNumber(50000).mul(D18);
        expectedPersiansBP = expectedPersiansBP.plus(tokens.mul(BP_PERSIAN));
        await persians.approve(battle.address, tokens, { from: persian_2 });
        await battle.assignPersiansToBattle(tokens, { from: persian_2 });
        persiansBP = await battle.getPersiansBattlePoints.call();
        assert(expectedPersiansBP.equals(persiansBP), 'persians battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        //Assign 20 immortals: their force is added to the persians side.
        tokens = web3.toBigNumber(20);
        expectedPersiansBP = expectedPersiansBP.plus(tokens.mul(D18).mul(BP_IMMORTAL));
        await immortals.approve(battle.address, tokens, { from: immortal_1 });
        await battle.assignImmortalsToBattle(tokens, { from: immortal_1 });
        persiansBP = await battle.getPersiansBattlePoints.call();
        assert(expectedPersiansBP.equals(persiansBP), 'immortals battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        //Assign other 10 immortals: their force is added to the persians side.
        tokens = web3.toBigNumber(10);
        expectedPersiansBP = expectedPersiansBP.plus(tokens.mul(D18).mul(BP_IMMORTAL));
        await immortals.approve(battle.address, tokens, { from: immortal_2 });
        await battle.assignImmortalsToBattle(tokens, { from: immortal_2 });
        persiansBP = await battle.getPersiansBattlePoints.call();
        assert(expectedPersiansBP.equals(persiansBP), 'immortals battle points are not calculated correctly. Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);

        //Adding persians or immortals to the battle don't impact the greeks army
        let expectedGreeksBP = web3.toBigNumber(0);
        let greeksBP = await battle.getGreeksBattlePoints.call();
        assert(greeksBP.equals(expectedGreeksBP), 'greeks army should have 0 battle points');

        //Adding spartans or athenians to the battle don't impact the persian army
        let greeksInTheField = 100;
        await spartans.approve(battle.address, greeksInTheField, { from: all_warriors_1 });
        await battle.assignSpartansToBattle(greeksInTheField, { from: all_warriors_1 });
        assert(expectedPersiansBP.equals(persiansBP), 'found spartans intruders in the persians army! Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);
        await athenians.approve(battle.address, greeksInTheField, { from: all_warriors_1 });
        await battle.assignAtheniansToBattle(greeksInTheField, { from: all_warriors_1 });
        assert(expectedPersiansBP.equals(persiansBP), 'found spartans intruders in the persians army! Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);
        let currentGreeksBP = await battle.getGreeksBattlePoints.call();

        //Assign 150 spartans to battle
        tokens = web3.toBigNumber(150).mul(D18);
        expectedGreeksBP = tokens.mul(BP_SPARTAN).plus(currentGreeksBP);
        await spartans.approve(battle.address, tokens, { from: spartan_1 });
        await battle.assignSpartansToBattle(tokens, { from: spartan_1 });
        greeksBP = await battle.getGreeksBattlePoints.call();
        assert(expectedGreeksBP.equals(greeksBP), 'greeks battle points are not calculated correctly. Expected: ' + expectedGreeksBP + ' -- Found: ' + greeksBP);

        //Assign other 50 spartans to battle
        tokens = web3.toBigNumber(50).mul(D18);
        expectedGreeksBP = expectedGreeksBP.plus(tokens.mul(BP_SPARTAN));
        await spartans.approve(battle.address, tokens, { from: spartan_2 });
        await battle.assignSpartansToBattle(tokens, { from: spartan_2 });
        greeksBP = await battle.getGreeksBattlePoints.call();
        assert(expectedGreeksBP.equals(greeksBP), 'greeks battle points are not calculated correctly. Expected: ' + expectedGreeksBP + ' -- Found: ' + greeksBP);

        //Assign 20 athenians: their force is added to the greek side.
        tokens = web3.toBigNumber(20).mul(D18);
        expectedGreeksBP = expectedGreeksBP.plus(tokens.mul(BP_ATHENIAN));
        await athenians.approve(battle.address, tokens, { from: athenian_1 });
        await battle.assignAtheniansToBattle(tokens, { from: athenian_1 });
        greeksBP = await battle.getGreeksBattlePoints.call();
        assert(expectedGreeksBP.equals(greeksBP), 'greeks battle points are not calculated correctly. Expected: ' + expectedGreeksBP + ' -- Found: ' + greeksBP);

        //Assign 10 athenians: their force is added to the greek side.
        tokens = web3.toBigNumber(10).mul(D18);
        expectedGreeksBP = expectedGreeksBP.plus(tokens.mul(BP_ATHENIAN));
        await athenians.approve(battle.address, tokens, { from: athenian_2 });
        await battle.assignAtheniansToBattle(tokens, { from: athenian_2 });
        greeksBP = await battle.getGreeksBattlePoints.call();
        assert(expectedGreeksBP.equals(greeksBP), 'greeks battle points are not calculated correctly. Expected: ' + expectedGreeksBP + ' -- Found: ' + greeksBP);

        //Adding spartans or athenians to the battle don't impact the persian army
        persiansBP = await battle.getPersiansBattlePoints.call();
        assert(persiansBP.equals(expectedPersiansBP), 'spartans army should have ' + expectedPersiansBP + ' battle points, but they have ' + persiansBP + ' battle points');
    });

    it('can\'t assign too much troops to the battlefield', async function() {
        assert(false, 'TO BE IMPLEMENTED');
    });

    it('battle should be ended', async function () {
        await battle.setTime(NOW, 0, 0);
        let ended = await battle.isEnded();
        assert(ended, 'The battle should be ended');
    });

    it('Greeks should have won', async function () {
        let winningFaction = await battle.getWinningFaction();
        assert.equal(winningFaction, 'Greeks', 'Greeks should have won');
    });

    it('players should not be able to add warriors when battle is over', async function () {
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

    it('players should be able to retrieve their own survived spartans and their new persian slaves', async function () {
        assert(false, 'TO BE IMPLEMENTED');
    });

    it('players should be able to retrieve their own survived persians and their new spartan slaves', async function () {
        assert(false, 'TO BE IMPLEMENTED');
    });

    // it('players can retrieve their own immortals', async function () {
    //     let player = immortal_1;
    //     let lastImmortalsBalance = await immortals.balanceOf.call(player);
    //     let lastImmortalsOnBattleField = await battle.getImmortalsOnTheBattlefield.call(player);
    //     let retrieved = await battle.retrieveImmortals({ from: player });
    //     assert(retrieved, 'immortals should have been retrieved from the battlefield');
    //     let immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield.call(player);
    //     assert.equal(0, immortalsOnTheBattlefield, 'all player\'s immortals should have left the battlefield');
    //     let currentImmortalsBalance = await immortals.balanceOf.call(player);
    //     assert(lastImmortalsBalance.plus(lastImmortalsOnBattleField).equals(currentImmortalsBalance), 'immortals should have been returned to the correct player');

    //     player = immortal_2;
    //     lastImmortalsBalance = await immortals.balanceOf.call(player);
    //     lastImmortalsOnBattleField = await battle.getImmortalsOnTheBattlefield.call(player);
    //     retrieved = await battle.retrieveImmortals({ from: player });
    //     assert(retrieved, 'immortals should have been retrieved from the battlefield');
    //     immortalsOnTheBattlefield = await battle.getImmortalsOnTheBattlefield.call(player);
    //     assert.equal(0, immortalsOnTheBattlefield, 'all player\'s immortals should have left the battlefield');
    //     currentImmortalsBalance = await immortals.balanceOf.call(player);
    //     assert(lastImmortalsBalance.plus(lastImmortalsOnBattleField).equals(currentImmortalsBalance), 'immortals should have been returned to the correct player');

    //     //player has already retrieved his immortals
    //     try {
    //         await battle.retrieveImmortals({ from: player });
    //         assert.fail("it should have thrown an exception because player has not immortals to retrieve anymore");
    //     } catch (error) {
    //         assertJump(error);
    //     }

    //     player = persian_1;
    //     //This player has not sent any immortals
    //     try {
    //         await battle.retrieveImmortals({ from: player });
    //         assert.fail("it should have thrown an exception because player has not sent any immortals to the battlefield");
    //     } catch (error) {
    //         assertJump(error);
    //     }
    // });

    // it('players can retrieve their own athenians', async function () {
    //     let player = athenian_1;
    //     let lastAtheniansBalance = await athenians.balanceOf.call(player);
    //     let lastAtheniansOnBattleField = await battle.getAtheniansOnTheBattlefield.call(player);
    //     let retrieved = await battle.retrieveAthenians({ from: player });
    //     assert(retrieved, 'athenians should have been retrieved from the battlefield');
    //     let atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield.call(player);
    //     assert.equal(0, atheniansOnTheBattlefield, 'all player\'s athenians should have left the battlefield');
    //     let currentAtheniansBalance = await athenians.balanceOf.call(player);
    //     assert(lastAtheniansBalance.plus(lastAtheniansOnBattleField).equals(currentAtheniansBalance), 'athenians should have been returned to the correct player');

    //     player = athenian_2;
    //     lastAtheniansBalance = await athenians.balanceOf.call(player);
    //     lastAtheniansOnBattleField = await battle.getAtheniansOnTheBattlefield.call(player);
    //     retrieved = await battle.retrieveAthenians({ from: player });
    //     assert(retrieved, 'athenians should have been retrieved from the battlefield');
    //     atheniansOnTheBattlefield = await battle.getAtheniansOnTheBattlefield.call(player);
    //     assert.equal(0, atheniansOnTheBattlefield, 'all player\'s athenians should have left the battlefield');
    //     currentAtheniansBalance = await athenians.balanceOf.call(player);
    //     assert(lastAtheniansBalance.plus(lastAtheniansOnBattleField).equals(currentAtheniansBalance), 'athenians should have been returned to the correct player');

    //     //player has already retrieved his athenians
    //     try {
    //         await battle.retrieveAthenians({ from: player });
    //         assert.fail("it should have thrown an exception because player has not athenians to retrieve anymore");
    //     } catch (error) {
    //         assertJump(error);
    //     }

    //     player = persian_1;
    //     //This player has not sent any athenians
    //     try {
    //         await battle.retrieveAthenians({ from: player });
    //         assert.fail("it should have thrown an exception because player has not sent any athenians to the battlefield");
    //     } catch (error) {
    //         assertJump(error);
    //     }
    // });

    it('battle is still in progress', function () {
        Battle.new(YESTERDAY, 3600 * 48, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle is still in progress");
            });
        });
    });

    it('battle is over', function () {
        Battle.new(YESTERDAY, 3600 * 1, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result != "The battle is still in progress");
            });
        });
    });

    it('battle ended in a draw!', function () {
        Battle.new(YESTERDAY, 3600 * 1, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.setDraw();
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle ended in a draw!");
            });
        });
    });

    it('Persians won!', function () {
        Battle.new(YESTERDAY, 3600 * 1, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.setPersiansWin();
            instance.getWinningFaction().then(function (result) { assert(result == "Persians"); });
        });
    });

    it('Greeks won!', function () {
        Battle.new(YESTERDAY, 3600 * 1, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.setGreeksWin();
            instance.getWinningFaction().then(function (result) { assert(result == "Greeks"); });
        });
    });

});