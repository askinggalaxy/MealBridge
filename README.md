# MealBridge - Food Sharing Platform

MealBridge is a community-driven platform that connects food donors with recipients to reduce food waste and support local communities.

## Features

- **User Authentication**: Email OTP and password-based authentication
- **Role-based Access**: Donors, recipients, NGOs, and admins
- **Food Donations**: Create listings with photos, location, and pickup details
- **Interactive Map**: Discover nearby food donations with filtering
- **Reservation System**: Request and manage food pickups
- **Real-time Messaging**: Chat between donors and recipients
- **Reputation System**: Rate users after successful pickups
- **Safety Guidelines**: Comprehensive food safety information
- **Moderation Tools**: Flag content and manage community safety

## Tech Stack

- **Frontend**: Next.js 13+ with TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: react-hook-form + zod validation
- **Maps**: Leaflet with OpenStreetMap
- **Images**: Supabase Storage with client-side compression

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account

### 1. Clone and Install

```bash
git clone <repository-url>
cd mealbridge
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard:
   - Go to Settings > API to get your project URL and anon key
   - Go to Storage and create a new bucket called `donation-images` (make it public)
   - Go to SQL Editor and run the migration file from `supabase/migrations/create_mealbridge_schema.sql`

### 3. Environment Variables

Create `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Database Schema

The application uses the following main tables:

- `profiles` - User profiles with location and reputation
- `categories` - Food categories (bread, dairy, produce, etc.)
- `donations` - Food donation listings
- `reservations` - Pickup requests and confirmations
- `messages` - Chat messages between users
- `ratings` - Post-pickup feedback
- `notifications` - System notifications
- `flags` - Content and user reports

## Key Features

### For Donors
- Create detailed food listings with photos
- Manage pickup windows and locations
- Accept/decline reservation requests
- Chat with potential recipients
- Track donation history and reputation

### For Recipients
- Discover food donations on interactive map
- Filter by distance, category, and expiry
- Request reservations with personal messages
- Navigate to pickup locations
- Rate donors after successful pickups

### For NGOs/Moderators
- Review flagged content and users
- Hide inappropriate donations
- Manage community safety
- Access platform statistics

## Safety & Guidelines

The platform includes comprehensive safety guidelines covering:
- Recommended foods (sealed, non-perishable items)
- Foods requiring extra care (cooked meals, dairy)
- Prohibited items (raw meat, expired foods)
- Pickup etiquette and safety tips

## Future Enhancements

- Mobile app (React Native/Flutter)
- Integration with delivery services
- Advanced geolocation with PostGIS
- Push notifications
- Donation analytics and reporting
- Multi-language support
- NGO partnership features

## Contributing

1. Follow the established code structure and patterns
2. Ensure all new tables have proper RLS policies
3. Test thoroughly with different user roles
4. Update documentation for new features

## License

[License information to be added]