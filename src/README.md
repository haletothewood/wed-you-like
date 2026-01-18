# Source Architecture

This project follows **Hexagonal Architecture** (Ports & Adapters pattern) to maintain clean separation of concerns.

## Directory Structure

```
src/
├── domain/              # Core business logic (framework-agnostic)
│   ├── entities/        # Domain entities (Guest, Invite, RSVP, etc.)
│   ├── value-objects/   # Immutable domain types (Email, Token, etc.)
│   ├── repositories/    # Repository interfaces (Ports)
│   └── services/        # Domain services (business rules)
│
├── application/         # Application use cases
│   ├── use-cases/       # Orchestration of domain logic
│   └── dtos/            # Data transfer objects
│
└── infrastructure/      # External adapters
    ├── database/        # Database implementations (SQLite + Drizzle)
    ├── email/           # Email service implementations (Resend)
    └── http/            # HTTP adapters (API controllers)
```

## Key Principles

1. **Domain Layer**: Pure business logic, no framework dependencies
2. **Application Layer**: Orchestrates domain objects to fulfill use cases
3. **Infrastructure Layer**: Implements technical details (database, email, APIs)

## Dependency Rule

Dependencies point inward:
- Infrastructure → Application → Domain
- Domain has NO dependencies on outer layers
- Application depends only on Domain
- Infrastructure can depend on both Application and Domain

## Testing Strategy

- **Unit Tests**: Domain and Application layers (no infrastructure)
- **Integration Tests**: Infrastructure layer (with real databases/services)
- **E2E Tests**: Full application flow

## TDD Workflow

1. Write a failing test (Red)
2. Write minimum code to pass (Green)
3. Refactor for clarity (Refactor)
4. Repeat
