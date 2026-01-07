import { StorageProvider, ResourceResponse, AddOptions } from '../types';
export declare class GoogleCloudStorageProvider implements StorageProvider {
    private storage;
    private bucketName;
    private defaultSignatureLifetime;
    constructor(bucketName: string, keyFileOrBase64?: string, signatureLifetime?: number);
    add(buffer: Buffer, fileName: string, options?: AddOptions): Promise<ResourceResponse>;
    find(identifier: string): Promise<Buffer | null>;
    getSignedUrl(storedUrl: string, expiresIn?: number): Promise<string | null>;
}
//# sourceMappingURL=GoogleCloudStorageProvider.d.ts.map