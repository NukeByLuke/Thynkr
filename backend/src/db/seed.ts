import bcrypt from 'bcryptjs';
import prisma from './client';
import { logger } from '../lib/logger';
import seedCoursesWithInternalFiles from './seed-courses-internal';

async function seed() {
  try {
    logger.info('Starting database seed...');

    // Create test users
    const testUsers = [
      {
        email: 'basic@test.local',
        username: 'basicuser',
        password: 'Password123!',
        firstName: 'Basic',
        lastName: 'User',
        role: 'BASIC' as const,
        emailVerified: true,
      },
      {
        email: 'standard@test.local',
        username: 'standarduser',
        password: 'Password123!',
        firstName: 'Standard',
        lastName: 'User',
        role: 'STANDARD' as const,
        emailVerified: true,
      },
      {
        email: 'premium@test.local',
        username: 'premiumuser',
        password: 'Password123!',
        firstName: 'Premium',
        lastName: 'User',
        role: 'PREMIUM' as const,
        emailVerified: true,
      },
      {
        email: 'admin@test.local',
        username: 'admin',
        password: 'AdminPass123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN' as const,
        emailVerified: true,
      },
    ];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      await prisma.user.upsert({
        where: { email: userData.email },
        create: {
          ...userData,
          password: hashedPassword,
        },
        update: {},
      });

      logger.info(`Created/verified user: ${userData.email}`);
    }

    // Create sample content
    const sampleContent = [
      {
        title: 'Welcome to Thynkr',
        description: 'Get started with our platform and explore what we offer',
        content: `# Welcome to Thynkr

Welcome to your new membership platform! This is a free article accessible to all users.

## What is Thynkr?

Thynkr is a modern membership platform built with cutting-edge technology including React, TypeScript, and Fastify.

## Features

- 🔐 Secure authentication with JWT
- 💳 Stripe integration for subscriptions
- 📚 Role-based content access
- 🎨 Modern, responsive UI
- ⚡ Lightning-fast performance

Start exploring our content library and upgrade to unlock premium features!`,
        slug: 'welcome-to-thynkr',
        requiredRole: 'BASIC' as const,
        featured: true,
        published: true,
        thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
        tags: ['getting-started', 'welcome'],
      },
      {
        title: 'Pro Member Benefits',
        description: 'Discover the exclusive benefits of Pro membership',
        content: `# Pro Member Benefits

Welcome to the Pro tier! As a Pro member, you get access to exclusive content and features.

## What's Included

- Access to Pro-level articles and tutorials
- Priority support
- Monthly webinars
- Community access
- Early access to new features

## Getting the Most Out of Your Membership

1. Check out our curated Pro content library
2. Join our monthly webinars
3. Connect with other Pro members
4. Provide feedback on new features

Upgrade to Premium for even more benefits!`,
        slug: 'pro-member-benefits',
        requiredRole: 'STANDARD' as const,
        featured: true,
        published: true,
        thumbnail: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800',
        tags: ['pro', 'benefits'],
      },
      {
        title: 'Advanced TypeScript Patterns',
        description: 'Master advanced TypeScript patterns and techniques',
        content: `# Advanced TypeScript Patterns

This Pro-level tutorial covers advanced TypeScript patterns you'll use in production applications.

## Type Guards

\`\`\`typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
\`\`\`

## Discriminated Unions

\`\`\`typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
\`\`\`

## Utility Types

Learn to leverage TypeScript's built-in utility types for cleaner code.

This is just the beginning - explore more Pro content in our library!`,
        slug: 'advanced-typescript-patterns',
        requiredRole: 'STANDARD' as const,
        featured: false,
        published: true,
        thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
        tags: ['typescript', 'programming', 'tutorial'],
      },
      {
        title: 'Premium Exclusive: Full-Stack Architecture',
        description: 'Deep dive into production-ready full-stack architecture',
        content: `# Full-Stack Architecture Masterclass

Welcome to our most comprehensive content - exclusive to Premium members!

## Architecture Overview

Learn how to design scalable, maintainable full-stack applications from the ground up.

### Frontend Architecture

- Component design patterns
- State management strategies
- Performance optimization
- Testing strategies

### Backend Architecture

- API design best practices
- Database optimization
- Caching strategies
- Security hardening

### DevOps & Deployment

- CI/CD pipelines
- Container orchestration
- Monitoring and logging
- Scaling strategies

## Real-World Case Studies

We'll walk through actual production architectures and the decisions behind them.

## Premium Resources

- Downloadable architecture diagrams
- Video walkthroughs
- Code repositories
- 1-on-1 consultation available

This is the kind of content that sets Premium members apart!`,
        slug: 'full-stack-architecture-masterclass',
        requiredRole: 'PREMIUM' as const,
        featured: true,
        published: true,
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
        tags: ['premium', 'architecture', 'full-stack'],
      },
      {
        title: 'React Performance Optimization',
        description: 'Boost your React app performance',
        content: `# React Performance Optimization

Learn to build lightning-fast React applications with these proven techniques.

## Key Topics

- Memoization strategies
- Code splitting
- Lazy loading
- Virtual scrolling
- Web Workers

Available to Pro and Premium members.`,
        slug: 'react-performance-optimization',
        requiredRole: 'STANDARD' as const,
        featured: false,
        published: true,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
        tags: ['react', 'performance', 'optimization'],
      },
      {
        title: 'Security Best Practices',
        description: 'Essential security practices for modern web apps',
        content: `# Security Best Practices

Security is paramount. Learn essential practices for protecting your applications and users.

## Topics Covered

- Authentication & Authorization
- XSS Prevention
- CSRF Protection
- SQL Injection Prevention
- Rate Limiting
- Security Headers

This is available to all members as security is everyone's responsibility!`,
        slug: 'security-best-practices',
        requiredRole: 'BASIC' as const,
        featured: false,
        published: true,
        thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
        tags: ['security', 'best-practices'],
      },
    ];

    for (const contentData of sampleContent) {
      await prisma.content.upsert({
        where: { slug: contentData.slug },
        create: contentData,
        update: {},
      });

      logger.info(`Created/verified content: ${contentData.title}`);
    }

    // Seed courses with comprehensive internal AI files
    await seedCoursesWithInternalFiles();

    logger.info('✅ Database seed completed successfully');
  } catch (error) {
    logger.error('❌ Database seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
