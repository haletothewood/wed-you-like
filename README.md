# Wedding Invite Application

A full-stack wedding invite management system built with Next.js, TypeScript, Drizzle ORM, and SQLite.

## Features (Planned)

- **Admin Dashboard**: Manage invites, guests, and settings
- **Email Invites**: Send personalized invites with unique RSVP links
- **RSVP Management**: Guests respond with meal preferences and custom questions
- **Table Assignments**: Drag-and-drop interface for seating arrangements
- **Meal Options**: Configure 3-course meal options
- **Custom Questions**: Add custom questions for guests (favorite memory, drink preference, etc.)
- **Email Templates**: Customizable invite and thank you emails with hero images

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Drizzle ORM
- **Email**: Resend
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier

## Architecture

Following **Hexagonal Architecture** (Ports & Adapters):

```
src/
├── domain/              # Core business logic
│   ├── entities/        # Domain entities
│   ├── value-objects/   # Immutable domain types
│   ├── repositories/    # Repository interfaces
│   └── services/        # Domain services
├── application/         # Use cases
│   ├── use-cases/       # Application logic
│   └── dtos/            # Data transfer objects
└── infrastructure/      # External adapters
    ├── database/        # Drizzle + SQLite
    ├── email/           # Resend integration
    └── http/            # API controllers
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env` and configure:

```env
RESEND_API_KEY=your_resend_api_key
DATABASE_URL=file:./wedding.db
NODE_ENV=development
```

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

### Database Management

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

## Project Status

✅ **Phase 1 Complete**: Project setup with Next.js, database schema, and testing framework

**Next Steps**:
- Phase 2: Domain model design with TDD
- Phase 3: Database repositories
- Phase 4: API routes for invite management
- Phase 5: Email configuration APIs
- Phase 6: RSVP and table management APIs
- Phase 7: Email service integration
- Phase 8: Admin dashboard UI
- Phase 9: Public RSVP page
- Phase 10: Table management UI

## Development Principles

This project follows **Software Craftsmanship** principles:

- **TDD**: Red-Green-Refactor workflow
- **SOLID**: Clean architecture with clear boundaries
- **Clean Code**: Expressive naming, no comments, small functions
- **Hexagonal Architecture**: Domain-first design

## License

Private project
