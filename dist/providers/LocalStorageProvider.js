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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageProvider = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const mime = __importStar(require("mime-types"));
class LocalStorageProvider {
    constructor(basePath) {
        this.basePath = basePath;
    }
    async add(buffer, fileName, options) {
        try {
            const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
            const extension = path.extname(fileName).toLowerCase().slice(1) || '';
            // Create nested directory structure based on first 4 characters of SHA1
            const dirPath = path.join(this.basePath, sha1[0], sha1[1], sha1[2], sha1[3]);
            await fs.mkdir(dirPath, { recursive: true });
            const storagePath = path.join(dirPath, sha1);
            // Check if file already exists
            try {
                await fs.access(storagePath);
                // File exists
                if (!options?.replace) {
                    const mimeType = mime.lookup(fileName) || 'application/octet-stream';
                    return {
                        response: 'exists',
                        message: 'File already exists with same content (SHA1 hash)',
                        data: {
                            fileSize: buffer.length,
                            resource: storagePath,
                            fileName: fileName,
                            fileExtension: extension,
                            mimetype: mimeType
                        }
                    };
                }
            }
            catch {
                // File doesn't exist, continue
            }
            await fs.writeFile(storagePath, buffer);
            const mimeType = mime.lookup(fileName) || 'application/octet-stream';
            const fileSize = buffer.length;
            return {
                response: 'success',
                data: {
                    fileSize,
                    resource: storagePath,
                    fileName: fileName,
                    fileExtension: extension,
                    mimetype: mimeType
                }
            };
        }
        catch (error) {
            return {
                response: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async find(identifier) {
        try {
            // Only accept SHA1 identifiers
            if (identifier.length !== 40 || !/^[a-f0-9]+$/.test(identifier)) {
                return null;
            }
            // Use the nested directory structure
            const filePath = path.join(this.basePath, identifier[0], identifier[1], identifier[2], identifier[3], identifier);
            return await fs.readFile(filePath);
        }
        catch (error) {
            return null;
        }
    }
}
exports.LocalStorageProvider = LocalStorageProvider;
//# sourceMappingURL=LocalStorageProvider.js.map