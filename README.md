# Multi-Tenant SaaS Notes Application

A production-ready multi-tenant SaaS application built with Next.js, featuring tenant isolation, subscription management, and role-based access control.

## Multi-Tenancy Approach

This application uses a **shared schema with tenant isolation** approach:
- Single database with all tenant data
- Each table includes a `tenant_id` column for isolation
- Application-level tenant filtering ensures data separation
- JWT tokens include tenant information for request-level isolation

### Benefits of This Approach:
- Cost-effective (single database)
- Easy to maintain and backup
- Simple cross-tenant analytics
- Efficient resource utilization

## Architecture

- **Backend**: Next.js API Routes with Supabase PostgreSQL
- **Frontend**: Next.js with React and Tailwind CSS
- **Authentication**: JWT-based with role and tenant isolation
- **Database**: PostgreSQL with Row Level Security (RLS)

## Seeded Test Accounts

All accounts use password: `password`

| Email | Role | Tenant | Plan |
|-------|------|--------|------|
| admin@acme.test | Admin | acme | Free |
| user@acme.test | Member | acme | Free |
| admin@globex.test | Admin | globex | Free |
| user@globex.test | Member | globex | Free |

## Features

### Authentication & Authorization
- JWT-based login system
- Role-based access control (Admin/Member)
- Tenant isolation at the token level

### Subscription Plans
- **Free Plan**: Maximum 3 notes per tenant
- **Pro Plan**: Unlimited notes
- Admin-only subscription upgrades

### Notes Management
- Create, read, update, delete notes
- Tenant isolation (users only see their tenant's notes)
- Subscription plan enforcement

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login

#### Health Check
- `GET /api/health` - Application health status

#### Notes
- `POST /api/notes` - Create note
- `GET /api/notes` - List tenant notes
- `GET /api/notes/[id]` - Get specific note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

#### Tenant Management
- `POST /api/tenants/[slug]/upgrade` - Upgrade tenant to Pro (Admin only)

## Local Development

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Click "Connect to Supabase" in the top right
   - The database will be automatically configured

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## Database Schema

### Tenants Table
- `id`: UUID primary key
- `slug`: Unique tenant identifier (e.g., 'acme', 'globex')
- `name`: Display name
- `plan`: Subscription plan ('free' or 'pro')

### Users Table
- `id`: UUID primary key
- `email`: User email (unique)
- `password_hash`: Encrypted password
- `role`: User role ('admin' or 'member')
- `tenant_id`: Foreign key to tenants table

### Notes Table
- `id`: UUID primary key
- `title`: Note title
- `content`: Note content
- `user_id`: Foreign key to users table
- `tenant_id`: Foreign key to tenants table (for tenant isolation)

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Supabase environment variables will be automatically configured
3. Deploy with automatic builds on push

### Environment Variables
The following are automatically configured with Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Security Features

- JWT token validation on all protected routes
- Tenant isolation enforced at database and application level
- Row Level Security (RLS) policies in Supabase
- Password hashing with bcryptjs
- CORS configuration for external API access
- Input validation and sanitization

## API Testing

Use tools like Postman or curl to test the API:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'

# Create note (with JWT token)
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Test Note","content":"Note content"}'
```

## Technology Stack

- **Framework**: Next.js 13+
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel