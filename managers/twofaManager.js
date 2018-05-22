const twofa = require('node-2fa');
const appName = "twofa-ict-example";

function _generate(email) {
    return twofa.generateSecret({name: email, account: appName});
}

function _validate(secret, code){
    return twofa.verifyToken(secret, code) != null;
}

exports.generate = _generate;
exports.validate = _validate;