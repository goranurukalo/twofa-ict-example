const express = require('express');
const router = express.Router();

const db = require('./../managers/databaseManager');
const jwt = require('./../managers/jwtManager');
const twofa = require('./../managers/twofaManager');


router.get('/', function (req, res, next) {
  res.status(200).json({ foo: 'bar' });
});

router.post('/register', function (req, res, next) {
  let { email, password } = req.body;
  let newUser = {
    email: email,
    password: password, //hash it ofc...
    createdAt: Date.now(),
    role: 'User',
    isTwofaSet: false,
    avatarUrl: `https://api.adorable.io/avatars/285/${email}`
  };

  //get id 
  db.users.getLastId(function (lastId) {
    newUser._id = Number(lastId) + 1;

    //insert user
    db.users.create(newUser, function (err, data) {
      res.status(200).json({ success: true });
    });

  });

});

router.post('/login', function (req, res, next) {
  let { email, password, pin } = req.body;


  db.users.get({ email: email, password: password }, function (err, data) {
    if (data) {
      if (data.isTwofaSet) {
        if (!pin) {
          res.status(400).json({ success: false, error: "PIN_MISSING" });
        } else {
          if (twofa.validate(data.qrSecret, pin)) {
            let token = jwt.sign(data._id);
            res.status(200).json({ success: true, token: token });
          } else {
            res.status(400).json({ success: false, error: "PIN_NOT_VALID" });
          }
        }
      } else {
        let token = jwt.sign(data._id);
        res.status(200).json({ success: true, token: token });
      }
    } else {
      res.status(400).json({ success: false, error: "Username and password do not match or you do not have an account yet." });
    }
  });

});

router.get('/user-data', function (req, res, next) {
  const { token } = req.cookies;

  if (token) {

    //validate token
    jwt.validate(token, function (err, decoded) {
      if (err) return res.status(400).json({ success: false, error: "TOKEN_INVALID" });

      db.users.get({ _id: decoded._id }, function (err, data) {
        // create models folder and do it like new User(data)
        const user = {
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt,
          email: data.email,
          isTwofaSet: data.isTwofaSet,
          role: data.role,
        };

        if (!data.isTwofaSet) {
          //save user with new fields
          const qrGenerated = twofa.generate(data.email);

          db.users.update(decoded._id, Object.assign({}, data, { qrSecret: qrGenerated.secret }), function (err, result) {
            const qrData = {
              qrImage: qrGenerated.qr
            };

            res.status(200).json({ success: true, isTwofaSet: data.isTwofaSet, twofaData: qrData });
          });
        } else {
          //he is all set
          res.status(200).json({ success: true, isTwofaSet: data.isTwofaSet, userData: user });
        }

      });

    });
  } else {
    res.status(400).json({ success: false, error: "TOKEN_INVALID" });
  }
});

router.post('/set-twofa', function (req, res, next) {
  const { token } = req.cookies;
  const { pin } = req.body;
  if (token) {

    //validate token
    jwt.validate(token, function (err, decoded) {
      if (err) return res.status(400).json({ success: false, error: "TOKEN_INVALID" });
      db.users.get({ _id: decoded._id }, function (err, data) {

        if (twofa.validate(data.qrSecret, pin)) {
          db.users.update(data._id, Object.assign({}, data, { isTwofaSet: true }), function (err, result) {
            const user = {
              avatarUrl: data.avatarUrl,
              createdAt: data.createdAt,
              email: data.email,
              isTwofaSet: data.isTwofaSet,
              role: data.role,
            };

            res.status(200).json({ success: true, isTwofaSet: data.isTwofaSet, userData: user });
          });
        } else {
          res.status(400).json({ success: false, error: "PIN_INVALID" });
        }
      });

    });
  } else {
    res.status(400).json({ success: false, error: "TOKEN_INVALID" });
  }

});

module.exports = router;
