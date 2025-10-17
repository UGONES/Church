import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.mjs';
import SocialAuth from '../models/SocialAuth.mjs';

const router = express.Router();

// Validate environment variables
const validateEnvVars = () => {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'API_BASE_URL',
    'CLIENT_URL',
    'JWT_SECRET',
  ];

  const missingVars = requiredVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
    return false;
  }
  return true;
};

// Configure Passport Strategies
const configurePassport = () => {
  const envVarsValid = validateEnvVars();

  if (!envVarsValid) {
    console.warn('⚠️ Social authentication disabled due to missing environment variables');
    return;
  }

  console.log(
    'Configuring Google Strategy with Client ID:',
    process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'
  );
  console.log(
    'Configuring Facebook Strategy with App ID:',
    process.env.FACEBOOK_APP_ID ? '✅ Set' : '❌ Missing'
  );

  // ✅ Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.API_BASE_URL}/auth/social/google/callback`,
          scope: ['profile', 'email'],
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            await handleSocialLogin('google', profile, accessToken, refreshToken, done);
          } catch (error) {
            console.error('Google OAuth error:', error);
            done(error);
          }
        }
      )
    );
    console.log('✅ Google OAuth strategy configured');
  } else {
    console.warn('❌ Google OAuth not configured - missing environment variables');
  }

  // ✅ Facebook Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${process.env.API_BASE_URL}/auth/social/facebook/callback`,
          profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
          enableProof: true,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            await handleSocialLogin('facebook', profile, accessToken, refreshToken, done);
          } catch (error) {
            console.error('Facebook OAuth error:', error);
            done(error);
          }
        }
      )
    );
    console.log('✅ Facebook OAuth strategy configured');
  } else {
    console.warn('❌ Facebook OAuth not configured - missing environment variables');
  }

  // Serialize / Deserialize
  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      console.error('Deserialize user error:', err);
      done(err);
    }
  });
};

// Handle Social Login
const handleSocialLogin = async (provider, profile, accessToken, refreshToken, done) => {
  try {
    console.log(`${provider} OAuth successful for:`, profile.displayName);

    let socialAuth = await SocialAuth.findByProviderId(provider, profile.id);

    if (socialAuth) {
      socialAuth.accessToken = accessToken;
      socialAuth.refreshToken = refreshToken;
      socialAuth.profile = profile._json;
      socialAuth.expiresAt = new Date(Date.now() + 3600 * 1000);
      socialAuth.lastUsed = new Date();
      await socialAuth.save();

      const user = await User.findById(socialAuth.userId);
      if (!user) return done(new Error('User not found for existing social account'));
      return done(null, user);
    }

    const email = profile.emails?.[0]?.value;
    let user = email ? await User.findOne({ email }) : null;

    if (!user) {
      user = new User({
        name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
        email: email,
        avatar: profile.photos?.[0]?.value,
        isEmailVerified: !!email,
        authMethod: provider,
        role: 'user',
      });
      await user.save();
      console.log('Created new user from social login:', user.email);
    }

    socialAuth = new SocialAuth({
      userId: user._id,
      provider,
      providerId: profile.id,
      accessToken,
      refreshToken,
      profile: profile._json,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      scopes: ['profile', 'email'],
      lastUsed: new Date(),
    });
    await socialAuth.save();

    console.log('✅ Social auth record created for user:', user.email);
    done(null, user);
  } catch (error) {
    console.error('Social login handler error:', error);
    done(error);
  }
};

// Generate JWT
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Check if social auth configured
const isSocialAuthConfigured = () =>
  (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
  (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);

// Initialize Passport
configurePassport();

/* ================== ROUTES ================== */

// ✅ Google OAuth Routes
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }));

  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
    }),
    (req, res) => {
      try {
        const token = generateToken(req.user);
        res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}&userId=${req.user._id}`);
      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=token_generation_failed`);
      }
    }
  );
} else {
  router.get('/google', (_, res) => res.status(501).json({ error: 'Google OAuth not configured' }));
  router.get('/google/callback', (_, res) =>
    res.status(501).json({ error: 'Google OAuth not configured' })
  );
}

// ✅ Facebook OAuth Routes
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get('/facebook', passport.authenticate('facebook', {
    scope: ['email'],
    session: false,
  }));

  router.get(
    '/facebook/callback',
    passport.authenticate('facebook', {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
    }),
    (req, res) => {
      try {
        const token = generateToken(req.user);
        res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}&userId=${req.user._id}`);
      } catch (error) {
        console.error('Facebook callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=token_generation_failed`);
      }
    }
  );
} else {
  router.get('/facebook', (_, res) => res.status(501).json({ error: 'Facebook OAuth not configured' }));
  router.get('/facebook/callback', (_, res) =>
    res.status(501).json({ error: 'Facebook OAuth not configured' })
  );
}

/* ================== FIX: Add Token Validation Routes ================== */

// ✅ POST /auth/social/validate/google
router.post('/validate/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) return res.status(401).json({ success: false, message: 'Invalid token payload' });

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        isEmailVerified: true,
        authMethod: 'google',
        role: 'user',
      });
    }

    const jwtToken = generateToken(user);
    res.json({ success: true, data: { token: jwtToken, user } });
  } catch (err) {
    console.error('Google token validation error:', err);
    res.status(500).json({ success: false, message: 'Token validation failed', error: err.message });
  }
});

// ✅ POST /auth/social/validate/facebook
router.post('/validate/facebook', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`);
    const data = await response.json();

    if (data.error) return res.status(401).json({ success: false, message: 'Invalid Facebook token' });

    let user = await User.findOne({ email: data.email });
    if (!user) {
      user = await User.create({
        name: data.name,
        email: data.email,
        avatar: data.picture?.data?.url,
        isEmailVerified: true,
        authMethod: 'facebook',
        role: 'user',
      });
    }

    const jwtToken = generateToken(user);
    res.json({ success: true, data: { token: jwtToken, user } });
  } catch (err) {
    console.error('Facebook token validation error:', err);
    res.status(500).json({ success: false, message: 'Token validation failed', error: err.message });
  }
});

/* ================== OTHER ROUTES ================== */

// ✅ Link account
router.post('/link', async (req, res) => {
  try {
    const { userId, provider, accessToken, providerId, profile } = req.body;
    if (!userId || !provider || !accessToken || !providerId)
      return res.status(400).json({ error: 'Missing required fields' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existingLink = await SocialAuth.findOne({
      $or: [{ provider, providerId }, { userId, provider }],
    });
    if (existingLink) return res.status(400).json({ error: 'Social account already linked' });

    const socialAuth = new SocialAuth({
      userId,
      provider,
      providerId,
      accessToken,
      profile: profile || {},
      expiresAt: new Date(Date.now() + 3600 * 1000),
      scopes: ['profile', 'email'],
      lastUsed: new Date(),
    });
    await socialAuth.save();

    res.json({ message: 'Social account linked successfully', socialAuth });
  } catch (error) {
    console.error('Link account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Unlink account
router.delete('/unlink/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await SocialAuth.findOneAndDelete({ userId, provider });
    if (!result) return res.status(404).json({ error: 'Social account not found' });

    res.json({ message: 'Social account unlinked successfully' });
  } catch (error) {
    console.error('Unlink accounrst error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ List linked accounts
router.get('/accounts', async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const socialAccounts = await SocialAuth.findByUserId(userId);
    res.json(socialAccounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Health check
router.get('/status', (_, res) => {
  res.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    configured: isSocialAuthConfigured(),
  });
});

export default router;
