/**
 * QuoteModal Component
 * Professional quote generator with PDF and PNG export
 */

import { useState, useRef } from 'react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FileImage, FileText, Sparkles, Zap, Crown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlanType = 'basic' | 'standard' | 'premium';
type BillingCycle = 'monthly' | 'yearly';

interface PlanConfig {
  name: string;
  monthlyPrice: number;
  icon: React.ReactNode;
  color: string;
  description: string;
  features: string[];
  comingSoon?: boolean;
}

const PLANS: Record<PlanType, PlanConfig> = {
  basic: {
    name: 'Basic',
    monthlyPrice: 0,
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-slate-500 to-slate-600',
    description: 'Essential study tools for getting started',
    features: [
      '5 file uploads per month',
      'AI-powered summaries',
      'Smart note generation',
      'Basic quiz creation',
      'Flashcard study sets',
    ],
  },
  standard: {
    name: 'Standard',
    monthlyPrice: 4.99,
    icon: <Zap className="w-5 h-5" />,
    color: 'from-blue-500 to-indigo-600',
    description: 'Advanced AI tools and unlimited uploads',
    features: [
      'Unlimited file uploads',
      'Advanced AI summaries',
      'Detailed study notes',
      'Custom quiz generation',
      'Interactive flashcards',
      'YouTube video processing',
      'Multi-language support',
    ],
  },
  premium: {
    name: 'Premium',
    monthlyPrice: 9.99,
    icon: <Crown className="w-5 h-5" />,
    color: 'from-brand-500 to-accent-600',
    description: 'Everything in Standard plus priority support',
    features: [
      'Unlimited file uploads',
      'Advanced AI summaries & notes',
      'Custom quiz generation',
      'Interactive flashcards',
      'YouTube video processing',
      'Priority AI processing',
      'Advanced analytics & insights',
      'Full course access',
      'Priority email support',
      'Early access to new features',
    ],
  },
};

const BILLING_CYCLES: Record<BillingCycle, { label: string; months: number; discount: number }> = {
  monthly: { label: 'Monthly', months: 1, discount: 0 },
  yearly: { label: 'Yearly (12 months)', months: 12, discount: 17 },
};

export default function QuoteModal({ isOpen, onClose }: QuoteModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('standard');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isExporting, setIsExporting] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  const plan = PLANS[selectedPlan];
  const billing = BILLING_CYCLES[billingCycle];
  
  // Calculate pricing with exact target prices
  const pricePerMonth = plan.monthlyPrice;
  const totalMonths = billing.months;
  const subtotal = pricePerMonth * totalMonths;
  
  // Define exact target prices for billing cycles (student discount removed)
  const targetPrices: Record<PlanType, Record<BillingCycle, number>> = {
    basic: {
      monthly: 0,
      yearly: 0,
    },
    standard: {
      monthly: 4.99,
      yearly: 49.99,
    },
    premium: {
      monthly: 9.99,
      yearly: 99.99,
    },
  };
  
  // Get target price for current configuration
  const targetPrice = targetPrices[selectedPlan][billingCycle];
  
  // Calculate discount to hit target price
  const totalDiscountAmount = subtotal - targetPrice;
  const billingDiscountAmount = totalDiscountAmount;
  
  const totalCost = targetPrice;

  const handleExportPNG = async () => {
    if (!quoteRef.current) return;

    setIsExporting(true);
    try {
      // Temporarily add export class for light mode styling
      quoteRef.current.classList.add('exporting');
      
      const canvas = await html2canvas(quoteRef.current, {
        backgroundColor: '#ffffff', // White background for light mode
        scale: 2,
        logging: false,
        windowWidth: 600,
      });

      const link = document.createElement('a');
      link.download = `thynkr-quote-${selectedPlan}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export PNG:', error);
    } finally {
      // Remove export class
      if (quoteRef.current) {
        quoteRef.current.classList.remove('exporting');
      }
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!quoteRef.current) return;

    setIsExporting(true);
    try {
      // Temporarily add export class for light mode styling
      quoteRef.current.classList.add('exporting');
      
      const canvas = await html2canvas(quoteRef.current, {
        backgroundColor: '#ffffff', // White background for light mode
        scale: 2,
        logging: false,
        windowWidth: 600,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // A4 dimensions: 210mm x 297mm
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10; // 10mm margin on all sides
      
      // Available space for content
      const maxWidth = pageWidth - (2 * margin);
      const maxHeight = pageHeight - (2 * margin);
      
      // Calculate dimensions maintaining aspect ratio
      const imgAspectRatio = canvas.width / canvas.height;
      let imgWidth = maxWidth;
      let imgHeight = imgWidth / imgAspectRatio;
      
      // If height exceeds available space, scale down based on height
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * imgAspectRatio;
      }

      // Center the image on the page
      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`thynkr-quote-${selectedPlan}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      // Remove export class
      if (quoteRef.current) {
        quoteRef.current.classList.remove('exporting');
      }
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Get a Quote"
      description="Configure your plan and export a professional quote"
      size="full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {/* Left Column: Configuration */}
        <div className="space-y-4">
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Select Plan
            </label>
            <div className="grid grid-cols-2 gap-3">
            {(Object.entries(PLANS) as [PlanType, PlanConfig][]).map(([key, planConfig]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedPlan === key
                    ? 'border-brand-500 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${planConfig.color} text-white`}
                  >
                    {planConfig.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {planConfig.name}
                      {planConfig.comingSoon && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      ${planConfig.monthlyPrice.toFixed(2)}/mo
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {planConfig.description}
                </p>
              </button>
            ))}
          </div>
        </div>

          {/* Billing Cycle Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Billing Cycle
            </label>
          <div className="space-y-2">
            {(Object.entries(BILLING_CYCLES) as [BillingCycle, typeof BILLING_CYCLES[BillingCycle]][]).map(
              ([key, cycle]) => (
                <button
                  key={key}
                  onClick={() => setBillingCycle(key)}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left flex items-center justify-between ${
                    billingCycle === key
                      ? 'border-brand-500 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="font-medium text-slate-900 dark:text-white">{cycle.label}</span>
                  {cycle.discount > 0 && (
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-semibold">
                      Save {cycle.discount}%
                    </span>
                  )}
                </button>
              )
            )}
          </div>
          </div>
        </div>

        {/* Right Column: Quote Preview */}
        <div
          ref={quoteRef}
          className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-8 shadow-lg [&.exporting]:bg-white [&.exporting]:border-slate-200"
          style={{ padding: '2rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 [.exporting_&]:border-slate-200">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent [.exporting_&]:bg-none [.exporting_&]:text-slate-900">
                Thynkr
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 [.exporting_&]:text-slate-600 mt-1">Pricing Quote</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400 [.exporting_&]:text-slate-600">Date</p>
              <p className="font-semibold text-slate-900 dark:text-white [.exporting_&]:text-slate-900">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Plan Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              {/* Hide colored icon during export */}
              <div className="p-3 rounded-xl bg-brand-500 text-white [.exporting_&]:hidden">
                {plan.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white [.exporting_&]:text-slate-900 flex items-center gap-2">
                  {plan.name} Plan
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 [.exporting_&]:text-slate-600">{billing.label}</p>
              </div>
            </div>
            
            {/* About Section */}
            <div className="mt-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 [.exporting_&]:text-slate-700 mb-1">About:</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 [.exporting_&]:text-slate-600">{plan.description}</p>
            </div>
            
            {/* Plan Features */}
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 [.exporting_&]:text-slate-700 mb-2">Included Features:</p>
              <ul className="space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-xs text-slate-600 dark:text-slate-400 [.exporting_&]:text-slate-600 flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-500 [.exporting_&]:text-green-600 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 [.exporting_&]:border-slate-200">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 [.exporting_&]:text-slate-600">Price per month</span>
              <span className="font-semibold text-slate-900 dark:text-white [.exporting_&]:text-slate-900">
                ${pricePerMonth.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 [.exporting_&]:text-slate-600">Duration</span>
              <span className="font-semibold text-slate-900 dark:text-white [.exporting_&]:text-slate-900">
                {totalMonths} {totalMonths === 1 ? 'month' : 'months'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 [.exporting_&]:text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white [.exporting_&]:text-slate-900">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            {billing.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-400 [.exporting_&]:text-green-700 font-semibold">
                  Billing Discount ({billing.discount}%)
                </span>
                <span className="font-bold text-green-700 dark:text-green-400 [.exporting_&]:text-green-700">
                  -${billingDiscountAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-slate-900 dark:text-white [.exporting_&]:text-slate-900">Total Cost</span>
            <span className="text-3xl font-bold text-slate-900 dark:text-white [.exporting_&]:text-slate-900">
              ${totalCost.toFixed(2)}
            </span>
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 [.exporting_&]:border-slate-200">
            <p className="text-xs text-slate-500 dark:text-slate-400 [.exporting_&]:text-slate-500 text-center">
              All plans include a 7-day money-back guarantee. Cancel anytime.
              <br />
              Questions? Contact us at support@thynkr.com
            </p>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <FileImage className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Download PNG'}
          </Button>
          <Button
            variant="primary"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Download PDF'}
          </Button>
        </ModalFooter>
    </Modal>
  );
}
