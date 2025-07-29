import { StorageProvider, ResourceResponse, AddOptions } from '../types';
import { Storage } from '@google-cloud/storage';
import * as crypto from 'crypto';
import * as path from 'path';
import * as mime from 'mime-types';

export class GoogleCloudStorageProvider implements StorageProvider {
  private storage: Storage;
  private bucketName: string;

  constructor(bucketName: string, keyFileOrBase64?: string) {
    this.bucketName = bucketName;
    
    if (keyFileOrBase64) {
      // Check if it's a base64 string
      if (keyFileOrBase64.startsWith('ew') || keyFileOrBase64.includes('=')) {
        try {
          const decodedKey = Buffer.from(keyFileOrBase64, 'base64').toString('utf-8');
          const credentials = JSON.parse(decodedKey);
          this.storage = new Storage({ credentials });
        } catch (e) {
          // If decoding fails, treat it as a file path
          this.storage = new Storage({ keyFilename: keyFileOrBase64 });
        }
      } else {
        // It's a file path
        this.storage = new Storage({ keyFilename: keyFileOrBase64 });
      }
    } else {
      // Use default credentials
      this.storage = new Storage();
    }
  }

  async add(buffer: Buffer, fileName: string, options?: AddOptions): Promise<ResourceResponse> {
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
    } catch (error) {
      return {
        response: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async find(identifier: string): Promise<Buffer | null> {
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
    } catch {
      return null;
    }
  }
}