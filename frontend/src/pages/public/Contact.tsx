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
import api from '@/lib/api';

export default function Contact() {
  const MIN_NAME_LENGTH = 2;
  const MIN_SUBJECT_LENGTH = 3;
  const MIN_MESSAGE_LENGTH = 20;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!name) return 'Please enter your name.';
    if (name.length < MIN_NAME_LENGTH) return `Name must be at least ${MIN_NAME_LENGTH} characters.`;

    if (!email) return 'Please enter your email address.';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) return 'Please enter a valid email address.';

    if (!subject) return 'Please enter a subject.';
    if (subject.length < MIN_SUBJECT_LENGTH) {
      return `Subject must be at least ${MIN_SUBJECT_LENGTH} characters.`;
    }

    if (!message) return 'Please enter a message.';
    if (message.length < MIN_MESSAGE_LENGTH) {
      return `Message must be at least ${MIN_MESSAGE_LENGTH} characters so we can help properly.`;
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/support/contact', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      const serverMessage = error.response?.data?.error;
      toast.error(serverMessage || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="text-center mb-16">
          <GradientText as="h1" className="text-4xl md:text-5xl mb-6">
            Get in Touch
          </GradientText>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Have questions, feedback, or need help? We'd love to hear from you.
            Our support team typically responds within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2 order-1">
            <Card padding="lg" variant="glass">
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-base text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 hover:border-gray-400 dark:hover:border-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all duration-200 ease-in-out resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6 order-2">
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

            <Card padding="lg" variant="default">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Quick Links
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="/pricing"
                    className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    Pricing & Plans
                  </a>
                </li>
                <li>
                  <a
                    href="/legal/privacy"
                    className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/legal/terms"
                    className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </Card>

            <Card padding="lg" variant="subtle">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Response Time
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We typically respond within <span className="font-semibold text-slate-900 dark:text-white">24 hours</span> during business days.
                For urgent issues, please mention "URGENT" in your subject line.
              </p>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
