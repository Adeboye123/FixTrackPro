import React, { useState, useEffect } from "react";
import { Check, Shield, Zap, Crown, AlertCircle, Lock } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { PLAN_TIERS, type PlanKey, type PlanTier } from "../config/planConfig";
import { BillingSkeleton } from "../components/Skeleton";

export default function Billing({ onUpdate }: { onUpdate?: (user: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [dynamicTiers, setDynamicTiers] = useState<Record<PlanKey, PlanTier>>({ ...PLAN_TIERS });
  const { toast, success, error } = useToast();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentPlan = user.plan || 'Trial';

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const data = await api.admin.getPricing();
        if (data.pricing) {
          const merged = { ...PLAN_TIERS };
          if (data.pricing.basic != null) {
            merged.Basic = { ...merged.Basic, price: Number(data.pricing.basic), durationLabel: `₦${Number(data.pricing.basic).toLocaleString()}/mo` };
          }
          if (data.pricing.pro != null) {
            merged.Pro = { ...merged.Pro, price: Number(data.pricing.pro), durationLabel: `₦${Number(data.pricing.pro).toLocaleString()}/mo` };
          }
          if (data.pricing.premium != null) {
            merged.Premium = { ...merged.Premium, price: Number(data.pricing.premium), durationLabel: `₦${Number(data.pricing.premium).toLocaleString()}/mo` };
          }
          setDynamicTiers(merged);
        }
      } catch (e) {
        console.error("Failed to fetch pricing:", e);
      } finally {
        setPricingLoading(false);
      }
    };
    fetchPricing();
  }, []);

  // Show skeleton while pricing loads from the database
  if (pricingLoading) return <BillingSkeleton />;

  const planOrder: PlanKey[] = ['Trial', 'Basic', 'Pro', 'Premium'];
  const currentPlanIndex = planOrder.indexOf(currentPlan as PlanKey);

  const plans = [
    {
      key: 'Basic' as PlanKey,
      icon: Shield,
      color: "text-slate-600",
      bg: "bg-slate-50",
      borderColor: "border-slate-200",
      buttonColor: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    },
    {
      key: 'Pro' as PlanKey,
      icon: Zap,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      borderColor: "border-indigo-600 ring-4 ring-indigo-50",
      buttonColor: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20",
      recommended: true,
    },
    {
      key: 'Premium' as PlanKey,
      icon: Crown,
      color: "text-amber-600",
      bg: "bg-amber-50",
      borderColor: "border-amber-300",
      buttonColor: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20",
    },
  ];

  const handleSubscribe = async (planKey: PlanKey) => {
    const tier = dynamicTiers[planKey];
    if (!tier || tier.price === 0) return;

    setLoading(true);
    const email = user.email || 'customer@example.com';
    const amount = tier.price;
    
    const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!PAYSTACK_PUBLIC_KEY) {
        error("VITE_PAYSTACK_PUBLIC_KEY is missing in your .env file!");
        setLoading(false);
        return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
         if ((window as any).PaystackPop) return resolve();
         const script = document.createElement('script');
         script.src = 'https://js.paystack.co/v1/inline.js';
         script.onload = () => resolve();
         script.onerror = () => reject(new Error('Failed to load Paystack script'));
         document.body.appendChild(script);
      });

      const handler = (window as any).PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amount * 100,
        currency: 'NGN',
        callback: function(response: any) {
             (async () => {
                 try {
                     const res = await api.shop.subscribe({ plan: planKey.toLowerCase(), amount, reference: response.reference });
                     if (res.status === 'success' && res.shop) {
                        user.plan = res.shop.subscription_plan || res.shop.plan;
                        user.expiresAt = res.shop.subscription_expires_at;
                        localStorage.setItem('user', JSON.stringify(user));
                        success("Payment Successful! Your plan has been upgraded.");
                        if (onUpdate) onUpdate(user);
                        setTimeout(() => window.location.reload(), 2000);
                     } else if (res.status === 'pending') {
                        success("Payment is processing. Your plan will upgrade once verification completes.");
                     } else {
                        error(res.message || "Payment verification incomplete.");
                     }
                 } catch (err: any) {
                     error(err.message || "Subscription upgrade failed");
                     setLoading(false);
                 }
             })();
        },
        onClose: function() {
             toast("Payment modal closed", "error");
             setLoading(false);
        }
      });
      handler.openIframe();
    } catch (err: any) {
      console.error("Paystack initialization error:", err);
      error(err.message || "Failed to initialize payment gateway. Please check your network or disable adblockers.");
      setLoading(false);
    }
  };

  const handleContactSales = () => {
    window.location.href = "mailto:sales@fixtrack.pro?subject=Enterprise Plan Inquiry";
  };

  const getButtonText = (planKey: PlanKey) => {
    const planIdx = planOrder.indexOf(planKey);
    if (planKey === currentPlan) return "Current Plan";
    if (planIdx < currentPlanIndex) return "Downgrade";
    return `Upgrade to ${PLAN_TIERS[planKey].name}`;
  };

  // Trial expiry calculation
  const trialExpiresAt = user.expiresAt ? new Date(user.expiresAt) : null;
  const now = new Date();
  const trialDaysLeft = trialExpiresAt ? Math.max(0, Math.ceil((trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const isTrialExpired = currentPlan === 'Trial' && trialDaysLeft <= 0;
  const isTrialActive = currentPlan === 'Trial' && trialDaysLeft > 0;

  return (
    <div className="space-y-8">
      {/* Trial Expired Alert */}
      {isTrialExpired && (
        <div className="p-6 rounded-2xl flex items-start gap-4 bg-red-50 border border-red-200">
          <div className="p-3 rounded-xl bg-red-100 text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-900">Free Trial Ended</h2>
            <p className="text-sm text-red-700">
              Your 7-day free trial has expired. Subscribe to a plan below to continue using all FixTrack Pro features.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan Banner */}
      <div className={`p-6 rounded-2xl flex items-start gap-4 ${
        isTrialActive ? 'bg-indigo-50 border border-indigo-100' 
        : isTrialExpired ? 'bg-red-50 border border-red-200'
        : 'bg-emerald-50 border border-emerald-100'
      }`}>
        <div className={`p-3 rounded-xl ${
          isTrialActive ? 'bg-indigo-100 text-indigo-600' 
          : isTrialExpired ? 'bg-red-100 text-red-600'
          : 'bg-emerald-100 text-emerald-600'
        }`}>
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${
            isTrialActive ? 'text-indigo-900' : isTrialExpired ? 'text-red-900' : 'text-emerald-900'
          }`}>
            {isTrialExpired ? 'Trial Expired — Subscribe Now'
              : isTrialActive ? `Free Trial Active — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining`
              : `${currentPlan} Plan Active`
            }
          </h2>
          <p className={`text-sm ${
            isTrialActive ? 'text-indigo-700' : isTrialExpired ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {isTrialActive
              ? `You have full access to all features during your trial. ${trialDaysLeft <= 2 ? 'Subscribe now to avoid interruption!' : 'Upgrade anytime to continue after trail ends.'}`
              : isTrialExpired
              ? 'Choose a plan below to restore access to all features.'
              : `You're on the ${currentPlan} plan. ${currentPlanIndex < 3 ? 'Upgrade to unlock more features.' : 'You have access to all features!'}`
            }
          </p>
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Subscription Plans</h1>
        <p className="text-slate-500 mt-2">Choose the plan that fits your shop's needs. Upgrade anytime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const tier = dynamicTiers[plan.key];
          const isCurrentPlan = plan.key === currentPlan;
          const isLower = planOrder.indexOf(plan.key) < currentPlanIndex;

          return (
            <div
              key={plan.key}
              className={`relative bg-white rounded-3xl p-8 shadow-sm border ${
                plan.recommended ? plan.borderColor : isCurrentPlan ? 'border-emerald-300 ring-4 ring-emerald-50' : 'border-slate-100'
              }`}
            >
              {plan.recommended && !isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                  Current Plan
                </div>
              )}
              <div className={`${plan.bg} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                <plan.icon className={`w-6 h-6 ${plan.color}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-slate-900">₦{tier.price.toLocaleString()}</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {tier.featureList.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                disabled={loading || isCurrentPlan}
                onClick={() => handleSubscribe(plan.key)}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  isCurrentPlan
                    ? "bg-emerald-50 text-emerald-600 cursor-default border border-emerald-200"
                    : isLower
                    ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                    : plan.buttonColor
                } disabled:opacity-50`}
              >
                {isCurrentPlan ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Current Plan
                  </span>
                ) : isLower ? (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> Contact Support to Downgrade
                  </span>
                ) : (
                  getButtonText(plan.key)
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold">Need a custom enterprise solution?</h2>
          <p className="text-slate-400">For large franchises with 10+ locations across Nigeria.</p>
        </div>
        <button 
          onClick={handleContactSales}
          className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
        >
          Contact Sales
        </button>
      </div>
    </div>
  );
}
