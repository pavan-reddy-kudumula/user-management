const express = require('express');

const {
  bulkCreateUsers,
  bulkUpdateUsers,
  getUsers,
  getUserById,
  getUserByEmail,
  getUserByPhone,
} = require('../controllers/userController');

const router = express.Router();

// GET routes
router.get('/', getUsers);
router.get('/:id', getUserById);
router.get('/email/:email', getUserByEmail);
router.get('/phone/:phone', getUserByPhone);

// POST routes
router.post('/bulk-create', bulkCreateUsers);

// PUT routes
router.put('/bulk-update', bulkUpdateUsers);

module.exports = router;