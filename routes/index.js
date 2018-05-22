const express = require('express');
const router = express.Router();
const path = require('path');

const db = require('./../managers/databaseManager');


router.get(['/', '/login'], function(req, res, next) {
  res.sendFile(path.join(__dirname + '/../public/login.html'));
});

router.get('/register', function(req, res, next) {
  res.sendFile(path.join(__dirname + '/../public/register.html'));
});

router.get('/app', function(req, res, next) {
  res.sendFile(path.join(__dirname + '/../public/app.html'));
});


module.exports = router;
