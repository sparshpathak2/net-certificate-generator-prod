import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

/**
 * Create a new user
 */
export const createUserService = async ({ data, loggedinUser }) => {
    const { email, password, name, phone, role } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: name || email.split("@")[0],
            phone: phone || null,
            role: role || "ADMIN",
        },
    });

    // Remove password from response
    const { password: _, ...safeUser } = user;
    return safeUser;
};

/**
 * Get all users with their relationships
 */
export const getAllUsersService = async () => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
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

    return users;
};

/**
 * Get user by ID with relationships
 */
export const getUserByIdService = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
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
        throw new Error("User not found");
    }

    // Remove password from response
    const { password, ...safeUser } = user;
    return safeUser;
};

/**
 * Update user by ID
 */
export const updateUserService = async (userId, data) => {
    const { email, password, name, phone, isActive, role } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!existingUser) {
        throw new Error("User not found");
    }

    // Prepare update data
    const updateData = {
        email: email ?? existingUser.email,
        name: name ?? existingUser.name,
        phone: phone ?? existingUser.phone,
        isActive: isActive !== undefined ? isActive : existingUser.isActive,
    };

    // Hash password if provided
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    // Update role if provided
    if (role) {
        updateData.role = role;
    }

    // Update user
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    // Remove password from response
    const { password: _, ...safeUser } = updatedUser;
    return safeUser;
};

/**
 * Delete user by ID
 */
export const deleteUserService = async (userId) => {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!existingUser) {
        throw new Error("User not found");
    }

    // Don't allow deleting the last admin
    const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
    });

    if (adminCount <= 1 && existingUser.role === "ADMIN") {
        throw new Error("Cannot delete the last admin user");
    }

    // Delete user
    const deletedUser = await prisma.user.delete({
        where: { id: userId },
    });

    // Remove password from response
    const { password, ...safeUser } = deletedUser;
    return safeUser;
};

/**
 * Get current user profile by session
 */
export const getCurrentUserService = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

/**
 * Update current user profile
 */
export const updateCurrentUserService = async (userId, data) => {
    const { name, phone, password } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!existingUser) {
        throw new Error("User not found");
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    // Remove password from response
    const { password: _, ...safeUser } = updatedUser;
    return safeUser;
};

/**
 * Find user by email
 */
export const findUserByEmailService = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    return user;
};

/**
 * Find user by ID
 */
export const findUserByIdService = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    return user;
};

/**
 * Validate user credentials
 */
export const validateUserCredentialsService = async (email, password) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return null;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return null;
    }

    // Remove password from response
    const { password: _, ...safeUser } = user;
    return safeUser;
};

/**
 * Check if email is already taken (excluding current user)
 */
export const isEmailTakenService = async (email, excludeUserId = null) => {
    const where = { email };
    if (excludeUserId) {
        where.id = { not: excludeUserId };
    }

    const user = await prisma.user.findFirst({
        where,
    });

    return !!user;
};

/**
 * Get user statistics
 */
export const getUserStatsService = async (userId) => {
    const stats = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            _count: {
                select: {
                    certificates: true,
                    templates: true,
                    sessions: true,
                },
            },
            certificates: {
                select: {
                    id: true,
                    status: true,
                },
            },
        },
    });

    if (!stats) {
        throw new Error("User not found");
    }

    // Count certificates by status
    const certificateStatusCount = stats.certificates.reduce((acc, cert) => {
        acc[cert.status] = (acc[cert.status] || 0) + 1;
        return acc;
    }, {});

    return {
        totalCertificates: stats._count.certificates,
        totalTemplates: stats._count.templates,
        totalSessions: stats._count.sessions,
        certificateStatusCount,
    };
};