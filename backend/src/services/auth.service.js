// import prisma from "../lib/prisma.js";

// export const validateSession = async (sessionId) => {
//     if (!sessionId) {
//         return { valid: false };
//     }

//     const session = await prisma.session.findUnique({
//         where: { id: sessionId },
//         include: {
//             user: {
//                 include: {
//                     role: true,
//                 },
//             },
//         },
//     });

//     if (!session || session.expiresAt < new Date()) {
//         return { valid: false };
//     }

//     const { passwordHash, ...safeUser } = session.user;

//     return {
//         valid: true,
//         user: safeUser,
//     };
// };


import prisma from "../lib/prisma.js";

export const validateSession = async (sessionId) => {
    if (!sessionId) {
        return { valid: false, user: null };
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            user: {
                // ✅ Don't include role as a relation - it's a scalar field
                // Just select the fields you need
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,  // ✅ This is fine - it's selecting, not including
                    isActive: true,
                    createdAt: true,
                }
            }
        }
    });

    if (!session || session.expiresAt < new Date()) {
        // Clean up expired session
        if (session) {
            await prisma.session.delete({ where: { id: sessionId } });
        }
        return { valid: false, user: null };
    }

    return {
        valid: true,
        user: session.user,
    };
};