/**
 * About Page
 * Mission statement and company information
 */

import { Helmet } from 'react-helmet-async';
import PageContainer from '@/components/layout/PageContainer';
import GradientText from '@/components/ui/GradientText';
import Card from '@/components/ui/Card';
import { Sparkles, Palette, Cpu, Users, Target, Zap } from 'lucide-react';

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Us - Thynkr</title>
        <meta
          name="description"
          content="Learn about Thynkr's mission to revolutionize studying with AI-powered tools and elegant design."
        />
      </Helmet>

      <PageContainer animate>
        {/* Hero Section */}
        <div className="text-center mb-16">
          <GradientText as="h1" className="text-4xl md:text-5xl mb-6">
            Revolutionizing the Way You Study
          </GradientText>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Thynkr is an AI-powered study platform designed to transform how students learn,
            retain, and master complex material. We combine cutting-edge artificial intelligence
            with elegant, intuitive design to create the ultimate learning experience.
          </p>
        </div>

        {/* Mission Section */}
        <PageContainer.Section className="mb-16">
          <Card variant="glass" padding="lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 text-white">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Our Mission
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  We believe studying shouldn't be tedious. Traditional note-taking and memorization
                  techniques are outdated in an age where AI can summarize, explain, and quiz you on
                  any topic. Our mission is to empower students worldwide with tools that adapt to
                  their learning style, save time, and boost retention—all wrapped in a design that's
                  as delightful to use as it is powerful.
                </p>
              </div>
            </div>
          </Card>
        </PageContainer.Section>

        {/* Key Principles */}
        <PageContainer.Section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            What Makes Thynkr <GradientText>Different</GradientText>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* AI-First Approach */}
            <Card hover padding="lg" className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white mb-4">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                AI-First Approach
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Powered by Google Gemini 2.5 Flash Lite and OpenAI's TTS models, Thynkr generates
                summaries, flashcards, quizzes, and even audio narration from your study materials.
                Our AI understands context and adapts to your learning pace.
              </p>
            </Card>

            {/* Aurora Design System */}
            <Card hover padding="lg" className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white mb-4">
                <Palette className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Aurora Design System
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Inspired by the natural beauty of sunrise and midnight skies, our design system uses
                warm pink-to-orange gradients in light mode and cool cyan-to-violet gradients in dark
                mode. Every interface element is crafted for clarity, elegance, and minimal
                distraction.
              </p>
            </Card>

            {/* Student-Centric */}
            <Card hover padding="lg" className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Student-Centric Features
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload PDFs, process YouTube lectures, organize courses, and access everything from
                any device. Thynkr is built by students, for students, with features that actually
                solve real studying problems—not just gimmicks.
              </p>
            </Card>
          </div>
        </PageContainer.Section>

        {/* Features Highlight */}
        <PageContainer.Section className="mb-16">
          <Card variant="glass" padding="lg">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              <GradientText>Core Features</GradientText>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    AI-Generated Summaries
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Upload any PDF or YouTube link and get instant, contextual summaries that
                    highlight key concepts and ideas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Smart Flashcards & Quizzes
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Automatically generate flashcards and practice quizzes from your notes to boost
                    retention and test understanding.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Audio Narration (TTS)
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Listen to your notes on the go with high-quality text-to-speech powered by
                    OpenAI, complete with speed controls and OS media integration.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Course Organization
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Keep all your study materials organized in courses, share with classmates, and
                    access everything from anywhere.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </PageContainer.Section>

        {/* CTA Section */}
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to <GradientText>Transform Your Studying?</GradientText>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already studying smarter, not harder.
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </a>
        </div>
      </PageContainer>
    </>
  );
}
