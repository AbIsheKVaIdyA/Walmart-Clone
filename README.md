# Walmart Clone - E-Commerce Application

A full-stack e-commerce application built with Next.js 14, featuring secure authentication, product search, shopping cart, and payment processing. The application implements OWASP security best practices including CSRF protection, rate limiting, and input validation.

## 🚀 Features

### Core Features
- ✅ **Product Browsing**: Browse products with search functionality
- ✅ **Shopping Cart**: Add/remove items from cart with persistent storage
- ✅ **User Authentication**: Secure login and signup with JWT tokens
- ✅ **Admin Panel**: Admin dashboard for managing the application
- ✅ **Payment Processing**: Secure payment processing with encryption
- ✅ **Responsive Design**: Mobile-first responsive UI built with Tailwind CSS

### Security Features (OWASP Best Practices)
- ✅ **CSRF Protection**: Double-submit cookie pattern to prevent cross-site request forgery
- ✅ **Rate Limiting**: Prevents brute-force attacks (5 login attempts per 15 minutes)
- ✅ **Input Validation & Sanitization**: XSS prevention through HTML entity encoding
- ✅ **Security Headers**: HSTS, X-Frame-Options, Content-Type-Options, and more
- ✅ **Secure Authentication**: JWT tokens with httpOnly cookies
- ✅ **Password Hashing**: bcrypt for secure password storage
- ✅ **Data Encryption**: Sensitive data encrypted before storage

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **HTTP Client**: Fetch API

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm** or **yarn** or **pnpm**
- **Supabase Account** (for database)

## 🔧 Installation

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd walmart-clone
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Next.js and React
- TypeScript
- Tailwind CSS
- Supabase client
- Authentication libraries
- UI components

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your_jwt_secret_key_min_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_min_32_characters

# Encryption Key (32 character hex string)
ENCRYPTION_KEY=your_32_character_hex_encryption_key
```

**How to get Supabase credentials:**
1. Go to [Supabase](https://supabase.com) and create a project
2. Go to Project Settings → API
3. Copy the `URL` and `anon public` key
4. Copy the `service_role` key (keep this secret!)

**How to generate JWT secrets:**
```bash
# Generate random secrets (32+ characters recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**How to generate encryption key:**
```bash
# Generate 32 character hex string
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Step 4: Set Up Database

The application uses Supabase (PostgreSQL). Make sure your Supabase project is set up with the required tables. Check the database schema in your Supabase dashboard.

### Step 5: Create Admin User (Optional)

To create an admin user, run:

```bash
node scripts/createAdminSimple.js
```

Follow the prompts to create an admin account.

## 🚀 Running the Project

### Development Mode

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

Open your browser and navigate to the URL to see the application.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
walmart-clone/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   │   ├── login/        # Login endpoint
│   │   │   ├── signup/       # Signup endpoint
│   │   │   ├── logout/       # Logout endpoint
│   │   │   └── refresh/      # Token refresh endpoint
│   │   ├── csrf-token/       # CSRF token endpoint
│   │   └── payment/          # Payment processing
│   ├── admin/                # Admin dashboard
│   ├── basket/               # Shopping cart page
│   ├── product/              # Product detail page
│   └── search/               # Search results page
├── components/              # React components
│   ├── auth/                 # Authentication components
│   ├── ui/                   # Reusable UI components
│   └── ...                   # Other components
├── lib/                      # Utility libraries
│   ├── auth/                 # Authentication utilities
│   │   ├── cookies.ts        # Cookie management
│   │   ├── db.ts             # Database operations
│   │   ├── jwt.ts            # JWT token handling
│   │   ├── password.ts       # Password hashing
│   │   └── middleware.ts    # Auth middleware
│   ├── security/             # Security utilities
│   │   ├── csrf.ts           # CSRF protection
│   │   ├── csrfClient.ts     # Client-side CSRF
│   │   ├── rateLimit.ts      # Rate limiting
│   │   └── validation.ts    # Input validation
│   ├── supabase/             # Supabase client
│   └── ...                   # Other utilities
├── store/                    # Zustand state management
├── typings/                  # TypeScript type definitions
├── middleware.ts             # Next.js middleware (security)
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🔒 Security Implementation

### CSRF Protection
- **Implementation**: Double-submit cookie pattern
- **Location**: `lib/security/csrf.ts`
- **How it works**: Token stored in httpOnly cookie and validated against header token

### Rate Limiting
- **Implementation**: In-memory sliding window
- **Location**: `lib/security/rateLimit.ts`
- **Limits**:
  - Login: 5 attempts per 15 minutes
  - Signup: 3 attempts per hour
  - API: 100 requests per 15 minutes

### Input Validation
- **Implementation**: Server-side validation and sanitization
- **Location**: `lib/security/validation.ts`
- **Features**: Email validation, XSS prevention, password strength checking

### Security Headers
- **Implementation**: Middleware adds security headers
- **Location**: `middleware.ts`
- **Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, etc.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Security
- `GET /api/csrf-token` - Get CSRF token

### Payment
- `POST /api/payment/process` - Process payment

## 🧪 Testing Security Features

### Test CSRF Protection
```bash
# This should fail (403 Forbidden)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### Test Rate Limiting
```bash
# Make 6 login attempts quickly
# The 6th attempt should return 429 Too Many Requests
```

### Test Input Validation
```bash
# Try injecting script in email field
# Should be rejected or sanitized
```

## 🚨 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Make sure `.env.local` file exists with all required variables.

### Issue: "CSRF token not found"
**Solution**: Ensure you're including the CSRF token in request headers. The token is automatically fetched when the login dialog opens.

### Issue: "Rate limit exceeded"
**Solution**: Wait for the rate limit window to expire (15 minutes for login, 1 hour for signup).

### Issue: Port 3000 already in use
**Solution**: 
```bash
# Use a different port
npm run dev -- -p 3001
```

## 📚 Additional Documentation

- **Security Setup**: See `SECURITY_SETUP.md` (if exists)
- **Database Security**: See `DATABASE_SECURITY_GUIDE.md` (if exists)
- **Data Transmission**: See `DATA_TRANSMISSION_SECURITY.md` (if exists)
- **Validation Guide**: See `VALIDATION_GUIDE.md` (if exists)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👨‍💻 Development Notes

- The application uses Next.js 14 App Router
- All API routes are server-side only
- Authentication uses JWT tokens stored in httpOnly cookies
- Security features are implemented following OWASP best practices
- The codebase is fully typed with TypeScript

## 🔐 Security Best Practices

- Never commit `.env.local` file
- Use strong, unique secrets for JWT and encryption
- Regularly update dependencies
- Monitor for security vulnerabilities
- Use HTTPS in production
- Keep Supabase service role key secret

---

**Built with ❤️ using Next.js and TypeScript**
