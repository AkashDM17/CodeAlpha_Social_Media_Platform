const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public / Private
const getCommentsByPost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const currentUserId = req.user ? req.user._id : null;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const comments = await Comment.find({ post: postId })
      .populate('user', 'name username profileImage')
      .sort({ createdAt: 1 });

    const formattedComments = comments.map((c) => {
      const isOwner = currentUserId && c.user
        ? c.user._id.toString() === currentUserId.toString()
        : false;

      return {
        _id: c._id,
        post: c.post,
        text: c.text,
        createdAt: c.createdAt,
        user: c.user,
        isOwner
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: formattedComments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving comments'
    });
  }
};

// @desc    Add comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty'
      });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters'
      });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const newComment = await Comment.create({
      post: postId,
      user: req.user._id,
      text: text.trim()
    });

    const populatedComment = await Comment.findById(newComment._id).populate(
      'user',
      'name username profileImage'
    );

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        _id: populatedComment._id,
        post: populatedComment.post,
        text: populatedComment.text,
        createdAt: populatedComment.createdAt,
        user: populatedComment.user,
        isOwner: true
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error adding comment'
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check authorization: user must be comment owner or post owner
    const post = await Post.findById(comment.post);
    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner = post && post.user.toString() === req.user._id.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own comments'
      });
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: { commentId }
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting comment'
    });
  }
};

module.exports = {
  getCommentsByPost,
  addComment,
  deleteComment
};
