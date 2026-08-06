import axios from "axios";
import { verifySession } from "../controllers/auth.controller.js";
import { validateSession } from "../services/auth.service.js";

export const authMiddleware = async (req, res, next) => {

    // ✅ Always allow preflight
    if (req.method === "OPTIONS") {
        return next();
    }

    // ✅ Define public route patterns (not just endings)
    const isPublicRoute = 
        req.path === "/api/health" ||
        req.path.startsWith("/api/auth/") ||
        req.path.startsWith("/api/public/") ||
        req.path.includes("/public/claim/") ||
        req.path.includes("/public/list") ||
        req.path.includes("/verify/") ||
        req.path.includes("/verify-session/") ||
        req.path.includes("/request-status/");

    if (isPublicRoute) {
        return next();
    }

    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
        return res.status(401).json({ message: "Unauthorized: No session found" });
    }

    try {
        const response = await validateSession(sessionId);
        const { valid, user } = response;

        if (!valid || !user) {
            return res.status(401).json({ message: "Invalid session" });
        }

        req.user = user;

        req.headers["x-user-id"] = user.id;
        req.headers["x-user-name"] = user.name;
        req.headers["x-user-role"] = user.role?.name || "GUEST";

        next();
    } catch (error) {
        console.error("Auth middleware error:", error.message);
        return res.status(401).json({ message: "Auth check failed" });
    }
};