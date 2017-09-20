'use strict'

var TestLib = artifacts.require('./TestLib.sol');

contract('TestLib', function (accounts) {

    it('Test library', async function () {
        let instance = await TestLib.deployed();
        let value = await instance.getReadme.call();
        assert.equal(value, 4, "not equal");
    });

});