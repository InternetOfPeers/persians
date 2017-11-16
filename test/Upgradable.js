'use strict'

const Upgradable = artifacts.require('./Upgradable.sol');
const assertException = require('./helpers/assertException');

contract('Upgradable', function (accounts) {

    it('Can deprecate contract, only once', async function () {
        let upgradable = await Upgradable.new('1.0.0');
        assert.equal(await upgradable.VERSION(), '1.0.0', 'Wrong starting version');
        let newContract = await Upgradable.new('2.0.0');
        assert.equal(await newContract.VERSION(), '2.0.0', 'Wrong starting version');
        assert(await upgradable.setDeprecated('2.0.0', newContract.address), 'Should be able to deprecate contract');
        assert.equal(await upgradable.newVersion(), '2.0.0', 'Wrong updated version');
        assert.equal(await upgradable.newAddress(), newContract.address, 'Wrong updated contract address');
        try {
            await upgradable.setDeprecated('3.0.0', 0x2);
            assert.fail('Shouldn\'t be able to set deprecated twice');
        } catch (error) {
            assertException(error);
        }
    });

});