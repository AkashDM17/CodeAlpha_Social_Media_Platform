const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must belong to a user']
    },
    content: {
      type: String,
      required: [true, 'Post content cannot be empty'],
      trim: true,
      maxlength: [2000, 'Post content cannot exceed 2000 characters']
    },
    image: {
      type: String,
      default: ''
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Post', postSchema);
