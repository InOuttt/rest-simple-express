const express = require('express');
const version = '/v1/';

const dokumenRoute = require('./dokumen.route');

const router = express.Router();

router.use(version + 'download', dokumenRoute);

module.exports = router;