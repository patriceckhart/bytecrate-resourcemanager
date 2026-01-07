import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { add, getSignedUrl } from '../src/index';

/**
 * Test for getSignedUrl functionality
 * 
 * Prerequisites:
 * - Set environment variables before running:
 *   STORAGE_TYPE=gcs
 *   GCS_BUCKET=your-private-bucket
 *   GCS_KEY_FILE=/path/to/service-account-key.json (or base64 encoded)
 *   GCS_SIGNATURE_LIFETIME=3600 (optional, defaults to 1 hour)
 * 
 * Run with:
 *   npx tsx test/getSignedUrl.test.ts
 */

describe('getSignedUrl', () => {
  let storedUrl: string;

  before(async () => {
    // Check if GCS is configured
    if (process.env.STORAGE_TYPE !== 'gcs' || !process.env.GCS_BUCKET) {
      console.log('\nSkipping tests: GCS not configured');
      console.log('Set STORAGE_TYPE=gcs and GCS_BUCKET to run these tests\n');
      process.exit(0);
    }
  });

  it('should upload a test file and store the URL', async () => {
    const testContent = Buffer.from(`Test content for signed URL - ${Date.now()}`);
    const result = await add(testContent, 'test-signed-url.txt');

    if (result.response === 'error') {
      console.log('Error:', result.error);
    }

    assert.ok(
      result.response === 'success' || result.response === 'exists',
      `Expected success or exists, got ${result.response}: ${result.error || ''}`
    );
    assert.ok(result.data, 'Expected data in response');
    
    // Construct the full URL as it would be stored in the database
    storedUrl = `https://${result.data.resource}`;
    console.log('Stored URL:', storedUrl);
  });

  it('should generate a signed URL from the stored URL', async () => {
    assert.ok(storedUrl, 'storedUrl not set - previous test failed');
    const signedUrl = await getSignedUrl(storedUrl);

    console.log('Signed URL:', signedUrl);
    
    assert.ok(signedUrl, 'Expected a signed URL to be returned');
    assert.ok(signedUrl.startsWith('https://'), 'Signed URL should start with https://');
    assert.ok(signedUrl.includes('Signature') || signedUrl.includes('X-Goog-Signature'), 'Signed URL should contain signature');
  });

  it('should generate a signed URL with custom expiry', async () => {
    assert.ok(storedUrl, 'storedUrl not set - previous test failed');
    const customExpiry = 300; // 5 minutes
    const signedUrl = await getSignedUrl(storedUrl, customExpiry);

    console.log('Signed URL (5 min expiry):', signedUrl);
    
    assert.ok(signedUrl, 'Expected a signed URL to be returned');
    assert.ok(signedUrl.includes('Signature') || signedUrl.includes('X-Goog-Signature'), 'Signed URL should contain signature');
  });

  it('should return null for invalid URL format', async () => {
    const invalidUrls = [
      'https://example.com/some-file',
      'not-a-url',
      'https://storage.googleapis.com/bucket/not-a-sha1',
      '',
    ];

    for (const url of invalidUrls) {
      const result = await getSignedUrl(url);
      assert.strictEqual(result, null, `Expected null for invalid URL: ${url}`);
    }
  });

  it('should return null for non-existent file', async () => {
    const nonExistentUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/0000000000000000000000000000000000000000`;
    const result = await getSignedUrl(nonExistentUrl);
    
    assert.strictEqual(result, null, 'Expected null for non-existent file');
  });

  it('should handle URL without https:// prefix', async () => {
    assert.ok(storedUrl, 'storedUrl not set - previous test failed');
    // Remove https:// prefix
    const urlWithoutProtocol = storedUrl.replace('https://', '');
    const signedUrl = await getSignedUrl(urlWithoutProtocol);

    console.log('Signed URL (no prefix):', signedUrl);
    
    assert.ok(signedUrl, 'Expected a signed URL even without https:// prefix');
    assert.ok(signedUrl.includes('Signature') || signedUrl.includes('X-Goog-Signature'), 'Signed URL should contain signature');
  });
});
