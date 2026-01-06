const express = require('express');
const router = express.Router();
const { requestBlood } = require('../controllers/bloodRequestController');

router.post('/request-blood', requestBlood);

module.exports = router;
