import { CustomError } from '../utils/errorHandler';
import { Product } from '../models/product.model';
import { Province } from '../models/shipping.model';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface OrderValidationRequest {
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  userId: string;
}

export interface OrderValidationResult {
  valid: boolean;
  orderItems?: Array<{
    productId: string;
    quantity: number;
    price: number;
    product: any;
  }>;
  shippingCharge: number;
  subtotal: number;
  totalTaxAmount: number;
  totalAmount: number;
  error?: string;
}

export class ValidationService {
  /**
   * Comprehensive order validation
   */
  static async validateOrderRequest(data: OrderValidationRequest): Promise<OrderValidationResult> {
    try {
      // Basic validation
      if (!data.items || data.items.length === 0) {
        throw new CustomError('Order must contain at least one item', 400);
      }

      if (!data.shippingInfo) {
        throw new CustomError('Shipping information is required', 400);
      }

      // Validate shipping info
      this.validateShippingInfo(data.shippingInfo);

      // Validate items
      const orderItems = await this.validateOrderItems(data.items);

      // Calculate totals
      const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Calculate shipping
      const shippingCharge = await this.calculateShippingCharge(data.shippingInfo.city);
      
      // Calculate tax
      const totalTaxAmount = this.calculateTax(orderItems);
      
      const totalAmount = subtotal + shippingCharge;

      return {
        valid: true,
        orderItems,
        shippingCharge,
        subtotal,
        totalTaxAmount,
        totalAmount
      };

    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Order validation failed', 400);
    }
  }

  /**
   * Validate shipping information
   */
  private static validateShippingInfo(shippingInfo: ShippingInfo): void {
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'province'];
    
    for (const field of requiredFields) {
      if (!shippingInfo[field as keyof ShippingInfo] || 
          typeof shippingInfo[field as keyof ShippingInfo] !== 'string' ||
          shippingInfo[field as keyof ShippingInfo].trim().length === 0) {
        throw new CustomError(`${field} is required`, 400);
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingInfo.email)) {
      throw new CustomError('Invalid email format', 400);
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(shippingInfo.phone.replace(/\s/g, ''))) {
      throw new CustomError('Invalid phone number format', 400);
    }
  }

  /**
   * Validate order items and check stock
   */
  private static async validateOrderItems(items: OrderItem[]): Promise<Array<{
    productId: string;
    quantity: number;
    price: number;
    product: any;
  }>> {
    const validatedItems = [];

    for (const item of items) {
      // Basic item validation
      if (!item.productId || !item.quantity) {
        throw new CustomError('Invalid item data', 400);
      }

      if (item.quantity < 1 || item.quantity > 100) {
        throw new CustomError('Quantity must be between 1 and 100', 400);
      }

      // Check product exists
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new CustomError(`Product not found: ${item.productId}`, 404);
      }

      // Check stock
      if (product.stockQuantity < item.quantity) {
        throw new CustomError(
          `Insufficient stock for ${product.title}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
          400
        );
      }

      const price = product.discountPrice || product.originalPrice;
      validatedItems.push({
        productId: product._id.toString(),
        quantity: item.quantity,
        price,
        product
      });
    }

    return validatedItems;
  }

  /**
   * Calculate shipping charge
   */
  private static async calculateShippingCharge(city: string): Promise<number> {
    const province = await Province.findOne({
      'cities.name': city,
      'cities.isActive': true
    });

    if (province) {
      const cityData = province.cities.find((c: any) => c.name === city && c.isActive);
      if (cityData) {
        return cityData.shippingCharge;
      }
    }

    return 0; // Default shipping charge
  }

  /**
   * Calculate tax from tax-inclusive prices
   */
  private static calculateTax(orderItems: Array<{ product: any; quantity: number }>): number {
    let totalTaxAmount = 0;

    for (const item of orderItems) {
      const effectivePrice = item.product.discountPrice || item.product.originalPrice;
      const basePrice = effectivePrice / (1 + item.product.taxRate);
      const itemTax = effectivePrice - basePrice;
      totalTaxAmount += itemTax * item.quantity;
    }

    return Math.round(totalTaxAmount);
  }
} 