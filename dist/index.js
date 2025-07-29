"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add = add;
exports.find = find;
const LocalStorageProvider_1 = require("./providers/LocalStorageProvider");
const GoogleCloudStorageProvider_1 = require("./providers/GoogleCloudStorageProvider");
let provider;
const storageType = process.env.STORAGE_TYPE || 'local';
const storagePath = process.env.STORAGE_PATH || './resources';
const gcsBucket = process.env.GCS_BUCKET || '';
const gcsKeyFile = process.env.GCS_KEY_FILE;
if (storageType === 'gcs' && gcsBucket) {
    provider = new GoogleCloudStorageProvider_1.GoogleCloudStorageProvider(gcsBucket, gcsKeyFile);
}
else {
    provider = new LocalStorageProvider_1.LocalStorageProvider(storagePath);
}
async function add(file, fileName, options) {
    const buffer = typeof file === 'string' ? Buffer.from(file) : file;
    return provider.add(buffer, fileName, options);
}
async function find(identifier) {
    return provider.find(identifier);
}
//# sourceMappingURL=index.js.map