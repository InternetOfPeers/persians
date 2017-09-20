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

        //This account has not alloed enough tokens
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

        //Adding persians or immortals to the battle don't impact the greeks army
        let expectedGreeksBP = web3.toBigNumber(0);
        let greeksBP = await battle.getGreeksBattlePoints.call();
        assert(greeksBP.equals(expectedGreeksBP), 'spartans army should have 0 battle points');

        //TODO ADD GREEKS CHECKS

        //Adding spartans or athenians to the battle don't impact the persian army
        await spartans.approve(battle.address, 100, { from: all_warriors_1 });
        await battle.assignSpartansToBattle(100, { from: all_warriors_1 });
        assert(expectedPersiansBP.equals(persiansBP), 'found spartans intruders in the persians army! Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);
        await athenians.approve(battle.address, 100, { from: all_warriors_1 });
        await battle.assignAtheniansToBattle(100, { from: all_warriors_1 });
        assert(expectedPersiansBP.equals(persiansBP), 'found spartans intruders in the persians army! Expected: ' + expectedPersiansBP + ' -- Found: ' + persiansBP);
    });

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

    it('Persians win!', function () {
        Battle.new(YESTERDAY, 3600 * 1, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.setPersiansWin();
            instance.getWinningFaction().then(function (result) { assert(result == "Persians"); });
        });
    });

    it('Greeks win!', function () {
        Battle.new(YESTERDAY, 3600 * 1, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.setGreeksWin();
            instance.getWinningFaction().then(function (result) { assert(result == "Greeks"); });
        });
    });

});