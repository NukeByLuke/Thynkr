/**
 * Landing Page
 * Marketing homepage with hero section, features, pricing, and CTAs for new visitors.
 */

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Button from '@/components/Button';
import { motion, Variants } from 'framer-motion';
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

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: 'easeOut' } 
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.12, delayChildren: 0.1 } 
  },
};

export default function Landing() {
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
      <section className="relative py-24 md:py-36 overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/5 via-transparent to-[#06B6D4]/5 dark:from-[#8B5CF6]/10 dark:via-transparent dark:to-[#06B6D4]/10" />
        
        {/* Floating gradient orbs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-brand-400/20 to-brand-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-32 w-96 h-96 bg-gradient-to-br from-accent-400/20 to-accent-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500/10 to-accent-500/10 backdrop-blur-sm text-brand-600 dark:text-brand-400 px-5 py-2.5 rounded-full text-sm font-semibold mb-10 border border-brand-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Learning Platform</span>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-8 text-balance leading-tight"
            >
              Study Smarter with
              <span className="gradient-text">
                {' '}
                AI
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto text-balance leading-relaxed"
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
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Discover Thynkr Features */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-transparent dark:via-slate-900/50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Discover <span className="gradient-text">Thynkr</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
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
              className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-white/10 hover:shadow-glow-brand transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Smart Summaries
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                AI automatically summarizes your uploaded readings, lectures, and documents.
                Regenerate anytime for fresh insights.
              </p>
            </motion.div>

            {/* Flashcards & Quizzes */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-white/10 hover:shadow-glow-brand transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-600 to-accent-500 text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Flashcards & Quizzes
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Generate interactive flashcards and quizzes from your notes. Choose difficulty and
                number of questions.
              </p>
            </motion.div>

            {/* AI Tutor */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-white/10 hover:shadow-glow-accent transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div className="absolute top-6 right-6">
                <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-full">
                  Premium
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                AI Tutor Chat
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Get personalized help from an AI tutor that understands your study materials and
                answers questions in context.
              </p>
            </motion.div>

            {/* Organized Workspace */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-white/10 hover:shadow-glow-brand transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Organized Workspace
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Keep all your study materials, AI outputs, and progress in one unified dashboard.
                Organize by folders and courses.
              </p>
            </motion.div>

            {/* Study Streaks */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-white/10 hover:shadow-glow-accent transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <Flame className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Study Streaks & Progress
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Track your study habits, maintain streaks, earn badges, and visualize your learning
                journey with detailed analytics.
              </p>
            </motion.div>

            {/* Secure & Private */}
            <motion.div
              variants={fadeInUp}
              className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-white/10 hover:shadow-glow-brand transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Safe & Private
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your data is encrypted and isolated. Secure JWT authentication, rate limiting, and
                enterprise-grade security.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-950" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">How It <span className="gradient-text">Works</span></h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Three simple steps to supercharge your learning
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <div className="relative inline-block mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-brand-500/10 to-accent-500/10 dark:from-brand-500/20 dark:to-accent-500/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto border border-brand-500/20">
                    <item.icon className="w-12 h-12 text-brand-600 dark:text-brand-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 text-white text-sm font-bold rounded-xl flex items-center justify-center shadow-glow-brand">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
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
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-500/10 to-accent-500/10 backdrop-blur-sm rounded-2xl mb-5 border border-brand-500/20">
                  <stat.icon className="w-7 h-7 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-transparent dark:via-slate-900/50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Why Choose <span className="gradient-text">Thynkr</span>?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Built for students who want to succeed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-center p-10 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 hover:shadow-glow-brand transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-18 h-18 bg-gradient-to-br from-brand-500/10 to-brand-600/10 dark:from-brand-500/20 dark:to-brand-600/20 text-brand-600 dark:text-brand-400 rounded-2xl mb-8 p-4">
                <Zap className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Lightning Fast
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Built with modern technology for blazing-fast performance and seamless experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-center p-10 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 hover:shadow-glow-accent transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-18 h-18 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 dark:from-emerald-500/20 dark:to-emerald-600/20 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-8 p-4">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Secure & Private
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your data is protected with enterprise-grade security and encryption.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-center p-10 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 hover:shadow-glow-brand transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-18 h-18 bg-gradient-to-br from-accent-500/10 to-accent-600/10 dark:from-accent-500/20 dark:to-accent-600/20 text-accent-600 dark:text-accent-400 rounded-2xl mb-8 p-4">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Community Driven
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Join thousands of learners and grow together in our supportive community.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <GraduationCap className="w-20 h-20 mx-auto mb-8 text-white/90" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              Join thousands of students who are already studying smarter with Thynkr
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="bg-white text-brand-600 hover:bg-white/90">
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
