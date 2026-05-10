import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "motion/react";
import {
  Wrench, Shield, Zap, BarChart3, Users, CreditCard,
  ArrowRight, CheckCircle, Star, ChevronDown, Smartphone,
  Package, Bell, Printer, Globe, Clock, Menu, X,
  Play, Sparkles, TrendingUp, Award, Crown, Monitor
} from "lucide-react";
import { PLAN_TIERS } from "../config/planConfig";
import { api } from "../services/api";

// ─── Animated Counter ───
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Floating Particles Background ───
function FloatingParticles() {
  return (
    <div className="ftl-particles">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="ftl-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
            width: `${3 + Math.random() * 6}px`,
            height: `${3 + Math.random() * 6}px`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Features Data ───
const features = [
  {
    icon: Smartphone,
    title: "Smart Device Check-In",
    desc: "Register customer devices in under 30 seconds. Auto-generated job IDs, instant thermal receipt printing, and full device history tracking.",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)"
  },
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    desc: "Real-time revenue tracking, pending payment dashboards, and 30-day trend charts. Know exactly how your business is performing.",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #34d399)"
  },
  {
    icon: Package,
    title: "Inventory Management",
    desc: "Track spare parts, set low-stock alerts, and manage your workshop supplies. Never run out of critical components again.",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)"
  },
  {
    icon: Users,
    title: "Staff Management",
    desc: "Add technicians, assign repairs, track individual performance, and manage staff roles — all from one clean interface.",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899, #f472b6)"
  },
  {
    icon: Bell,
    title: "Customer Notifications",
    desc: "Automated email and WhatsApp status updates. Customers stay informed at every stage — from received to ready for pickup.",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)"
  },
  {
    icon: Printer,
    title: "Professional Printing",
    desc: "Print branded thermal receipts and A5 device jobcards. Supports PDF download and custom shop logos for a professional look.",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)"
  },
];

// Pricing is loaded dynamically from the database via API
// Plan features are sourced from planConfig.ts to ensure consistency

// ─── Testimonials ───
const testimonials = [
  {
    name: "Tunde Afolabi",
    role: "Owner, QuickFix Electronics",
    text: "FixTrack Pro completely transformed how we run our shop. Before, we used paper receipts and WhatsApp to track everything. Now every repair is traceable with a click.",
    rating: 5,
  },
  {
    name: "Ada Okonkwo",
    role: "Lead Technician, MobileCare Lagos",
    text: "The auto-generated job IDs and printable jobcards make us look so professional. Our customers are impressed every single time they drop a device.",
    rating: 5,
  },
  {
    name: "Ibrahim Musa",
    role: "Manager, PhoneFix Hub Abuja",
    text: "We went from losing track of 3-4 devices a month to zero. The inventory alerts also saved us from running out of screens during our busiest season.",
    rating: 5,
  },
];

// ─── FAQ Data ───
const faqs = [
  {
    q: "How do I get started?",
    a: "Simply create an account, set up your shop name, and you're ready to start checking in devices. The 7-day free trial gives you full access to explore all features."
  },
  {
    q: "Can I use this on my phone?",
    a: "Absolutely! FixTrack Pro is fully mobile-responsive. Your dashboard, repairs, inventory — everything works seamlessly on phones and tablets."
  },
  {
    q: "How does the notification system work?",
    a: "When you update a repair status, customers can be notified automatically via email or WhatsApp. They get a professional branded message with their job ID and current status."
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted, isolated per shop, and stored on industry-standard cloud infrastructure. Only authorized staff can access your shop's information."
  },
  {
    q: "Can I add multiple staff members?",
    a: "Yes! You can add technicians, assign repairs to them, and track performance. Staff management is available on all plans."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all Nigerian bank cards, bank transfers, and USSD payments through our secure banking integration."
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [totalShops, setTotalShops] = useState(0);
  const [totalRepairs, setTotalRepairs] = useState(0);
  const [pricing, setPricing] = useState({ basic: PLAN_TIERS.Basic.price, pro: PLAN_TIERS.Pro.price, premium: PLAN_TIERS.Premium.price });
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    document.title = "FixTrack Pro — Professional Repair Shop Management";
    // Fetch real stats and pricing from the database
    api.admin.getPublicStats().then((data) => {
      if (data.totalShops != null) setTotalShops(data.totalShops);
      if (data.totalRepairs != null) setTotalRepairs(data.totalRepairs);
      if (data.pricing) setPricing({ basic: data.pricing.basic, pro: data.pricing.pro, premium: data.pricing.premium });
    }).catch(() => { });
  }, []);

  // Build plans dynamically from planConfig + live pricing
  const plans = [
    {
      name: "Trial",
      price: "Free",
      period: "7 days",
      desc: "Perfect for trying out the platform",
      features: PLAN_TIERS.Trial.featureList,
      highlighted: false,
    },
    {
      name: "Basic",
      price: `₦${pricing.basic.toLocaleString()}`,
      period: "/month",
      desc: "For small repair shops just getting started",
      features: PLAN_TIERS.Basic.featureList,
      highlighted: false,
    },
    {
      name: "Pro",
      price: `₦${pricing.pro.toLocaleString()}`,
      period: "/month",
      desc: "For growing shops that need more power",
      features: PLAN_TIERS.Pro.featureList,
      highlighted: true,
    },
    {
      name: "Premium",
      price: `₦${pricing.premium.toLocaleString()}`,
      period: "/month",
      desc: "Full power for established businesses",
      features: PLAN_TIERS.Premium.featureList,
      highlighted: false,
    },
  ];

  return (
    <div className="ftl-page">
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="ftl-navbar">
        <div className="ftl-navbar-inner">
          <Link to="/" className="ftl-brand">
            <div className="ftl-brand-icon">
              <Wrench className="ftl-brand-wrench" />
            </div>
            <span className="ftl-brand-text">FixTrack Pro</span>
          </Link>

          {/* Desktop Nav */}
          <div className="ftl-nav-links">
            <a href="#features" className="ftl-nav-link">Features</a>
            <a href="#pricing" className="ftl-nav-link">Pricing</a>
            <a href="#testimonials" className="ftl-nav-link">Reviews</a>
            <a href="#faq" className="ftl-nav-link">FAQ</a>
          </div>

          <div className="ftl-nav-actions">
            <Link to="/login" className="ftl-btn-ghost">Sign In</Link>
            <Link to="/register" className="ftl-btn-primary">
              Get Started Free <ArrowRight className="ftl-btn-icon" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="ftl-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="ftl-mobile-menu"
            >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="ftl-mobile-link">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="ftl-mobile-link">Pricing</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="ftl-mobile-link">Reviews</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="ftl-mobile-link">FAQ</a>
              <div className="ftl-mobile-actions">
                <Link to="/login" className="ftl-btn-ghost-full">Sign In</Link>
                <Link to="/register" className="ftl-btn-primary-full">Get Started Free</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <motion.section className="ftl-hero" style={{ opacity: heroOpacity, scale: heroScale }}>
        <FloatingParticles />
        <div className="ftl-hero-split">
          <div className="ftl-hero-content">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="ftl-hero-badge"
            >
              <Sparkles className="ftl-hero-badge-icon" />
              <span>Built for Nigerian repair shops</span>
            </motion.div>

            <motion.h1
              className="ftl-hero-title"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              Stop Losing Track.
              <br />
              <span className="ftl-hero-gradient-text">Start Fixing Smarter.</span>
            </motion.h1>

            <motion.p
              className="ftl-hero-subtitle"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Track every device that walks into your shop — from phones and laptops to tablets.
              Manage your spare parts inventory, print professional receipts and jobcards,
              and send customers automatic status updates. All from one dashboard.
            </motion.p>

            <motion.div
              className="ftl-hero-buttons"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
            >
              <Link to="/register" className="ftl-btn-hero-primary">
                Start Your Free Trial
                <ArrowRight className="ftl-btn-icon" />
              </Link>
              <a href="#features" className="ftl-btn-hero-secondary">
                <Play className="ftl-btn-play-icon" />
                See How It Works
              </a>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              className="ftl-hero-stats"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="ftl-stat">
                <span className="ftl-stat-value"><AnimatedCounter value={totalShops || 0} suffix="+" /></span>
                <span className="ftl-stat-label">Active Shops</span>
              </div>
              <div className="ftl-stat-divider" />
              <div className="ftl-stat">
                <span className="ftl-stat-value"><AnimatedCounter value={totalRepairs || 0} suffix="+" /></span>
                <span className="ftl-stat-label">Repairs Tracked</span>
              </div>
              <div className="ftl-stat-divider" />
              <div className="ftl-stat">
                <span className="ftl-stat-value"><AnimatedCounter value={99} suffix="%" /></span>
                <span className="ftl-stat-label">Uptime</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Image — Dashboard Mockup */}
          <motion.div
            className="ftl-hero-image"
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <img src="/images/dashboard-mockup.png" alt="FixTrack Pro dashboard on a laptop" className="ftl-hero-img" />
            <div className="ftl-hero-img-glow" />
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="ftl-scroll-indicator"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown />
        </motion.div>
      </motion.section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="ftl-section ftl-section-light">
        <div className="ftl-container">
          <motion.div
            className="ftl-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="ftl-section-tag">How it works</span>
            <h2 className="ftl-section-title">Up and running in 3 simple steps</h2>
            <p className="ftl-section-subtitle">No complicated setup. No training needed. Just sign up and go.</p>
          </motion.div>

          <div className="ftl-steps">
            {[
              { step: "01", title: "Create Your Shop", desc: "Sign up with your shop name, email, and phone. Takes less than 60 seconds.", icon: Globe },
              { step: "02", title: "Check In Devices", desc: "Log every device that comes in — phone, laptop, tablet. Auto-assign job IDs and print jobcards.", icon: Smartphone },
              { step: "03", title: "Track & Get Paid", desc: "Monitor repair status, send updates to customers, and collect payments — all in one place.", icon: TrendingUp },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="ftl-step-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="ftl-step-number">{item.step}</div>
                <div className="ftl-step-icon-wrap">
                  <item.icon className="ftl-step-icon" />
                </div>
                <h3 className="ftl-step-title">{item.title}</h3>
                <p className="ftl-step-desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ VISUAL SHOWCASE — Real Workshop ═══════════ */}
      <section className="ftl-section ftl-section-light ftl-showcase">
        <div className="ftl-container">
          <motion.div
            className="ftl-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="ftl-section-tag">Built for Real Workshops</span>
            <h2 className="ftl-section-title">From soldering irons to screen replacements</h2>
            <p className="ftl-section-subtitle">Whether you repair phones, laptops, or tablets — FixTrack Pro helps you stay organized, professional, and profitable.</p>
          </motion.div>

          <div className="ftl-showcase-grid">
            <motion.div
              className="ftl-showcase-item ftl-showcase-large"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <img src="/images/hero-workshop.png" alt="Repair workshop with tools and devices" />
              <div className="ftl-showcase-overlay">
                <h3>Professional Workbench</h3>
                <p>Track every device on your bench with unique job IDs and status updates</p>
              </div>
            </motion.div>
            <motion.div
              className="ftl-showcase-item"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <img src="/images/technician-at-work.png" alt="Technician repairing a smartphone" />
              <div className="ftl-showcase-overlay">
                <h3>Skilled Technicians</h3>
                <p>Assign repairs and track staff performance</p>
              </div>
            </motion.div>
            <motion.div
              className="ftl-showcase-item"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <img src="/images/repair-tools.png" alt="Electronic repair tools and components" />
              <div className="ftl-showcase-overlay">
                <h3>Spare Parts & Inventory</h3>
                <p>Never run out of screens, batteries, or flex cables</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="ftl-section ftl-section-dark">
        <div className="ftl-container">
          <motion.div
            className="ftl-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="ftl-section-tag ftl-tag-dark">Powerful Features</span>
            <h2 className="ftl-section-title ftl-title-white">Everything you need to run a modern repair shop</h2>
            <p className="ftl-section-subtitle ftl-subtitle-dark">Built specifically for the Nigerian repair industry. Every feature is designed to save you time and make you money.</p>
          </motion.div>

          <div className="ftl-features-grid">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="ftl-feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className="ftl-feature-icon-wrap" style={{ background: feature.gradient }}>
                  <feature.icon className="ftl-feature-icon" />
                </div>
                <h3 className="ftl-feature-title">{feature.title}</h3>
                <p className="ftl-feature-desc">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF BANNER ═══════════ */}
      <section className="ftl-proof-banner">
        <div className="ftl-proof-inner">
          <motion.div
            className="ftl-proof-item"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Shield className="ftl-proof-icon" />
            <div>
              <span className="ftl-proof-value">Bank-Level Security</span>
              <span className="ftl-proof-label">256-bit encryption</span>
            </div>
          </motion.div>
          <motion.div
            className="ftl-proof-item"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Clock className="ftl-proof-icon" />
            <div>
              <span className="ftl-proof-value">30-Second Check-In</span>
              <span className="ftl-proof-label">Lightning-fast workflow</span>
            </div>
          </motion.div>
          <motion.div
            className="ftl-proof-item"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Award className="ftl-proof-icon" />
            <div>
              <span className="ftl-proof-value">Nigerian-Built</span>
              <span className="ftl-proof-label">For Nigerian Engineers</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="ftl-section ftl-section-light">
        <div className="ftl-container">
          <motion.div
            className="ftl-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="ftl-section-tag">Simple Pricing</span>
            <h2 className="ftl-section-title">Plans that grow with your business</h2>
            <p className="ftl-section-subtitle">Start free. Upgrade when you're ready. No hidden fees.</p>
          </motion.div>

          <div className="ftl-pricing-grid">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`ftl-price-card ${plan.highlighted ? "ftl-price-highlight" : ""}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
              >
                {plan.highlighted && <div className="ftl-price-badge">Most Popular</div>}
                <h3 className="ftl-price-name">{plan.name}</h3>
                <div className="ftl-price-amount">
                  <span className="ftl-price-value">{plan.price}</span>
                  <span className="ftl-price-period">{plan.period}</span>
                </div>
                <p className="ftl-price-desc">{plan.desc}</p>
                <ul className="ftl-price-features">
                  {plan.features.map((f) => (
                    <li key={f}><CheckCircle className="ftl-price-check" />{f}</li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={plan.highlighted ? "ftl-price-btn-primary" : "ftl-price-btn-outline"}
                >
                  {plan.name === "Trial" ? "Start Free Trial" : "Get Started"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="testimonials" className="ftl-section ftl-section-dark">
        <div className="ftl-container">
          <motion.div
            className="ftl-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="ftl-section-tag ftl-tag-dark">What People Say</span>
            <h2 className="ftl-section-title ftl-title-white">Loved by repair shop owners</h2>
          </motion.div>

          <div className="ftl-testimonials-grid">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                className="ftl-testimonial-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="ftl-testimonial-stars">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="ftl-star" />
                  ))}
                </div>
                <p className="ftl-testimonial-text">"{t.text}"</p>
                <div className="ftl-testimonial-author">
                  <div className="ftl-testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <p className="ftl-testimonial-name">{t.name}</p>
                    <p className="ftl-testimonial-role">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="ftl-section ftl-section-light">
        <div className="ftl-container ftl-container-narrow">
          <motion.div
            className="ftl-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="ftl-section-tag">FAQ</span>
            <h2 className="ftl-section-title">Got questions? We've got answers.</h2>
          </motion.div>

          <div className="ftl-faq-list">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="ftl-faq-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <button className="ftl-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown className={`ftl-faq-chevron ${openFaq === i ? "ftl-faq-chevron-open" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ftl-faq-a-wrap"
                    >
                      <p className="ftl-faq-a">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="ftl-cta">
        <FloatingParticles />
        <div className="ftl-cta-content">
          <motion.h2
            className="ftl-cta-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to modernize your repair shop?
          </motion.h2>
          <motion.p
            className="ftl-cta-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Join hundreds of Nigerian repair shops already using FixTrack Pro. Start your free 7-day trial today — no credit card required.
          </motion.p>
          <motion.div
            className="ftl-cta-buttons"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/register" className="ftl-btn-cta-primary">
              Create Free Account <ArrowRight className="ftl-btn-icon" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="ftl-footer">
        <div className="ftl-footer-inner">
          <div className="ftl-footer-brand">
            <div className="ftl-brand">
              <div className="ftl-brand-icon">
                <Wrench className="ftl-brand-wrench" />
              </div>
              <span className="ftl-brand-text">FixTrack Pro</span>
            </div>
            <p className="ftl-footer-desc">
              Professional repair shop management software built for Nigerian technicians and business owners.
            </p>
          </div>
          <div className="ftl-footer-links-group">
            <h4 className="ftl-footer-heading">Product</h4>
            <a href="#features" className="ftl-footer-link">Features</a>
            <a href="#pricing" className="ftl-footer-link">Pricing</a>
            <a href="#testimonials" className="ftl-footer-link">Reviews</a>
            <a href="#faq" className="ftl-footer-link">FAQ</a>
          </div>
          <div className="ftl-footer-links-group">
            <h4 className="ftl-footer-heading">Get Started</h4>
            <Link to="/register" className="ftl-footer-link">Create Account</Link>
            <Link to="/login" className="ftl-footer-link">Sign In</Link>
          </div>
        </div>
        <div className="ftl-footer-bottom">
          <p>© {new Date().getFullYear()} FixTrack Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
