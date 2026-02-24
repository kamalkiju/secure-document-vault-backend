/**
 * Route aggregation. All protected except auth and health.
 */

const express = require('express');
const authRoutes = require('./authRoutes');
const folderRoutes = require('./folderRoutes');
const documentRoutes = require('./documentRoutes');
const auditRoutes = require('./auditRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'OK', data: null });
});

router.use('/auth', authRoutes);
router.use('/folders', folderRoutes);
router.use('/documents', documentRoutes);
router.use('/audit', auditRoutes);

module.exports = router;
