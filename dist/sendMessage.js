"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wwebjs_mongo_1 = require("wwebjs-mongo");
const mongoose_1 = __importStar(require("mongoose"));
const whatsapp_web_js_1 = __importDefault(require("whatsapp-web.js"));
const { Client, RemoteAuth } = whatsapp_web_js_1.default;
function whatsappClientConnection(message) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, mongoose_1.connect)((_a = process.env.WHATSAPP_SESSION_MONGODB_URI) !== null && _a !== void 0 ? _a : "");
            const store = new wwebjs_mongo_1.MongoStore({ mongoose: mongoose_1.default });
            const client = new Client({
                authStrategy: new RemoteAuth({
                    store: store,
                    backupSyncIntervalMs: 300000,
                }),
                puppeteer: {
                    args: ["--no-sandbox"],
                },
            });
            const messageSent = yield client.sendMessage((_b = process.env.WHATSAPP_US_CHAT_ID) !== null && _b !== void 0 ? _b : "", message);
            client.initialize();
        }
        catch (error) {
            console.log(error);
        }
    });
}
exports.default = whatsappClientConnection;
