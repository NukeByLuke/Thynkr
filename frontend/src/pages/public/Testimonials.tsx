/**
 * Testimonials Page
 * Student success stories and reviews
 */

import { Helmet } from 'react-helmet-async';
import PageContainer from '@/components/layout/PageContainer';
import GradientText from '@/components/ui/GradientText';
import Card from '@/components/ui/Card';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  initials: string;
  color: string;
  rating: number;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Computer Science, 3rd Year',
    initials: 'SC',
    color: 'from-pink-500 to-orange-500',
    rating: 5,
    text: "Thynkr completely changed how I study for my CS exams. The AI-generated summaries from my lecture slides save me hours every week, and the flashcards are spot-on. I went from a B average to straight A's this semester!",
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Business Administration, 2nd Year',
    initials: 'MJ',
    color: 'from-cyan-500 to-blue-600',
    rating: 5,
    text: "The YouTube processing feature is a game-changer. I can upload entire lecture recordings and get summaries + quizzes instantly. Plus the audio narration lets me study while commuting. Worth every penny of the Premium plan.",
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Pre-Med, 1st Year',
    initials: 'ER',
    color: 'from-violet-500 to-purple-600',
    rating: 5,
    text: "As a pre-med student, I have to memorize tons of material. Thynkr's AI flashcards are incredibly smart—they pull out the key concepts I need to know. The dark mode is easy on my eyes during late-night study sessions too.",
  },
  {
    id: 4,
    name: 'David Patel',
    role: 'Engineering, 4th Year',
    initials: 'DP',
    color: 'from-fuchsia-500 to-pink-600',
    rating: 5,
    text: "I was skeptical about AI study tools at first, but Thynkr proved me wrong. The summaries are accurate, the interface is beautiful, and organizing my courses is effortless. It's like having a personal tutor available 24/7.",
  },
  {
    id: 5,
    name: 'Jessica Liu',
    role: 'Psychology, 2nd Year',
    initials: 'JL',
    color: 'from-orange-500 to-amber-500',
    rating: 5,
    text: "The design alone is worth it—everything is so intuitive and pretty! But beyond that, the AI quizzes help me test my understanding before exams. I love that I can share course materials with my study group using the share links.",
  },
  {
    id: 6,
    name: 'Alex Thompson',
    role: 'History Major, 3rd Year',
    initials: 'AT',
    color: 'from-blue-500 to-indigo-600',
    rating: 5,
    text: "I upload all my reading PDFs to Thynkr and get summaries that actually capture the main arguments. The audio feature is perfect for reviewing while I'm at the gym. Can't imagine studying without it now.",
  },
];

export default function Testimonials() {
  return (
    <>
      <Helmet>
        <title>Testimonials - Thynkr</title>
        <meta
          name="description"
          content="Read what students are saying about Thynkr and how it's transformed their studying experience."
        />
      </Helmet>

      <PageContainer animate>
        {/* Header */}
        <div className="text-center mb-16">
          <GradientText as="h1" className="text-4xl md:text-5xl mb-6">
            Loved by Students Worldwide
          </GradientText>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it. Here's what real students have to say about how
            Thynkr has transformed their studying experience and academic performance.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card padding="lg" className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-orange-600 mb-2">
              10K+
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Active Students</p>
          </Card>
          <Card padding="lg" className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 mb-2">
              4.9/5
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Average Rating</p>
          </Card>
          <Card padding="lg" className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600 mb-2">
              500K+
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">AI Requests</p>
          </Card>
          <Card padding="lg" className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 to-pink-600 mb-2">
              95%
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Would Recommend</p>
          </Card>
        </div>

        {/* Testimonials Grid */}
        <PageContainer.Section>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} hover padding="lg" className="flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Avatar */}
                  <div
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                  >
                    {testimonial.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {testimonial.role}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />

                {/* Testimonial Text */}
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed flex-grow">
                  "{testimonial.text}"
                </p>
              </Card>
            ))}
          </div>
        </PageContainer.Section>

        {/* CTA Section */}
        <div className="text-center py-16 mt-12">
          <Card variant="glass" padding="lg" className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Join <GradientText>Thousands of Successful Students</GradientText>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Start studying smarter today with AI-powered tools designed for academic success.
              Free plan available—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-xl border border-gray-300 dark:border-slate-600 transition-all"
              >
                View Pricing
              </a>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
