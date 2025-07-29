# bytecrate-resourcemanager

A TypeScript resource management library with support for local file system and Google Cloud Storage. Files are stored using their SHA1 hash as identifiers, ensuring deduplication and efficient retrieval.

## Features

- **Dual Storage Support**: Local file system or Google Cloud Storage
- **SHA1-based Storage**: Files are stored using their SHA1 hash for deduplication
- **Hierarchical Directory Structure**: Local storage uses nested directories for better performance with large file counts
- **SHA1-based Retrieval**: Find files using their SHA1 hash
- **Simple API**: Just two main methods - `add()` and `find()`
- **TypeScript Support**: Fully typed with TypeScript definitions

## Installation

```bash
npm install bytecrate-resourcemanager
# or
yarn add bytecrate-resourcemanager
```

## Usage

### Basic Setup

```typescript
import { add, find } from 'bytecrate-resourcemanager';

// Add a file from Buffer
const buffer = await fs.readFile('picture.jpg');
const result = await add(buffer, 'picture.jpg');

if (result.response === 'success') {
  console.log('File stored with SHA1:', result.data.resource);
}

// Find a file by SHA1
const content = await find('2ef7bde608ce5404e97d5f042f95f89f1c232871');
if (content) {
  console.log('File found:', content.toString());
}

// Handle existing files
const result2 = await add(buffer, 'picture.jpg');
if (result2.response === 'exists') {
  console.log('File already exists:', result2.message);
  
  // Force replace if needed
  const result3 = await add(buffer, 'picture.jpg', { replace: true });
  console.log('File replaced:', result3.response);
}
```

### Configuration

The library uses environment variables for configuration:

```bash
# Storage type: 'local' (default) or 'gcs'
STORAGE_TYPE=local

# For local storage - base directory path
STORAGE_PATH=./resources

# For Google Cloud Storage
STORAGE_TYPE=gcs
GCS_BUCKET=your-bucket-name
GCS_KEY_FILE=/path/to/service-account-key.json
# Or use base64 encoded credentials
GCS_KEY_FILE=base64-encoded-credentials
```

### Local Storage

When using local storage, files are stored in a hierarchical directory structure based on the first 4 characters of the SHA1 hash:

```
resources/
├── 3/
│   └── 8/
│       └── f/
│           └── c/
│               └── 38fc6751c055a7edc420679c1fef24c18ef5606a
```

### Google Cloud Storage

Files are stored in the specified bucket using the SHA1 hash as the object name.

## API Reference

### `add(file: Buffer | string, fileName: string, options?: AddOptions): Promise<ResourceResponse>`

Adds a file to the storage system.

**Parameters:**
- `file`: Buffer or string content to store
- `fileName`: Original filename (used for MIME type detection)
- `options`: Optional configuration
  - `replace?: boolean`: If true, replaces existing files with same content (default: false)

**Returns:** `ResourceResponse` object with:
```typescript
{
  response: 'success' | 'error' | 'exists';
  data?: {
    fileSize: number;
    resource: string;      // Storage path or identifier
    fileName: string;      // Original filename
    fileExtension: string; // File extension
    mimetype: string;      // MIME type
  };
  error?: string;        // Error message if response is 'error'
  message?: string;      // Additional message (e.g., when file exists)
}
```

**Response Types:**
- `'success'`: File was stored successfully
- `'exists'`: File already exists with same SHA1 hash (when replace is false)
- `'error'`: An error occurred during storage

### `find(identifier: string): Promise<Buffer | null>`

Retrieves a file from storage.

**Parameters:**
- `identifier`: SHA1 hash of the file (40 character hex string)

**Returns:** Buffer containing file content, or null if not found

**Example:**
```typescript
// Find by SHA1 hash
const content = await find('2ef7bde608ce5404e97d5f042f95f89f1c232871');
```

## Example

```typescript
import { add, find } from 'bytecrate-resourcemanager';
import fs from 'fs/promises';

// Configure for local storage
process.env.STORAGE_TYPE = 'local';
process.env.STORAGE_PATH = './uploads';

async function uploadFile() {
  // Read a file
  const imageBuffer = await fs.readFile('./photo.jpg');
  
  // Upload to storage
  const result = await add(imageBuffer, 'photo.jpg');
  
  if (result.response === 'success') {
    console.log('Uploaded successfully!');
    console.log('SHA1:', result.data.resource.split('/').pop());
    console.log('Size:', result.data.fileSize);
    console.log('MIME:', result.data.mimetype);
    
    // Retrieve the file
    const sha1 = result.data.resource.split('/').pop();
    const retrieved = await find(sha1);
    
    if (retrieved) {
      await fs.writeFile('./photo-copy.jpg', retrieved);
      console.log('File retrieved and saved!');
    }
  }
}
```

## Development

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Watch mode
yarn dev

# Run tests
npx ts-node test-local-storage.ts
```

## License

MIT