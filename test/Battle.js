var Battle = artifacts.require('./Battle.sol');

/*
    // result.tx => transaction hash, string
    // result.logs => array of trigger events (1 item in this case)
    // result.receipt => receipt object
*/

contract('Battle', function (accounts) {

    var now = Math.floor(new Date().getTime() / 1000);
    var yesterday = now - (3600 * 24);

    it('The battle is still in progress', function () {
        Battle.new(yesterday, 3600 * 48, 15).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle is still in progress");
            });
        });
    });

    it('The battle is over', function () {
        Battle.new(yesterday, 3600 * 1, 15).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result != "The battle is still in progress");
            });
        });
    });

    it('The battle ended in a draw!', function () {
        Battle.new(yesterday, 3600 * 1, 15).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle ended in a draw!");
            });
        });
        Battle.new(yesterday, 3600 * 1, 15).then(function (instance) {
            instance.setDraw();
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle ended in a draw!");
            });
        });
    });

    it('Persians win!', function () {
        Battle.new(yesterday, 3600 * 1, 15).then(function (instance) {
            instance.setPersiansWin();
            instance.getWinningFaction().then(function (result) { assert(result == "Persians"); });
        });
    });

    it('Greeks win!', function () {
        Battle.new(yesterday, 3600 * 1, 15).then(function (instance) {
            instance.setGreeksWin();
            instance.getWinningFaction().then(function (result) { assert(result == "Greeks"); });
        });
    });

});