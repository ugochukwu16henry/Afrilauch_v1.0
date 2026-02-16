'use client';

import { useState, useEffect } from 'react';
import { api, getStoredToken, type User } from '@/lib/api';
import { RevenueModelSection } from '@/components/common/RevenueModelSection';

const SKIP_REASONS: { value: 'cant_afford' | 'pay_later' | 'exploring' | 'other'; label: string }[] = [
  { value: 'cant_afford', label: "I can't afford now" },
  { value: 'pay_later', label: 'I will pay later' },
  { value: 'exploring', label: 'Just exploring' },
  { value: 'other', label: 'Other' },
];

interface SetupModalProps {
  user: User;
  onComplete: (user: User) => void;
  primaryColor: string;
}

export function SetupModal({ user, onComplete, primaryColor }: SetupModalProps) {
  const [step, setStep] = useState<'pricing_info' | 'choose' | 'skip'>('pricing_info');
  const [reason, setReason] = useState<'cant_afford' | 'pay_later' | 'exploring' | 'other'>('exploring');
  const [quote, setQuote] = useState<{ amount: number; currency: string; amountUsd: number } | null>(null);
  const [pricingConfig, setPricingConfig] = useState<{ ideaStarterSetupFeeUsd: number; investorSetupFeeUsd: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = getStoredToken();
  const isInvestor = user.role === 'investor';
  const feeUsd = pricingConfig
    ? (isInvestor ? pricingConfig.investorSetupFeeUsd : pricingConfig.ideaStarterSetupFeeUsd)
    : (isInvestor ? 10 : 7);

  useEffect(() => {
    api.setupFee.config().then(setPricingConfig).catch(() => setPricingConfig(null));
  }, []);

  useEffect(() => {
    if (!token) return;
    const currency = typeof navigator !== 'undefined' && navigator.language ? (navigator.language.includes('NG') ? 'NGN' : 'USD') : 'USD';
    api.setupFee.quote(currency, token)
      .then((r) => setQuote({ amount: r.amount, currency: r.currency, amountUsd: r.amountUsd }))
      .catch(() => setQuote({ amount: feeUsd, currency: 'USD', amountUsd: feeUsd }));
  }, [token, feeUsd]);

  async function handlePay() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const session = await api.setupFee.createSession({ currency: quote?.currency || 'USD' }, token);
      if (!session?.checkoutUrl) {
        setError('Invalid payment response. Please try again.');
        setLoading(false);
        return;
      }
      window.location.href = session.checkoutUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start payment';
      console.error('Setup fee payment error:', e);
      if (msg === 'Failed to fetch' || msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('502')) {
        setError(
          'Unable to connect to the payment server. Ensure NEXT_PUBLIC_API_URL points to your Railway backend URL and the backend service is running.'
        );
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  }

  async function handleSkipSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await api.setupFee.skip({ reason }, token);
      onComplete(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Complete your setup">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-secondary mb-2">Complete Your Setup to Unlock Your Startup Journey</h2>
        <p className="text-gray-600 text-sm mb-6">
          Pay a one-time setup fee to unlock full platform features, free consultation booking, and full dashboard access.
        </p>

        {step === 'pricing_info' && (
          <>
            <RevenueModelSection source="onboarding" variant="compact" className="mb-6 text-left" />
            <button
              type="button"
              onClick={() => setStep('choose')}
              className="w-full rounded-xl py-3 px-4 font-semibold text-white transition"
              style={{ backgroundColor: primaryColor }}
            >
              Continue to payment
            </button>
          </>
        )}

        {step === 'choose' && (
          <>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">
                {isInvestor ? 'Investor' : 'Entrepreneur'} setup fee (one-time)
              </p>
              <p className="text-2xl font-bold text-secondary">
                {quote ? `${quote.currency} ${quote.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `USD ${feeUsd}`}
              </p>
              {quote && quote.currency !== 'USD' && (
                <p className="text-xs text-gray-500 mt-1">≈ USD {quote.amountUsd}</p>
              )}
            </div>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setStep('pricing_info')}
                className="w-full rounded-xl py-2 px-4 font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition text-sm"
              >
                ← How our pricing works
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="w-full rounded-xl py-3 px-4 font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? 'Redirecting…' : 'Pay Setup Fee'}
              </button>
              <button
                type="button"
                onClick={() => setStep('skip')}
                disabled={loading}
                className="w-full rounded-xl py-3 px-4 font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
              >
                Skip for Now
              </button>
            </div>
          </>
        )}

        {step === 'skip' && (
          <form onSubmit={handleSkipSubmit}>
            <p className="text-sm text-gray-600 mb-4">Why are you skipping?</p>
            <div className="space-y-2 mb-6">
              {SKIP_REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="rounded-full border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="flex-1 rounded-xl py-2.5 px-4 font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl py-2.5 px-4 font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? 'Saving…' : 'Continue to limited dashboard'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
