const jwt = require('jsonwebtoken');
const secret = "Uz},9P]mma8z67BV^#;W+]J;;K-uD7@'={8fJeg%-@tGjGr~2JTx9XA'dM9NL?).Tmzx}f/5}4[8CE'gs.xs}Uk=TKGev*dkK'%EZQ'58AzCh'pHS+N?]pG%[NbR7?_+";

function _sign(userId) {
    return jwt.sign({ _id: userId }, secret, {
        expiresIn: 1800 // expires in 30 minutes
    });
}

function _validate(token, cb){
    jwt.verify(token, secret, function(err, decoded) {
        if (err) return cb(true, err);
        cb(false, decoded);
    });
}

exports.sign = _sign;
exports.validate = _validate;