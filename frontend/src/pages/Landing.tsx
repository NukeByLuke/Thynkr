/**
 * Landing Page
 * Marketing homepage with hero section, features, pricing, and CTAs for new visitors.
 */

import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Button from '@/components/Button';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRight,
  Zap,
  Shield,
  Users,
  Sparkles,
  BookOpen,
  Brain,
  MessageCircle,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  Trophy,
  Lock,
  Lightbulb,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to their courses
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/my-courses" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Thynkr - AI-Powered Study Platform</title>
        <meta
          name="description"
          content="Transform your learning with AI-powered summaries, flashcards, quizzes, and an intelligent tutor. Study smarter, not harder."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-20 md:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200/30 dark:bg-secondary-800/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-8 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Learning Platform</span>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 text-balance"
            >
              Study Smarter with
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                {' '}
                AI
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto text-balance"
            >
              Upload your study materials and let AI create summaries, flashcards, quizzes, and get
              personalized tutoring—all in one place.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" onClick={() => (window.location.href = '/register')}>
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = '/pricing')}
              >
                View Pricing
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Discover Thynkr Features */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Discover Thynkr
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to master your studies, powered by cutting-edge AI technology
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Smart Summaries */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800 hover:shadow-xl transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 text-white rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Smart Summaries
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI automatically summarizes your uploaded readings, lectures, and documents.
                Regenerate anytime for fresh insights.
              </p>
            </motion.div>

            {/* Flashcards & Quizzes */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-8 rounded-2xl border border-purple-100 dark:border-purple-800 hover:shadow-xl transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-500 text-white rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Flashcards & Quizzes
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate interactive flashcards and quizzes from your notes. Choose difficulty and
                number of questions.
              </p>
            </motion.div>

            {/* AI Tutor */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-8 rounded-2xl border border-amber-100 dark:border-amber-800 hover:shadow-xl transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-primary-500 text-white rounded-full">
                  Premium
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                AI Tutor Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get personalized help from an AI tutor that understands your study materials and
                answers questions in context.
              </p>
            </motion.div>

            {/* Organized Workspace */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 rounded-2xl border border-green-100 dark:border-green-800 hover:shadow-xl transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Organized Workspace
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Keep all your study materials, AI outputs, and progress in one unified dashboard.
                Organize by folders and courses.
              </p>
            </motion.div>

            {/* Study Streaks */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-8 rounded-2xl border border-orange-100 dark:border-orange-800 hover:shadow-xl transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <Flame className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Study Streaks & Progress
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your study habits, maintain streaks, earn badges, and visualize your learning
                journey with detailed analytics.
              </p>
            </motion.div>

            {/* Secure & Private */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-600 text-white rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Safe & Private
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your data is encrypted and isolated. Secure JWT authentication, rate limiting, and
                enterprise-grade security.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Three simple steps to supercharge your learning
            </p>
          </motion.div>

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
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="relative text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto">
                    <item.icon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10K+', label: 'Study Materials', icon: FileText },
              { value: '50K+', label: 'Flashcards Created', icon: Brain },
              { value: '98%', label: 'Satisfaction Rate', icon: Trophy },
              { value: '24/7', label: 'AI Availability', icon: Zap },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl mb-4">
                  <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Thynkr?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Built for students who want to succeed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all duration-300 bg-white dark:bg-slate-900 border border-white/10"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Lightning Fast
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built with modern technology for blazing-fast performance and seamless experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-center p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all duration-300 bg-white dark:bg-slate-900 border border-white/10"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Secure & Private
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your data is protected with enterprise-grade security and encryption.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-center p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all duration-300 bg-white dark:bg-slate-900 border border-white/10"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Community Driven
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Join thousands of learners and grow together in our supportive community.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-700 dark:to-secondary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GraduationCap className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students who are already studying smarter with Thynkr
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Start Learning for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
