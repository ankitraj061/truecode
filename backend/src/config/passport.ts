import dotenv from 'dotenv';

dotenv.config();

let passportInstance: any;
let UserModel: any;
let generateUsernameFn: any;

const loadDependencies = async () => {
    if (!passportInstance) {
        const passportModule = await import('passport');
        passportInstance = passportModule.default;
    }

    if (!UserModel) {
        const userModule = await import('../models/user.js');
        UserModel = userModule.default;
    }

    if (!generateUsernameFn) {
        const validatorModule = await import('../utils/validator.js');
        generateUsernameFn = validatorModule.generateUsername;
    }

    return {
        passport: passportInstance,
        User: UserModel,
        generateUsername: generateUsernameFn
    };
};

const strategyRegistrationKey = Symbol.for('truecode.google.strategy.registered');
const githubStrategyRegistrationKey = Symbol.for('truecode.github.strategy.registered');

const getGoogleStrategyConfig = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const backendUrl = process.env.BACKEND_URL?.trim() || process.env.BACKEND_URL || 'http://localhost:8000';

  console.log('GOOGLE_CLIENT_ID =', clientID);
  console.log('GOOGLE_CLIENT_SECRET exists =', Boolean(clientSecret));
  console.log('BACKEND_URL =', backendUrl);

  const config = {
    clientID,
    clientSecret,
    callbackURL: `${backendUrl}/api/auth/google/callback`
  };

  console.log('Google Strategy Config:', config);

  if (!clientID || !clientSecret) {
    throw new Error('Google OAuth configuration is incomplete. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }

  return config;
};

const verifyGoogleUser = async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        const { User, generateUsername } = await loadDependencies();

        // Check if user already exists with this Google ID
        let existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
            // Update login tracking
            existingUser.lastLoginAt = new Date();
            existingUser.loginCount += 1;
            await existingUser.save();
            return done(null, existingUser);
        }

        // Check if user exists with same email (link accounts)
        let existingEmailUser = await User.findOne({ emailId: profile.emails[0].value });

        if (existingEmailUser) {
            // Link Google account to existing user
            existingEmailUser.googleId = profile.id;
            existingEmailUser.authProvider = 'google';
            existingEmailUser.profilePicture = profile.photos[0]?.value;
            existingEmailUser.isEmailVerified = true;
            existingEmailUser.lastLoginAt = new Date();
            existingEmailUser.loginCount += 1;
            await existingEmailUser.save();
            return done(null, existingEmailUser);
        }

        // Create new user with Google account
        const username = await generateUsername(profile.name.givenName);

        const newUser = await User.create({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName || '',
            emailId: profile.emails[0].value,
            username: username,
            profilePicture: profile.photos[0]?.value,
            authProvider: 'google',
            isEmailVerified: true,
            role: 'user',
            lastLoginAt: new Date(),
            loginCount: 1
            // Note: password not required for Google users
        });

        return done(null, newUser);
    } catch (error) {
        return done(error, null);
    }
};

const registerGoogleStrategy = async (): Promise<boolean> => {
    if ((globalThis as any)[strategyRegistrationKey]) {
        return true;
    }

    try {
        const { passport, User } = await loadDependencies();
        const { Strategy: GoogleStrategy } = await import('passport-google-oauth20');
        const config = getGoogleStrategyConfig();
        passport.use('google', new GoogleStrategy(config, verifyGoogleUser));
        passport.serializeUser((user: any, done: any) => {
            done(null, user._id);
        });

        passport.deserializeUser(async (id: any, done: any) => {
            try {
                const user = await User.findById(id);
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        });

        (globalThis as any)[strategyRegistrationKey] = true;
        return true;
    } catch (error: any) {
        console.error('Failed to initialize Google OAuth strategy:', error.message);
        return false;
    }
};

const getGithubStrategyConfig = () => {
  const clientID = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  const backendUrl = process.env.BACKEND_URL?.trim() || process.env.BACKEND_URL || 'http://localhost:8000';

  console.log('GITHUB_CLIENT_ID =', clientID);
  console.log('GITHUB_CLIENT_SECRET exists =', Boolean(clientSecret));

  const config = {
    clientID,
    clientSecret,
    callbackURL: `${backendUrl}/api/auth/github/callback`
  };

  if (!clientID || !clientSecret) {
    throw new Error('GitHub OAuth configuration is incomplete. Check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
  }

  return config;
};

const verifyGithubUser = async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        const { User, generateUsername } = await loadDependencies();

        let existingUser = await User.findOne({ githubId: profile.id });

        if (existingUser) {
            existingUser.lastLoginAt = new Date();
            existingUser.loginCount += 1;
            await existingUser.save();
            return done(null, existingUser);
        }

        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('Your GitHub account has no accessible email address. Please make an email public on GitHub or use another sign-in method.'), null);
        }

        // Check if user exists with same email (link accounts)
        let existingEmailUser = await User.findOne({ emailId: email });

        if (existingEmailUser) {
            existingEmailUser.githubId = profile.id;
            existingEmailUser.authProvider = 'github';
            existingEmailUser.profilePicture = existingEmailUser.profilePicture || profile.photos?.[0]?.value;
            existingEmailUser.isEmailVerified = true;
            existingEmailUser.lastLoginAt = new Date();
            existingEmailUser.loginCount += 1;
            await existingEmailUser.save();
            return done(null, existingEmailUser);
        }

        // Create new user with GitHub account
        const displayName = profile.displayName || profile.username;
        const [firstName, ...rest] = displayName.split(' ');
        const username = await generateUsername(profile.username || firstName);

        const newUser = await User.create({
            githubId: profile.id,
            firstName: firstName || profile.username,
            lastName: rest.join(' ') || '',
            emailId: email,
            username: username,
            profilePicture: profile.photos?.[0]?.value,
            authProvider: 'github',
            isEmailVerified: true,
            role: 'user',
            lastLoginAt: new Date(),
            loginCount: 1
            // Note: password not required for GitHub users
        });

        return done(null, newUser);
    } catch (error) {
        return done(error, null);
    }
};

const registerGithubStrategy = async (): Promise<boolean> => {
    if ((globalThis as any)[githubStrategyRegistrationKey]) {
        return true;
    }

    try {
        const { passport, User } = await loadDependencies();
        const { Strategy: GitHubStrategy } = await import('passport-github2');
        const config = getGithubStrategyConfig();
        passport.use('github', new GitHubStrategy(config, verifyGithubUser));

        passport.serializeUser((user: any, done: any) => {
            done(null, user._id);
        });

        passport.deserializeUser(async (id: any, done: any) => {
            try {
                const user = await User.findById(id);
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        });

        (globalThis as any)[githubStrategyRegistrationKey] = true;
        return true;
    } catch (error: any) {
        console.error('Failed to initialize GitHub OAuth strategy:', error.message);
        return false;
    }
};

const passportProxy: any = new Proxy({}, {
    get(_target, prop) {
        if (!passportInstance) {
            throw new Error('Passport has not been initialized yet.');
        }

        const value = passportInstance[prop];
        return typeof value === 'function' ? value.bind(passportInstance) : value;
    },
    set(_target, prop, value) {
        passportInstance = passportInstance || {};
        passportInstance[prop] = value;
        return true;
    }
});

export { registerGoogleStrategy, registerGithubStrategy };
export default passportProxy;
