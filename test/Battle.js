var Battle = artifacts.require('./Battle.sol');
var SimpleToken = artifacts.require("./SimpleToken.sol");

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

    var battle, persians, immortals, spartans, athenians;

    before("create tokens and deploy battle contract", function () {
        return SimpleToken.new("Persian", "PRS", 18, 300000 * Math.pow(10, 18)).then(function (instance) {
            persians = instance;
            persians.transfer(persian_1, 150000 * Math.pow(10, 18));
            return persians.transfer(persian_2, 150000 * Math.pow(10, 18));
        }).then(function () {
            return SimpleToken.new("Immortal", "IMT", 0, 100).then(function (instance) {
                immortals = instance;
                immortals.transfer(immortal_1, 50);
                return immortals.transfer(immortal_2, 50);;
            })
        }).then(function () {
            return SimpleToken.new("Spartan", "300", 18, 300 * Math.pow(10, 18)).then(function (instance) {
                spartans = instance;
                spartans.transfer(spartan_1, 150 * Math.pow(10, 18));
                return spartans.transfer(spartan_2, 150 * Math.pow(10, 18));
            })
        }).then(function () {
            return SimpleToken.new("Athenian", "100", 18, 100 * Math.pow(10, 18)).then(function (instance) {
                athenians = instance;
                athenians.transfer(athenian_1, 50 * Math.pow(10, 18));
                return athenians.transfer(athenian_2, 50 * Math.pow(10, 18));
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

    it('should give error because allowance is too few', function () {
        //This account has not persian tokens, hence not enough allowance
        battle.assignPersiansToBattle(20 * Math.pow(10, 18), { from: immortal_1 })
        .then(assert.fail)
        .catch(function (error) {
            assert(error.message.indexOf('invalid opcode') >= 0, "it should have thrown an exception because there's not enough allowance.");
        });
        //This account has not allowed any tokens
        battle.assignPersiansToBattle(20 * Math.pow(10, 18), { from: persian_1 })
        .then(assert.fail)
        .catch(function (error) {
            assert(error.message.indexOf('invalid opcode') >= 0, "it should have thrown an exception because there's not enough allowance.");
        });
        //This account has not alloed enough tokens
        persians.approve(battle.address, 10 * Math.pow(10, 18)).then(function() {
            battle.assignPersiansToBattle(20 * Math.pow(10, 18), { from: immortal_1 })
            .then(assert.fail)
            .catch(function (error) {
                assert(error.message.indexOf('invalid opcode') >= 0, "it should have thrown an exception because there's not enough allowance.");
            });
        });
    })

    it('The battle is still in progress', function () {
        Battle.new(YESTERDAY, 3600 * 48, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle is still in progress");
            });
        });
    });

    it('The battle is still in progress', function () {
        Battle.new(YESTERDAY, 3600 * 48, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle is still in progress");
            });
        });
    });

    it('The battle is over', function () {
        Battle.new(YESTERDAY, 3600 * 1, 15, persians.address, immortals.address, spartans.address, athenians.address).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result != "The battle is still in progress");
            });
        });
    });

    it('The battle ended in a draw!', function () {
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