'use strict'

const Upgradable = artifacts.require('./Upgradable.sol');
const assertJump = require('./helpers/assertJump');

contract('Upgradable', function (accounts) {

    it('Can deprecate contract, only once', async function () {
        let upgradable = await Upgradable.new('1.0.0');
        assert.equal(await upgradable.VERSION(), '1.0.0', 'Wrong starting version');
        assert(await upgradable.setDeprecated('2.0.0', 0xaEc98A708810414878c3BCDF46Aad31dEd4a4557), 'Should be able to deprecate contract');
        assert.equal(await upgradable.newVersion(), '2.0.0', 'Wrong updated version');
        assert.equal(await upgradable.newAddress(), 0xaEc98A708810414878c3BCDF46Aad31dEd4a4557, 'Wrong updated contract address');
        try {
            await upgradable.setDeprecated('3.0.0', 0x2);
            assert.fail('Shouldn\'t be able to set deprecated twice');
        } catch (error) {
            assertJump(error);
        }
    });

});