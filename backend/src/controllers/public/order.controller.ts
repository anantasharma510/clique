import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware'; // Adjust path
import { Order } from '../../models/order.model'; // Adjust path
import mongoose from 'mongoose';
import { Product } from '../../models/product.model'; // Adjust path
import { Province } from '../../models/shipping.model';
import crypto from 'crypto';
import { sendOrderConfirmationEmail } from '../../services/email.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ESewaSignatureVerifier } from '../../utils/esewaSignature';
import ipRangeCheck from 'ip-range-check';
import { monitoringService } from '../../services/monitoring.service';
import { deadLetterQueueService } from '../../services/deadLetterQueue.service';
import { ESEWA_CONFIG } from '../../config/esewa.config';

// eSewa IP whitelist for webhook security
const ESEWA_IP_WHITELIST = [
  // eSewa production IP ranges (you should get these from eSewa)
  '103.21.244.0/22',
  '103.22.200.0/22',
  '104.16.0.0/12',
  '172.64.0.0/13',
  // Add more eSewa IP ranges as provided by eSewa
];

// Development IPs for testing (remove in production)
const DEVELOPMENT_IPS = [
  '127.0.0.1',
  '::1',
  'localhost'
];

// Check if IP is in eSewa whitelist
const validateESewaIP = (ip: string): boolean => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // In development, allow localhost and development IPs
  if (isDevelopment && DEVELOPMENT_IPS.includes(ip)) {
    console.log('[IP Validation] Development IP allowed:', ip);
    return true;
  }
  
  // In production, only allow eSewa IPs
  if (isDevelopment) {
    console.log('[IP Validation] Development mode - allowing all IPs for testing');
    return true;
  }
  
  // Production IP validation using proper IP range library
  const isWhitelisted = ipRangeCheck(ip, ESEWA_IP_WHITELIST);
  
  console.log('[IP Validation] IP:', ip, 'Whitelisted:', isWhitelisted);
  return isWhitelisted;
};

// Validate request timestamp to prevent replay attacks
const validateRequestTimestamp = (timestamp?: string): boolean => {
  if (!timestamp) {
    console.log('[Timestamp Validation] No timestamp provided');
    return process.env.NODE_ENV !== 'production'; // Allow in development
  }
  
  try {
    const requestTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);
    
    // Allow 5-minute window for request timing
    const isValid = timeDiff <= 5 * 60 * 1000;
    console.log('[Timestamp Validation] Time diff:', timeDiff, 'ms, Valid:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('[Timestamp Validation] Error:', error);
    return process.env.NODE_ENV !== 'production'; // Allow in development
  }
};

// Audit logging function
const logAuditEvent = (event: string, userId: string, orderId: string, details: any) => {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${event} - User: ${userId} - Order: ${orderId} - Details:`, details);
};

// Use centralized signature verification
const verifyESewaSignature = (data: any, signature: string): boolean => {
  return ESewaSignatureVerifier.verify(data, signature);
};

// Validate order data
const validateOrderData = (items: any[], userId: string): { valid: boolean; error?: string; orderItems?: any[] } => {
  if (!items || items.length === 0) {
    return { valid: false, error: 'Order must contain at least one item' };
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    if (!item.productId || !item.quantity) {
      return { valid: false, error: 'Invalid item data' };
    }

    if (item.quantity < 1 || item.quantity > 100) {
      return { valid: false, error: 'Invalid quantity (must be between 1 and 100)' };
    }

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
    });
  }

  return { valid: true, orderItems };
};

/**
 * @desc    Create a new order and generate eSewa payment info
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Security checks
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (req.user.isBlocked) {
      res.status(403).json({ 
        message: 'Account blocked. Please contact support for assistance.' 
      });
      return;
    }

    const { items, shippingInfo } = req.body;

    // Validate order data
    const validation = validateOrderData(items, req.user._id.toString());
    if (!validation.valid) {
      res.status(400).json({ message: validation.error });
      return;
    }

    // Verify products exist and have sufficient stock
    const orderItems = [];
    let subtotal = 0;

    for (const item of validation.orderItems!) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        res.status(404).json({ message: `Product not found: ${item.productId}` });
        return;
      }

      if (product.stockQuantity < item.quantity) {
        res.status(400).json({ 
          message: `Insufficient stock for ${product.title}. Available: ${product.stockQuantity}, Requested: ${item.quantity}` 
        });
        return;
      }

      const price = product.discountPrice || product.originalPrice;
      subtotal += price * item.quantity;
      
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: price,
      });
    }

    // Calculate shipping and tax
    const province = await Province.findOne({
      'cities.name': shippingInfo.city,
      'cities.isActive': true
    });

    let shippingCharge = 0;
    if (province) {
      const city = province.cities.find((c: any) => c.name === shippingInfo.city && c.isActive);
      if (city) {
        shippingCharge = city.shippingCharge;
      }
    }

    // Calculate tax from tax-inclusive prices
    let totalTaxAmount = 0;
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        const effectivePrice = product.discountPrice || product.originalPrice;
        const basePrice = effectivePrice / (1 + product.taxRate);
        const itemTax = effectivePrice - basePrice;
        totalTaxAmount += itemTax * item.quantity;
      }
    }

    const totalAmount = subtotal + shippingCharge; // subtotal already includes tax
    
    // Generate secure transaction UUID
    const transaction_uuid = crypto.randomUUID();

    // Generate eSewa signature using centralized utility
    const signature = ESewaSignatureVerifier.generate({
      total_amount: totalAmount,
      transaction_uuid,
      product_code: ESEWA_CONFIG.PRODUCT_CODE
    });

    // Create order
    const order = await Order.create([{
      userId: req.user._id,
      items: orderItems,
      transaction_uuid,
      amount: subtotal,
      totalAmount: totalAmount,
      status: 'PENDING',
      shippingInfo,
      shippingCharge,
      tax: Math.round(totalTaxAmount)
    }]);

    // Log audit event
    logAuditEvent('ORDER_CREATED', req.user._id.toString(), order[0]._id.toString(), {
      transaction_uuid,
      totalAmount,
      itemCount: orderItems.length
    });

    res.json({
      orderId: order[0]._id,
      formAction: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      fields: {
        amount: totalAmount,
        tax_amount: "0",
        total_amount: totalAmount,
        transaction_uuid,
        product_code: ESEWA_CONFIG.PRODUCT_CODE,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: ESEWA_CONFIG.SUCCESS_URL,
        failure_url: ESEWA_CONFIG.FAILURE_URL,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature
      },
    });

  } catch (error: any) {
    console.error("[Order Controller] Create Order Error:", error.message);
    
    // Log order failure for monitoring
    if (req.user) {
      monitoringService.logOrderFailure(
        req.body.transaction_uuid || 'unknown',
        req.user._id.toString(),
        error.message
      );
    }
    
    res.status(500).json({ message: "Server error while creating order" });
  }
};

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    
    const pageSize = Math.min(Number(req.query.limit) || 10, 50); // Limit max page size
    const page = Math.max(Number(req.query.page) || 1, 1);

    const query = { userId: req.user._id };

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('items.productId', 'title images originalPrice discountPrice')
      .select('-userId')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      count
    });

  } catch (error: any) {
    console.error('[User Order Controller] Get My Orders Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
};

/**
 * @desc    Get a single one of logged-in user's orders by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getMyOrderById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid order ID format' });
      return;
    }

    // Ensure user can only access their own orders
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('items.productId')
      .populate('userId', 'username email');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found or access denied' });
    }
  } catch (error: any) {
    console.error('[User Order Controller] Get My Order By ID Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching order' });
  }
};

/**
 * @desc    Verify payment and update order status + reduce stock
 * @route   POST /api/orders/verify-payment
 * @access  Public (called by eSewa webhook)
 */
export const verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // IP whitelist validation for eSewa webhooks
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
  console.log('[Payment Verification] Client IP:', clientIP);
  
  if (!validateESewaIP(clientIP)) {
    console.error('[Payment Verification] IP not whitelisted:', clientIP);
    res.status(403).json({ message: 'Access denied - IP not whitelisted' });
    return;
  }

  // Timestamp validation to prevent replay attacks
  const timestamp = req.headers['x-esewa-timestamp'] as string || req.body.timestamp;
  if (!validateRequestTimestamp(timestamp)) {
    console.error('[Payment Verification] Invalid timestamp or replay attack detected');
    res.status(400).json({ message: 'Invalid timestamp' });
    return;
  }

  // Extract variables early for error handling
  const { 
    transaction_uuid, 
    transaction_code, 
    status, 
    total_amount,
    signature 
  } = req.body;

  let order: any = null; // Declare order variable for error handling

  try {

    console.log('[Payment Verification] Processing payment:', {
      transaction_uuid,
      transaction_code,
      status,
      total_amount,
      total_amount_type: typeof total_amount,
      signature: signature ? 'provided' : 'not provided',
      full_body: req.body
    });

    // Find the order
    order = await Order.findOne({ transaction_uuid });
    if (!order) {
      console.error('[Payment Verification] Order not found:', transaction_uuid);
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Check if payment was successful
    if (status !== 'COMPLETE') {
      console.log('[Payment Verification] Payment not complete:', status);
      res.status(200).json({ message: 'Payment not complete' });
      return;
    }

    // Check if order already processed
    if (order.status === 'COMPLETED') {
      console.log('[Payment Verification] Order already completed:', order._id);
      res.status(200).json({ message: 'Order already processed' });
      return;
    }

    // STRICT SIGNATURE VERIFICATION - ENABLED FOR PRODUCTION
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (signature) {
      console.log('[Payment Verification] Attempting signature verification...');
      const isValidSignature = verifyESewaSignature(
        { total_amount, transaction_uuid, product_code: ESEWA_CONFIG.PRODUCT_CODE },
        signature
      );

      if (!isValidSignature) {
        console.error('[Payment Verification] Invalid signature detected');
        
        if (isProduction) {
          // In production, reject invalid signatures
          res.status(400).json({ message: 'Invalid signature' });
          return;
        } else {
          // In development, log but continue for testing
          console.warn('[Payment Verification] Invalid signature - continuing for development testing');
        }
      } else {
        console.log('[Payment Verification] Signature verification successful');
      }
    } else {
      console.log('[Payment Verification] No signature provided');
      
      if (isProduction) {
        // In production, require signature
        res.status(400).json({ message: 'Signature required' });
        return;
      } else {
        // In development, allow missing signature for testing
        console.warn('[Payment Verification] No signature provided - continuing for development testing');
      }
    }

    // Verify amount matches
    if (parseFloat(total_amount) !== order.totalAmount) {
      console.error('[Payment Verification] Amount mismatch:', {
        received: total_amount,
        expected: order.totalAmount
      });
      res.status(400).json({ message: 'Amount mismatch' });
      return;
    }

    // Update order status
    order.status = 'COMPLETED';
    order.eSewaRefId = transaction_code;
    await order.save();

    // Reduce stock quantities
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        console.error(`[Payment Verification] Product not found: ${item.productId}`);
        res.status(404).json({ message: `Product not found: ${item.productId}` });
        return;
      }

      // Final stock check
      if (product.stockQuantity < item.quantity) {
        console.error(`[Payment Verification] Insufficient stock for product: ${product.title}`);
        
        // Log stock depletion alert
        monitoringService.logStockDepletion(
          product._id.toString(),
          product.title,
          product.stockQuantity
        );
        
        res.status(400).json({ message: `Insufficient stock for product: ${product.title}` });
        return;
      }

      product.stockQuantity -= item.quantity;
      
      // Log stock depletion if stock is low or depleted
      if (product.stockQuantity <= 5) {
        monitoringService.logStockDepletion(
          product._id.toString(),
          product.title,
          product.stockQuantity
        );
      }
      
      if (product.stockQuantity === 0) {
        product.status = 'out-of-stock';
      }

      await product.save();
    }

    // Log audit event
    logAuditEvent('PAYMENT_VERIFIED', order.userId.toString(), order._id.toString(), {
      transaction_uuid,
      transaction_code,
      total_amount
    });

    // Send confirmation email
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate('items.productId', 'title')
        .populate('userId', 'username email');

      if (populatedOrder && populatedOrder.userId) {
        const orderItems = populatedOrder.items.map((item: any) => ({
          productTitle: item.productId.title,
          quantity: item.quantity,
          price: item.price
        }));

        const emailData = {
          orderId: order._id.toString(),
          customerName: `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}`,
          customerEmail: order.shippingInfo.email,
          orderItems: orderItems,
          totalAmount: order.totalAmount,
          shippingCharge: order.shippingCharge || 0,
          tax: order.tax || 0,
          subtotal: order.amount,
          shippingAddress: order.shippingInfo,
          transactionId: transaction_code,
          orderDate: order.createdAt
        };

        await sendOrderConfirmationEmail(emailData);
      }
    } catch (emailError: any) {
      console.error('[Payment Verification] Email error:', emailError.message);
      // Don't fail the process if email fails
    }

    res.status(200).json({ 
      message: 'Payment verified and stock updated successfully',
      orderId: order._id,
      status: 'COMPLETED'
    });

  } catch (error: any) {
    console.error('[Payment Verification] Error:', error.message);
    
    // Add to dead letter queue for retry
    try {
      if (order && transaction_uuid && total_amount) {
        await deadLetterQueueService.addFailedPayment(
          order._id.toString(),
          order.userId.toString(),
          transaction_uuid,
          parseFloat(total_amount),
          status || 'UNKNOWN',
          error.message,
          transaction_code,
          signature
        );
      }
    } catch (dlqError) {
      console.error('[Payment Verification] Failed to add to DLQ:', dlqError);
    }
    
    res.status(500).json({ message: 'Server error while verifying payment' });
  }
};

/**
 * @desc    Alternative payment verification using eSewa status check API
 * @route   POST /api/orders/verify-payment-status
 * @access  Public
 */
export const verifyPaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // IP whitelist validation for eSewa webhooks
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
  console.log('[Payment Status Check] Client IP:', clientIP);
  
  if (!validateESewaIP(clientIP)) {
    console.error('[Payment Status Check] IP not whitelisted:', clientIP);
    res.status(403).json({ message: 'Access denied - IP not whitelisted' });
    return;
  }

  // Timestamp validation to prevent replay attacks
  const timestamp = req.headers['x-esewa-timestamp'] as string || req.body.timestamp;
  if (!validateRequestTimestamp(timestamp)) {
    console.error('[Payment Status Check] Invalid timestamp or replay attack detected');
    res.status(400).json({ message: 'Invalid timestamp' });
    return;
  }

  try {
    const { transaction_uuid, transaction_code, total_amount } = req.body;

    console.log('[Payment Status Check] Processing:', {
      transaction_uuid,
      transaction_code,
      total_amount
    });

    // Find the order
    const order = await Order.findOne({ transaction_uuid });
    if (!order) {
      console.error('[Payment Status Check] Order not found:', transaction_uuid);
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // In a real implementation, you would call eSewa's status check API here
    // For now, we'll simulate the verification based on the transaction data
    const isPaymentValid = transaction_code && total_amount && 
                          parseFloat(total_amount) === order.totalAmount;

    if (isPaymentValid) {
      // Update order status if not already completed
      if (order.status !== 'COMPLETED') {
        order.status = 'COMPLETED';
        order.eSewaRefId = transaction_code;
        await order.save();

        // Reduce stock quantities
        for (const item of order.items) {
          const product = await Product.findById(item.productId);
          if (product && product.stockQuantity >= item.quantity) {
            product.stockQuantity -= item.quantity;
            if (product.stockQuantity === 0) {
              product.status = 'out-of-stock';
            }
            await product.save();
          }
        }

        // Log audit event
        logAuditEvent('PAYMENT_STATUS_VERIFIED', order.userId.toString(), order._id.toString(), {
          transaction_uuid,
          transaction_code,
          total_amount
        });
      }

      res.json({
        message: 'Payment status verified successfully',
        orderId: order._id,
        status: 'COMPLETED',
        response_code: 0,
        response_message: 'Payment successful'
      });
    } else {
      res.status(400).json({
        message: 'Payment verification failed',
        response_code: 1,
        response_message: 'Invalid payment data'
      });
    }

  } catch (error: any) {
    console.error('[Payment Status Check] Error:', error.message);
    res.status(500).json({ message: 'Server error while verifying payment status' });
  }
}; 