import { ResourceResponse, StorageProvider, AddOptions } from './types';
import { LocalStorageProvider } from './providers/LocalStorageProvider';
import { GoogleCloudStorageProvider } from './providers/GoogleCloudStorageProvider';

let provider: StorageProvider;

const storageType = process.env.STORAGE_TYPE || 'local';
const storagePath = process.env.STORAGE_PATH || './resources';
const gcsBucket = process.env.GCS_BUCKET || '';
const gcsKeyFile = process.env.GCS_KEY_FILE;

if (storageType === 'gcs' && gcsBucket) {
  provider = new GoogleCloudStorageProvider(gcsBucket, gcsKeyFile);
} else {
  provider = new LocalStorageProvider(storagePath);
}

export async function add(file: Buffer | string, fileName: string, options?: AddOptions): Promise<ResourceResponse> {
  const buffer = typeof file === 'string' ? Buffer.from(file) : file;
  return provider.add(buffer, fileName, options);
}

export async function find(identifier: string): Promise<Buffer | null> {
  return provider.find(identifier);
}

export { ResourceResponse, AddOptions } from './types';