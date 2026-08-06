import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";  // Make sure this path is correct
import { v4 as uuidv4 } from "uuid";

// Helper functions for cookie management
// const setSessionCookie = (res, sessionId) => {
//     res.cookie("sessionId", sessionId, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "lax",
//         maxAge: 60 * 60 * 1000, // 1 hour
//     });
// };

// const setSessionCookie = (res, sessionId) => {
//     res.cookie("sessionId", sessionId, {
//         httpOnly: true,
//         secure: false, // MUST be false for localhost HTTP
//         sameSite: "lax",
//         maxAge: 60 * 60 * 1000,
//         path: "/",
//         // domain: "localhost" // Don't set domain for localhost
//     });
// };

const setSessionCookie = (res, sessionId) => {
    console.log('🔐 Setting cookie with sessionId:', sessionId);
    
    res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
        path: "/",
    });
    
    console.log('📋 Cookie set. Headers will be sent with response');
};

const clearSessionCookie = (res) => {
    res.clearCookie("sessionId");
};

// SIGNUP
export const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        console.log("Signup attempt:", { email, name });

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Check if prisma is available
        if (!prisma) {
            console.error("Prisma is not initialized");
            return res.status(500).json({
                success: false,
                message: "Database connection error",
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || email.split("@")[0],
                password: hashedPassword,
                role: "ADMIN",
            },
        });

        // Create session
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.session.create({
            data: {
                id: sessionId,
                userId: newUser.id,
                expiresAt,
            },
        });

        // Set cookie
        setSessionCookie(res, sessionId);

        const { password: _, ...safeUser } = newUser;

        return res.status(201).json({
            success: true,
            message: "Signup successful",
            user: safeUser,
        });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

// LOGIN
// export const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Email and password are required",
//             });
//         }

//         // Find user
//         const user = await prisma.user.findUnique({
//             where: { email },
//         });

//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid credentials",
//             });
//         }

//         // Verify password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid credentials",
//             });
//         }

//         // Create session
//         const sessionId = uuidv4();
//         const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

//         await prisma.session.create({
//             data: {
//                 id: sessionId,
//                 userId: user.id,
//                 expiresAt,
//             },
//         });

//         // Set cookie
//         setSessionCookie(res, sessionId);

//         const { password: _, ...safeUser } = user;

//         return res.status(200).json({
//             success: true,
//             message: "Login successful",
//             user: safeUser,
//         });

//     } catch (error) {
//         console.error("Login error:", error);
//         return res.status(500).json({
//             success: false,
//             message: error.message || "Internal server error",
//         });
//     }
// };

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Create session
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                expiresAt,
            },
        });

        console.log('✅ Session created:', sessionId);

        // ✅ Set cookie - same as working test endpoint
        try {
            res.cookie("sessionId", sessionId, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 60 * 60 * 1000,
                path: "/",
            });
            console.log('✅ Cookie set successfully');
        } catch (cookieError) {
            console.error('❌ Error setting cookie:', cookieError);
        }

        const { password: _, ...safeUser } = user;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: safeUser,
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

// LOGOUT
export const logout = async (req, res) => {
    try {
        const sessionId = req.cookies?.sessionId;

        if (sessionId) {
            await prisma.session.deleteMany({
                where: { id: sessionId },
            });
        }

        clearSessionCookie(res);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });

    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

// VERIFY SESSION
export const verifySession = async (req, res) => {
    try {
        const sessionId = req.cookies?.sessionId;

        if (!sessionId) {
            return res.json({ valid: false, message: "No session found" });
        }

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!session || session.expiresAt < new Date()) {
            if (session) {
                await prisma.session.delete({ where: { id: sessionId } });
            }
            return res.json({ valid: false, message: "Session expired" });
        }

        return res.json({
            valid: true,
            user: session.user,
        });

    } catch (error) {
        console.error("Verify session error:", error);
        return res.status(500).json({
            valid: false,
            message: error.message || "Server error",
        });
    }
};