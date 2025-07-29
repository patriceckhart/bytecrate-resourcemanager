import { StorageProvider, ResourceResponse, AddOptions } from '../types';
export declare class GoogleCloudStorageProvider implements StorageProvider {
    private storage;
    private bucketName;
    constructor(bucketName: string, keyFileOrBase64?: string);
    add(buffer: Buffer, fileName: string, options?: AddOptions): Promise<ResourceResponse>;
    find(identifier: string): Promise<Buffer | null>;
}
//# sourceMappingURL=GoogleCloudStorageProvider.d.ts.map