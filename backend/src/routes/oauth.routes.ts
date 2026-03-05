/**
 * OAuth Routes
 * Handles Google and Apple OAuth authentication
 */

import { FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../db/client';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';

// Backend API URL (where OAuth callbacks are handled)
// In production this should be https://thynkr.ca (the nginx proxies /auth to backend)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Google OAuth client
const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${BACKEND_URL}/auth/google/callback`,
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}



/**
 * Generate a unique username from email or name
 */
async function generateUniqueUsername(email: string, firstName?: string): Promise<string> {
  const base = firstName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
               email.split('@')[0].replace(/[^a-z0-9]/g, '');
  
  let username = base;
  let counter = 1;
  
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${counter}`;
    counter++;
  }
  
  return username;
}

/**
 * Create tokens and redirect to frontend
 */
async function createSessionAndRedirect(
  userId: string,
  email: string,
  role: string,
  reply: any
) {
  const payload = { userId, email, role };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
  
  // Update last login
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
    select: { id: true },
  });
  
  // Redirect to frontend callback with tokens
  const callbackUrl = new URL('/oauth-callback', FRONTEND_URL);
  callbackUrl.searchParams.set('accessToken', accessToken);
  callbackUrl.searchParams.set('refreshToken', refreshToken);
  
  return reply.redirect(callbackUrl.toString());
}

export default async function oauthRoutes(server: FastifyInstance) {
  // ═══════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * Redirect to Google OAuth consent screen
   */
  const googleHandler = async (_request: any, reply: any) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return reply.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
    }
    
    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent',
    });
    
    return reply.redirect(authUrl);
  };
  
  server.get('/google', googleHandler);
  
  /**
   * Handle Google OAuth callback
   */
  server.get('/google/callback', async (request, reply) => {
    try {
      const { code } = request.query as { code?: string };
      
      if (!code) {
        return reply.redirect(`${FRONTEND_URL}/login?error=no_code`);
      }
      
      // Exchange code for tokens
      const { tokens } = await googleClient.getToken(code);
      
      if (!tokens.id_token) {
        return reply.redirect(`${FRONTEND_URL}/login?error=no_token`);
      }
      
      // Verify and decode the ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload() as GoogleTokenPayload;
      
      if (!payload || !payload.email) {
        return reply.redirect(`${FRONTEND_URL}/login?error=invalid_token`);
      }
      
      // Check if user exists by Google ID or email
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: payload.sub },
            { email: payload.email },
          ],
        },
        select: {
          id: true,
          email: true,
          username: true,
          googleId: true,
          role: true,
          password: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          oauthProvider: true,
          emailVerified: true,
          theme: true,
          preferredLanguage: true,
          ttsVoice: true,
          ttsSpeed: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          stripeCustomerId: true,
          level: true,
          xp: true,
          lastXpGain: true,
        },
      });
      
      if (user) {
        // Update Google ID if not set (linking existing account)
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: payload.sub,
              oauthProvider: user.oauthProvider || 'google',
              emailVerified: true,
              avatarUrl: user.avatarUrl || payload.picture,
            },
            select: {
              id: true,
              email: true,
              username: true,
              googleId: true,
              role: true,
              password: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              oauthProvider: true,
              emailVerified: true,
              theme: true,
              preferredLanguage: true,
              ttsVoice: true,
              ttsSpeed: true,
              createdAt: true,
              updatedAt: true,
              lastLoginAt: true,
              stripeCustomerId: true,
              level: true,
              xp: true,
              lastXpGain: true,
            },
          });
        }
      } else {
        // Create new user
        const username = await generateUniqueUsername(payload.email, payload.given_name);
        
        user = await prisma.user.create({
          data: {
            email: payload.email,
            username,
            googleId: payload.sub,
            oauthProvider: 'google',
            firstName: payload.given_name || null,
            lastName: payload.family_name || null,
            avatarUrl: payload.picture || null,
            emailVerified: true,
          },
        });
      }
      
      return createSessionAndRedirect(user.id, user.email, user.role, reply);
    } catch (error) {
      server.log.error({ error }, 'Google OAuth error');
      return reply.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }
  });
}
