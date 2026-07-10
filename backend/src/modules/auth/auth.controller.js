import * as authService from './auth.service.js';

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const clearTokenCookies = (res) => {
  res.cookie('access_token', '', { httpOnly: true, maxAge: 0 });
  res.cookie('refresh_token', '', { httpOnly: true, maxAge: 0 });
};

const register = async (req, res, next) => {
  const { email, password, fullName, headline, skills } = req.body;

  try {
    const user = await authService.registerUser(email, password, fullName, headline, skills);
    const formattedUser = authService.formatUserResponse(user);
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please login to continue.',
      data: {
        user: formattedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const device = req.headers['user-agent'] || 'unknown';

    const { tokens, user } = await authService.loginUser(email, password, ipAddress, device);
    
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    const formattedUser = authService.formatUserResponse(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: formattedUser,
        session: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
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
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    await authService.logoutUser(refreshToken);
    clearTokenCookies(res);
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAllDevices(req.user.id);
    clearTokenCookies(res);
    
    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refresh_token;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const device = req.headers['user-agent'] || 'unknown';

    const tokens = await authService.refreshAccessToken(oldRefreshToken, ipAddress, device);
    
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    clearTokenCookies(res);
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: 'Reset password link sent. Please check your inbox.',
    data: null
  });
};

const resetPassword = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: 'Password has been reset successfully.',
    data: null
  });
};

export { register, login, getMe, logout, logoutAll, refresh, forgotPassword, resetPassword };
