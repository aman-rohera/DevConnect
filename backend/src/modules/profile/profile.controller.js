import * as profileService from './profile.service.js';

const getOwnProfile = async (req, res) => {
  try {
    const profile = await profileService.getUserProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.'
      });
    }
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch own profile.',
      error: error.message
    });
  }
};

const getProfileById = async (req, res) => {
  const { id } = req.params;

  try {
    const profile = await profileService.getUserProfile(id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
      error: error.message
    });
  }
};

const getByUsername = async (req, res) => {
  const { username } = req.params;
  try {
    const profile = await profileService.getProfileByUsername(username);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.', error: error.message });
  }
};

const updateOwnProfile = async (req, res) => {
  const { headline, bio, avatarUrl, skills, projects, education, experience, certificates } = req.body;

  try {
    const updatedProfile = await profileService.updateUserProfile(req.user.id, {
      headline,
      bio,
      avatarUrl,
      skills,
      projects,
      education,
      experience,
      certificates
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedProfile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message
    });
  }
};

export { getOwnProfile, getProfileById, getByUsername, updateOwnProfile };
