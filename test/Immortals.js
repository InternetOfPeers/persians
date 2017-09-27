var Immortals = artifacts.require('./Immortals.sol');

/*
    // result.tx => transaction hash, string
    // result.logs => array of trigger events (1 item in this case)
    // result.receipt => receipt object
*/

contract('Immortals', function (accounts) {

    it('throws if less then 0.5 ethers are sent', function () {
        Immortals.new().then(function (instance) {
            //should throw if less then 0.5
            instance.send(web3.toWei(0.4999, 'ether'))
                .then(assert.fail)
                .catch(function (error) {
                    assert(error.message.indexOf('invalid opcode') >= 0, 'it should have thrown an exception because too few ethers were sent');
                });
            //should be fine with 0.5 or more
            instance.send(web3.toWei(0.5, 'ether'))
                .then(function (success) { assert(success, '0.5 ether should be enough') });
            instance.send(web3.toWei(0.6, 'ether'))
                .then(function (success) { assert(success, '0.6 ether should be enough') });
        });
    });

    it('should gain immortals', function () {
        return Immortals.new().then(function (instance) {
            instance.sendTransaction({ from: accounts[1], value: web3.toWei(0.5, 'ether') });
            instance.balanceOf.call(accounts[1]).then(function (balance) {
                assert.equal(balance.valueOf(), 1, 'it should have gained 1 immortal');
            });

            instance.sendTransaction({ from: accounts[2], value: web3.toWei(0.8, 'ether') });
            instance.balanceOf.call(accounts[2]).then(function (balance) {
                assert.equal(balance.valueOf(), 1, 'it should have gained 1 immortal');
            });

            instance.sendTransaction({ from: accounts[3], value: web3.toWei(1, 'ether') });
            instance.balanceOf.call(accounts[3]).then(function (balance) {
                assert.equal(balance.valueOf(), 2, 'it should have gained 2 immortal');
            });

            instance.sendTransaction({ from: accounts[4], value: web3.toWei(1.2, 'ether') }).then(function() {
                instance.balanceOf.call(accounts[4]).then(function (balance) {
                    assert.equal(balance.valueOf(), 2, 'it should have gained 2 immortal');
                });
                instance.sendTransaction({ from: accounts[4], value: web3.toWei(1.2, 'ether') }).then(function() {
                    instance.balanceOf.call(accounts[4]).then(function (balance) {
                        assert.equal(balance.valueOf(), 4, 'it should have gained a grand total of 4 immortal');
                    });
                });
            });
        });
    });

    it('should count token already assigned', function () {
        return Immortals.new().then(function (instance) {
            instance.sendTransaction({ from: accounts[1], value: web3.toWei(1.26, 'ether') }).then(function(){
                instance.sendTransaction({ from: accounts[1], value: web3.toWei(1.76, 'ether') });
                instance.tokenAssigned().then(function (tokenAssigned) {
                    assert.equal(tokenAssigned.valueOf(), 5, 'it should have gained 5 immortal');
                });
            });
        });
    });

    it('throw if token are all assigned', function () {
        return Immortals.new().then(function (instance) {
            instance.sendTransaction({ from: accounts[1], value: web3.toWei(50, 'ether') });
            instance.sendTransaction({ from: accounts[1], value: web3.toWei(1.76, 'ether') })
                .then(assert.fail)
                .catch(function (error) {
                    assert(error.message.indexOf('invalid opcode') >= 0, 'it should have thrown an exception because there are no more tokens');
                });
        });
    });

    it('should assign maximum token available', function () {
        return Immortals.new().then(function (instance) {
            var owner = accounts[0];
            var sender = accounts[1];
            var previousSenderBalance = web3.eth.getBalance(sender);
            instance.sendTransaction({ from: owner, value: web3.toWei(49.9, 'ether') });
            instance.sendTransaction({ from: sender, value: web3.toWei(1.76, 'ether') })
                .then(function (result) {
                    instance.balanceOf.call(sender).then(function (balance) {
                        assert.equal(balance.valueOf(), 1, 'it should have gained only the last immortal');
                        var newSenderBalance = web3.eth.getBalance(sender);
                        var amount = web3.toWei(0.5, 'ether');
                        var fee = web3.eth.getTransaction(result.tx).gasPrice.valueOf() * result.receipt.gasUsed.valueOf();
                        assert.equal(previousSenderBalance.minus(fee).minus(amount).toNumber(), newSenderBalance.toNumber(), 'sender should have 1.26 ether sent back');
                    });
                });
        });
    });

    it('should send the remainder to sender', function () {
        return Immortals.new().then(function (instance) {
            var sender = accounts[1];
            var previousSenderBalance = web3.eth.getBalance(sender);
            instance.sendTransaction({ from: sender, value: web3.toWei(1.8766, 'ether') })
                .then(function (result) {
                    var newSenderBalance = web3.eth.getBalance(sender);
                    var amount = web3.toWei(1.5, 'ether');
                    var fee = web3.eth.getTransaction(result.tx).gasPrice.valueOf() * result.receipt.gasUsed.valueOf();
                    assert.equal(previousSenderBalance.minus(fee).minus(amount).toNumber(), newSenderBalance.toNumber(), 'sender should have 0.3766 ether sent back');
                });
        });
    });

    it('owner should be able to redeem ethers', function() {
        return Immortals.new().then(function (instance) {
            var owner = accounts[0];
            var sender = accounts[1];
            var amount = web3.toWei(1.5, 'ether');
            instance.sendTransaction({ from: sender, value: web3.toWei(1.8766, 'ether') })
                .then(function (result) {
                    var contractBalance = web3.eth.getBalance(instance.address);
                    assert.equal(contractBalance.valueOf(), amount, 'contract balance should be 1.5 ether');
                    var previousOwnerBalance = web3.eth.getBalance(owner);
                    instance.redeemEther(amount).then(function(result){
                        contractBalance = web3.eth.getBalance(instance.address);
                        assert.equal(contractBalance.valueOf(), 0, 'contract balance should be 0 ether');
                        var currentOwnerBalance = web3.eth.getBalance(owner);
                        var fee = web3.eth.getTransaction(result.tx).gasPrice.valueOf() * result.receipt.gasUsed.valueOf();
                        assert.equal(currentOwnerBalance.plus(fee).minus(previousOwnerBalance).toNumber(), amount, 'owner should have gained 1.5 ether');
                    });
                });
        });
    });

});