/**
 * Landing Page
 * Marketing homepage with hero section, features, pricing, and CTAs for new visitors.
 */

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Button from '@/components/ui/Button';
import {
  ArrowRight,
  Zap,
  Shield,
  Users,
  Sparkles,
  BookOpen,
  Brain,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  Trophy,
  Lock,
  Lightbulb,
} from 'lucide-react';

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Thynkr - AI Study Platform</title>
        <meta
          name="description"
          content="Transform your learning with AI-powered summaries, flashcards, and quizzes. Study smarter, not harder."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Subtle background tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950" />

        <div className="max-w-6xl mx-auto px-8 lg:px-16 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Learning Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-slate-900 dark:text-white mb-6 text-balance leading-tight">
              Study Smarter with
              <span className="text-cyan-500">
                {' '}
                AI
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto text-balance leading-relaxed">
              Upload your study materials and let AI create summaries, flashcards, and quizzes—all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => (window.location.href = '/register')}>
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = '/login')}
              >
                Login
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => (window.location.href = '/pricing')}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Discover Thynkr Features */}
      <section className="py-20 relative bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-8 lg:px-16 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-4">
              Discover <span className="text-cyan-500">Thynkr</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Everything you need to master your studies, powered by AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Smart Summaries */}
            <div className="group relative bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-500 text-white rounded-xl mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Smart Summaries
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                AI automatically summarizes your uploaded readings, lectures, and documents.
                Regenerate anytime for fresh insights.
              </p>
            </div>

            {/* Flashcards & Quizzes */}
            <div className="group relative bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-500 text-white rounded-xl mb-5">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Flashcards & Quizzes
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Generate interactive flashcards and quizzes from your notes. Choose difficulty and
                number of questions.
              </p>
            </div>

            {/* Organized Workspace */}
            <div className="group relative bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 text-white rounded-xl mb-5 group-hover:scale-105 transition-transform duration-200">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Organized Workspace
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Keep all your study materials, AI outputs, and progress in one unified dashboard.
                Organize by folders and courses.
              </p>
            </div>

            {/* Study Streaks */}
            <div className="group relative bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 text-white rounded-xl mb-5 group-hover:scale-105 transition-transform duration-200">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Study Streaks & Progress
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Track your study habits, maintain streaks, earn badges, and visualize your learning
                journey with detailed analytics.
              </p>
            </div>

            {/* Secure & Private */}
            <div className="group relative bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-600 text-white rounded-xl mb-5 group-hover:scale-105 transition-transform duration-200">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Safe & Private
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your data is encrypted and isolated. Secure JWT authentication, rate limiting, and
                enterprise-grade security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-8 lg:px-16 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-4">How It <span className="gradient-text">Works</span></h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Three simple steps to supercharge your learning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: BookOpen,
                title: 'Upload Your Materials',
                description:
                  'Upload PDFs, documents, or slides. Our AI extracts and processes the content automatically.',
              },
              {
                step: '02',
                icon: Lightbulb,
                title: 'AI Generates Study Tools',
                description:
                  'Get instant summaries, flashcards, and quizzes tailored to your materials.',
              },
              {
                step: '03',
                icon: Trophy,
                title: 'Master Your Subjects',
                description:
                  'Study with AI-powered tools, track progress, and ace your exams with confidence.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative text-center"
              >
                <div className="relative inline-block mb-8">
                  <div className="w-20 h-20 bg-primary-500/10 dark:bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto border border-primary-500/20">
                    <item.icon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-500 text-white text-sm font-semibold rounded-lg flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative">
        <div className="max-w-6xl mx-auto px-8 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10K+', label: 'Study Materials', icon: FileText },
              { value: '50K+', label: 'Flashcards Created', icon: Brain },
              { value: '98%', label: 'Satisfaction Rate', icon: Trophy },
              { value: '24/7', label: 'AI Availability', icon: Zap },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500/10 rounded-xl mb-4 border border-primary-500/20">
                  <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-3xl md:text-4xl font-semibold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-8 lg:px-16 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-4">
              Why Choose <span className="gradient-text">Thynkr</span>?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Built for students who want to succeed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Lightning Fast
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Built with modern technology for blazing-fast performance and seamless experience.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl mb-6">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Secure & Private
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your data is protected with enterprise-grade security and encryption.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 rounded-xl mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Community Driven
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Join thousands of learners and grow together in our supportive community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden bg-navy-800 dark:bg-navy-900">
        <div className="max-w-4xl mx-auto px-8 lg:px-16 text-center relative">
          <div>
            <GraduationCap className="w-16 h-16 mx-auto mb-6 text-white/80" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Join thousands of students who are already studying smarter with Thynkr
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="bg-white text-navy-800 hover:bg-white/90">
                Start Learning for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
