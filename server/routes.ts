import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { insertUserSchema } from "@shared/schema";
import { supabase } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configure Passport
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists with Google ID
    let user = await storage.getUserByGoogleId(profile.id);
    
    if (!user) {
      // Check if user exists with email
      user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
      
      if (user) {
        // Update existing user with Google ID
        user = await storage.updateUserGoogleId(user.id, profile.id, profile.photos?.[0]?.value);
      } else {
        // Create new user
        user = await storage.createUser({
          email: profile.emails?.[0]?.value || '',
          fullName: profile.displayName,
          googleId: profile.id,
          profileImage: profile.photos?.[0]?.value,
          authProvider: 'google'
        });
      }
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Google OAuth routes
app.get("/api/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

app.get("/api/auth/google/callback", passport.authenticate("google", {
  failureRedirect: "/auth?error=google_auth_failed"
}), async (req, res) => {
  try {
    const user = req.user as any;
    
    // Generate JWT token for authenticated user
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h"
    });
    
    // Redirect to frontend with token
    res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      profileImage: user.profileImage
    }))}`);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect("/auth?error=callback_failed");
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize passport
  app.use(passport.initialize());
  
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, fullName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        fullName,
        authProvider: 'email'
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "24h"
      });

      res.json({
        user: { id: user.id, email: user.email, fullName: user.fullName },
        token
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "24h"
      });

      res.json({
        user: { id: user.id, email: user.email, fullName: user.fullName },
        token
      });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    // For JWT-based auth, signout is handled client-side by removing the token
    res.json({ message: "Signed out successfully" });
  });

  // Middleware to verify JWT token
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Protected route example
  app.get("/api/user", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: user.id, email: user.email, fullName: user.fullName });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Content generation API route with usage limiting
  app.post("/api/generate-content", async (req: any, res) => {
    try {
      const { mainKeyword, trendingKeywords } = req.body;
      
      if (!mainKeyword) {
        return res.status(400).json({ error: "Main keyword is required" });
      }

      // Get user's IP address
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Check if user is authenticated
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      let isAuthenticated = false;

      if (token) {
        try {
          jwt.verify(token, JWT_SECRET);
          isAuthenticated = true;
        } catch (err) {
          // Token is invalid, treat as unauthenticated
        }
      }

      // If not authenticated, check usage limits
      if (!isAuthenticated) {
        const usage = await storage.getUsageByIpAndDate(ipAddress, today);
        if (usage && usage.generationCount >= 2) {
          return res.status(429).json({ 
            error: "Daily limit reached. Please sign up or log in to generate more content ideas.",
            requiresAuth: true 
          });
        }
      }

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const prompt = `You are a content strategist assistant. Based on the following trending topics and keyword, generate 5 highly creative and relevant content ideas. Focus on originality, engagement, and trend relevance.

Main Keyword: "${mainKeyword}"

Trending Terms (from Google Trends): ${trendingKeywords || "No specific trending terms provided"}

Use a mix of formats like videos, blog posts, carousels, or threads. Vary the approach: practical, emotional, data-driven, controversial, or inspiring.

For each idea, give:

Title: [Catchy, specific, trend-aware title]  
Format: [Blog, Video, Twitter Thread, Reel, etc.]  
Angle: [Unique POV or creative hook]

Respond in this format for 5 content ideas:
---
Title:  
Format:  
Angle:
---`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from API');
      }
      
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Track usage for unauthenticated users
      if (!isAuthenticated) {
        await storage.createOrUpdateUsage({
          ipAddress,
          usageDate: today,
        });
      }
      
      res.json({ content: generatedText });
    } catch (error) {
      console.error("Content generation error:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
