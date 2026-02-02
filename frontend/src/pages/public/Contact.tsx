/**
 * Contact Page
 * Contact form and support information
 */

import { useState, FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import PageContainer from '@/components/layout/PageContainer';
import GradientText from '@/components/ui/GradientText';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, MessageSquare, Send } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Message sent! We'll get back to you soon.");
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - Thynkr</title>
        <meta
          name="description"
          content="Get in touch with the Thynkr team. We're here to help with any questions or feedback."
        />
      </Helmet>

      <PageContainer animate>
        {/* Header */}
        <div className="text-center mb-12">
          <GradientText as="h1" className="text-4xl md:text-5xl mb-6">
            Get in Touch
          </GradientText>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Have questions, feedback, or need help? We'd love to hear from you.
            Our support team typically responds within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 text-white">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Send us a Message
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Your Name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <Input
                  label="Subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="What's this about?"
                  required
                />

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Message
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  className="!bg-gradient-to-r !from-pink-600 !to-orange-600 hover:!from-pink-700 hover:!to-orange-700"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            <Card padding="lg" variant="glass">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Email Support
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                For general inquiries and support questions:
              </p>
              <a
                href="mailto:support@thynkr.ca"
                className="text-blue-600 dark:text-cyan-400 hover:underline font-medium"
              >
                support@thynkr.ca
              </a>
            </Card>

            <Card padding="lg" variant="glass">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Quick Links
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/pricing"
                    className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    → Pricing & Plans
                  </a>
                </li>
                <li>
                  <a
                    href="/legal/privacy"
                    className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    → Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/legal/terms"
                    className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    → Terms of Service
                  </a>
                </li>
              </ul>
            </Card>

            <Card padding="lg" variant="glass" className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-slate-800/50 dark:to-slate-800/50 border-pink-200 dark:border-pink-900/30">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Response Time
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We typically respond within <span className="font-semibold text-pink-600 dark:text-pink-400">24 hours</span> during business days.
                For urgent issues, please mention "URGENT" in your subject line.
              </p>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
