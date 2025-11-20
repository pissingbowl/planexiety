// This file creates an Express server for handling auth middleware
// Since Next.js App Router doesn't directly support Express middleware,
// we create a separate Express server instance for auth handling

import express from "express";
import * as client from "openid-client";
import memoize from "memoizee";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

let authApp: express.Express | null = null;

export async function getAuthApp() {
  if (!authApp) {
    authApp = express();
    await setupAuth(authApp);

    // Auth user endpoint - Check authentication but return null if not authenticated
    authApp.get('/api/auth/user', async (req: any, res) => {
      // Check if user is authenticated
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        // Return null for unauthenticated users instead of 401
        return res.json(null);
      }
      
      // Check token expiry
      const user = req.user as any;
      if (!user || !user.expires_at) {
        return res.json(null);
      }
      
      const now = Math.floor(Date.now() / 1000);
      if (now > user.expires_at) {
        // Token expired, try to refresh if we have refresh token
        const refreshToken = user.refresh_token;
        if (!refreshToken) {
          return res.json(null);
        }
        
        try {
          const config = await getOidcConfig();
          const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
          updateUserSession(user, tokenResponse);
        } catch (error) {
          console.error("Failed to refresh token:", error);
          return res.json(null);
        }
      }
      
      try {
        const userId = user.claims.sub;
        const userRecord = await storage.getUser(userId);
        res.json(userRecord || null);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.json(null);
      }
    });
  }
  return authApp;
}