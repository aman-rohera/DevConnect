import * as postService from './post.service.js';

const create = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;

    if (!content && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Content or image is required' });
    }

    const post = await postService.createPost(req.user.id, content, imageUrl);
    res.json({ success: true, post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

const getFeed = async (req, res) => {
  try {
    const posts = await postService.getFeedPosts(req.user.id);
    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feed' });
  }
};

const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await postService.togglePostLike(req.user.id, id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
};

const share = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await postService.logPostShare(req.user.id, id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ success: false, message: 'Failed to share post' });
  }
};

const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentCommentId } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    const comment = await postService.addComment(req.user.id, id, content, parentCommentId);
    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
};

const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await postService.getPostCommentsTree(id);
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

const deleteOne = async (req, res) => {
  try {
    const { id } = req.params;
    await postService.deletePost(req.user.id, id);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    if (error.message === 'Post not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Unauthorized to delete this post') {
      return res.status(403).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

export {
  create,
  getFeed,
  toggleLike,
  share,
  createComment,
  getComments,
  deleteOne
};
