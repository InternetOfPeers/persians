module.exports = function (error, message) {
    assert.isAbove(error.message.search('VM Exception'), -1, message);
}