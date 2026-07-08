import * as recommendationService from './recommendation.service.js';

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id; // Assumes auth middleware sets req.user
    const recommendations = await recommendationService.getRecommendations(userId);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations', error: error.message });
  }
};

const syncProfileToNeo4j = async (req, res) => {
  try {
    const userId = req.user.id;
    await recommendationService.syncUserToNeo4j(userId);
    res.json({ success: true, message: 'Profile synced to recommendation engine' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to sync profile', error: error.message });
  }
};

export { getRecommendations, syncProfileToNeo4j };
