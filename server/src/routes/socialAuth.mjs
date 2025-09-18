import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import jwt from 'jsonwebtoken';
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
    'JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
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

  console.log('Configuring Google Strategy with Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('Configuring Facebook Strategy with App ID:', process.env.FACEBOOK_APP_ID ? '✅ Set' : '❌ Missing');

  // Google Strategy - only configure if env vars exist
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_BASE_URL}/auth/social/google/callback`,
      scope: ['profile', 'email'],
      passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
      try {
        await handleSocialLogin('google', profile, accessToken, refreshToken, done);
      } catch (error) {
        console.error('Google OAuth error:', error);
        done(error);
      }
    }));
    console.log('✅ Google OAuth strategy configured');
  } else {
    console.warn('❌ Google OAuth not configured - missing environment variables');
  }

  // Facebook Strategy - only configure if env vars exist
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.API_BASE_URL}/auth/social/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      enableProof: true
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await handleSocialLogin('facebook', profile, accessToken, refreshToken, done);
      } catch (error) {
        console.error('Facebook OAuth error:', error);
        done(error);
      }
    }));
    console.log('✅ Facebook OAuth strategy configured');
  } else {
    console.warn('❌ Facebook OAuth not configured - missing environment variables');
  }

  // Serialization
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      console.error('Deserialize user error:', error);
      done(error);
    }
  });
};

// Social Login Handler
const handleSocialLogin = async (provider, profile, accessToken, refreshToken, done) => {
  try {
    console.log(`${provider} OAuth successful for:`, profile.displayName);
    
    // Check if social account already exists
    let socialAuth = await SocialAuth.findByProviderId(provider, profile.id);
    
    if (socialAuth) {
      // Update existing social auth
      socialAuth.accessToken = accessToken;
      socialAuth.refreshToken = refreshToken;
      socialAuth.profile = profile._json;
      socialAuth.expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
      socialAuth.lastUsed = new Date();
      await socialAuth.save();
      
      const user = await User.findById(socialAuth.userId);
      if (!user) {
        return done(new Error('User not found for existing social account'));
      }
      return done(null, user);
    }

    // Check if user email already exists
    const email = profile.emails?.[0]?.value;
    let user = email ? await User.findOne({ email }) : null;

    if (!user) {
      // Create new user
      user = new User({
        name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
        email: email,
        avatar: profile.photos?.[0]?.value,
        isEmailVerified: !!email,
        authMethod: provider,
        role: 'user' // Default role
      });
      await user.save();
      console.log('Created new user from social login:', user.email);
    }

    // Create social auth record
    socialAuth = new SocialAuth({
      userId: user._id,
      provider,
      providerId: profile.id,
      accessToken,
      refreshToken,
      profile: profile._json,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      scopes: ['profile', 'email'],
      lastUsed: new Date()
    });
    await socialAuth.save();

    console.log('Social auth record created for user:', user.email);
    done(null, user);
  } catch (error) {
    console.error('Social login handler error:', error);
    done(error);
  }
};

// Generate JWT Token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Check if social auth is configured
const isSocialAuthConfigured = () => {
  return (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
         (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
};

// Initialize passport
configurePassport();

// Routes

// Google Authentication (only if configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  }));

  router.get('/google/callback', passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`
  }), (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/success?token=${token}&userId=${req.user._id}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=token_generation_failed`);
    }
  });
} else {
  router.get('/google', (req, res) => {
    res.status(501).json({ error: 'Google OAuth not configured' });
  });
  
  router.get('/google/callback', (req, res) => {
    res.status(501).json({ error: 'Google OAuth not configured' });
  });
}

// Facebook Authentication (only if configured)
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get('/facebook', passport.authenticate('facebook', {
    scope: ['email'],
    session: false
  }));

  router.get('/facebook/callback', passport.authenticate('facebook', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`
  }), (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/success?token=${token}&userId=${req.user._id}`);
    } catch (error) {
      console.error('Facebook callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=token_generation_failed`);
    }
  });
} else {
  router.get('/facebook', (req, res) => {
    res.status(501).json({ error: 'Facebook OAuth not configured' });
  });
  
  router.get('/facebook/callback', (req, res) => {
    res.status(501).json({ error: 'Facebook OAuth not configured' });
  });
}

// Link social account to existing user
router.post('/link', async (req, res) => {
  try {
    const { userId, provider, accessToken, providerId, profile } = req.body;
    
    if (!userId || !provider || !accessToken || !providerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if social account already linked
    const existingLink = await SocialAuth.findOne({ 
      $or: [
        { provider, providerId },
        { userId, provider }
      ]
    });

    if (existingLink) {
      return res.status(400).json({ error: 'Social account already linked' });
    }

    // Create social auth record
    const socialAuth = new SocialAuth({
      userId,
      provider,
      providerId,
      accessToken,
      profile: profile || {},
      expiresAt: new Date(Date.now() + 3600 * 1000),
      scopes: ['profile', 'email'],
      lastUsed: new Date()
    });

    await socialAuth.save();

    res.json({ 
      message: 'Social account linked successfully',
      socialAuth 
    });
  } catch (error) {
    console.error('Link account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unlink social account
router.delete('/unlink/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user._id; // Assuming authenticated user

    const result = await SocialAuth.findOneAndDelete({ 
      userId, 
      provider 
    });

    if (!result) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    res.json({ message: 'Social account unlinked successfully' });
  } catch (error) {
    console.error('Unlink account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's linked social accounts
router.get('/accounts', async (req, res) => {
  try {
    const userId = req.user._id; // Assuming authenticated user
    const socialAccounts = await SocialAuth.findByUserId(userId);
    
    res.json(socialAccounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
router.get('/status', (req, res) => {
  res.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    configured: isSocialAuthConfigured()
  });
});

export default router;