import express from "express";
import { signup, login, logout, verifySession } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-session", verifySession);

router.get('/test-cookie', (req, res) => {
    res.cookie('test-cookie', 'test-value', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 60000,
        path: '/'
    });
    res.json({ message: 'Test cookie set' });
});

// Add this temporary test endpoint in your auth.routes.js
router.post('/test-login', async (req, res) => {
    const { email, password } = req.body;
    
    // Just for testing - don't keep this in production
    res.cookie("sessionId", "test-session-123", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
        path: "/",
    });
    
    res.json({ success: true, message: "Test login" });
});

export default router;