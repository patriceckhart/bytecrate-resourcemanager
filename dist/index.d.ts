import { ResourceResponse, AddOptions } from './types';
export declare function add(file: Buffer | string, fileName: string, options?: AddOptions): Promise<ResourceResponse>;
export declare function find(identifier: string): Promise<Buffer | null>;
export declare function getSignedUrl(storedUrl: string, expiresIn?: number): Promise<string | null>;
export { ResourceResponse, AddOptions } from './types';
//# sourceMappingURL=index.d.ts.map