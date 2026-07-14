const path = require('path');
const Database = require('./backend/models/database');

const dbPath = path.join(__dirname, 'backend', 'data', 'database.sqlite');
const db = new Database(dbPath);

const wpImages = [
    'wp_tj.webp',
    'wp_yg.webp',
    'wp_y.webp',
    'wp_web_dev_xm.webp',
    'wp_envato_head.png',
    'wp_self_intro.jpg',
    'wp_product_icon.png',
    'wp_pexels_cottonbro.jpg',
    'wp_pexels_mowgli.jpg',
    'wp_pexels_ketut.jpg',
    'wp_pexels_mowgli2.jpg',
    'wp_01_preview_magic9.9.jpg'
];

function pickImg() {
    return 'assets/products/' + wpImages[Math.floor(Math.random() * wpImages.length)];
}

const newProducts = [
    {
        title: "WhatsApp CRM & Bulk Messenger",
        category: "SaaS Software",
        price: 69,
        oldPrice: 149,
        shortDesc: "Complete WhatsApp Business CRM with bulk messaging, auto-reply, chatbot, contact management, and broadcasting features.",
        features: ["Bulk Messaging", "Auto Reply Bot", "Contact Management", "Broadcasting", "Analytics Dashboard"],
        included: ["Full Source Code", "API Documentation", "Installation Support"]
    },
    {
        title: "SEO Optimizer Pro - Rank Tracker",
        category: "SEO",
        price: 35,
        oldPrice: 79,
        shortDesc: "Advanced SEO tool for keyword tracking, competitor analysis, site audits, and rank monitoring across search engines.",
        features: ["Keyword Tracker", "Competitor Analysis", "Site Audit", "Rank Monitor", "Report Generator"],
        included: ["Web Application", "Database Script", "User Manual"]
    },
    {
        title: "Ultimate AdSense Manager",
        category: "AdSense",
        price: 29,
        oldPrice: 59,
        shortDesc: "Manage multiple AdSense accounts, track earnings, optimize ad placements, and maximize revenue with smart analytics.",
        features: ["Multi-Account Support", "Earnings Tracker", "Ad Placement Optimizer", "Revenue Analytics", "Auto Optimization"],
        included: ["Admin Panel", "Reporting Module", "1 Year Updates"]
    },
    {
        title: "Python Automation Bot Framework",
        category: "Automation",
        price: 45,
        oldPrice: 99,
        shortDesc: "Enterprise-grade Python automation framework for web scraping, data processing, social media automation, and task scheduling.",
        features: ["Web Scraping", "Task Scheduler", "Proxy Rotation", "Multi-threading", "Logging System"],
        included: ["Source Code", "Example Scripts", "Documentation"]
    },
    {
        title: "React Native Mobile App Builder",
        category: "Tools & Software",
        price: 79,
        oldPrice: 169,
        shortDesc: "Complete React Native boilerplate with authentication, payment integration, push notifications, and CMS backend.",
        features: ["Auth System", "Payment Gateway", "Push Notifications", "CMS Backend", "Multi-language"],
        included: ["Frontend Code", "Backend API", "Admin Dashboard"]
    },
    {
        title: "YouTube Growth & Automation Tool",
        category: "Automation",
        price: 39,
        oldPrice: 89,
        shortDesc: "Automate YouTube channel growth with smart comment replies, video scheduling, analytics tracking, and SEO optimization.",
        features: ["Auto Comment Reply", "Video Scheduler", "Analytics", "SEO Optimizer", "Bulk Upload"],
        included: ["Full Software", "API Keys Setup", "Video Tutorials"]
    },
    {
        title: "WooCommerce Multi-Vendor Marketplace",
        category: "eCommerce",
        price: 89,
        oldPrice: 199,
        shortDesc: "Complete multi-vendor marketplace solution for WooCommerce with vendor dashboards, commission system, and withdrawal requests.",
        features: ["Vendor Dashboard", "Commission System", "Withdrawals", "Product Management", "Rating System"],
        included: ["Plugin Files", "Documentation", "6 Months Support"]
    },
    {
        title: "Google Ads Intelligence Platform",
        category: "AdSense",
        price: 49,
        oldPrice: 99,
        shortDesc: "AI-powered Google Ads management platform with smart bidding, keyword research, ad copy generation, and performance tracking.",
        features: ["Smart Bidding", "Keyword Research", "Ad Copy Generator", "Performance Dashboard", "Budget Optimizer"],
        included: ["SaaS Application", "Admin Interface", "API Integration"]
    },
    {
        title: "Laravel Admin Panel Generator",
        category: "Code Scripts",
        price: 55,
        oldPrice: 119,
        shortDesc: "Rapid admin panel builder for Laravel with CRUD generation, role management, media manager, and responsive design.",
        features: ["CRUD Generator", "Role Management", "Media Manager", "Theme System", "API Builder"],
        included: ["Laravel Package", "Starter Template", "Developer Guide"]
    },
    {
        title: "Instagram Marketing Suite",
        category: "Tools & Software",
        price: 34,
        oldPrice: 74,
        shortDesc: "Full Instagram marketing toolkit with auto posting, stories scheduler, DM automation, hashtag research, and analytics.",
        features: ["Auto Poster", "Stories Scheduler", "DM Automation", "Hashtag Research", "Analytics"],
        included: ["Software License", "Setup Guide", "Premium Support"]
    },
    {
        title: "Node.js REST API Boilerplate",
        category: "Code Scripts",
        price: 42,
        oldPrice: 89,
        shortDesc: "Production-ready Node.js REST API with authentication, database integration, file upload, email service, and Docker support.",
        features: ["JWT Auth", "Database ORM", "File Upload", "Email Service", "Docker Setup"],
        included: ["Complete Source", "Postman Collection", "Deployment Guide"]
    },
    {
        title: "AI Content Writer & Blog Generator",
        category: "SaaS Software",
        price: 59,
        oldPrice: 129,
        shortDesc: "AI-powered content writing platform with GPT integration, batch generation, SEO analysis, and WordPress auto-posting.",
        features: ["AI Writing", "Batch Generation", "SEO Analysis", "WordPress Auto-Post", "Template Library"],
        included: ["SaaS Platform", "Admin Dashboard", "API Access"]
    },
    {
        title: "Facebook Pixel & Retargeting Tool",
        category: "SEO",
        price: 25,
        oldPrice: 55,
        shortDesc: "Advanced Facebook Pixel manager with event tracking, custom audiences, retargeting automation, and conversion analytics.",
        features: ["Pixel Manager", "Event Tracking", "Custom Audiences", "Retargeting", "Conversion Analytics"],
        included: ["Plugin Files", "Integration Guide", "Email Support"]
    },
    {
        title: "Telegram Bot & Notification System",
        category: "Automation",
        price: 32,
        oldPrice: 69,
        shortDesc: "Multi-purpose Telegram bot builder with notification system, command handling, payment integration, and group management.",
        features: ["Bot Builder", "Notifications", "Command System", "Payment Integration", "Group Manager"],
        included: ["Source Code", "Bot Setup Guide", "Hosting Config"]
    },
    {
        title: "Professional Logo & Branding Kit",
        category: "Tools & Software",
        price: 19,
        oldPrice: 49,
        shortDesc: "Complete branding package with customizable logo templates, business card designs, social media kits, and brand guidelines.",
        features: ["Logo Templates", "Business Cards", "Social Media Kit", "Brand Guidelines", "Vector Files"],
        included: ["Editable Files", "Font Pack", "Usage License"]
    },
    {
        title: "Affiliate Marketing Platform",
        category: "eCommerce",
        price: 74,
        oldPrice: 159,
        shortDesc: "Full affiliate marketing platform with commission tracking, referral links, payout management, and performance analytics.",
        features: ["Commission Tracking", "Referral Links", "Payout System", "Performance Dashboard", "Coupon Engine"],
        included: ["Complete System", "Merchant Panel", "Affiliate Panel"]
    },
    {
        title: "Advanced Web Scraper & Data Extractor",
        category: "Code Scripts",
        price: 38,
        oldPrice: 84,
        shortDesc: "Powerful PHP-based web scraper with proxy support, CSS selectors, scheduled scraping, and CSV/JSON export.",
        features: ["CSS Selectors", "Proxy Support", "Scheduled Scraping", "CSV/JSON Export", "Multi-threading"],
        included: ["PHP Scripts", "Configuration Files", "Usage Examples"]
    },
    {
        title: "Social Media Auto Poster - Multi Platform",
        category: "Automation",
        price: 44,
        oldPrice: 94,
        shortDesc: "Schedule and auto-post content across Facebook, Instagram, Twitter, LinkedIn, and Pinterest from one dashboard.",
        features: ["Multi-Platform", "Schedule Posts", "Media Library", "Analytics", "Team Collaboration"],
        included: ["Web Application", "API Integrations", "User Manual"]
    },
    {
        title: "E-commerce Dropshipping Management",
        category: "eCommerce",
        price: 65,
        oldPrice: 139,
        shortDesc: "Complete dropshipping management system with supplier integration, order tracking, inventory sync, and profit calculator.",
        features: ["Supplier Integration", "Order Tracking", "Inventory Sync", "Profit Calculator", "Shipping Manager"],
        included: ["Source Code", "Database Schema", "Integration Guide"]
    },
    {
        title: "PDF Generation & Document Automation",
        category: "Code Scripts",
        price: 28,
        oldPrice: 59,
        shortDesc: "PHP-based PDF generation system with templates, dynamic content, batch processing, and cloud storage integration.",
        features: ["Template System", "Dynamic Content", "Batch Processing", "Cloud Storage", "API Support"],
        included: ["PHP Library", "Sample Templates", "Developer Docs"]
    }
];

const extraListings = [
    {
        title: "Premium YouTube Channel - Gaming Niche",
        category: "YouTube Channel",
        price: 2500,
        description: "Monetized YouTube channel with 50K subscribers in gaming niche. Consistent monthly growth and high engagement.",
        status: "Active",
        stats: [
            { label: "Subscribers", value: "50K" },
            { label: "Views/Mo", value: "200K" },
            { label: "Revenue/Mo", value: "$800" }
        ],
        info: [
            { label: "Niche", value: "Gaming" },
            { label: "Age", value: "18 months" },
            { label: "Country", value: "Pakistan" }
        ]
    },
    {
        title: "Facebook Page - News & Media",
        category: "Facebook Page",
        price: 1800,
        description: "Verified Facebook news page with 300K followers. High daily traffic and engagement rate.",
        status: "Active",
        stats: [
            { label: "Followers", value: "300K" },
            { label: "Reach/Mo", value: "1.2M" },
            { label: "Revenue/Mo", value: "$500" }
        ],
        info: [
            { label: "Category", value: "News & Media" },
            { label: "Age", value: "2 years" },
            { label: "Country", value: "Pakistan" }
        ]
    },
    {
        title: "Instagram Page - Fitness Niche",
        category: "Instagram Page",
        price: 1200,
        description: "High-engagement Instagram fitness page with 150K real followers. Daily posts and stories with affiliate revenue.",
        status: "Active",
        stats: [
            { label: "Followers", value: "150K" },
            { label: "Engagement", value: "8%" },
            { label: "Revenue/Mo", value: "$300" }
        ],
        info: [
            { label: "Niche", value: "Fitness" },
            { label: "Age", value: "1 year" },
            { label: "Country", value: "Pakistan" }
        ]
    },
    {
        title: "TikTok Account - Comedy Content",
        category: "TikTok Account",
        price: 3500,
        description: "Viral TikTok comedy account with 500K followers. Multiple videos with 1M+ views. Monetization enabled.",
        status: "Active",
        stats: [
            { label: "Followers", value: "500K" },
            { label: "Avg Views", value: "200K" },
            { label: "Revenue/Mo", value: "$1,200" }
        ],
        info: [
            { label: "Niche", value: "Comedy" },
            { label: "Age", value: "8 months" },
            { label: "Country", value: "India" }
        ]
    }
];

async function seedAll() {
    await db.init();

    console.log('Adding new shop products...');
    for (let i = 0; i < newProducts.length; i++) {
        const p = newProducts[i];
        const img = pickImg();
        const discount = '-' + Math.round((1 - (p.price / p.oldPrice)) * 100) + '%';
        const dbData = {
            title: p.title,
            category: p.category,
            price: p.price,
            oldPrice: p.oldPrice,
            discount: discount,
            shortDesc: p.shortDesc,
            fullDesc: p.shortDesc + " This premium digital product is thoroughly tested and ready for immediate use. Includes full documentation and support.",
            features: p.features,
            included: p.included,
            image: img,
            badge: i < 5 ? 'Best Seller' : (i < 10 ? 'Trending' : ''),
            badgeColor: i < 5 ? '#ef4444' : (i < 10 ? '#f97316' : ''),
            rating: (4 + Math.random()).toFixed(1),
            reviews: Math.floor(Math.random() * 400) + 30,
            sold: Math.floor(Math.random() * 1500) + 50,
            gallery: [img, pickImg(), pickImg(), pickImg(), pickImg()]
        };
        db.createProduct(dbData);
        console.log(`  [${i + 1}/${newProducts.length}] ${p.title} - $${p.price}`);
    }

    console.log('\nAdding marketplace listings...');
    for (const l of extraListings) {
        db.createListing({
            title: l.title,
            category: l.category,
            price: l.price,
            description: l.description,
            status: l.status,
            location: l.info.find(i => i.label === "Country")?.value || "Pakistan",
            image: pickImg(),
            stats: l.stats,
            info: l.info,
            whatsapp: "+923281270900",
            negotiable: "Yes"
        });
        console.log(`  ${l.title} - $${l.price}`);
    }

    console.log('\nAdding blog posts...');
    const blogImages = [
        'wp_pexels_cottonbro.jpg',
        'wp_pexels_mowgli.jpg',
        'wp_pexels_ketut.jpg',
        'wp_pexels_mowgli2.jpg',
        'wp_web_dev_xm.webp',
        'wp_tj.webp'
    ];

    const blogs = [
        {
            title: "Top 10 PHP Scripts for Your Online Business in 2026",
            category: "Technology",
            excerpt: "Discover the most powerful PHP scripts that can transform your online business operations and boost revenue.",
            image: 'assets/products/' + blogImages[0],
            readTime: "6 min read",
            date: "June 1, 2026",
            content: "<p>PHP continues to dominate the web development landscape. In this article, we explore the top 10 PHP scripts that every online business owner should consider in 2026.</p><h2>Why PHP Scripts Matter</h2><p>PHP scripts power millions of websites worldwide. They offer flexibility, scalability, and cost-effectiveness for businesses of all sizes.</p><h2>Our Top Picks</h2><p>From CRM systems to e-commerce solutions, our curated list covers the best PHP scripts available in the market today.</p>"
        },
        {
            title: "How to Automate Your Social Media Marketing",
            category: "Business",
            excerpt: "Learn how to save hours of work daily by automating your social media posts, engagement, and analytics tracking.",
            image: 'assets/products/' + blogImages[1],
            readTime: "5 min read",
            date: "May 28, 2026",
            content: "<p>Social media automation is no longer optional - it's essential for staying competitive. Learn how to leverage automation tools effectively.</p><h2>Benefits of Automation</h2><p>Save time, maintain consistency, and improve engagement with smart automation strategies.</p>"
        },
        {
            title: "Google AdSense Approval Guide 2026 - Fast Track",
            category: "Business",
            excerpt: "Step-by-step guide to getting your Google AdSense account approved quickly with proven strategies and tips.",
            image: 'assets/products/' + blogImages[2],
            readTime: "8 min read",
            date: "May 22, 2026",
            content: "<p>Getting AdSense approval can be challenging. This guide covers everything you need to know about getting approved fast.</p><h2>Key Requirements</h2><p>Quality content, proper site structure, and traffic are the three pillars of AdSense approval.</p>"
        },
        {
            title: "Building Scalable Web Applications with Node.js",
            category: "Technology",
            excerpt: "A comprehensive guide to building high-performance, scalable web applications using Node.js and modern JavaScript.",
            image: 'assets/products/' + blogImages[3],
            readTime: "7 min read",
            date: "May 18, 2026",
            content: "<p>Node.js has revolutionized backend development. Learn how to build production-ready applications that scale.</p>"
        },
        {
            title: "SEO Trends 2026: What You Need to Know",
            category: "Technology",
            excerpt: "Stay ahead of the competition with the latest SEO trends and algorithm updates for 2026.",
            image: 'assets/products/' + blogImages[4],
            readTime: "5 min read",
            date: "May 15, 2026",
            content: "<p>Search engine optimization continues to evolve. Stay updated with the latest trends that matter.</p>"
        },
        {
            title: "The Ultimate Guide to Digital Asset Investing",
            category: "Business",
            excerpt: "Learn how to build wealth by investing in digital assets - websites, YouTube channels, and social media accounts.",
            image: 'assets/products/' + blogImages[5],
            readTime: "10 min read",
            date: "May 10, 2026",
            content: "<p>Digital assets are the new real estate. Discover how to identify, acquire, and profit from digital properties.</p>"
        }
    ];

    for (const blog of blogs) {
        db.createBlog(blog);
        console.log(`  ${blog.title}`);
    }

    console.log('\nSeed completed successfully!');
    console.log(`  - ${newProducts.length} products added`);
    console.log(`  - ${extraListings.length} marketplace listings added`);
    console.log(`  - ${blogs.length} blog posts added`);

    process.exit(0);
}

seedAll().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
