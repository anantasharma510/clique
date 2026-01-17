import crypto from 'crypto';
import { ESEWA_CONFIG } from '../config/esewa.config';

/**
 * Centralized eSewa signature verification utility
 * Follows eSewa's exact documentation for signature generation and verification
 */
export class ESewaSignatureVerifier {
  /**
   * Verify eSewa signature according to official documentation
   * @param data - Payment data from eSewa
   * @param signature - Signature received from eSewa
   * @returns boolean indicating if signature is valid
   */
  static verify(data: any, signature: string): boolean {
    try {
      console.log('[ESewa Signature] Input data:', {
        total_amount: data.total_amount,
        transaction_uuid: data.transaction_uuid,
        product_code: data.product_code || ESEWA_CONFIG.PRODUCT_CODE,
        received_signature: signature ? 'provided' : 'not provided'
      });

      // Handle different data formats as per eSewa documentation
      const total_amount = data.total_amount || data.totalAmount;
      const transaction_uuid = data.transaction_uuid || data.transactionUuid;
      const product_code = data.product_code || ESEWA_CONFIG.PRODUCT_CODE;

      // Create message string exactly as per eSewa documentation
      // Format: total_amount={amount},transaction_uuid={uuid},product_code={code}
      const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
      console.log('[ESewa Signature] Message to sign:', message);

      // Generate signature using HMAC-SHA256 as per eSewa docs
      const expectedSignature = crypto
        .createHmac("sha256", ESEWA_CONFIG.SECRET_KEY)
        .update(message)
        .digest("base64");

      console.log('[ESewa Signature] Expected signature:', expectedSignature);
      console.log('[ESewa Signature] Received signature:', signature);

      // Compare signatures
      const signaturesMatch = signature === expectedSignature;
      console.log('[ESewa Signature] Signatures match:', signaturesMatch);

      // Additional verification: Check if using test credentials
      if (process.env.NODE_ENV !== 'production') {
        console.log('[ESewa Signature] Using test credentials - signature verification may be lenient');
      }

      return signaturesMatch;
    } catch (error) {
      console.error('[ESewa Signature] Verification error:', error);
      return false;
    }
  }

  /**
   * Generate signature for outgoing requests (if needed)
   * @param data - Data to sign
   * @returns Generated signature
   */
  static generate(data: any): string {
    try {
      const total_amount = data.total_amount || data.totalAmount;
      const transaction_uuid = data.transaction_uuid || data.transactionUuid;
      const product_code = data.product_code || ESEWA_CONFIG.PRODUCT_CODE;

      const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
      
      return crypto
        .createHmac("sha256", ESEWA_CONFIG.SECRET_KEY)
        .update(message)
        .digest("base64");
    } catch (error) {
      console.error('[ESewa Signature] Generation error:', error);
      throw new Error('Failed to generate signature');
    }
  }

  /**
   * Validate signature data structure
   * @param data - Data to validate
   * @returns Validation result
   */
  static validateData(data: any): { valid: boolean; error?: string } {
    if (!data.total_amount && !data.totalAmount) {
      return { valid: false, error: 'Missing total_amount' };
    }
    
    if (!data.transaction_uuid && !data.transactionUuid) {
      return { valid: false, error: 'Missing transaction_uuid' };
    }
    
    return { valid: true };
  }
} 