# Midtrans Payment Integration Setup

This document provides instructions for setting up and testing the Midtrans payment gateway integration in the Hikari Shop application.

## Prerequisites

1. A Midtrans account (you can sign up at [https://midtrans.com/](https://midtrans.com/))
2. Access to Midtrans Sandbox Dashboard
3. Node.js and npm installed on your development environment

## Configuration Steps

### 1. Get Midtrans API Keys

1. Log in to your Midtrans Dashboard (Sandbox for testing)
2. Navigate to Settings > Access Keys
3. Note down your Client Key and Server Key

### 2. Set Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Midtrans Payment Gateway
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxx
MIDTRANS_PRODUCTION=false

# App URL for callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the placeholder keys with your actual Midtrans API keys from the dashboard.

### 3. Setting Up Webhook Notifications

To receive real-time payment status updates:

1. In your Midtrans Dashboard, go to Settings > Configuration
2. Under "Payment Notification URL", enter your webhook URL:
   - For local development: Use a service like ngrok to create a public URL that forwards to your local server
   - For production: `https://your-domain.com/api/midtrans/notification`
3. Save your settings

### 4. Testing the Integration

#### Local Testing with Midtrans Simulator

1. Start your application locally (`npm run dev`)
2. Go through the checkout process and select the Midtrans payment option
3. After creating an order, you should be redirected to the Midtrans payment page
4. Use the test card details provided in the Midtrans documentation:
   - Card Number: `4811 1111 1111 1114`
   - CVV: Any 3 digits
   - Expiry Date: Any future date
   - 3D Secure OTP: `112233`

#### Testing Webhook Notifications

1. Create a test transaction using the Midtrans Simulator in your dashboard
2. Fill in the required fields:
   - Order ID: A unique identifier
   - Payment Type: Credit Card, Bank Transfer, etc.
   - Gross Amount: Transaction amount
3. Submit the test transaction
4. Check your server logs to verify the notification was received and processed

## Implementation Details

### Key Files

- `app/api/midtrans/config.js`: Midtrans API configuration
- `app/api/midtrans/route.js`: API route for creating Midtrans transactions
- `app/api/midtrans/notification/route.js`: Webhook endpoint for notifications
- `app/checkout/components/MidtransPayment.jsx`: Client-side component for Midtrans integration
- `app/checkout/components/PaymentForm.tsx`: Form with Midtrans payment option
- `app/checkout/page.tsx`: Main checkout page handling the payment flow

### Transaction Flow

1. User selects Midtrans payment method during checkout
2. Order is created in the database with "awaiting_payment" status
3. Client requests a transaction token from the server
4. The Midtrans Snap popup is displayed for payment selection
5. User completes payment on the Midtrans side
6. Midtrans sends notification to the webhook URL
7. Order status is updated based on payment result

## Troubleshooting

### Common Issues

1. **Payment Popup Not Appearing**
   - Check browser console for errors
   - Verify the client key is correctly set
   - Ensure the Snap.js script is loading properly

2. **Webhook Notifications Not Working**
   - Verify the notification URL is correctly set in the Midtrans dashboard
   - Ensure your server is accessible from the internet
   - Check server logs for any errors processing notifications

3. **Invalid Transaction Errors**
   - Verify all required fields are passed correctly
   - Ensure the gross amount is a valid number
   - Check that the order ID is unique for each transaction

## Additional Resources

- [Midtrans API Documentation](https://docs.midtrans.com/)
- [Midtrans Node.js Client Library](https://github.com/midtrans/midtrans-nodejs-client)
- [Midtrans Testing Guide](https://docs.midtrans.com/en/technical-reference/testing-payment) 