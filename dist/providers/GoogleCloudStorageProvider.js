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
exports.GoogleCloudStorageProvider = void 0;
const storage_1 = require("@google-cloud/storage");
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
const mime = __importStar(require("mime-types"));
class GoogleCloudStorageProvider {
    constructor(bucketName, keyFileOrBase64, signatureLifetime) {
        this.bucketName = bucketName;
        this.defaultSignatureLifetime = signatureLifetime || 3600; // Default 1 hour
        if (keyFileOrBase64) {
            // Check if it's a base64 string
            if (keyFileOrBase64.startsWith('ew') || keyFileOrBase64.includes('=')) {
                try {
                    const decodedKey = Buffer.from(keyFileOrBase64, 'base64').toString('utf-8');
                    const credentials = JSON.parse(decodedKey);
                    this.storage = new storage_1.Storage({ credentials });
                }
                catch (e) {
                    // If decoding fails, treat it as a file path
                    this.storage = new storage_1.Storage({ keyFilename: keyFileOrBase64 });
                }
            }
            else {
                // It's a file path
                this.storage = new storage_1.Storage({ keyFilename: keyFileOrBase64 });
            }
        }
        else {
            // Use default credentials
            this.storage = new storage_1.Storage();
        }
    }
    async add(buffer, fileName, options) {
        try {
            const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
            const extension = path.extname(fileName).toLowerCase().slice(1) || '';
            const mimeType = mime.lookup(fileName) || 'application/octet-stream';
            const bucket = this.storage.bucket(this.bucketName);
            const file = bucket.file(sha1);
            // Check if file already exists
            const [exists] = await file.exists();
            if (exists && !options?.replace) {
                const fileSize = buffer.length;
                const resource = `storage.googleapis.com/${this.bucketName}/${sha1}`;
                return {
                    response: 'exists',
                    message: 'File already exists with same content (SHA1 hash)',
                    data: {
                        fileSize,
                        resource,
                        fileName: fileName,
                        fileExtension: extension,
                        mimetype: mimeType
                    }
                };
            }
            await file.save(buffer, {
                metadata: {
                    contentType: mimeType,
                    metadata: {
                        originalName: fileName
                    }
                }
            });
            const fileSize = buffer.length;
            const resource = `storage.googleapis.com/${this.bucketName}/${sha1}`;
            return {
                response: 'success',
                data: {
                    fileSize,
                    resource,
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
            const bucket = this.storage.bucket(this.bucketName);
            const file = bucket.file(identifier);
            const [exists] = await file.exists();
            if (exists) {
                const [data] = await file.download();
                return data;
            }
            return null;
        }
        catch {
            return null;
        }
    }
    async getSignedUrl(storedUrl, expiresIn) {
        try {
            // Parse the stored URL to extract bucket and object name
            // Format: https://storage.googleapis.com/bucket/sha1 or storage.googleapis.com/bucket/sha1
            const urlPattern = /(?:https?:\/\/)?storage\.googleapis\.com\/([^\/]+)\/([a-f0-9]{40})$/;
            const match = storedUrl.match(urlPattern);
            if (!match) {
                return null;
            }
            const [, bucketName, objectName] = match;
            const bucket = this.storage.bucket(bucketName);
            const file = bucket.file(objectName);
            const [exists] = await file.exists();
            if (!exists) {
                return null;
            }
            const lifetime = expiresIn || this.defaultSignatureLifetime;
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + lifetime * 1000
            });
            return signedUrl;
        }
        catch {
            return null;
        }
    }
}
exports.GoogleCloudStorageProvider = GoogleCloudStorageProvider;
//# sourceMappingURL=GoogleCloudStorageProvider.js.map