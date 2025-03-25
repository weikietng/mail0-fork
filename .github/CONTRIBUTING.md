# Contributing to 0.email

Thank you for your interest in contributing to 0.email! We're excited to have you join our mission to create an open-source email solution that prioritizes privacy, transparency, and user empowerment.

## Table of Contents

- [Contributing to 0.email](#contributing-to-0email)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Development Workflow](#development-workflow)
  - [Database Management](#database-management)
  - [Coding Guidelines](#coding-guidelines)
    - [General Principles](#general-principles)
    - [JavaScript/TypeScript Guidelines](#javascripttypescript-guidelines)
    - [React Guidelines](#react-guidelines)
  - [Internationalization (i18n)](#internationalization-i18n)
  - [Testing](#testing)
  - [Documentation](#documentation)
  - [Areas of Contribution](#areas-of-contribution)
  - [Community](#community)
  - [Questions or Need Help?](#questions-or-need-help)

## Getting Started

1. **Fork the Repository**
   - Click the 'Fork' button at the top right of this repository
   - Clone your fork locally: `git clone https://github.com/YOUR-USERNAME/Zero.git`

2. **Set Up Development Environment**
   - Install [Bun](https://bun.sh)
   - Clone the repository and install dependencies: `bun install`
   - Start the database locally: `bun docker:up`
   - Copy `.env.example` to `.env` in both `apps/mail` and `packages/db` folders
   - Set up your Google OAuth credentials (see [README.md](../README.md))
   - Install database dependencies: `bun db:dependencies`
   - Initialize the database: `bun db:push`

## Development Workflow

1. **Start the Development Environment**

   ```bash
   # Start database locally
   bun docker:up
   
   # Start the development server
   bun dev
   ```

2. **Create a New Branch**

   Always create a new branch for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Your Changes**

   - Write clean, maintainable code
   - Follow our coding standards
   - Add/update tests as needed
   - Update documentation if required

4. **Test Your Changes**

   - Make sure the app runs without errors
   - Test your feature thoroughly

5. **Commit Your Changes**

   - Use clear, descriptive commit messages
   - Reference issues and pull requests

   ```bash
   git commit -m "feat: add new email threading feature

   Implements #123"
   ```

6. **Stay Updated**

   Keep your fork in sync with the main repository:

   ```bash
   git fetch upstream
   git merge upstream/main
   ```

7. **Push to Your Fork**

   ```bash
   git push origin your-branch-name
   ```

8. **Submit a Pull Request**
   - Go to your fork on GitHub and click "New Pull Request"
   - Fill out the PR template completely
   - Link any relevant issues
   - Add screenshots for UI changes

## Database Management

Zero uses PostgreSQL with Drizzle ORM. Here's how to work with it:

1. **Database Structure**

   The database schema is defined in the `packages/db/src` directory.

2. **Common Database Tasks**

   ```bash
   # Install database dependencies
   bun db:dependencies
   
   # Apply schema changes to development database
   bun db:push
   
   # Create migration files after schema changes
   bun db:generate
   
   # Apply migrations (for production)
   bun db:migrate
   
   # View and edit data with Drizzle Studio
   bun db:studio
   ```

3. **Database Connection**

   Make sure your database connection string is in both:
   - `apps/mail/.env`
   - `packages/db/.env`

   For local development:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zerodotemail"
   ```

4. **Troubleshooting**

   - **Connection Issues**: Make sure Docker is running
   - **Schema Errors**: Check your schema files for errors

## Coding Guidelines

### General Principles

- Write clean, readable, and maintainable code
- Follow existing code style and patterns
- Keep functions small and focused
- Use meaningful variable and function names
- Comment complex logic, but write self-documenting code where possible

### JavaScript/TypeScript Guidelines

- Use TypeScript for new code
- Follow ESLint and Prettier configurations
- Use async/await for asynchronous operations
- Properly handle errors and edge cases
- Use proper TypeScript types and interfaces
- Do not use the `any` type. We will enforce strict `"no-explicit-any"` in the future
- Ensure all code passes type checking, as builds will check for types in the future

### React Guidelines

- Use functional components and hooks
- Keep components small and focused
- Use proper prop types/TypeScript interfaces
- Follow React best practices for performance
- Implement responsive design principles

## Internationalization (i18n)

0.email supports multiple languages through our internationalization (i18n) system. This makes our application accessible to users worldwide. As a contributor, you play a key role in making new features available in all supported languages.

### Adding Translations for New Features

When implementing new features, follow these guidelines:

1. **Add English Source Strings**
   - Place all user-facing text in `apps/mail/locales/en.json`
   - Organize strings according to the existing structure
   - Use descriptive, hierarchical keys that identify the feature and context
   - Example: `"pages.settings.connections.disconnectSuccess": "Account disconnected successfully"`

2. **Follow i18n Formatting Standards**
   - Variables: `{variableName}` 
   - Pluralization: `{count, plural, =0 {items} one {item} other {items}}`
   - Avoid string concatenation to ensure proper translation

3. **Quality Checklist**
   - All visible UI text is externalized (not hardcoded)
   - Strings are organized in logical sections
   - Context is clear for translators
   - The feature works properly with the default language

For more details about our translation process and how translators contribute, see [TRANSLATION.md](../TRANSLATION.md).

## Testing

- Write unit tests for new features
- Update existing tests when modifying features
- Ensure all tests pass before submitting PR
- Include integration tests for complex features
- Test edge cases and error scenarios

## Documentation

- Update README.md if needed
- Document new features and APIs
- Include JSDoc comments for functions
- Update API documentation
- Add comments for complex logic

## Areas of Contribution

- 📨 Email Integration Features
- 🎨 UI/UX Improvements
- 🔒 Security Enhancements
- ⚡ Performance Optimizations
- 📝 Documentation
- 🐛 Bug Fixes
- ✨ New Features
- 🧪 Testing

## Community

- Join our discussions in GitHub Issues
- Help others in the community
- Share your ideas and feedback
- Be respectful and inclusive
- Follow our Code of Conduct

## Questions or Need Help?

If you have questions or need help, you can:

1. Check our documentation
2. Open a GitHub issue
3. Join our community discussions

---

Thank you for contributing to 0.email! Your efforts help make email more open, private, and user-centric. 🚀
