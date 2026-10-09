const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  searchUsers,
  getUserById,
  updateUserProfile,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser
} = require('../controllers/userController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.get('/', optionalProtect, getAllUsers);
router.get('/search', optionalProtect, searchUsers);
router.get('/:id', optionalProtect, getUserById);
router.put('/:id', protect, updateUserProfile);
router.get('/:id/followers', optionalProtect, getFollowers);
router.get('/:id/following', optionalProtect, getFollowing);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);

module.exports = router;
