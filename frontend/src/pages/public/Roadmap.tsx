/**
 * Roadmap Page
 * Showcasing planned features and upcoming improvements
 */

import { Helmet } from 'react-helmet-async';
import PageContainer from '@/components/layout/PageContainer';
import GradientText from '@/components/ui/GradientText';
import Card from '@/components/ui/Card';
import {
  Rocket,
  CheckCircle,
  Circle,
  Clock,
  Sparkles,
  Users,
  BookOpen,
  Zap,
  Headphones,
  MessageSquare,
  Share2,
  BarChart3,
  Brain,
  Globe,
  Smartphone,
  Trophy,
} from 'lucide-react';

interface RoadmapItem {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  icon: React.ReactNode;
  category: 'AI' | 'Features' | 'UX' | 'Social';
}

const roadmapItems: RoadmapItem[] = [
  // Completed Features
  {
    title: 'AI-Powered Summaries',
    description: 'Generate concise summaries from any study material using Google Gemini AI.',
    status: 'completed',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'AI',
  },
  {
    title: 'Smart Flashcards',
    description: 'Automatically generate flashcards with spaced repetition.',
    status: 'completed',
    icon: <BookOpen className="w-5 h-5" />,
    category: 'Features',
  },
  {
    title: 'AI Quiz Generation',
    description: 'Create custom quizzes with multiple difficulty levels.',
    status: 'completed',
    icon: <Brain className="w-5 h-5" />,
    category: 'AI',
  },
  {
    title: 'Aurora Design System',
    description: 'Beautiful gradient-based UI with light/dark mode support.',
    status: 'completed',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'UX',
  },

  // In Progress
  {
    title: 'Mobile App',
    description: 'Native iOS and Android apps for studying on-the-go.',
    status: 'in-progress',
    icon: <Smartphone className="w-5 h-5" />,
    category: 'Features',
  },
  {
    title: 'Study Groups',
    description: 'Collaborate with classmates in real-time study sessions.',
    status: 'in-progress',
    icon: <Users className="w-5 h-5" />,
    category: 'Social',
  },
  {
    title: 'Advanced Analytics',
    description: 'Deep insights into your learning patterns and progress over time.',
    status: 'in-progress',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'Features',
  },

  // Planned Features
  {
    title: 'Text-to-Speech Narration',
    description: 'Listen to your summaries with high-quality AI voice narration.',
    status: 'planned',
    icon: <Headphones className="w-5 h-5" />,
    category: 'AI',
  },
  {
    title: 'AI Tutor Chat',
    description: 'Ask questions and get instant explanations about your study material.',
    status: 'planned',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'AI',
  },
  {
    title: 'Social Sharing',
    description: 'Share your study packs and achievements with friends.',
    status: 'planned',
    icon: <Share2 className="w-5 h-5" />,
    category: 'Social',
  },
  {
    title: 'Gamification 2.0',
    description: 'Enhanced achievements, leaderboards, and study streaks.',
    status: 'planned',
    icon: <Trophy className="w-5 h-5" />,
    category: 'Features',
  },
  {
    title: 'Multi-Language Support',
    description: 'Study in your native language with AI translations.',
    status: 'planned',
    icon: <Globe className="w-5 h-5" />,
    category: 'Features',
  },
  {
    title: 'Speed Reading Mode',
    description: 'Train your speed reading skills with customizable exercises.',
    status: 'planned',
    icon: <Zap className="w-5 h-5" />,
    category: 'Features',
  },
];

const StatusBadge = ({ status }: { status: RoadmapItem['status'] }) => {
  const statusConfig = {
    completed: {
      icon: <CheckCircle className="w-4 h-4" />,
      text: 'Completed',
      className:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    },
    'in-progress': {
      icon: <Clock className="w-4 h-4 animate-pulse" />,
      text: 'In Progress',
      className:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    planned: {
      icon: <Circle className="w-4 h-4" />,
      text: 'Planned',
      className:
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}
    >
      {config.icon}
      {config.text}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: RoadmapItem['category'] }) => {
  const categoryConfig = {
    AI: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400',
    Features: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
    UX: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    Social: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${categoryConfig[category]}`}
    >
      {category}
    </span>
  );
};

export default function Roadmap() {
  const completedItems = roadmapItems.filter((item) => item.status === 'completed');
  const inProgressItems = roadmapItems.filter((item) => item.status === 'in-progress');
  const plannedItems = roadmapItems.filter((item) => item.status === 'planned');

  return (
    <>
      <Helmet>
        <title>Roadmap - Thynkr</title>
        <meta
          name="description"
          content="See what's coming next to Thynkr - upcoming features, improvements, and innovations."
        />
      </Helmet>

      <PageContainer animate>
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Rocket className="w-8 h-8 text-pink-600 dark:text-cyan-500" />
            <GradientText as="h1" className="text-4xl md:text-5xl">
              Product Roadmap
            </GradientText>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Here's what we're building to make Thynkr the best AI study platform in the world.
            We're constantly innovating and listening to your feedback.
          </p>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card variant="glass" padding="lg" className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {completedItems.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Completed Features
            </div>
          </Card>
          <Card variant="glass" padding="lg" className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {inProgressItems.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              In Development
            </div>
          </Card>
          <Card variant="glass" padding="lg" className="text-center">
            <div className="text-3xl font-bold text-fuchsia-600 dark:text-violet-400 mb-2">
              {plannedItems.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Planned Features
            </div>
          </Card>
        </div>

        {/* In Progress Section */}
        {inProgressItems.length > 0 && (
          <PageContainer.Section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              In Progress
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressItems.map((item, index) => (
                <Card
                  key={index}
                  hover
                  padding="lg"
                  className="relative overflow-hidden border-2 border-blue-200 dark:border-blue-800"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        {item.icon}
                      </div>
                      <CategoryBadge category={item.category} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {item.description}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                </Card>
              ))}
            </div>
          </PageContainer.Section>
        )}

        {/* Planned Section */}
        {plannedItems.length > 0 && (
          <PageContainer.Section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Circle className="w-6 h-6 text-fuchsia-600 dark:text-violet-400" />
              Coming Soon
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plannedItems.map((item, index) => (
                <Card
                  key={index}
                  hover
                  padding="lg"
                  className="relative overflow-hidden border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-pink-600 to-fuchsia-600 dark:from-cyan-500 dark:to-violet-600 text-white">
                      {item.icon}
                    </div>
                    <CategoryBadge category={item.category} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {item.description}
                  </p>
                  <StatusBadge status={item.status} />
                </Card>
              ))}
            </div>
          </PageContainer.Section>
        )}

        {/* Completed Section */}
        {completedItems.length > 0 && (
          <PageContainer.Section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              Already Available
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {completedItems.map((item, index) => (
                <Card
                  key={index}
                  hover
                  padding="md"
                  className="border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                      {item.icon}
                    </div>
                    <CategoryBadge category={item.category} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {item.description}
                  </p>
                  <StatusBadge status={item.status} />
                </Card>
              ))}
            </div>
          </PageContainer.Section>
        )}

        {/* Feedback CTA */}
        <div className="mt-16">
          <Card variant="glass" padding="lg" className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-fuchsia-600 dark:text-cyan-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Have a Feature Request?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
              We'd love to hear your ideas! Help us shape the future of Thynkr by sharing your feedback.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-fuchsia-600 dark:from-cyan-500 dark:to-violet-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg"
            >
              Contact Us
            </a>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
