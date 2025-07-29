import { StorageProvider, ResourceResponse, AddOptions } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as mime from 'mime-types';

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async add(buffer: Buffer, fileName: string, options?: AddOptions): Promise<ResourceResponse> {
    try {
      const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
      const extension = path.extname(fileName).toLowerCase().slice(1) || '';
      
      // Create nested directory structure based on first 4 characters of SHA1
      const dirPath = path.join(
        this.basePath,
        sha1[0],
        sha1[1],
        sha1[2],
        sha1[3]
      );
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
      } catch {
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
      
      // Use the nested directory structure
      const filePath = path.join(
        this.basePath,
        identifier[0],
        identifier[1],
        identifier[2],
        identifier[3],
        identifier
      );

      return await fs.readFile(filePath);
    } catch (error) {
      return null;
    }
  }
}