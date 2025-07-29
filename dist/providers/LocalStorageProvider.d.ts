import { StorageProvider, ResourceResponse, AddOptions } from '../types';
export declare class LocalStorageProvider implements StorageProvider {
    private basePath;
    constructor(basePath: string);
    add(buffer: Buffer, fileName: string, options?: AddOptions): Promise<ResourceResponse>;
    find(identifier: string): Promise<Buffer | null>;
}
//# sourceMappingURL=LocalStorageProvider.d.ts.map