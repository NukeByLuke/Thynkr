/**
 * QuoteModal Component
 * Professional quote generator with PDF and PNG export
 */

import { useState, useRef } from 'react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FileImage, FileText, Sparkles, Zap, Crown, GraduationCap } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlanType = 'basic' | 'standard' | 'premium' | 'student';
type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

interface PlanConfig {
  name: string;
  monthlyPrice: number;
  icon: React.ReactNode;
  color: string;
  comingSoon?: boolean;
}

const PLANS: Record<PlanType, PlanConfig> = {
  basic: {
    name: 'Basic',
    monthlyPrice: 0,
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-slate-500 to-slate-600',
  },
  standard: {
    name: 'Standard',
    monthlyPrice: 4.99,
    icon: <Zap className="w-5 h-5" />,
    color: 'from-blue-500 to-indigo-600',
  },
  premium: {
    name: 'Premium',
    monthlyPrice: 9.99,
    icon: <Crown className="w-5 h-5" />,
    color: 'from-brand-500 to-accent-600',
  },
  student: {
    name: 'Student',
    monthlyPrice: 2.99,
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-600',
    comingSoon: true,
  },
};

const BILLING_CYCLES: Record<BillingCycle, { label: string; months: number; discount: number }> = {
  monthly: { label: 'Monthly', months: 1, discount: 0 },
  quarterly: { label: 'Quarterly (3 months)', months: 3, discount: 5 },
  semiannual: { label: 'Semi-Annual (6 months)', months: 6, discount: 10 },
  yearly: { label: 'Yearly (12 months)', months: 12, discount: 17 },
};

export default function QuoteModal({ isOpen, onClose }: QuoteModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('standard');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isExporting, setIsExporting] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  const plan = PLANS[selectedPlan];
  const billing = BILLING_CYCLES[billingCycle];
  
  // Calculate pricing
  const pricePerMonth = plan.monthlyPrice;
  const totalMonths = billing.months;
  const subtotal = pricePerMonth * totalMonths;
  const discountAmount = (subtotal * billing.discount) / 100;
  const totalCost = subtotal - discountAmount;

  const handleExportPNG = async () => {
    if (!quoteRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(quoteRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        windowWidth: 800,
      });

      const link = document.createElement('a');
      link.download = `thynkr-quote-${selectedPlan}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export PNG:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!quoteRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(quoteRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`thynkr-quote-${selectedPlan}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
                Thynkr
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Pricing Quote</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400">Date</p>
              <p className="font-semibold text-slate-900 dark:text-white">
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
              <div className={`p-3 rounded-xl bg-gradient-to-br ${plan.color} text-white`}>
                {plan.icon}
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {plan.name} Plan
                  {plan.comingSoon && (
                    <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
                      Coming Soon
                    </span>
                  )}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{billing.label}</p>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Price per month</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${pricePerMonth.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Duration</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {totalMonths} {totalMonths === 1 ? 'month' : 'months'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            {billing.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Discount ({billing.discount}%)
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  -${discountAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-slate-900 dark:text-white">Total Cost</span>
            <span className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              ${totalCost.toFixed(2)}
            </span>
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
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
