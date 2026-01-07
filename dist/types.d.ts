export interface ResourceResponse {
    response: 'success' | 'error' | 'exists';
    data?: {
        fileSize: number;
        resource: string;
        fileName: string;
        fileExtension: string;
        mimetype: string;
    };
    error?: string;
    message?: string;
}
export interface AddOptions {
    replace?: boolean;
}
export interface StorageProvider {
    add(buffer: Buffer, fileName: string, options?: AddOptions): Promise<ResourceResponse>;
    find(identifier: string): Promise<Buffer | null>;
    getSignedUrl?(storedUrl: string, expiresIn?: number): Promise<string | null>;
}
//# sourceMappingURL=types.d.ts.map