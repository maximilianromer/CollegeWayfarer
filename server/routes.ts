import express, { Express, Request, Response, NextFunction } from "express";
import { createInsertSchema } from "drizzle-zod";
import { createServer, Server } from "http";
import { 
  OnboardingResponses, 
  onboardingSchema, 
  insertChatMessageSchema, 
  insertCollegeSchema,
  insertAdvisorSchema,
  insertCollegeRecommendationSchema,
  insertMessageFeedbackSchema,
  CollegeStatus,
  AdvisorType,
  type CollegeStatusType,
  type AdvisorTypeValue,
  type ChatSession,
  fileAttachmentSchema,
  type FileAttachment
} from "@shared/schema";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { storage as dbStorage } from "./storage";
import { setupAuth } from "./auth";

// Configure multer for file uploads
const uploadDir = path.resolve("uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `file-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images, PDFs, and common document types
  const allowedMimeTypes = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation" // pptx
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

const upload = multer({
  storage: fileStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register the auth routes (login, register, logout)
  setupAuth(app);
  
  // Serve static files from uploads directory
  app.use('/uploads', (req, res, next) => {
    // Add CORS headers for uploaded files
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  }, express.static(uploadDir));
  
  // File upload endpoint
  app.post("/api/upload", upload.array("files", 5), (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      
      const attachments = req.files.map(file => ({
        filename: path.basename(file.originalname),
        url: `/uploads/${path.basename(file.path)}`,
        contentType: file.mimetype,
        size: file.size
      }));
      
      return res.json(attachments);
    } catch (error: any) {
      console.error("Error uploading files:", error);
      return res.status(500).json({ error: error.message || "Failed to upload files" });
    }
  });
  
  // Check if the user is authenticated - keep for backward compatibility
  app.get("/api/user", (req: Request, res: Response) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
  
  // New /me endpoint that returns user data if authenticated
  app.get("/api/me", (req: Request, res: Response) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
  
  // Message feedback endpoint
  app.post("/api/message-feedback", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const feedbackData = insertMessageFeedbackSchema.parse({
        userId: req.user.id,
        messageId: req.body.messageId,
        messageContent: req.body.messageContent,
        isPositive: req.body.isPositive
      });
      
      const savedFeedback = await dbStorage.createMessageFeedback(feedbackData);
      
      return res.status(200).json({ 
        success: true, 
        feedback: savedFeedback 
      });
    } catch (error) {
      console.error("Error saving message feedback:", error);
      return res.status(500).json({ error: "Failed to save message feedback" });
    }
  });
  
  // Generate a profile for a user
  app.post("/api/generate-profile", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, onboarding } = req.body;
      
      if (!username || !onboarding) {
        console.error("Missing parameters:", { username: !!username, onboarding: !!onboarding });
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      console.log("Onboarding data received:", JSON.stringify(onboarding));
      
      // Get API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("GEMINI_API_KEY not configured in environment variables");
        return res.status(500).json({ error: "API key not configured" });
      }
      
      // Generate the prompt
      const prompt = generatePrompt(username, onboarding);
      
      console.log(`Generating profile for user ${username}...`);
      console.log("Generated prompt:", prompt);
      
      try {
        // Generate the profile
        const profileDescription = await generateProfileWithGemini(prompt, apiKey);
        
        // Get the user ID
        const user = req.user || await dbStorage.getUserByUsername(username);
        
        if (!user) {
          console.error(`User not found: ${username}`);
          return res.status(404).json({ error: "User not found" });
        }
        
        console.log(`Updating profile for user ${username} (ID: ${user.id})...`);
        
        // Update the user's profile description
        const updatedUser = await dbStorage.updateUserProfileDescription(user.id, profileDescription);
        
        if (!updatedUser) {
          console.error(`Failed to update profile for user ${username} (ID: ${user.id})`);
          return res.status(500).json({ error: "Failed to update user profile" });
        }
        
        console.log(`Profile updated successfully for ${username}`);
        console.log("Profile content:", profileDescription.substring(0, 100) + "...");
        
        // Return the updated profile description
        res.json({ 
          profileDescription,
          success: true 
        });
      } catch (aiError: any) {
        console.error("Error generating profile with AI:", aiError);
        console.error("Error details:", aiError.stack || "No stack trace available");
        return res.status(500).json({ error: "Failed to generate profile with AI: " + (aiError.message || "Unknown error") });
      }
    } catch (error: any) {
      console.error("Error in generate-profile endpoint:", error);
      console.error("Error details:", error.stack || "No stack trace available");
      next(error);
    }
  });
  
  // Get all colleges for the current user
  app.get("/api/colleges", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const colleges = await dbStorage.getColleges(req.user.id);
      res.json(colleges);
    } catch (error) {
      next(error);
    }
  });
  
  // Get colleges filtered by status
  app.get("/api/colleges/status/:status", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { status } = req.params;
      
      // Validate status
      if (!Object.values(CollegeStatus).includes(status as CollegeStatusType)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const colleges = await dbStorage.getCollegesByStatus(req.user.id, status as CollegeStatusType);
      res.json(colleges);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new college
  app.post("/api/colleges", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const collegeData = insertCollegeSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const college = await dbStorage.createCollege(collegeData);
      res.status(201).json(college);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a college's status
  app.patch("/api/colleges/:collegeId/status", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { collegeId } = req.params;
      const { status } = req.body;
      
      // Validate status
      if (!Object.values(CollegeStatus).includes(status as CollegeStatusType)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const updatedCollege = await dbStorage.updateCollegeStatus(parseInt(collegeId), status as CollegeStatusType);
      
      if (!updatedCollege) {
        return res.status(404).json({ error: "College not found" });
      }
      
      res.json(updatedCollege);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a college's position within its status list
  app.patch("/api/colleges/:collegeId/position", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { collegeId } = req.params;
      const { position } = req.body;
      
      // Validate position
      if (typeof position !== 'number' || position < 0) {
        return res.status(400).json({ error: "Invalid position" });
      }
      
      const updatedCollege = await dbStorage.updateCollegePosition(parseInt(collegeId), position);
      
      if (!updatedCollege) {
        return res.status(404).json({ error: "College not found" });
      }
      
      res.json(updatedCollege);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a college
  app.delete("/api/colleges/:collegeId", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { collegeId } = req.params;
      
      const success = await dbStorage.deleteCollege(parseInt(collegeId));
      
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete college" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Get all advisors for the current user
  app.get("/api/advisors", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const advisors = await dbStorage.getAdvisors(req.user.id);
      res.json(advisors);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new advisor
  app.post("/api/advisors", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const advisorData = insertAdvisorSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const advisor = await dbStorage.createAdvisor(advisorData);
      res.status(201).json(advisor);
    } catch (error) {
      next(error);
    }
  });
  
  // Update an advisor's active status
  app.patch("/api/advisors/:advisorId/status", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { advisorId } = req.params;
      const { isActive } = req.body;
      
      // Validate isActive
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: "isActive must be a boolean" });
      }
      
      const updatedAdvisor = await dbStorage.updateAdvisorActiveStatus(parseInt(advisorId), isActive);
      
      if (!updatedAdvisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }
      
      res.json(updatedAdvisor);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete an advisor
  app.delete("/api/advisors/:advisorId", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { advisorId } = req.params;
      
      const success = await dbStorage.deleteAdvisor(parseInt(advisorId));
      
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete advisor" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Share chat sessions with an advisor
  app.post("/api/advisors/:advisorId/share-chats", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { advisorId } = req.params;
      const { sessionIds } = req.body;
      
      if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(400).json({ error: "Session IDs array is required" });
      }
      
      // Verify advisor belongs to the user
      const advisor = await dbStorage.getAdvisors(req.user.id)
        .then(advisors => advisors.find(a => a.id === parseInt(advisorId)));
      
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }
      
      // Verify all sessions belong to the user
      const sessions = await Promise.all(
        sessionIds.map(async (sessionId: number) => {
          const session = await dbStorage.getChatSession(sessionId);
          return session && session.userId === req.user!.id ? session : null;
        })
      );
      
      const invalidSessions = sessions.some(session => session === null);
      if (invalidSessions) {
        return res.status(403).json({ error: "One or more sessions are not accessible" });
      }
      
      // Share the chat sessions with the advisor
      await dbStorage.shareChatsWithAdvisor(parseInt(advisorId), sessionIds);
      
      // Get the updated list of shared sessions
      const sharedSessionIds = await dbStorage.getSharedChatSessions(parseInt(advisorId));
      
      res.json({ 
        success: true, 
        sharedSessionIds 
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Unshare chat sessions with an advisor
  app.post("/api/advisors/:advisorId/unshare-chats", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { advisorId } = req.params;
      const { sessionIds } = req.body;
      
      if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(400).json({ error: "Session IDs array is required" });
      }
      
      // Verify advisor belongs to the user
      const advisor = await dbStorage.getAdvisors(req.user.id)
        .then(advisors => advisors.find(a => a.id === parseInt(advisorId)));
      
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }
      
      // Unshare the chat sessions with the advisor
      await dbStorage.unshareChatsWithAdvisor(parseInt(advisorId), sessionIds);
      
      // Get the updated list of shared sessions
      const sharedSessionIds = await dbStorage.getSharedChatSessions(parseInt(advisorId));
      
      res.json({ 
        success: true, 
        sharedSessionIds 
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get the shared chat sessions for an advisor
  app.get("/api/advisors/:advisorId/shared-chats", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { advisorId } = req.params;
      
      // Verify advisor belongs to the user
      const advisor = await dbStorage.getAdvisors(req.user.id)
        .then(advisors => advisors.find(a => a.id === parseInt(advisorId)));
      
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }
      
      // Get the shared session IDs
      const sharedSessionIds = await dbStorage.getSharedChatSessions(parseInt(advisorId));
      
      // Return just the session IDs as that's what the client expects
      res.json(sharedSessionIds);
    } catch (error) {
      next(error);
    }
  });
  
  // Get messages for a shared chat session from advisor's perspective
  app.get("/api/shared/:shareToken/chat/:sessionId/messages", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shareToken, sessionId } = req.params;
      
      // Get the messages for the shared session
      const messages = await dbStorage.getSharedChatMessagesForAdvisor(shareToken, parseInt(sessionId));
      
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  // Get college recommendations for the current user
  app.get("/api/recommendations", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const recommendations = await dbStorage.getCollegeRecommendations(req.user.id);
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  });
  
  // Generate college recommendations using the Gemini API
  app.post("/api/recommendations/generate", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { preference } = req.body;
      
      // Get API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key not configured" });
      }
      
      // Get the user's profile description
      const user = await dbStorage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get the user's current college lists
      const applyingColleges = await dbStorage.getCollegesByStatus(req.user.id, CollegeStatus.APPLYING);
      const researchingColleges = await dbStorage.getCollegesByStatus(req.user.id, CollegeStatus.RESEARCHING);
      const notApplyingColleges = await dbStorage.getCollegesByStatus(req.user.id, CollegeStatus.NOT_APPLYING);
      
      // Get current recommendations
      const currentRecommendations = await dbStorage.getCollegeRecommendations(req.user.id);
      
      // Extract college names for the prompt
      const applyingCollegeNames = applyingColleges.map(c => c.name);
      const researchingCollegeNames = researchingColleges.map(c => c.name);
      const notApplyingCollegeNames = notApplyingColleges.map(c => c.name);
      const currentRecommendationNames = currentRecommendations.map(r => r.name);
      
      // Generate the prompt
      const prompt = generateRecommendationPrompt(
        user.profileDescription || "",
        preference || "",
        applyingCollegeNames,
        researchingCollegeNames,
        notApplyingCollegeNames,
        currentRecommendationNames
      );
      
      console.log("Generating recommendations with prompt:", prompt.substring(0, 200) + "...");
      
      // Generate recommendations
      const recommendations = await generateCollegeRecommendationsWithGemini(prompt, apiKey);
      
      // Save recommendations to database
      const savedRecommendations = [];
      for (const rec of recommendations) {
        const recommendationData = insertCollegeRecommendationSchema.parse({
          userId: req.user.id,
          name: rec.name,
          description: rec.description,
          reason: rec.reason,
          acceptanceRate: rec.acceptanceRate
        });
        
        const savedRec = await dbStorage.createCollegeRecommendation(recommendationData);
        savedRecommendations.push(savedRec);
      }
      
      res.json(savedRecommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      next(error);
    }
  });
  
  // Delete a college recommendation
  app.delete("/api/recommendations/:recommendationId", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { recommendationId } = req.params;
      
      const success = await dbStorage.deleteCollegeRecommendation(parseInt(recommendationId));
      
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete recommendation" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Convert a recommendation to a regular college
  app.post("/api/recommendations/:recommendationId/convert", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { recommendationId } = req.params;
      const { status } = req.body;
      
      // Validate status
      if (!Object.values(CollegeStatus).includes(status as CollegeStatusType)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      // Get the recommendation
      const recommendations = await dbStorage.getCollegeRecommendations(req.user.id);
      const recommendation = recommendations.find(r => r.id === parseInt(recommendationId));
      
      if (!recommendation) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      
      // Create a new college from the recommendation
      const collegeData = insertCollegeSchema.parse({
        userId: req.user.id,
        name: recommendation.name,
        status: status as CollegeStatusType
      });
      
      const college = await dbStorage.createCollege(collegeData);
      
      // Delete the recommendation
      await dbStorage.deleteCollegeRecommendation(parseInt(recommendationId));
      
      res.json(college);
    } catch (error) {
      next(error);
    }
  });
  
  // Add advisor recommendation
  app.post("/api/shared/:shareToken/recommendations", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shareToken } = req.params;
      const { name, advisorNotes } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "College name is required" });
      }
      
      // Get the advisor by share token
      const advisor = await dbStorage.getAdvisorByShareToken(shareToken);
      
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found or link inactive" });
      }
      
      // Get the user info to generate better recommendations
      const user = await dbStorage.getUser(advisor.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      try {
        // Generate college info using Gemini API
        const prompt = `
        Please provide the following information about ${name.trim()}, a college/university:
        1. A brief description of the college (2-3 sentences)
        2. Why this might be a good fit for a student (2-3 sentences)
        3. The acceptance rate as a number between 0 and 100 (just the number, no symbols or text)

        Format your response as a JSON object with these fields:
        {
          "description": "Brief description of the college",
          "reason": "Why it might be a good fit",
          "acceptanceRate": number
        }
        `;
        
        // Check if API key exists
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          // Use fallback data if no API key is available
          const recommendationData = insertCollegeRecommendationSchema.parse({
            userId: advisor.userId,
            name: name.trim(),
            description: "Recommended by your advisor.", 
            reason: "Your advisor thinks this college would be a good fit for you.",
            recommendedBy: advisor.name,
            advisorNotes: advisorNotes || null,
            acceptanceRate: null
          });
          
          const recommendation = await dbStorage.createCollegeRecommendation(recommendationData);
          return res.status(201).json(recommendation);
        }
        
        // Generate recommendation with Gemini
        const collegeInfo = await generateCollegeInfoWithGemini(prompt, apiKey);
        
        // Create the recommendation with Gemini-generated data
        const recommendationData = insertCollegeRecommendationSchema.parse({
          userId: advisor.userId,
          name: name.trim(),
          description: collegeInfo.description || "Recommended by your advisor.",
          reason: collegeInfo.reason || "Your advisor thinks this college would be a good fit for you.",
          recommendedBy: advisor.name,
          advisorNotes: advisorNotes || null,
          acceptanceRate: collegeInfo.acceptanceRate || null
        });
        
        const recommendation = await dbStorage.createCollegeRecommendation(recommendationData);
        res.status(201).json(recommendation);
      } catch (aiError) {
        console.error("Error generating college info with AI:", aiError);
        
        // Fallback to basic recommendation if AI fails
        const recommendationData = insertCollegeRecommendationSchema.parse({
          userId: advisor.userId,
          name: name.trim(),
          description: "Recommended by your advisor.",
          reason: "Your advisor thinks this college would be a good fit for you.",
          recommendedBy: advisor.name,
          advisorNotes: advisorNotes || null,
          acceptanceRate: null
        });
        
        const recommendation = await dbStorage.createCollegeRecommendation(recommendationData);
        res.status(201).json(recommendation);
      }
    } catch (error) {
      next(error);
    }
  });
  
// Helper function to generate college info with Gemini
async function generateCollegeInfoWithGemini(prompt: string, apiKey: string): Promise<{
  description: string;
  reason: string;
  acceptanceRate: number | null;
}> {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95
        }
      })
    });
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from AI");
    }
    
    const content = data.candidates[0].content;
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error("Invalid response structure from AI");
    }
    
    const text = content.parts[0].text;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      const jsonStr = jsonMatch[0];
      const result = JSON.parse(jsonStr);
      
      return {
        description: result.description || "Information not available.",
        reason: result.reason || "Information not available.",
        acceptanceRate: result.acceptanceRate ? Number(result.acceptanceRate) : null
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Failed to parse AI response");
    }
  } catch (error) {
    console.error("Error in AI request:", error);
    throw error;
  }
}
  
  // Get shared advisor data
  app.get("/api/shared/:shareToken", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shareToken } = req.params;
      
      // Get the advisor by share token
      const advisor = await dbStorage.getAdvisorByShareToken(shareToken);
      
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }
      
      // Get the user's profile description
      const user = await dbStorage.getUser(advisor.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get the user's current college lists
      const applyingColleges = await dbStorage.getCollegesByStatus(advisor.userId, CollegeStatus.APPLYING);
      const researchingColleges = await dbStorage.getCollegesByStatus(advisor.userId, CollegeStatus.RESEARCHING);
      const notApplyingColleges = await dbStorage.getCollegesByStatus(advisor.userId, CollegeStatus.NOT_APPLYING);
      
      // Get the user's recommendations
      const recommendations = await dbStorage.getCollegeRecommendations(advisor.userId);
      
      // Get shared chat sessions
      const sharedChatSessions = await dbStorage.getSharedChatSessionsForAdvisor(shareToken);
      
      // Get the user's info
      const userData = {
        username: user.username,
        profileDescription: user.profileDescription
      };
      
      // Combine college lists into a single array
      const colleges = [
        ...applyingColleges,
        ...researchingColleges,
        ...notApplyingColleges
      ];
      
      res.json({
        advisor: {
          name: advisor.name,
          type: advisor.type
        },
        user: userData,
        colleges: colleges,
        recommendations: recommendations,
        sharedChatSessions: sharedChatSessions
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get all chat sessions for the current user
  app.get("/api/chat/sessions", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const sessions = await dbStorage.getChatSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new chat session
  app.post("/api/chat/sessions", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { title } = req.body;
      
      // Default title if none provided - will be updated with first message
      const sessionTitle = title || "New Conversation";
      
      // Create a new chat session
      const session = await dbStorage.createChatSession({
        userId: req.user.id,
        title: sessionTitle
      });
      
      res.json(session);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new session and send a message in one request
  app.post("/api/chat/messages", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { content, attachments, shareWithAdvisorIds, useWebSearch } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      // Create a new session first
      const session = await dbStorage.createChatSession({
        userId: req.user.id,
        title: "New Conversation" // Will be updated with first message
      });
      
      // Clean any "..." markers that might have been added by the client
      const cleanedContent = content.endsWith("...") ? content.slice(0, -3) : content;
      
      // Process attachments if any
      let validatedAttachments = undefined;
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        // Validate each attachment against schema
        try {
          validatedAttachments = attachments.map(attachment => fileAttachmentSchema.parse(attachment));
        } catch (error) {
          console.error("Invalid attachment:", error);
          return res.status(400).json({ error: "Invalid attachment format" });
        }
      }
      
      // Save the user message
      const messageData = insertChatMessageSchema.parse({
        sessionId: session.id,
        content: cleanedContent,
        sender: "user",
        attachments: validatedAttachments
      });
      
      const savedMessage = await dbStorage.createChatMessage(messageData);
      
      // Update the session title based on first message
      const truncatedMessage = cleanedContent.length > 30 
        ? cleanedContent.substring(0, 27) + "..." 
        : cleanedContent;
      
      // Update the session title
      await dbStorage.updateChatSessionTitle(session.id, truncatedMessage);
      
      // Get API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key not configured" });
      }
      
      // Generate system prompt (now async)
      const systemPrompt = await generateChatPrompt(req.user, session);
      
      try {
        // Check if web search or extended thinking is requested
        const shouldUseWebSearch = !!useWebSearch;
        const shouldExtendThinking = !!req.body.extendThinking;
        
        if (shouldUseWebSearch) {
          console.log(`Using web search for new chat message: ${cleanedContent.substring(0, 50)}${cleanedContent.length > 50 ? '...' : ''}`);
        }
        
        if (shouldExtendThinking) {
          console.log(`Using extended thinking (gemini-2.5) for new chat message`);
        }
        
        // Generate AI response with optional web search and extended thinking
        const aiResponse = await generateAIResponse(
          systemPrompt,
          [savedMessage], // Just the first message as context
          cleanedContent,
          apiKey,
          validatedAttachments,
          shouldUseWebSearch,
          shouldExtendThinking
        );
        
        // Extract the AI response text and citation data
        const aiResponseText = typeof aiResponse === 'string' 
          ? aiResponse 
          : aiResponse.text;
          
        // Save the AI response
        const aiMessageData = insertChatMessageSchema.parse({
          sessionId: session.id,
          content: aiResponseText,
          sender: "ai"
        });
        
        // Store citation metadata if available
        // Citations are now embedded in the content
        const searchQueries = typeof aiResponse === 'string' ? null : aiResponse.searchQueries;
        
        const savedAiMessage = await dbStorage.createChatMessage(aiMessageData);
        
        // Check for profile updates
        let profileUpdated = false;
        let updatedUser = null;
        
        try {
          // Get the current user to access their profile
          console.log("Checking for profile updates for user (new session):", req.user.id);
          const currentUser = await dbStorage.getUser(req.user.id);
          console.log("Current user profile (new session):", currentUser?.profileDescription ? "Has profile" : "No profile");
          
          if (currentUser && currentUser.profileDescription) {
            // Check if the message contains information to update the profile
            console.log("Analyzing message for profile updates (new session):", cleanedContent);
            const updatedProfile = await checkForProfileUpdate(
              currentUser.profileDescription,
              cleanedContent,
              [savedMessage], // Just the first message as context since this is a new session
              apiKey
            );
            
            console.log("Profile update check result (new session):", updatedProfile ? "Profile updated" : "No updates needed");
            
            // If we have an updated profile, save it
            if (updatedProfile) {
              updatedUser = await dbStorage.updateUserProfileDescription(req.user.id, updatedProfile);
              profileUpdated = true;
              console.log("Profile updated with new information from chat (new session):", updatedProfile.substring(0, 100) + "...");
            }
          } else {
            console.log("User has no profile description yet (new session), skipping update check");
          }
        } catch (error) {
          console.error("Error checking for profile updates (new session):", error);
          // Continue without profile updates if there's an error
        }
        
        // Return the user message, AI response, session ID, and profile update status
        // Citations are now embedded directly in the AI response content
        res.json({
          userMessage: savedMessage,
          aiMessage: savedAiMessage,
          sessionId: session.id,
          profileUpdated: profileUpdated,
          searchQueries: searchQueries
        });
      } catch (error) {
        console.error("Error generating AI response:", error);
        
        // Return just the user message on error
        res.json({
          userMessage: savedMessage,
          error: "Failed to generate AI response. Please try again.",
          sessionId: session.id
        });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Update a chat session (title)
  app.patch("/api/chat/sessions/:sessionId", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { sessionId } = req.params;
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      
      // Get the session to check ownership
      const session = await dbStorage.getChatSession(parseInt(sessionId));
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Update the session title
      const updatedSession = await dbStorage.updateChatSessionTitle(parseInt(sessionId), title);
      
      res.json(updatedSession);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a chat session and its messages
  app.delete("/api/chat/sessions/:sessionId", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { sessionId } = req.params;
      
      // Get the session to check ownership
      const session = await dbStorage.getChatSession(parseInt(sessionId));
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Delete the session and its messages
      const success = await dbStorage.deleteChatSession(parseInt(sessionId));
      
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete chat session" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Get messages for a chat session
  app.get("/api/chat/sessions/:sessionId/messages", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { sessionId } = req.params;
      
      // Get the session to check ownership
      const session = await dbStorage.getChatSession(parseInt(sessionId));
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Get the messages for the session
      const messages = await dbStorage.getChatMessages(parseInt(sessionId));
      
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  // Send a message in a chat session - simple non-streaming implementation
  app.post("/api/chat/sessions/:sessionId/messages", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { sessionId } = req.params;
      const { content, attachments, useWebSearch } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      // Get the session to check ownership
      const session = await dbStorage.getChatSession(parseInt(sessionId));
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Clean any "..." markers that might have been added by the client
      const cleanedContent = content.endsWith("...") ? content.slice(0, -3) : content;
      
      // Process attachments if any
      let validatedAttachments = undefined;
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        // Validate each attachment against schema
        try {
          validatedAttachments = attachments.map(attachment => fileAttachmentSchema.parse(attachment));
        } catch (error) {
          console.error("Invalid attachment:", error);
          return res.status(400).json({ error: "Invalid attachment format" });
        }
      }
      
      // Save the user message
      const messageData = insertChatMessageSchema.parse({
        sessionId: parseInt(sessionId),
        content: cleanedContent,
        sender: "user",
        attachments: validatedAttachments
      });
      
      const savedMessage = await dbStorage.createChatMessage(messageData);
      
      // Check if this is the first message in the session and update title
      const messages = await dbStorage.getChatMessages(parseInt(sessionId));
      if (messages.length === 1 && messages[0].id === savedMessage.id) {
        // Truncate the message to create a title (max 30 chars)
        const truncatedMessage = cleanedContent.length > 30 
          ? cleanedContent.substring(0, 27) + "..." 
          : cleanedContent;
        
        // Update the session title
        await dbStorage.updateChatSessionTitle(parseInt(sessionId), truncatedMessage);
      }
      
      // Get API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Missing Gemini API key for chat functionality" + (useWebSearch ? " with web search" : ""));
        return res.status(500).json({ 
          error: "API key not configured",
          message: "Gemini API key is required. Please configure the GEMINI_API_KEY environment variable." 
        });
      }
      
      // Get previous messages for context
      const previousMessages = await dbStorage.getChatMessages(parseInt(sessionId));
      
      // Generate system prompt (now async)
      const systemPrompt = await generateChatPrompt(req.user, session);
      
      try {
        // Check if web search or extended thinking is requested
        const shouldUseWebSearch = !!useWebSearch;
        const shouldExtendThinking = !!req.body.extendThinking;
        
        if (shouldUseWebSearch) {
          console.log(`Using web search for chat message in session ${sessionId}: ${cleanedContent.substring(0, 50)}${cleanedContent.length > 50 ? '...' : ''}`);
        }
        
        if (shouldExtendThinking) {
          console.log(`Using extended thinking (gemini-2.5) for chat message in session ${sessionId}`);
        }
        
        // Generate AI response with optional web search and extended thinking
        const aiResponse = await generateAIResponse(
          systemPrompt,
          previousMessages,
          cleanedContent,
          apiKey,
          validatedAttachments,
          shouldUseWebSearch,
          shouldExtendThinking
        );
        
        // Extract the AI response text and citation data
        const aiResponseText = typeof aiResponse === 'string' 
          ? aiResponse 
          : aiResponse.text;
          
        // Save the AI response text in the database
        const aiMessageData = insertChatMessageSchema.parse({
          sessionId: parseInt(sessionId),
          content: aiResponseText,
          sender: "ai"
        });
        
        // Store citation metadata if available
        // Citations are now embedded in the content
        const searchQueries = typeof aiResponse === 'string' ? null : aiResponse.searchQueries;
        
        const savedAiMessage = await dbStorage.createChatMessage(aiMessageData);
        
        // Check for profile updates
        let profileUpdated = false;
        let updatedUser = null;
        
        try {
          // Get the current user to access their profile
          console.log("Checking for profile updates for user:", req.user.id);
          const currentUser = await dbStorage.getUser(req.user.id);
          console.log("Current user profile:", currentUser?.profileDescription ? "Has profile" : "No profile");
          
          if (currentUser && currentUser.profileDescription) {
            // Check if the message contains information to update the profile
            console.log("Analyzing message for profile updates:", cleanedContent);
            const updatedProfile = await checkForProfileUpdate(
              currentUser.profileDescription,
              cleanedContent,
              previousMessages,
              apiKey
            );
            
            console.log("Profile update check result:", updatedProfile ? "Profile updated" : "No updates needed");
            
            // If we have an updated profile, save it
            if (updatedProfile) {
              updatedUser = await dbStorage.updateUserProfileDescription(req.user.id, updatedProfile);
              profileUpdated = true;
              console.log("Profile updated with new information from chat:", updatedProfile.substring(0, 100) + "...");
            }
          } else {
            console.log("User has no profile description yet, skipping update check");
          }
        } catch (error) {
          console.error("Error checking for profile updates:", error);
          // Continue without profile updates if there's an error
        }
        
        // Return the user message, AI response, and profile update status
        // Citations are now embedded directly in the AI response content
        res.json({
          userMessage: savedMessage,
          aiMessage: savedAiMessage,
          profileUpdated: profileUpdated,
          searchQueries: searchQueries
        });
      } catch (error) {
        console.error("Error generating AI response:", error);
        
        // Return just the user message on error
        res.json({
          userMessage: savedMessage,
          error: "Failed to generate AI response. Please try again."
        });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Create HTTP server
  const server = createServer(app);
  
  return server;
}

// Generate a prompt for a student profile
function generatePrompt(username: string, onboarding: OnboardingResponses): string {
  return `
You are CollegeWayfarer, an AI assistant specializing in helping high school students with college applications.

The user just provided the following information during their onboarding process:
Student's academic interests: ${onboarding.programs}
Academic environment preferences: ${onboarding.academicEnv}
Location preferences: ${onboarding.location}
Campus culture preferences: ${onboarding.culture}
Academic achievements: ${onboarding.academicStats}
Financial aid needs: ${onboarding.financialAid}
Other considerations: ${onboarding.other}

INSTRUCTIONS:
Write a concise, professionally written initial student profile/summary based on the information the student provided. 
The profile should be written in the third person and should highlight the student's academic strengths, 
interests, and aspirations in a way that would be helpful for college planning. It could include:
- Key interests and extracurricular activities
- Career aspirations
- College preferences (location, size, etc.)
- The student's academic calibre and stats
- Financial needs and scholarship interests
- Any other considerations

Write ONLY the profile text with no additional commentary. Start the description with "This student is"
`;
}

// Check if a user message contains information that should update their profile
async function checkForProfileUpdate(
  currentProfile: string,
  userMessage: string,
  previousMessages: any[],
  apiKey: string
): Promise<string | null> {
  try {
    // Process all messages for potential profile updates
    // No keyword filtering - all messages will be processed
    
    const prompt = `
      Your objetive is to update the user's profile description based on information that the user provides.
      The current profile description is:
      """
      ${currentProfile}
      """

      The user just sent a new message in the chat:
      """
      ${userMessage}
      """

      Chat history for context:
      ${previousMessages.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

      Based on the user's new message, determine if there is any NEW information about the user as a college applicant that should be added to or removed from their profile.
      Pay special attention to:
      - Academic interests, majors, programs they're considering or no longer considering
      - Locations or colleges they're interested in or no longer interested in
      - Activities, extracurriculars, or achievements
      - Test scores, GPA, or academic performance
      - Personal preferences about college environment, culture, etc.

      --

      IF: there is new information to add or remove:
      Return an UPDATED version of the entire profile description that incorporates these changes naturally. JUST PRINT THE UPDATED PROFILE TEXT. DO NOT add any extra formatting text or notes that you have updated it.

      If there is NO new information:
      Just return NULL (the literal word) - nothing else

      DO NOT invent information or make assumptions. Only include information explicitly stated by the user.
      Remember, return ONLY the updated text of the profile or NULL. NOTHING EXTRA.
      `;
    
    // Call the Gemini API
    const response = await generateAIResponse(prompt, [], "", apiKey);
    
    // Get the text from the response (whether it's a string or AIResponseWithCitations)
    const responseText = typeof response === 'string' 
      ? response 
      : response.text;
    
    // If the response indicates no updates needed, return null
    if (responseText.includes("NULL")) {
      return null;
    }
    
    // Otherwise, return the updated profile
    return responseText;
  } catch (error) {
    console.error("Error checking for profile updates:", error);
    return null;
  }
}

// Generate a profile using Gemini API
async function generateProfileWithGemini(prompt: string, apiKey: string): Promise<string> {
  try {
    console.log("Calling Gemini API to generate profile...");
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.9,
        topP: 0.8,
        topK: 40
      }
    };
    
    console.log("Request config:", JSON.stringify({
      url: "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": "API_KEY_HIDDEN"
      },
      body: {
        ...requestBody,
        contents: [
          {
            parts: [
              {
                text: prompt.substring(0, 100) + "..." // Just show a sample of the prompt
              }
            ]
          }
        ]
      }
    }));
    
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(requestBody)
    });
    
    // Check response status first
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error status:", response.status, errorText);
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Gemini API response received:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Validate the response structure
    if (!data.candidates || !data.candidates.length) {
      console.error("No candidates in Gemini response:", JSON.stringify(data));
      throw new Error("No generation candidates returned from Gemini API");
    }
    
    if (!data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts.length) {
      console.error("Invalid response structure from Gemini API:", JSON.stringify(data));
      throw new Error("Invalid response structure from Gemini API");
    }
    
    const profileText = data.candidates[0].content.parts[0].text;
    
    if (!profileText || profileText.trim().length === 0) {
      console.error("Empty profile text generated from response:", JSON.stringify(data));
      throw new Error("Empty profile text generated");
    }
    
    console.log("Profile generated successfully. Length:", profileText.length);
    console.log("First 100 characters:", profileText.substring(0, 100) + "...");
    return profileText;
  } catch (error: any) {
    console.error("Error generating profile with Gemini API:", error);
    console.error("Error stack:", error.stack || "No stack trace available");
    throw new Error("Failed to generate profile: " + (error.message || "Unknown error"));
  }
}

// Generate a prompt for chat
async function generateChatPrompt(user: any, session: any): Promise<string> {
  try {
    // Get the user's profile description if it exists
    const userData = await dbStorage.getUser(user.id);
    const profileDescription = userData?.profileDescription || "No profile information available";
    
    return `
You are CollegeWayfarer, an AI assistant designed to help high school students with college planning and application processes.

STUDENT PROFILE:
"""
${profileDescription}
"""

GUIDELINES:
1. Be friendly, supportive, and encouraging in your responses.
2. Give accurate, well-informed advice about colleges, majors, application processes, and college life.
3. Base your recommendations on the student's profile information when possible.
4. When the student mentions specific colleges, provide helpful information about them.
5. Never make up false information about colleges. If you're unsure, acknowledge your limitations.
6. Encourage students to research and verify critical information independently.
7. Maintain a positive, growth-oriented mindset when discussing grades and test scores.
8. Respect the student's preferences and goals, even if they differ from conventional wisdom.
9. Provide balanced perspectives that consider multiple factors (academics, campus life, location, cost, etc.).

Current conversation: ${session.title}

Respond to the user's questions and messages as CollegeWayfarer following the guidelines above.
`;
  } catch (error) {
    console.error("Error generating chat prompt:", error);
    // Fallback to a basic prompt if there's an error
    return `
You are CollegeWayfarer, an AI assistant designed to help high school students with college planning and application processes.

GUIDELINES:
1. Be friendly, supportive, and encouraging in your responses.
2. Give accurate, well-informed advice about colleges, majors, application processes, and college life.
3. Never make up false information about colleges. If you're unsure, acknowledge your limitations.
4. Maintain a positive, growth-oriented mindset when discussing grades and test scores.

Respond to the user's questions and messages as CollegeWayfarer following the guidelines above.
`;
  }
}

// Generate a prompt for college recommendations
function generateRecommendationPrompt(
  profileDescription: string,
  preference: string,
  applyingColleges: string[],
  researchingColleges: string[],
  notApplyingColleges: string[],
  currentRecommendations: string[] = []
): string {
  return `
You are a college counselor tasked with generating personalized college recommendations.

STUDENT PROFILE:
"""
${profileDescription || "No profile information available."}
"""

STUDENT'S SPECIFIC REQUEST:
"""
${preference || "The student didn't specify any particular preference."}
"""

CURRENT COLLEGE LISTS:
- Currently applying to: ${applyingColleges.length > 0 ? applyingColleges.join(", ") : "None"}
- Currently researching: ${researchingColleges.length > 0 ? researchingColleges.join(", ") : "None"}
- Decided not to apply to: ${notApplyingColleges.length > 0 ? notApplyingColleges.join(", ") : "None"}
- Current recommendations: ${currentRecommendations.length > 0 ? currentRecommendations.join(", ") : "None"}

INSTRUCTIONS:
1. Generate exactly 3 college recommendations that would be a good fit for this student.
2. For each college, provide:
   - The name of the college
   - A brief description (2-3 sentences) of what the college is known for
   - 2-3 specific reasons why this might be a good match for the student, referring to details from their profile
   - An estimated acceptance rate (as a percentage between 0-100)

3. Format your response as a JSON array with the following structure:
[
  {
    "name": "College Name",
    "description": "Brief description of what the college is known for",
    "reason": "Why this college might be a good fit for the student",
    "acceptanceRate": 45
  },
  {...},
  {...}
]

4. Make thoughtful recommendations that:
   - Are not already in the student's current college lists
   - Are not already in the student's current recommendations list
   - Match the student's academic profile and interests
   - Consider the student's preference if they specified one
   - Unless the student specifically requests otherwise, should prioritize schools that the student might like that are not highly selective. In general, be skeptical to recommend highly selective schools.

Return ONLY the JSON array, with no other text or commentary.
`;
}

// Generate college recommendations using Gemini API
async function generateCollegeRecommendationsWithGemini(prompt: string, apiKey: string): Promise<any[]> {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          topP: 0.8,
          topK: 40
        }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API error:", data);
      throw new Error(`Gemini API error: ${JSON.stringify(data)}`);
    }
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const responseText = data.candidates[0].content.parts[0].text;
      console.log("Raw Gemini response:", responseText.substring(0, 100) + "...");
      
      try {
        // Clean up the response text to handle markdown formatting
        let cleanedText = responseText;
        
        // Check if response is wrapped in markdown code blocks
        if (responseText.includes("```json") || responseText.includes("```")) {
          // Extract just the JSON content from code blocks
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch && jsonMatch[1]) {
            cleanedText = jsonMatch[1].trim();
            console.log("Extracted JSON from code blocks:", cleanedText.substring(0, 100) + "...");
          }
        }
        
        // Try to parse the cleaned JSON response
        const recommendations = JSON.parse(cleanedText);
        return recommendations;
      } catch (parseError) {
        console.error("Error parsing Gemini response as JSON:", parseError);
        throw new Error("Failed to parse recommendations. The AI didn't return valid JSON.");
      }
    } else {
      throw new Error("Unexpected response format from Gemini API");
    }
  } catch (error) {
    console.error("Error calling Gemini API for recommendations:", error);
    throw new Error("Failed to generate college recommendations");
  }
}

// Define Gemini API message part type
interface GeminiMessagePart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

// Define interfaces for Gemini API responses
interface WebCitation {
  title: string;
  uri: string;
  snippet?: string;
}

interface AIResponseWithCitations {
  text: string;
  // Citations are now embedded directly in the text
  searchQueries: string[] | null;
}

// Generate a response from Gemini using chat history
async function generateAIResponse(
  systemPrompt: string | Promise<string>, 
  previousMessages: any[], 
  userMessage: string, 
  apiKey: string,
  attachments?: { filename: string; url: string; contentType: string; size: number }[],
  useWebSearch?: boolean,
  extendThinking?: boolean
): Promise<string | AIResponseWithCitations> {
  // Resolve the system prompt if it's a promise
  const resolvedSystemPrompt = typeof systemPrompt === 'string' ? systemPrompt : await systemPrompt;
  try {

    // Construct the chat context from previous messages
    const messageHistory = previousMessages.map(msg => {
      // If message has attachments
      if (msg.attachments && msg.attachments.length > 0) {
        // Extract the filename from the URL for files in the uploads directory
        const parts: GeminiMessagePart[] = [{ text: msg.content }];
        
        for (const attachment of msg.attachments) {
          try {
            // Extract the filename from the URL, ensuring we handle paths correctly
            const fileUrl = attachment.url;
            let filename;
            
            // Handle both formats: '/uploads/file-xyz.jpg' and just 'file-xyz.jpg'
            if (fileUrl.startsWith('/uploads/')) {
              filename = path.basename(fileUrl);
            } else {
              filename = path.basename(fileUrl);
            }
            
            // Construct the full filepath
            const filepath = path.join(uploadDir, filename);
            
            if (attachment.contentType.startsWith('image/')) {
              // Handle image files
              console.log(`Processing previous message image attachment: ${filename} from URL: ${fileUrl}`);
              console.log(`Looking for file at: ${filepath}`);
              
              if (fs.existsSync(filepath)) {
                try {
                  const fileData = fs.readFileSync(filepath);
                  const base64Data = Buffer.from(fileData).toString('base64');
                  
                  console.log(`Successfully read file data, size: ${fileData.length} bytes`);
                  
                  parts.push({
                    inline_data: {
                      mime_type: attachment.contentType,
                      data: base64Data
                    }
                  });
                  console.log(`Successfully processed image attachment: ${filename}`);
                } catch (readError) {
                  console.error(`Error reading file ${filepath}:`, readError);
                  parts.push({ text: `[Image attachment: ${attachment.filename} (error reading file)]` });
                }
              } else {
                console.error(`File not found: ${filepath}`);
                parts.push({ text: `[Image attachment: ${attachment.filename} (file not found)]` });
              }
            } else if (attachment.contentType === 'application/pdf') {
              // Handle PDF files
              console.log(`Processing previous message PDF attachment: ${filename} from URL: ${fileUrl}`);
              console.log(`Looking for file at: ${filepath}`);
              
              if (fs.existsSync(filepath)) {
                try {
                  const fileData = fs.readFileSync(filepath);
                  const base64Data = Buffer.from(fileData).toString('base64');
                  
                  console.log(`Successfully read PDF file data, size: ${fileData.length} bytes`);
                  
                  parts.push({
                    inline_data: {
                      mime_type: attachment.contentType,
                      data: base64Data
                    }
                  });
                  console.log(`Successfully processed PDF attachment: ${filename}`);
                } catch (readError) {
                  console.error(`Error reading PDF file ${filepath}:`, readError);
                  parts.push({ text: `[PDF attachment: ${attachment.filename} (error reading file)]` });
                }
              } else {
                console.error(`File not found: ${filepath}`);
                parts.push({ text: `[PDF attachment: ${attachment.filename} (file not found)]` });
              }
            } else if (attachment.contentType === 'text/plain') {
              // Handle text files
              console.log(`Processing previous message text file attachment: ${filename} from URL: ${fileUrl}`);
              console.log(`Looking for file at: ${filepath}`);
              
              if (fs.existsSync(filepath)) {
                try {
                  const textContent = fs.readFileSync(filepath, 'utf8');
                  
                  console.log(`Successfully read text file, size: ${textContent.length} characters`);
                  
                  parts.push({
                    text: textContent
                  });
                  console.log(`Successfully processed text file attachment: ${filename}`);
                } catch (readError) {
                  console.error(`Error reading text file ${filepath}:`, readError);
                  parts.push({ text: `[Text file attachment: ${attachment.filename} (error reading file)]` });
                }
              } else {
                console.error(`File not found: ${filepath}`);
                parts.push({ text: `[Text file attachment: ${attachment.filename} (file not found)]` });
              }
            } else {
              // For other file types, just mention them in the text
              parts.push({ text: `[Attached file: ${attachment.filename}]` });
            }
          } catch (error) {
            console.error(`Error processing attachment: ${error}`);
            parts.push({ text: `[Attachment error: ${attachment.filename}]` });
          }
        }
        
        return {
          role: msg.sender === "user" ? "user" : "model",
          parts: parts
        };
      } else {
        // Regular text message
        return {
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        };
      }
    });
    
    // Prepare the final user message with attachments if any
    const finalUserMessage: {
      role: string;
      parts: GeminiMessagePart[]
    } = {
      role: "user",
      parts: [{ text: userMessage }]
    };
    
    // If attachments are provided for the current message
    if (attachments && attachments.length > 0) {
      const messageParts: GeminiMessagePart[] = [{ text: userMessage }];
      
      for (const attachment of attachments) {
        try {
          // Extract the filename from the URL, ensuring we handle paths correctly
          const fileUrl = attachment.url;
          let filename;
          
          // Handle both formats: '/uploads/file-xyz.jpg' and just 'file-xyz.jpg'
          if (fileUrl.startsWith('/uploads/')) {
            filename = path.basename(fileUrl);
          } else {
            filename = path.basename(fileUrl);
          }
          
          // Construct the full filepath
          const filepath = path.join(uploadDir, filename);
          
          if (attachment.contentType.startsWith('image/')) {
            // Handle image files
            console.log(`Processing image attachment: ${filename} from URL: ${fileUrl}`);
            console.log(`Looking for file at: ${filepath}`);
            
            if (fs.existsSync(filepath)) {
              try {
                const fileData = fs.readFileSync(filepath);
                const base64Data = Buffer.from(fileData).toString('base64');
                
                console.log(`Successfully read file data, size: ${fileData.length} bytes`);
                
                messageParts.push({
                  inline_data: {
                    mime_type: attachment.contentType,
                    data: base64Data
                  }
                });
                console.log(`Successfully processed image attachment: ${filename}`);
              } catch (readError) {
                console.error(`Error reading file ${filepath}:`, readError);
                messageParts.push({ text: `[Image attachment: ${attachment.filename} (error reading file)]` });
              }
            } else {
              console.error(`File not found: ${filepath}`);
              messageParts.push({ text: `[Image attachment: ${attachment.filename} (file not found)]` });
            }
          } else if (attachment.contentType === 'application/pdf') {
            // Handle PDF files
            console.log(`Processing PDF attachment: ${filename} from URL: ${fileUrl}`);
            console.log(`Looking for file at: ${filepath}`);
            
            if (fs.existsSync(filepath)) {
              try {
                const fileData = fs.readFileSync(filepath);
                const base64Data = Buffer.from(fileData).toString('base64');
                
                console.log(`Successfully read PDF file data, size: ${fileData.length} bytes`);
                
                messageParts.push({
                  inline_data: {
                    mime_type: attachment.contentType,
                    data: base64Data
                  }
                });
                console.log(`Successfully processed PDF attachment: ${filename}`);
              } catch (readError) {
                console.error(`Error reading PDF file ${filepath}:`, readError);
                messageParts.push({ text: `[PDF attachment: ${attachment.filename} (error reading file)]` });
              }
            } else {
              console.error(`File not found: ${filepath}`);
              messageParts.push({ text: `[PDF attachment: ${attachment.filename} (file not found)]` });
            }
          } else if (attachment.contentType === 'text/plain') {
            // Handle text files
            console.log(`Processing text file attachment: ${filename} from URL: ${fileUrl}`);
            console.log(`Looking for file at: ${filepath}`);
            
            if (fs.existsSync(filepath)) {
              try {
                const textContent = fs.readFileSync(filepath, 'utf8');
                
                console.log(`Successfully read text file, size: ${textContent.length} characters`);
                
                messageParts.push({
                  text: textContent
                });
                console.log(`Successfully processed text file attachment: ${filename}`);
              } catch (readError) {
                console.error(`Error reading text file ${filepath}:`, readError);
                messageParts.push({ text: `[Text file attachment: ${attachment.filename} (error reading file)]` });
              }
            } else {
              console.error(`File not found: ${filepath}`);
              messageParts.push({ text: `[Text file attachment: ${attachment.filename} (file not found)]` });
            }
          } else {
            // For other file types, just mention them in the text
            messageParts.push({ text: `[Attached file: ${attachment.filename}]` });
          }
        } catch (error) {
          console.error(`Error processing attachment: ${error}`);
          messageParts.push({ text: `[Attachment error: ${attachment.filename}]` });
        }
      }
      
      finalUserMessage.parts = messageParts;
    }
    
    // Add system prompt as context
    const contents = [
      {
        role: "user",
        parts: [{ text: resolvedSystemPrompt }]
      },
      {
        role: "model",
        parts: [{ text: "I understand and will act as CollegeWayfarer according to these guidelines." }]
      },
      ...messageHistory,
      finalUserMessage
    ];
    
    console.log("Sending request to Gemini API with:", {
      systemPrompt: resolvedSystemPrompt.substring(0, 100) + "...",
      messageCount: messageHistory.length,
      userMessage: userMessage.substring(0, 100) + (userMessage.length > 100 ? "..." : "")
    });
    
    // Build request body, conditionally adding search tool if requested
    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: 0.9,
        topP: 0.9,
        topK: 40
      }
    };
    
    // Add search tool if enabled
    if (useWebSearch) {
      // Configure the Gemini API to use Google Search grounding
      requestBody.tools = [{
        googleSearch: {}  // Empty object is sufficient according to the API docs
      }];
      
      console.log("Adding Google Search grounding tool to the Gemini request");
    }
    
    // Determine model endpoint based on extendThinking and useWebSearch flags
    let modelEndpoint;
    let modelDescription;
    
    if (extendThinking) {
      // Use gemini-2.5-flash-preview for extended thinking mode
      // Always use v1beta endpoint with the gemini-2.5-flash-preview-04-17 model
      modelEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent";
      modelDescription = 'gemini-2.5-flash-preview-04-17 with v1beta API (Extended Thinking)';
    } else if (useWebSearch) {
      // For web search, use gemini-2.0-flash with v1beta endpoint
      modelEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      modelDescription = 'gemini-2.0-flash with v1beta API (Web Search)';
    } else {
      // Standard mode
      modelEndpoint = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";
      modelDescription = 'gemini-2.0-flash with v1 API (Standard)';
    }
    
    console.log(`Using model endpoint: ${modelDescription}`);
    
    const response = await fetch(modelEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log("Gemini API response status:", response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API error:", data);
      
      // Create a more user-friendly error message based on the error
      let errorMessage = "Gemini API error";
      
      if (data.error) {
        // Check for specific error types
        if (data.error.message && data.error.message.includes("API key")) {
          errorMessage = "API key error: Please check the Gemini API key configuration";
        } else if (data.error.message && (
          data.error.message.includes("permission") || 
          data.error.message.includes("enablement") ||
          data.error.message.includes("search") ||
          data.error.message.includes("API is not enabled") ||
          data.error.message.includes("Search tool") ||
          data.error.message.includes("Google Search") ||
          data.error.message.includes("not available")
        )) {
          // More comprehensive check for web search permission errors
          errorMessage = "Web Search Permission Error: Your Gemini API key doesn't have the Web Search feature enabled. Please go to Google AI Studio (https://aistudio.google.com/), create an API key with Web Search enabled, and update your GEMINI_API_KEY environment variable.";
          
          console.error("Web Search permission error details:", data.error);
        } else if (data.error.message) {
          errorMessage = `Error: ${data.error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    if (data.candidates && data.candidates[0]) {
      // Check if we have content and parts as expected
      if (data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        const responseText = data.candidates[0].content.parts[0].text;
        console.log("Received AI response (first 100 chars):", responseText.substring(0, 100) + "...");
        
        // Start with the base response text
        let modifiedResponseText = responseText;
        let searchQueries = null;
        
        // Enhanced handling of search grounding metadata
        if (useWebSearch) {
          if (data.candidates[0].groundingMetadata) {
            console.log("Web search was used in the response");
            
            // Extract citation data if available
            if (data.candidates[0].groundingMetadata.groundingChunks &&
                data.candidates[0].groundingMetadata.groundingChunks.length > 0) {
              
              // Extract citation sources from groundingChunks
              const citations = data.candidates[0].groundingMetadata.groundingChunks
                .filter((chunk: any) => chunk.web && chunk.web.uri)
                .map((chunk: any) => ({
                  title: chunk.web.title || 'Source',
                  uri: chunk.web.uri,
                  snippet: chunk.web.snippet || null
                }));
              
              if (citations.length > 0) {
                console.log(`Found ${citations.length} citation sources`);
                
                // Append citations directly to the response text
                modifiedResponseText += "\n\n## Sources\n";
                
                // Add each citation as a numbered reference with markdown links
                citations.forEach((citation: WebCitation, index: number) => {
                  modifiedResponseText += `\n${index + 1}. [${citation.title}](${citation.uri})`;
                  if (citation.snippet) {
                    modifiedResponseText += ` - ${citation.snippet}`;
                  }
                });
              }
            }
            
            // Extract search queries if available (keep this for debugging)
            if (data.candidates[0].groundingMetadata.webSearchQueries) {
              searchQueries = data.candidates[0].groundingMetadata.webSearchQueries;
              console.log("Web search queries used:", searchQueries);
            }
            
            if (data.candidates[0].groundingMetadata.searchEntryPoint && 
                data.candidates[0].groundingMetadata.searchEntryPoint.renderedContent) {
              console.log("Search grounding metadata available with rendered content");
            } else {
              console.log("Search metadata present but no rendered content found");
            }
          } else {
            // This is important - if we requested search but didn't get search metadata
            console.log("Web search was requested but no search metadata was returned");
          }
        }
        
        // Create a response object that includes the text with embedded citations
        // We'll keep the existing structure but citations will be null since they're in the text
        const responseData: AIResponseWithCitations = {
          text: modifiedResponseText,
          searchQueries: searchQueries
        };
        
        return responseData;
      } else {
        // Handle case where content/parts structure is unexpected
        console.error("Unexpected response structure from Gemini API:", data);
        throw new Error("Unexpected response structure from Gemini API");
      }
    } else {
      console.error("Unexpected response format from Gemini API:", data);
      throw new Error("Unexpected response format from Gemini API");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    // Preserve the original error message if available
    if (error instanceof Error) {
      throw error; // Throw the error with its original message
    } else {
      throw new Error("Failed to generate AI response");
    }
  }
}