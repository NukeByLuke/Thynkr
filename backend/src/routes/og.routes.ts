/**
 * Open Graph Meta Tag Routes
 * 
 * Serves pre-rendered HTML with proper OG meta tags for social media crawlers.
 * When a bot (Discord, iMessage, Twitter, Facebook, etc.) requests a Thynkr URL,
 * nginx proxies the request here instead of serving the SPA.
 * 
 * This returns a minimal HTML page with:
 * - og:title, og:description, og:image, og:url
 * - twitter:card, twitter:title, twitter:description, twitter:image
 * - A redirect to the real SPA for any human visitors that somehow land here
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const db = new PrismaClient();

// Category display names and emoji for embed descriptions
const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  MATH: { emoji: '📐', label: 'Mathematics' },
  SCIENCE: { emoji: '🔬', label: 'Science' },
  ENGLISH: { emoji: '📝', label: 'English' },
  HISTORY: { emoji: '📜', label: 'History' },
  COMPUTER_SCIENCE: { emoji: '💻', label: 'Computer Science' },
  BUSINESS: { emoji: '📊', label: 'Business' },
  ART: { emoji: '🎨', label: 'Art & Design' },
  MUSIC: { emoji: '🎵', label: 'Music' },
  LANGUAGE: { emoji: '🌍', label: 'Languages' },
  HEALTH: { emoji: '🏥', label: 'Health & Medicine' },
  OTHER: { emoji: '📚', label: 'General' },
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildOgHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  siteName?: string;
  themeColor?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
}): string {
  const {
    title,
    description,
    image,
    url,
    type = 'website',
    siteName = 'Thynkr',
    themeColor = '#7c3aed',
    imageWidth = 1200,
    imageHeight = 630,
    imageAlt,
  } = opts;

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(url);
  const safeImageAlt = escapeHtml(imageAlt || title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="theme-color" content="${themeColor}" />

  <!-- Open Graph -->
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:secure_url" content="${safeImage}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="${imageWidth}" />
  <meta property="og:image:height" content="${imageHeight}" />
  <meta property="og:image:alt" content="${safeImageAlt}" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:site_name" content="${siteName}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />
  <meta name="twitter:image:alt" content="${safeImageAlt}" />

  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${safeUrl}">${safeTitle}</a>...</p>
</body>
</html>`;
}

export default async function ogRoutes(server: FastifyInstance) {
  const frontendUrl = config.app.frontendUrl || 'https://thynkr.study';
  const defaultImage = `${frontendUrl}/brand/og-default.png`;

  // ===== Course Detail OG =====
  server.get<{ Params: { id: string }; Querystring: { token?: string } }>(
    '/courses/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { token } = request.query;

        const course = await db.course.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            description: true,
            bannerImage: true,
            category: true,
            visibility: true,
            shareToken: true,
            creator: { select: { username: true } },
            files: { select: { id: true } },
          },
        });

        if (!course) {
          return reply.type('text/html').send(buildOgHtml({
            title: 'Course Not Found — Thynkr',
            description: 'This course could not be found on Thynkr.',
            image: defaultImage,
            url: `${frontendUrl}/courses/${id}`,
          }));
        }

        // For private courses, only show OG if share token is present
        const isPrivate = course.visibility === 'PRIVATE';
        const hasToken = token && course.shareToken === token;
        if (isPrivate && !hasToken) {
          return reply.type('text/html').send(buildOgHtml({
            title: 'Private Course — Thynkr',
            description: 'This course is private. You need an invitation link to view it.',
            image: defaultImage,
            url: `${frontendUrl}/courses/${id}`,
          }));
        }

        const cat = CATEGORY_META[course.category] || CATEGORY_META.OTHER;
        const fileCount = course.files?.length || 0;
        const creatorName = course.creator?.username || 'Unknown';

        // Build description
        let desc = course.description
          ? course.description.substring(0, 200)
          : `${cat.emoji} ${cat.label} course with ${fileCount} file${fileCount !== 1 ? 's' : ''}`;
        if (course.description && course.description.length > 200) desc += '...';
        desc += ` • By ${creatorName} on Thynkr`;

        // Use banner image if available, otherwise default
        let ogImage = defaultImage;
        if (course.bannerImage) {
          // Banner images are stored as relative paths like /uploads/banners/xxx.jpg
          ogImage = course.bannerImage.startsWith('http')
            ? course.bannerImage
            : `${frontendUrl}${course.bannerImage}`;
        }

        const courseUrl = token
          ? `${frontendUrl}/courses/${id}?token=${token}`
          : `${frontendUrl}/courses/${id}`;

        return reply.type('text/html').send(buildOgHtml({
          title: `${course.title} — Thynkr`,
          description: desc,
          image: ogImage,
          url: courseUrl,
          type: 'article',
        }));
      } catch (err) {
        server.log.error(err, 'OG route error for course');
        return reply.type('text/html').send(buildOgHtml({
          title: 'Thynkr — AI-Powered Study Platform',
          description: 'Transform your learning with intelligent study tools and AI tutoring.',
          image: defaultImage,
          url: frontendUrl,
        }));
      }
    }
  );

  // ===== Course Study OG =====
  server.get<{ Params: { id: string }; Querystring: { token?: string } }>(
    '/courses/:id/study',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { token } = request.query;

        const course = await db.course.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            category: true,
            bannerImage: true,
          },
        });

        const cat = CATEGORY_META[course?.category || 'OTHER'] || CATEGORY_META.OTHER;
        const title = course ? `Study: ${course.title}` : 'AI Study Mode';
        const desc = course
          ? `${cat.emoji} Study "${course.title}" with AI-powered summaries, flashcards, quizzes & notes.`
          : 'AI-powered study mode with summaries, flashcards, quizzes & notes.';

        let ogImage = defaultImage;
        if (course?.bannerImage) {
          ogImage = course.bannerImage.startsWith('http')
            ? course.bannerImage
            : `${frontendUrl}${course.bannerImage}`;
        }

        const studyUrl = token
          ? `${frontendUrl}/courses/${id}/study?token=${token}`
          : `${frontendUrl}/courses/${id}/study`;

        return reply.type('text/html').send(buildOgHtml({
          title: `${title} — Thynkr`,
          description: desc,
          image: ogImage,
          url: studyUrl,
        }));
      } catch (err) {
        server.log.error(err, 'OG route error for study');
        return reply.type('text/html').send(buildOgHtml({
          title: 'AI Study Mode — Thynkr',
          description: 'Study with AI-powered summaries, flashcards, quizzes & notes.',
          image: defaultImage,
          url: `${frontendUrl}`,
        }));
      }
    }
  );

  // ===== Generic Pages OG =====
  // Pricing
  server.get('/pricing', async (_request, reply) => {
    return reply.type('text/html').send(buildOgHtml({
      title: 'Pricing — Thynkr',
      description: 'Choose your plan. Free tier available. Upgrade for AI study tools, YouTube processing, and unlimited courses.',
      image: defaultImage,
      url: `${frontendUrl}/pricing`,
    }));
  });

  // About
  server.get('/about', async (_request, reply) => {
    return reply.type('text/html').send(buildOgHtml({
      title: 'About — Thynkr',
      description: 'Thynkr is an AI-powered study platform that transforms your learning with intelligent study tools and personalized learning paths.',
      image: defaultImage,
      url: `${frontendUrl}/about`,
    }));
  });

  // Roadmap
  server.get('/roadmap', async (_request, reply) => {
    return reply.type('text/html').send(buildOgHtml({
      title: 'Roadmap — Thynkr',
      description: 'See what\'s coming next for Thynkr. Track upcoming features, vote on ideas, and follow our development progress.',
      image: defaultImage,
      url: `${frontendUrl}/roadmap`,
    }));
  });

  // Login / Register
  server.get('/login', async (_request, reply) => {
    return reply.type('text/html').send(buildOgHtml({
      title: 'Sign In — Thynkr',
      description: 'Sign in to Thynkr to access your AI-powered study tools, courses, and learning dashboard.',
      image: defaultImage,
      url: `${frontendUrl}/login`,
    }));
  });

  server.get('/register', async (_request, reply) => {
    return reply.type('text/html').send(buildOgHtml({
      title: 'Create Account — Thynkr',
      description: 'Join Thynkr for free. Get AI-powered summaries, flashcards, quizzes, and more for your study materials.',
      image: defaultImage,
      url: `${frontendUrl}/register`,
    }));
  });

  // Catch-all fallback for any other page
  server.get('/*', async (request, reply) => {
    const path = (request.params as Record<string, string>)['*'] || '';
    return reply.type('text/html').send(buildOgHtml({
      title: 'Thynkr — AI-Powered Study Platform',
      description: 'Transform your learning with intelligent study tools, AI tutoring, and personalized learning paths.',
      image: defaultImage,
      url: `${frontendUrl}/${path}`,
    }));
  });
}
