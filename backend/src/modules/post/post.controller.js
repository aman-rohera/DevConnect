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
    const posts = await postService.getFeedPosts();
    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feed' });
  }
};

export { create, getFeed };
