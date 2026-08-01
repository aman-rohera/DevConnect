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
  const { email } = req.body;
  try {
    const result = await authService.generatePasswordResetOtp(email);
    const isSimulated = result.simulated;
    const message = isSimulated
      ? `[Demo Mode] OTP code generated: ${result.otp}. (Configure GMAIL_USER & GMAIL_APP_PASS in backend/.env for real SMTP delivery)`
      : 'OTP code has been sent to your email. Please check your inbox.';

    return res.status(200).json({
      success: true,
      message,
      data: {
        email: result.email,
        simulated: isSimulated,
        devOtp: result.otp
      }
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const result = await authService.verifyPasswordResetOtp(email, otp);
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  try {
    await authService.resetPasswordWithOtp(email, otp, newPassword);
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

const getGoogleCallbackUrl = (req) => {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  const rawProtocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const protocol = String(rawProtocol).split(',')[0].trim();
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}/api/auth/google/callback`;
};

const googleAuth = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_CLIENT_ID is not configured in server environment.',
      });
    }

    const callbackUrl = getGoogleCallbackUrl(req);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20email%20profile&prompt=consent`;

    if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
      return res.status(200).json({
        success: true,
        data: { url: googleAuthUrl },
      });
    }

    return res.redirect(googleAuthUrl);
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const code = req.query.code || req.body?.code;
  const errorParam = req.query.error;

  if (errorParam) {
    console.error('[Google OAuth Warning] Consent denied or error:', errorParam);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google authentication was cancelled or failed.')}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('No authorization code provided by Google.')}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;
    const callbackUrl = getGoogleCallbackUrl(req);

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Google OAuth Error] Token exchange failed:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(tokenData.error_description || 'Failed to exchange authorization code with Google.')}`);
    }

    // Fetch user profile info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    if (!userRes.ok || !googleUser.email) {
      console.error('[Google OAuth Error] UserInfo fetch failed:', googleUser);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to fetch user profile from Google.')}`);
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const device = req.headers['user-agent'] || 'unknown';

    const { user, tokens } = await authService.findOrCreateGoogleUser({
      email: googleUser.email,
      fullName: googleUser.name,
      avatarUrl: googleUser.picture,
    }, ipAddress, device);

    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    if (req.method === 'POST') {
      const formattedUser = authService.formatUserResponse(user);
      return res.status(200).json({
        success: true,
        message: 'Google authentication successful',
        data: {
          user: formattedUser,
          session: { access_token: tokens.accessToken, refresh_token: tokens.refreshToken },
        },
      });
    }

    return res.redirect(`${frontendUrl}/?token=${tokens.accessToken}`);
  } catch (error) {
    console.error('[Google OAuth Exception]:', error);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'Google authentication failed.')}`);
  }
};

const getGithubCallbackUrl = (req) => {
  if (process.env.GITHUB_CALLBACK_URL) {
    return process.env.GITHUB_CALLBACK_URL;
  }
  const rawProtocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const protocol = String(rawProtocol).split(',')[0].trim();
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}/api/auth/github/callback`;
};

const githubAuth = async (req, res, next) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'GITHUB_CLIENT_ID is not configured in server environment.',
      });
    }

    const callbackUrl = getGithubCallbackUrl(req);
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=user:email`;

    if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
      return res.status(200).json({
        success: true,
        data: { url: githubAuthUrl },
      });
    }

    return res.redirect(githubAuthUrl);
  } catch (error) {
    next(error);
  }
};

const githubCallback = async (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const code = req.query.code || req.body?.code;
  const errorParam = req.query.error;

  if (errorParam) {
    console.error('[GitHub OAuth Warning] Consent denied or error:', errorParam);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('GitHub authentication was cancelled or failed.')}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('No authorization code provided by GitHub.')}`);
  }

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const callbackUrl = getGithubCallbackUrl(req);

    // Exchange authorization code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: String(code),
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[GitHub OAuth Error] Token exchange failed:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(tokenData.error_description || 'Failed to exchange authorization code with GitHub.')}`);
    }

    // Fetch user profile info from GitHub API
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'DevConnect-App',
      },
    });

    const githubUser = await userRes.json();
    if (!userRes.ok || !githubUser) {
      console.error('[GitHub OAuth Error] User profile fetch failed:', githubUser);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to fetch user profile from GitHub.')}`);
    }

    // Resolve primary email (GitHub emails API if email is null/private)
    let email = githubUser.email;
    if (!email) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'DevConnect-App',
          },
        });
        const emails = await emailsRes.json();
        if (Array.isArray(emails) && emails.length > 0) {
          const primaryEmail = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
          email = primaryEmail?.email;
        }
      } catch (err) {
        console.warn('[GitHub OAuth Warning] Failed to fetch emails array:', err);
      }
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const device = req.headers['user-agent'] || 'unknown';

    const { user, tokens } = await authService.findOrCreateGithubUser({
      email,
      fullName: githubUser.name,
      avatarUrl: githubUser.avatar_url,
      githubUsername: githubUser.login,
    }, ipAddress, device);

    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    if (req.method === 'POST') {
      const formattedUser = authService.formatUserResponse(user);
      return res.status(200).json({
        success: true,
        message: 'GitHub authentication successful',
        data: {
          user: formattedUser,
          session: { access_token: tokens.accessToken, refresh_token: tokens.refreshToken },
        },
      });
    }

    return res.redirect(`${frontendUrl}/?token=${tokens.accessToken}`);
  } catch (error) {
    console.error('[GitHub OAuth Exception]:', error);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'GitHub authentication failed.')}`);
  }
};

const testEmailLive = async (req, res) => {
  const to = req.query.to || 'divyeshdandwani6@gmail.com';
  try {
    const result = await authService.sendWelcomeEmail({ email: to, fullName: 'Test User' });
    return res.status(200).json({
      envUser: process.env.GMAIL_USER ? process.env.GMAIL_USER : 'NOT_SET',
      envPassSet: Boolean(process.env.GMAIL_APP_PASS),
      result
    });
  } catch (err) {
    return res.status(500).json({
      envUser: process.env.GMAIL_USER ? process.env.GMAIL_USER : 'NOT_SET',
      envPassSet: Boolean(process.env.GMAIL_APP_PASS),
      error: err.message || err
    });
  }
};

export { register, login, getMe, logout, logoutAll, refresh, forgotPassword, verifyOtp, resetPassword, testEmailLive, googleAuth, googleCallback, githubAuth, githubCallback };

