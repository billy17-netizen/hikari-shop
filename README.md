# Hikari Shop

A modern e-commerce platform built with Next.js, PostgreSQL, and Prisma ORM. This project features a complete online shopping experience with secure payment processing via Midtrans gateway.

![Hikari Shop](public/images/hikari-banner.png)

## Features

- **Modern UI/UX** - Clean and responsive design using TailwindCSS and Framer Motion animations
- **User Authentication** - Secure login and registration with NextAuth.js
- **Product Catalog** - Browse products with filtering and sorting capabilities
- **Shopping Cart** - Client-side cart with persistent storage
- **Checkout Process** - Streamlined checkout flow with multiple payment options
- **Payment Integration** - Secure payment processing via Midtrans gateway
- **Order Management** - User dashboard to view order history with status filtering and pagination
- **Admin Dashboard** - Complete admin panel for product, order, and user management
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Payment Processing**: Midtrans
- **Deployment**: Vercel (Frontend/API), Supabase (PostgreSQL)

## Project Structure

```
hikari-shop/
├── app/                 # Next.js app directory
│   ├── api/             # API routes including Midtrans integration
│   ├── product/         # Product pages
│   ├── checkout/        # Checkout and payment processing
│   ├── account/         # User account management
│   ├── admin/           # Admin interface
│   └── components/      # Shared UI components
├── contexts/            # React contexts (cart, auth, etc.)
├── lib/                 # Library code
│   ├── db.ts            # Database client
│   └── utils/           # Utility functions
├── prisma/              # Prisma ORM
│   ├── migrations/      # Database migrations
│   ├── schema.prisma    # Database schema
│   └── sql/             # SQL scripts for seeding
├── public/              # Static assets
├── scripts/             # Utility scripts
│   ├── seed-db.js       # Database seeding script
│   └── check-products.js # Database verification script  
├── types/               # TypeScript type definitions
└── middleware.ts        # Next.js middleware for auth protection
```

## Key Implementation Details

### Payment Processing

The application implements a robust payment flow using Midtrans:

1. Orders are created with "pending" status before payment is initiated
2. Payment processing via Midtrans popup with various payment methods
3. Webhook handling for payment status updates
4. Comprehensive order status tracking (pending, processing, shipped, etc.)

### User Experience

- Animated page transitions and loading states
- Real-time form validation
- Responsive design for all device sizes
- Order filtering and pagination for easy management

## Database Setup

This project uses PostgreSQL database with Prisma ORM. To set up the database:

1. Make sure you have PostgreSQL installed and running on your system.

2. Create a new PostgreSQL database:
   ```
   createdb hikarishop
   ```

3. Set up your environment variables by creating a `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/hikarishop?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
   MIDTRANS_SERVER_KEY="your-midtrans-server-key"
   ```

4. Run migrations to create the database schema:
   ```
   npm run prisma:migrate
   ```

5. Seed the database with initial data:
   ```
   npm run db:seed
   ```

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run db:seed` - Seed the database
- `npm run db:reset` - Reset and reseed the database
- `npm run db:check` - Check database contents

## Deployment

The project is configured for easy deployment on Vercel with PostgreSQL database hosted on Supabase:

1. Create a Supabase project and set up a PostgreSQL database
2. Configure environment variables in your Vercel project
3. Connect your GitHub repository to Vercel for automatic deployments

## API Routes

### Products
- `GET /api/products` - Get all products
- `GET /api/products/[slug]` - Get a single product by slug
- `POST /api/products` - Create a new product (admin only)
- `PUT /api/products/[id]` - Update a product (admin only)
- `DELETE /api/products/[id]` - Delete a product (admin only)

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders` - Create a new order
- `PUT /api/orders/[id]` - Update order status (admin only)

### Payments
- `POST /api/midtrans` - Initialize Midtrans payment
- `POST /api/midtrans/notification` - Handle Midtrans webhooks

## License

This project is licensed under the MIT License. 