import mongoose from 'mongoose';
import { monitoringService } from './monitoring.service';

export interface FailedPayment {
  _id?: string;
  orderId: string;
  userId: string;
  transaction_uuid: string;
  transaction_code?: string;
  total_amount: number;
  status: string;
  signature?: string;
  error: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Create schema for failed payments
const failedPaymentSchema = new mongoose.Schema<FailedPayment>({
  orderId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  transaction_uuid: { type: String, required: true, unique: true },
  transaction_code: { type: String },
  total_amount: { type: Number, required: true },
  status: { type: String, required: true },
  signature: { type: String },
  error: { type: String, required: true },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  nextRetryAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes for efficient querying
failedPaymentSchema.index({ nextRetryAt: 1 });
failedPaymentSchema.index({ retryCount: 1 });
failedPaymentSchema.index({ status: 1 });

const FailedPaymentModel = mongoose.model<FailedPayment>('FailedPayment', failedPaymentSchema);

class DeadLetterQueueService {
  private isProcessing = false;
  private retryIntervals: number[] = [5, 15, 60]; // Minutes between retries

  constructor() {
    // Start processing failed payments every minute
    setInterval(() => {
      this.processFailedPayments();
    }, 60000);
  }

  /**
   * Add a failed payment to the dead letter queue
   */
  async addFailedPayment(
    orderId: string,
    userId: string,
    transaction_uuid: string,
    total_amount: number,
    status: string,
    error: string,
    transaction_code?: string,
    signature?: string
  ): Promise<void> {
    try {
      const nextRetryAt = new Date(Date.now() + this.retryIntervals[0] * 60 * 1000);

      const failedPayment = new FailedPaymentModel({
        orderId,
        userId,
        transaction_uuid,
        transaction_code,
        total_amount,
        status,
        signature,
        error,
        retryCount: 0,
        maxRetries: 3,
        nextRetryAt
      });

      await failedPayment.save();

      console.log(`[DLQ] Added failed payment to queue: ${transaction_uuid}`);
      
      // Log monitoring event
      monitoringService.logPaymentFailure(orderId, userId, {
        error,
        transaction_uuid,
        status,
        queued: true
      });

    } catch (error) {
      console.error('[DLQ] Error adding failed payment to queue:', error);
    }
  }

  /**
   * Process failed payments that are ready for retry
   */
  private async processFailedPayments(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      
      // Find failed payments ready for retry
      const failedPayments = await FailedPaymentModel.find({
        nextRetryAt: { $lte: now },
        retryCount: { $lt: 3 }
      }).limit(10); // Process 10 at a time

      console.log(`[DLQ] Processing ${failedPayments.length} failed payments`);

      for (const failedPayment of failedPayments) {
        await this.retryPayment(failedPayment);
      }

    } catch (error) {
      console.error('[DLQ] Error processing failed payments:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retry a failed payment
   */
  private async retryPayment(failedPayment: FailedPayment): Promise<void> {
    try {
      console.log(`[DLQ] Retrying payment: ${failedPayment.transaction_uuid} (attempt ${failedPayment.retryCount + 1})`);

      // Import here to avoid circular dependencies
      const { Order } = await import('../models/order.model');
      const { Product } = await import('../models/product.model');
      const { sendOrderConfirmationEmail } = await import('./email.service');

      try {
        // Find the order
        const order = await Order.findOne({ transaction_uuid: failedPayment.transaction_uuid });
        
        if (!order) {
          throw new Error('Order not found');
        }

        // Check if order was already processed
        if (order.status === 'COMPLETED') {
          // Remove from failed payments queue
          await FailedPaymentModel.findByIdAndDelete(failedPayment._id);
          console.log(`[DLQ] Payment already completed, removed from queue: ${failedPayment.transaction_uuid}`);
          return;
        }

        // Verify payment status with eSewa (you would implement this)
        const paymentStatus = await this.verifyPaymentWithESewa(failedPayment);
        
        if (paymentStatus.status === 'COMPLETE') {
          // Update order status
          order.status = 'COMPLETED';
          order.eSewaRefId = paymentStatus.transaction_code;
          await order.save();

          // Reduce stock quantities
          for (const item of order.items) {
            const product = await Product.findById(item.productId);
            
            if (!product) {
              throw new Error(`Product not found: ${item.productId}`);
            }

            if (product.stockQuantity < item.quantity) {
              throw new Error(`Insufficient stock for product: ${product.title}`);
            }

            product.stockQuantity -= item.quantity;
            
            if (product.stockQuantity === 0) {
              product.status = 'out-of-stock';
            }

            await product.save();
          }

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
                transactionId: paymentStatus.transaction_code,
                orderDate: order.createdAt
              };

              await sendOrderConfirmationEmail(emailData);
            }
          } catch (emailError: any) {
            console.error('[DLQ] Email error:', emailError.message);
          }

          // Remove from failed payments queue
          await FailedPaymentModel.findByIdAndDelete(failedPayment._id);
          
          console.log(`[DLQ] Payment retry successful: ${failedPayment.transaction_uuid}`);
          
          // Log success
          monitoringService.logEvent({
            type: 'PAYMENT_FAILURE',
            severity: 'LOW',
            message: `Payment retry successful for order ${failedPayment.orderId}`,
            details: { transaction_uuid: failedPayment.transaction_uuid, retryCount: failedPayment.retryCount },
            orderId: failedPayment.orderId,
            userId: failedPayment.userId
          });

        } else {
          throw new Error(`Payment not complete: ${paymentStatus.status}`);
        }

      } catch (error: any) {
        throw error;
      }

    } catch (error: any) {
      console.error(`[DLQ] Retry failed for ${failedPayment.transaction_uuid}:`, error.message);
      
      // Update retry count and next retry time
      const nextRetryIndex = Math.min(failedPayment.retryCount, this.retryIntervals.length - 1);
      const nextRetryMinutes = this.retryIntervals[nextRetryIndex];
      const nextRetryAt = new Date(Date.now() + nextRetryMinutes * 60 * 1000);

      await FailedPaymentModel.findByIdAndUpdate(failedPayment._id, {
        $inc: { retryCount: 1 },
        nextRetryAt,
        error: error.message,
        updatedAt: new Date()
      });

      // If max retries reached, log as permanent failure
      if (failedPayment.retryCount >= failedPayment.maxRetries) {
        console.log(`[DLQ] Max retries reached for payment: ${failedPayment.transaction_uuid}`);
        
        monitoringService.logEvent({
          type: 'PAYMENT_FAILURE',
          severity: 'CRITICAL',
          message: `Payment permanently failed after ${failedPayment.maxRetries} retries`,
          details: { 
            transaction_uuid: failedPayment.transaction_uuid, 
            retryCount: failedPayment.retryCount,
            finalError: error.message 
          },
          orderId: failedPayment.orderId,
          userId: failedPayment.userId
        });
      }
    }
  }

  /**
   * Verify payment with eSewa (placeholder - implement actual eSewa verification)
   */
  private async verifyPaymentWithESewa(failedPayment: FailedPayment): Promise<any> {
    // This is a placeholder - you would implement actual eSewa verification here
    // For now, we'll simulate a successful verification
    
    return {
      status: 'COMPLETE',
      transaction_code: failedPayment.transaction_code || `RETRY_${Date.now()}`,
      transaction_uuid: failedPayment.transaction_uuid
    };
  }

  /**
   * Get failed payments statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    maxRetriesReached: number;
    processing: number;
  }> {
    const [total, pending, maxRetriesReached, processing] = await Promise.all([
      FailedPaymentModel.countDocuments(),
      FailedPaymentModel.countDocuments({ retryCount: { $lt: 3 } }),
      FailedPaymentModel.countDocuments({ retryCount: { $gte: 3 } }),
      FailedPaymentModel.countDocuments({ 
        nextRetryAt: { $lte: new Date() },
        retryCount: { $lt: 3 }
      })
    ]);

    return {
      total,
      pending,
      maxRetriesReached,
      processing
    };
  }

  /**
   * Manually retry a specific failed payment
   */
  async manualRetry(transaction_uuid: string): Promise<void> {
    const failedPayment = await FailedPaymentModel.findOne({ transaction_uuid });
    
    if (!failedPayment) {
      throw new Error('Failed payment not found');
    }

    if (failedPayment.retryCount >= failedPayment.maxRetries) {
      throw new Error('Max retries already reached');
    }

    // Reset retry count and set immediate retry
    failedPayment.retryCount = 0;
    failedPayment.nextRetryAt = new Date();
    await failedPayment.save();

    console.log(`[DLQ] Manual retry triggered for: ${transaction_uuid}`);
  }

  /**
   * Clear old failed payments (older than 30 days)
   */
  async clearOldFailedPayments(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await FailedPaymentModel.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });

    console.log(`[DLQ] Cleared ${result.deletedCount} old failed payments`);
    return result.deletedCount || 0;
  }
}

export const deadLetterQueueService = new DeadLetterQueueService(); 