/* ============================================================
 * Vextro Lyntra — SEO Enhancer
 * Dynamically updates <title>, meta tags, Open Graph, Twitter,
 * canonical URL, and injects JSON-LD Service + FAQ schema on
 * every route/page change. Boosts rankings for each service.
 * ============================================================ */
(function() {
    'use strict';

    // ---------- SEO Data per Page ----------
    const ORIGIN = (location.origin || 'https://vextrolyntra.online').replace(/\/$/, '');
    const BRAND = 'Vextro Lyntra';
    const DEFAULT_IMG = ORIGIN + '/assets/service-web-hero.jpg';

    const PAGE_SEO = {
        home: {
            title: 'Vextro Lyntra — Premium Web, SaaS, AI, SEO & Ads Agency',
            desc: 'Top-rated digital agency delivering premium websites, SaaS platforms, AI automation, SEO, Google & Meta Ads, social media management, and elite branding. 500+ projects delivered.',
            keywords: 'digital agency, web development, SaaS development, AI automation, SEO services, google ads, facebook ads, social media management, graphic design'
        },
        shop: {
            title: 'Digital Products & Templates | Vextro Lyntra Shop',
            desc: 'Browse premium website templates, dashboard UI kits, SaaS boilerplates and marketing assets — instant download, lifetime updates.',
            keywords: 'website templates, ui kits, saas boilerplate, digital products, premium templates'
        },
        blog: {
            title: 'Digital Growth Blog | Web, SaaS, SEO & Marketing Insights',
            desc: 'Actionable guides on web development, SaaS growth, SEO strategy, paid ads, and social media — written by Vextro Lyntra experts.',
            keywords: 'digital marketing blog, seo guide, web development tips, saas growth'
        },
        contact: {
            title: 'Contact Vextro Lyntra — Get a Free Project Quote',
            desc: 'Talk to our team about your next website, SaaS, AI, or marketing project. Free consultation, response within 24 hours.',
            keywords: 'contact digital agency, free quote, project consultation'
        }
    };

    const SERVICE_SEO = {
        web: {
            title: 'Premium Website Development Services | Vextro Lyntra',
            desc: 'Custom, blazing-fast, SEO-ready websites built with modern tech. Starting $99. 100% satisfaction, unlimited revisions, 30-day free support.',
            keywords: 'website development, custom website design, business website, ecommerce website, wordpress alternative, next.js developer',
            offers: { low: 99, high: 999 },
            faqs: [
                ['How long does it take to build a website?', 'Most business websites are delivered in 7-14 days. Complex ecommerce or SaaS sites take 3-6 weeks. You get progress updates every 48 hours.'],
                ['Do you offer unlimited revisions?', 'Yes. We revise the design and copy until you are 100% happy — with zero extra cost. This is part of every Vextro Lyntra plan.'],
                ['Will my website be mobile-friendly and SEO-optimized?', 'Absolutely. Every site is mobile-first, scores 90+ on Google PageSpeed, and includes on-page SEO, schema markup, and semantic HTML.'],
                ['What if I need changes after launch?', 'You get 30 days of free bug fixes, tweaks, and small updates post-launch. After that, monthly care plans start at $29/month.']
            ]
        },
        software: {
            title: 'Custom Software & SaaS Development | Vextro Lyntra',
            desc: 'Enterprise-grade SaaS platforms, dashboards, and custom software. Multi-tenant, secure, scalable. Trusted by 200+ founders worldwide.',
            keywords: 'saas development, custom software, web app development, dashboard development, react developer, node.js developer',
            offers: { low: 499, high: 9999 },
            faqs: [
                ['What tech stack do you use for SaaS?', 'React/Next.js, Node.js, PostgreSQL, Stripe, and cloud-native infra on AWS or Vercel. Fully scalable multi-tenant architecture.'],
                ['Do you handle payment integration?', 'Yes — Stripe, Paddle, LemonSqueezy and PayPal are supported. Subscription billing, invoices, tax and refund flows included.'],
                ['Will I own the source code?', '100%. You get full source code, private GitHub repo access, and complete IP ownership. No vendor lock-in.'],
                ['How do you handle security?', 'End-to-end encryption, JWT auth, rate limiting, SQL-injection protection, GDPR-compliant data handling, and quarterly security audits.']
            ]
        },
        ai: {
            title: 'AI Automation & Integration Services | Vextro Lyntra',
            desc: 'Custom AI chatbots, workflow automation, GPT integration, and RAG systems. Save 40+ hours/week with intelligent business automation.',
            keywords: 'ai automation, chatgpt integration, custom chatbot, ai agency, workflow automation, langchain developer',
            offers: { low: 299, high: 4999 },
            faqs: [
                ['Which AI models do you work with?', 'OpenAI GPT-4, Anthropic Claude, Google Gemini, Meta Llama, and open-source Mistral. We choose the best fit for your budget and use case.'],
                ['Can AI be integrated into my existing tools?', 'Yes — we integrate with Zapier, HubSpot, Salesforce, Slack, WhatsApp, Notion, Airtable and any REST API-enabled platform.'],
                ['What is a RAG system?', 'Retrieval Augmented Generation — an AI trained on YOUR business data (docs, PDFs, database) so it answers accurately without hallucinations.'],
                ['How much does AI automation cost?', 'Starter chatbots begin at $299. Full custom AI agents with RAG and multi-tool workflows range from $1,500 to $5,000.']
            ]
        },
        seo: {
            title: 'Dominant SEO Services — Rank #1 on Google | Vextro Lyntra',
            desc: 'Battle-tested SEO that gets your site to page one. Technical SEO, content strategy, link building, and local SEO — with monthly transparent reports.',
            keywords: 'seo services, seo agency, google ranking, local seo, technical seo, link building, on-page seo',
            offers: { low: 199, high: 2499 },
            faqs: [
                ['How long does SEO take to show results?', 'Initial improvements in 30-60 days. Significant ranking growth in 3-6 months. Dominance and compounding traffic in 6-12 months.'],
                ['Do you follow white-hat SEO?', 'Only 100% white-hat, Google-compliant techniques. No PBNs, no black-hat tactics, no risky shortcuts that could get you penalized.'],
                ['What is included in monthly SEO?', 'Keyword research, on-page optimization, 4-8 pieces of content, 10-30 quality backlinks, technical audits, and detailed monthly reports.'],
                ['Can you guarantee #1 ranking?', 'No ethical SEO agency guarantees rank #1 — but we DO guarantee measurable traffic growth or your next month is free.']
            ]
        },
        ads: {
            title: 'Google Ads Management — Profitable PPC | Vextro Lyntra',
            desc: 'Certified Google Ads experts. Lower cost-per-click, higher ROAS, and transparent reporting. Managed Search, Shopping, YouTube and Performance Max.',
            keywords: 'google ads management, ppc agency, google ads expert, adwords management, performance max, google shopping ads',
            offers: { low: 299, high: 2999 },
            faqs: [
                ['What is the minimum ad budget I need?', 'We recommend $500/month minimum ad spend for meaningful data. Local businesses can start at $300; ecommerce works best at $1,500+.'],
                ['Do you charge on top of ad spend?', 'Yes — our management fee is either flat ($299-$999/mo) or 15% of ad spend, whichever is higher. Fully transparent, no hidden fees.'],
                ['Can you fix a failing Google Ads account?', 'Absolutely. We audit your account free, identify wasted spend, restructure campaigns, and typically reduce CPA by 30-60% in 60 days.'],
                ['Which industries do you specialize in?', 'Ecommerce, SaaS, local services, real estate, coaching, and healthcare. 500+ campaigns managed across 40+ industries.']
            ]
        },
        fb: {
            title: 'Facebook & Instagram Ads Management | Vextro Lyntra',
            desc: 'Meta Ads experts running high-ROAS Facebook & Instagram campaigns. Creative strategy, pixel setup, retargeting, and daily optimization.',
            keywords: 'facebook ads, instagram ads, meta ads agency, facebook ads management, meta ads expert, ecommerce ads',
            offers: { low: 299, high: 2999 },
            faqs: [
                ['What ROAS can I realistically expect?', 'Ecommerce clients average 3.5x-6x ROAS. Lead generation clients average $4-$18 per qualified lead depending on industry.'],
                ['Do you create the ad creatives too?', 'Yes — we design static ads, carousels, and short-form video ads in-house. All creatives A/B tested for maximum performance.'],
                ['How is iOS 14+ tracking handled?', 'We set up Conversions API (CAPI), server-side tracking, and UTM structures to bypass Apple\'s privacy limitations and recover 60-80% of lost data.'],
                ['Can you scale a winning campaign?', 'That is our specialty. We use CBO, ABO, and lookalike stacking to scale winners from $50/day to $5,000/day without breaking ROAS.']
            ]
        },
        social: {
            title: 'Premium Social Media Management | Vextro Lyntra',
            desc: 'Full-service social media management: content creation, community management, growth strategy, and analytics for Instagram, TikTok, LinkedIn & X.',
            keywords: 'social media management, instagram growth, tiktok agency, linkedin marketing, content creation, social media agency',
            offers: { low: 249, high: 1999 },
            faqs: [
                ['How many posts do you publish per month?', 'Standard plan: 20 posts + 12 reels. Premium: 30 posts + 20 reels + 60 stories. All content designed and copywritten in-house.'],
                ['Do you handle DMs and comments?', 'Yes — community management is included. We reply to comments in under 2 hours during business hours and forward hot leads to you instantly.'],
                ['Can you grow my followers organically?', 'Yes. Our clients average 8-25% monthly follower growth using content strategy, engagement pods, hashtag research, and reels-first strategy.'],
                ['Which platforms do you support?', 'Instagram, TikTok, LinkedIn, X (Twitter), Facebook, Pinterest, YouTube Shorts, and Threads. Multi-platform bundle discounts available.']
            ]
        },
        graphic: {
            title: 'Elite Graphic Design & Branding | Vextro Lyntra',
            desc: 'Premium logo design, complete brand identity, packaging, and marketing collateral. Award-winning designers, unlimited revisions, from $79.',
            keywords: 'graphic design agency, logo design, brand identity, packaging design, business card design, brand book',
            offers: { low: 79, high: 449 },
            faqs: [
                ['How many logo concepts do I get?', 'Standard: 3 unique concepts + unlimited revisions on your favorite. Premium: 6 concepts across different styles. Delivery in 3-5 days.'],
                ['What files do I receive?', 'All source files: AI, PSD, SVG, PDF, PNG, JPG in every size and color variant, plus a full brand book PDF with usage guidelines.'],
                ['Do you offer 100% original designs?', 'Every design is custom, never templated, and copyright-transferred to you. We provide a signed IP ownership document with delivery.'],
                ['Can I get my logo urgently?', 'Yes — 48-hour rush delivery available at +50% fee. Otherwise, standard delivery is 3-5 business days.']
            ]
        }
    };

    // ---------- Helpers ----------
    function setMeta(name, content, isProperty) {
        if (!content) return;
        const attr = isProperty ? 'property' : 'name';
        let el = document.querySelector('meta[' + attr + '="' + name + '"]');
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }
    function setLink(rel, href) {
        let el = document.querySelector('link[rel="' + rel + '"]');
        if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', rel);
            document.head.appendChild(el);
        }
        el.setAttribute('href', href);
    }
    function injectJSONLD(id, data) {
        const old = document.getElementById(id);
        if (old) old.remove();
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.id = id;
        s.textContent = JSON.stringify(data);
        document.head.appendChild(s);
    }
    function clearDynamicSchema() {
        ['vl-schema-service', 'vl-schema-faq', 'vl-schema-breadcrumb'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    // ---------- Apply SEO ----------
    function applySEO(pageKey, serviceKey) {
        const canonical = ORIGIN + location.pathname;
        clearDynamicSchema();

        let seo;
        if (serviceKey && SERVICE_SEO[serviceKey]) {
            seo = SERVICE_SEO[serviceKey];
        } else {
            seo = PAGE_SEO[pageKey] || PAGE_SEO.home;
        }

        document.title = seo.title;
        setMeta('description', seo.desc);
        setMeta('keywords', seo.keywords);
        setMeta('author', BRAND);
        setMeta('robots', 'index, follow, max-image-preview:large');

        // Open Graph
        setMeta('og:title', seo.title, true);
        setMeta('og:description', seo.desc, true);
        setMeta('og:type', serviceKey ? 'article' : 'website', true);
        setMeta('og:site_name', BRAND, true);
        setMeta('og:url', canonical, true);
        setMeta('og:image', DEFAULT_IMG, true);

        // Twitter
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', seo.title);
        setMeta('twitter:description', seo.desc);
        setMeta('twitter:image', DEFAULT_IMG);

        setLink('canonical', canonical);

        // Service + FAQ JSON-LD
        if (serviceKey && seo.faqs) {
            injectJSONLD('vl-schema-service', {
                '@context': 'https://schema.org',
                '@type': 'Service',
                'name': seo.title,
                'description': seo.desc,
                'provider': {
                    '@type': 'Organization',
                    'name': BRAND,
                    'url': ORIGIN
                },
                'areaServed': 'Worldwide',
                'offers': {
                    '@type': 'AggregateOffer',
                    'priceCurrency': 'USD',
                    'lowPrice': seo.offers.low,
                    'highPrice': seo.offers.high
                },
                'aggregateRating': {
                    '@type': 'AggregateRating',
                    'ratingValue': '4.9',
                    'reviewCount': '187'
                }
            });
            injectJSONLD('vl-schema-faq', {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                'mainEntity': seo.faqs.map(([q, a]) => ({
                    '@type': 'Question',
                    'name': q,
                    'acceptedAnswer': { '@type': 'Answer', 'text': a }
                }))
            });
            injectJSONLD('vl-schema-breadcrumb', {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': ORIGIN + '/' },
                    { '@type': 'ListItem', 'position': 2, 'name': 'Services', 'item': ORIGIN + '/#services' },
                    { '@type': 'ListItem', 'position': 3, 'name': seo.title }
                ]
            });
        }
    }
    window.vlApplySEO = applySEO;

    // ---------- Hook route changes ----------
    function detectAndApply() {
        try {
            const hash = (location.hash || '').replace('#', '');
            const path = (location.pathname || '/').replace(/^\//, '').replace(/\/$/, '');
            const route = hash || path || 'home';

            if (route.indexOf('service') === 0) {
                const id = route.replace('service/', '').replace('service-', '');
                applySEO(null, id);
            } else {
                applySEO(route || 'home', null);
            }
        } catch(e) { console.warn('SEO enhance error', e); }
    }

    // Wrap showPage / showService if available
    function wrap() {
        if (typeof window.showPage === 'function' && !window.showPage.__vlSeo) {
            const orig = window.showPage;
            window.showPage = function(p, s) {
                const r = orig.apply(this, arguments);
                try { applySEO(p, null); } catch(e) {}
                return r;
            };
            window.showPage.__vlSeo = true;
        }
        if (typeof window.showService === 'function' && !window.showService.__vlSeo) {
            const orig = window.showService;
            window.showService = function(id) {
                const r = orig.apply(this, arguments);
                try { applySEO(null, id); } catch(e) {}
                return r;
            };
            window.showService.__vlSeo = true;
        }
    }

    // Initial + retry (main.js may load after)
    document.addEventListener('DOMContentLoaded', () => {
        wrap(); detectAndApply();
        setTimeout(() => { wrap(); detectAndApply(); }, 500);
        setTimeout(() => { wrap(); detectAndApply(); }, 1500);
    });
    window.addEventListener('popstate', detectAndApply);
    window.addEventListener('hashchange', detectAndApply);
})();
