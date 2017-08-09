var TestLib = artifacts.require('./TestLib.sol');

contract('TestLib', function (accounts) {

    it('Test library', function () {
        TestLib.deployed().then(function (instance) {
            assert(instance.a == 4);
        });
    });

});