import { prisma } from '../lib/prisma';

/**
 * Script to update existing orders with a payment status
 * Run with: npx ts-node scripts/update-payment-status.ts
 */
async function main() {
  console.log('Starting payment status update...');
  
  try {
    const orders = await prisma.order.findMany();
    console.log(`Found ${orders.length} orders to update`);
    
    for (const order of orders) {
      let paymentStatus = 'unpaid'; // Default
      
      // Use similar logic to our UI function to determine payment status
      if (order.status === 'cancelled') {
        paymentStatus = 'unpaid';
      } else if (order.paymentMethod === 'credit_card' || order.paymentMethod === 'midtrans') {
        paymentStatus = 'paid';
      } else if (order.paymentMethod === 'Bank Transfer' && 
                (order.status === 'processing' || order.status === 'completed')) {
        paymentStatus = 'paid';
      } else if (order.paymentMethod === 'cod' && order.status === 'completed') {
        paymentStatus = 'paid';
      } else if (['processing', 'completed', 'shipped', 'delivered'].includes(order.status)) {
        // If order status indicates order is being processed, payment should be paid
        paymentStatus = 'paid';
      }
      
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus }
      });
      
      console.log(`Updated order ${order.id}: ${paymentStatus}`);
    }
    
    console.log('Payment status update completed!');
  } catch (error) {
    console.error('Error updating payment status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 