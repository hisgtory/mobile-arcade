/**
 * Customer order generation for DreamStore
 */

import type { ProductType, CustomerOrder } from '../types';

/** Generate a customer order with random products from available types */
export function generateCustomer(productTypes: number, orderSize: number): CustomerOrder {
  const items: ProductType[] = [];
  for (let i = 0; i < orderSize; i++) {
    items.push(Math.floor(Math.random() * productTypes));
  }
  return {
    items,
    fulfilled: new Array(orderSize).fill(false),
  };
}

/** Check if order is fully fulfilled */
export function isOrderComplete(order: CustomerOrder): boolean {
  return order.fulfilled.every(Boolean);
}

/** Try to fulfill an item in the order. Returns the index fulfilled, or -1 if no match. */
export function fulfillItem(order: CustomerOrder, product: ProductType): number {
  for (let i = 0; i < order.items.length; i++) {
    if (!order.fulfilled[i] && order.items[i] === product) {
      order.fulfilled[i] = true;
      return i;
    }
  }
  return -1;
}
