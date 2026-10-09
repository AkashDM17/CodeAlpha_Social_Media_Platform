const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Get all users (suggestions/directory)
// @route   GET /api/users
// @access  Public (or Private)
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user._id : null;
    const limit = parseInt(req.query.limit, 10) || 20;

    let filter = {};
    if (currentUserId) {
      filter._id = { $ne: currentUserId };
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(limit)
      .sort({ createdAt: -1 });

    const formattedUsers = users.map((u) => {
      const isFollowing = currentUserId
        ? u.followers.some((f) => f.toString() === currentUserId.toString())
        : false;
      return {
        _id: u._id,
        name: u.name,
        username: u.username,
        bio: u.bio,
        profileImage: u.profileImage,
        followersCount: u.followers.length,
        followingCount: u.following.length,
        isFollowing
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: formattedUsers
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving users'
    });
  }
};

// @desc    Search users by name or username
// @route   GET /api/users/search?q=keyword
// @access  Public
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';
    const currentUserId = req.user ? req.user._id : null;

    if (!query) {
      return res.status(200).json({
        success: true,
        message: 'Empty query, returning empty results',
        data: []
      });
    }

    // Escape regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');

    const users = await User.find({
      $or: [{ username: regex }, { name: regex }]
    })
      .select('-password')
      .limit(20);

    const formattedUsers = users.map((u) => {
      const isFollowing = currentUserId
        ? u.followers.some((f) => f.toString() === currentUserId.toString())
        : false;
      return {
        _id: u._id,
        name: u.name,
        username: u.username,
        bio: u.bio,
        profileImage: u.profileImage,
        followersCount: u.followers.length,
        followingCount: u.following.length,
        isFollowing,
        isSelf: currentUserId ? u._id.toString() === currentUserId.toString() : false
      };
    });

    return res.status(200).json({
      success: true,
      message: `Found ${formattedUsers.length} user(s)`,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Search users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public / Private
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const postsCount = await Post.countDocuments({ user: user._id });
    const currentUserId = req.user ? req.user._id : null;
    const isFollowing = currentUserId
      ? user.followers.some((f) => f.toString() === currentUserId.toString())
      : false;
    const isSelf = currentUserId
      ? user._id.toString() === currentUserId.toString()
      : false;

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postsCount,
        isFollowing,
        isSelf,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Check ownership
    if (req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own profile'
      });
    }

    const { name, username, bio, profileImage } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (username && username.toLowerCase().trim() !== user.username) {
      const usernameExists = await User.findOne({
        username: username.toLowerCase().trim(),
        _id: { $ne: id }
      });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken by another account'
        });
      }
      user.username = username.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (profileImage !== undefined) user.profileImage = profileImage.trim();

    await user.save();

    const postsCount = await Post.countDocuments({ user: user._id });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postsCount,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile'
    });
  }
};

// @desc    Get followers of a user
// @route   GET /api/users/:id/followers
// @access  Public / Private
const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(id).populate('followers', 'name username bio profileImage followers');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUserId = req.user ? req.user._id : null;

    const followersList = user.followers.map((f) => {
      const isFollowing = currentUserId
        ? f.followers.some((flw) => flw.toString() === currentUserId.toString())
        : false;
      const isSelf = currentUserId ? f._id.toString() === currentUserId.toString() : false;
      return {
        _id: f._id,
        name: f.name,
        username: f.username,
        bio: f.bio,
        profileImage: f.profileImage,
        isFollowing,
        isSelf
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Followers retrieved successfully',
      data: followersList
    });
  } catch (error) {
    console.error('Get followers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving followers'
    });
  }
};

// @desc    Get users followed by a user
// @route   GET /api/users/:id/following
// @access  Public / Private
const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(id).populate('following', 'name username bio profileImage followers');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUserId = req.user ? req.user._id : null;

    const followingList = user.following.map((f) => {
      const isFollowing = currentUserId
        ? f.followers.some((flw) => flw.toString() === currentUserId.toString())
        : false;
      const isSelf = currentUserId ? f._id.toString() === currentUserId.toString() : false;
      return {
        _id: f._id,
        name: f.name,
        username: f.username,
        bio: f.bio,
        profileImage: f.profileImage,
        isFollowing,
        isSelf
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Following list retrieved successfully',
      data: followingList
    });
  } catch (error) {
    console.error('Get following error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving following list'
    });
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target user ID'
      });
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User to follow was not found'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already following
    const alreadyFollowing = targetUser.followers.some(
      (f) => f.toString() === currentUserId.toString()
    );

    if (alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Add to targetUser followers
    targetUser.followers.push(currentUserId);
    await targetUser.save();

    // Add to currentUser following
    if (!currentUser.following.some((f) => f.toString() === targetUserId.toString())) {
      currentUser.following.push(targetUserId);
      await currentUser.save();
    }

    return res.status(200).json({
      success: true,
      message: `You are now following @${targetUser.username}`,
      data: {
        targetUserId: targetUser._id,
        followersCount: targetUser.followers.length,
        isFollowing: true
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error following user'
    });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target user ID'
      });
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User to unfollow was not found'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Remove from targetUser followers
    targetUser.followers = targetUser.followers.filter(
      (f) => f.toString() !== currentUserId.toString()
    );
    await targetUser.save();

    // Remove from currentUser following
    currentUser.following = currentUser.following.filter(
      (f) => f.toString() !== targetUserId.toString()
    );
    await currentUser.save();

    return res.status(200).json({
      success: true,
      message: `You unfollowed @${targetUser.username}`,
      data: {
        targetUserId: targetUser._id,
        followersCount: targetUser.followers.length,
        isFollowing: false
      }
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error unfollowing user'
    });
  }
};

module.exports = {
  getAllUsers,
  searchUsers,
  getUserById,
  updateUserProfile,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser
};
