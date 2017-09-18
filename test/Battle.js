var Battle = artifacts.require('./Battle.sol');

/*
    // result.tx => transaction hash, string
    // result.logs => array of trigger events (1 item in this case)
    // result.receipt => receipt object
*/

contract('Battle', function (accounts) {

    var persians            = 0xaec98a708810414878c3bcdf46aad31ded4a4557;
    var immortals           = 0xED19698C0abdE8635413aE7AD7224DF6ee30bF22;
    var spartans            = 0x163733bcc28dbf26B41a8CfA83e369b5B3af741b;
    var athenians           = 0x17052d51e954592c1046320c2371abab6c73ef10;
    var now = Math.floor(new Date().getTime() / 1000);
    var yesterday = now - (3600 * 24);

    it('The battle is still in progress', function () {
        Battle.new(yesterday, 3600 * 48, 15, persians, immortals, spartans, athenians).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle is still in progress");
            });
        });
    });

    it('The battle is over', function () {
        Battle.new(yesterday, 3600 * 1, 15, persians, immortals, spartans, athenians).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result != "The battle is still in progress");
            });
        });
    });

    it('The battle ended in a draw!', function () {
        Battle.new(yesterday, 3600 * 1, 15, persians, immortals, spartans, athenians).then(function (instance) {
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle ended in a draw!");
            });
        });
        Battle.new(yesterday, 3600 * 1, 15, persians, immortals, spartans, athenians).then(function (instance) {
            instance.setDraw();
            instance.getWinningFaction().then(function (result) {
                assert(result == "The battle ended in a draw!");
            });
        });
    });

    it('Persians win!', function () {
        Battle.new(yesterday, 3600 * 1, 15, persians, immortals, spartans, athenians).then(function (instance) {
            instance.setPersiansWin();
            instance.getWinningFaction().then(function (result) { assert(result == "Persians"); });
        });
    });

    it('Greeks win!', function () {
        Battle.new(yesterday, 3600 * 1, 15, persians, immortals, spartans, athenians).then(function (instance) {
            instance.setGreeksWin();
            instance.getWinningFaction().then(function (result) { assert(result == "Greeks"); });
        });
    });

});