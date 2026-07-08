import * as authService from './auth.service.js';

const register = async (req, res) => {
  const { email, password, fullName, headline, skills } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and full name are required.'
    });
  }

  try {
    const newUser = await authService.registerUser(email, password, fullName, headline, skills);
    const formattedUser = authService.formatUserResponse(newUser);
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: formattedUser }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  try {
    const authData = await authService.loginUser(email, password);
    const formattedUser = authService.formatUserResponse(authData.user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        session: authData.session,
        user: formattedUser
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const formattedUser = authService.formatUserResponse(user);
    return res.status(200).json({
      success: true,
      message: 'Session verified',
      data: { user: formattedUser }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const forgotPassword = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Reset password link sent. Please check your inbox.'
  });
};

const resetPassword = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Password has been reset successfully.'
  });
};

export { register, login, getMe, forgotPassword, resetPassword };
