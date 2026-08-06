import express from "express";
import {
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    createUser
} from "../controllers/user.controller.js";

const router = express.Router();

// Create new user
router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUserById);
router.delete("/:id", deleteUserById);


export default router;