"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const { JWT_SECRET } = (0, env_1.loadEnv)();
const JWT_SECRET_KEY = JWT_SECRET;
function signToken(payload, expiresIn = '7d') {
    const options = { expiresIn };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET_KEY, options);
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET_KEY);
}
