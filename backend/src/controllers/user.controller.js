// import { ROLES } from "../constants/constants.js";
import prisma from "../lib/prisma.js";
import { createUserService, deleteUserService } from "../services/user.service.js";
import bcrypt from "bcrypt";
// import { nanoid } from "nanoid";
// import bcrypt from "bcryptjs";

export const createUser = async (req, res) => {
    const currentUser = req.user

    try {
        const user = await createUserService({ data: req.body, loggedinUser: currentUser });

        return res.status(201).json({ success: true, data: user });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};


export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        certificates: true,
                        templates: true,
                        sessions: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (err) {
        console.error("Get all users error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error",
        });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                certificates: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                templates: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                _count: {
                    select: {
                        certificates: true,
                        templates: true,
                        sessions: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: sanitizeUser(user),
        });
    } catch (err) {
        console.error("Get user by ID error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error",
        });
    }
};


// ✅ Update user by ID
export const updateUserById = async (req, res) => {
    const { id } = req.params;
    const { email, password, name, phone, isActive } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Prepare update data
        const updateData = {
            email: email ?? existingUser.email,
            name: name ?? existingUser.name,
            phone: phone ?? existingUser.phone,
            isActive: isActive !== undefined ? isActive : existingUser.isActive,
        };

        // Only hash password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        return res.status(200).json({
            success: true,
            data: sanitizeUser(updatedUser),
        });
    } catch (err) {
        console.error("Update user error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error",
        });
    }
};


// ✅ Delete user by ID
export const deleteUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        const deletedUser = await deleteUserService(userId);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: deletedUser,
        });

    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};
