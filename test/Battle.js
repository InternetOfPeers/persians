
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
            return persians.transfer(persian_2, 150000 * D18);
        }).then(function () {
            return SimpleToken.new("Immortal", "IMT", 0, 100).then(function (instance) {
                immortals = instance;
                immortals.transfer(immortal_1, 50);
                return immortals.transfer(immortal_2, 50);;
            })
        }).then(function () {
            return SimpleToken.new("Spartan", "300", 18, 300 * D18).then(function (instance) {
                spartans = instance;
                spartans.transfer(spartan_1, 150 * D18);
                return spartans.transfer(spartan_2, 150 * D18);
            })
        }).then(function () {
            return SimpleToken.new("Athenian", "100", 18, 100 * D18).then(function (instance) {
                athenians = instance;
                athenians.transfer(athenian_1, 50 * D18);
                return athenians.transfer(athenian_2, 50 * D18);
            })
        }).then(function () {
            var startBattle = NOW;
            var endBattle = startBattle + (60 * 60 * 24);
            var avarageBlockTime = 24;
            return Battle.new(startBattle, endBattle, avarageBlockTime, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
                battle = instance;
            });
        });
    });

    it('should give error because allowance is too few', async function () {
        try {
            //This account has not persian tokens, hence not enough allowance
            await battle.assignPersiansToBattle(20 * Math.pow(10, 18), { from: immortal_1 });
            assert.fail("it should have thrown an exception because there's not enough allowance.");
        } catch (error) {
            assertJump(error);
        }

        try {
            //This account has not persian tokens, hence not enough allowance
            await battle.assignPersiansToBattle(20 * Math.pow(10, 18), { from: persian_1 });
            assert.fail("it should have thrown an exception because there's not enough allowance.");
        } catch (error) {
            assertJump(error);
        }

        try {
            //This account has not alloed enough tokens
            await persians.approve(battle.address, 10 * Math.pow(10, 18), { from: immortal_1 });
            await battle.assignPersiansToBattle(20 * Math.pow(10, 18), { from: immortal_1 });
            assert.fail("it should have thrown an exception because there's not enough allowance.");
        } catch (error) {
            assertJump(error);
        }
    })

    // it('should assign warriors to battle', function () {
    //     //Assign 150.000 persians to battle
    //     // var tokens = 150000 * D18;
    //     // var expectedPersiansBP = tokens * BP_PERSIAN;
    //     // var sender = persian_1;
    //     // return persians.approve(battle.address, tokens, { from: sender }).then(function () {
    //     //     return battle.assignPersiansToBattle(tokens, { from: sender }).then(function () {
    //     //         return battle.getPersiansBattlePoints.call().then(function (result) {
    //     //             //console.log(result);
    //     //             //console.log(JSON.stringify(expectedPersiansBP));
    //     //             //assert.equal(result, expectedPersiansBP, 'persians battle points are not calculated correctly');
    //     //         });
    //     //     });
    //     // })
    //     // .then(function () {
    //     //     //Assign other 50.000 persians to battle
    //     //     tokens = 50000 * D18;
    //     //     expectedPersiansBP += tokens * BP_PERSIAN;
    //     //     sender = persian_2;
    //     //     return persians.approve(battle.address, tokens, { from: sender }).then(function () {
    //     //         return battle.assignPersiansToBattle(tokens, { from: sender }).then(function () {
    //     //             return battle.getPersiansBattlePoints.call().then(function (result) {
    //     //                 console.log("BBBB:"+result+"--"+expectedPersiansBP);
    //     //                 assert.equal(result.valueOf(), expectedPersiansBP + 1, 'persians battle points are not calculated correctly');
    //     //             });
    //     //         });
    //     //     });
    //     // });
    // });

    it('battle is still in progress', function () {
        Battle.new(YESTERDAY, 3600 * 48, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle is still in progress");
            });
        });
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