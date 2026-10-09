const express = require('express');
const router = express.Router();
const {
  getFeed,
  getUserPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost
} = require('../controllers/postController');
const {
  getCommentsByPost,
  addComment
} = require('../controllers/commentController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Feed route must come before :id
router.get('/feed', optionalProtect, getFeed);

// User posts
router.get('/user/:userId', optionalProtect, getUserPosts);

// Single post operations
router.get('/:id', optionalProtect, getPostById);
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

// Likes
router.post('/:id/like', protect, likePost);
router.delete('/:id/like', protect, unlikePost);

// Comments for post
router.get('/:id/comments', optionalProtect, getCommentsByPost);
router.post('/:id/comments', protect, addComment);

module.exports = router;
