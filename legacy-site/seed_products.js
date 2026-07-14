const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('./backend/models/database');

const dbPath = path.join(__dirname, 'backend', 'data', 'database.sqlite');
const db = new Database(dbPath);

const assetDir = path.join(__dirname, 'assets', 'products');
if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true });
}

// Download helper
function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

// Known tech/dashboard/software unsplash IDs
const unsplashIds = [
    '1551288049-bebda4e38f71', '1460925895917-afdab827c52f', '1555066931-4365d14bab8c', '1504868584819-f8e8b4b6d7e3', 
    '1531403009284-440f080d1e12', '1498050108023-c5249f4df085', '1461749280684-dccba630e2f6', '1517694712202-14dd9538aa97',
    '1507238691740-14c27d7620f1', '1522881115143-ef7b5a837a78', '1454165804606-c3d57bc86b40', '1457305237443-44c3d5a30b89',
    '1551288049-bebda4e38f71', '1460925895917-afdab827c52f', '1555066931-4365d14bab8c', '1504868584819-f8e8b4b6d7e3'
];

const productsData = [
    {
        title: "Perfex CRM - Powerful Open Source CRM",
        category: "PHP Scripts",
        price: 59,
        oldPrice: 120,
        shortDesc: "Complete Customer Relationship Management software that is a great fit for almost any company, freelancer or many other uses.",
        features: ["Project Management", "Invoicing", "Support Tickets", "Leads Tracking", "Finance Management"],
        included: ["Full Source Code", "6 Months Support", "Future Updates"]
    },
    {
        title: "MagicAI - OpenAI Content, Text, Image Generator",
        category: "SaaS Software",
        price: 39,
        oldPrice: 79,
        shortDesc: "The most advanced AI platform to generate text, images, and code using GPT-4 and DALL-E 3 technologies.",
        features: ["AI Text Generator", "AI Image Generator", "AI Code Generator", "SaaS Ready", "Subscription Billing"],
        included: ["SaaS Platform Code", "Admin Panel", "Payment Gateways"]
    },
    {
        title: "Acelle - Email Marketing Web Application",
        category: "Marketing",
        price: 49,
        oldPrice: 99,
        shortDesc: "Self-hosted, full-featured, and easy to use email marketing web application written in PHP.",
        features: ["Campaign Management", "List Segmentation", "Autoresponders", "Bounce Handling", "SMTP Integration"],
        included: ["Acelle Source Code", "API Documentation", "Email Templates"]
    },
    {
        title: "Stackposts - Social Media Marketing Tool",
        category: "Marketing",
        price: 45,
        oldPrice: 89,
        shortDesc: "Social media marketing tool that allows and helps you to easily auto post, schedule Instagram posts along with Facebook, Twitter.",
        features: ["Auto Posting", "Analytics", "Multi-Account Support", "Watermark Support", "Proxy Manager"],
        included: ["Web App", "Documentation", "Free Installation"]
    },
    {
        title: "FileBird - WordPress Media Library Folders",
        category: "WordPress Plugins",
        price: 39,
        oldPrice: 0,
        shortDesc: "Organize thousands of WordPress media files into folders/categories at ease.",
        features: ["Drag and Drop Interface", "Unlimited Folders", "Smart Search", "Gutenberg Ready", "Multilingual"],
        included: ["Plugin ZIP", "License Key", "6 Months Support"]
    },
    {
        title: "Active eCommerce CMS",
        category: "eCommerce",
        price: 59,
        oldPrice: 150,
        shortDesc: "Most complete eCommerce solution for your business. Multi-vendor, multi-currency, and multi-language support.",
        features: ["Multi Vendor System", "B2B Module", "Refund System", "Flash Deals", "Wallet System"],
        included: ["Web Source Code", "Customer App Code", "Delivery Boy App"]
    },
    {
        title: "Educa LMS - Learning Management System",
        category: "PHP Scripts",
        price: 55,
        oldPrice: 110,
        shortDesc: "Advanced eLearning platform to sell online courses, manage instructors and students with zoom integration.",
        features: ["Course Builder", "Zoom Integration", "Certificate Generator", "Quizzes", "Payment Gateways"],
        included: ["Full Source Code", "Instructor Dashboard", "Student Panel"]
    },
    {
        title: "Store Locator - Google Maps for WordPress",
        category: "WordPress Plugins",
        price: 25,
        oldPrice: 50,
        shortDesc: "Advanced Google Maps Store Locator for WordPress with custom map markers, categories and directions.",
        features: ["Google Maps Integration", "Custom Markers", "Store Directions", "Radius Search", "CSV Import"],
        included: ["Plugin File", "User Guide", "Premium Support"]
    },
    {
        title: "Ultimate POS - Point of Sale & Inventory",
        category: "PHP Scripts",
        price: 65,
        oldPrice: 130,
        shortDesc: "Best stock management and point of sale software for retail, restaurant, and wholesale businesses.",
        features: ["Inventory Management", "Barcode Printing", "Multi-Store Support", "Tax Management", "Reports"],
        included: ["POS Software", "Database Script", "Installation Guide"]
    },
    {
        title: "ChatPion - Facebook & WhatsApp Bot",
        category: "SaaS Software",
        price: 49,
        oldPrice: 100,
        shortDesc: "White label SaaS platform for multi-channel marketing, auto-reply, and eCommerce inside Messenger & WhatsApp.",
        features: ["WhatsApp Bot", "Messenger Bot", "eCommerce Store", "SMS Broadcasting", "Email Marketing"],
        included: ["SaaS Application", "Admin Dashboard", "Reseller System"]
    }
];

async function seedProducts() {
    await db.init();
    
    for (let i = 0; i < productsData.length; i++) {
        const prod = productsData[i];
        console.log(`Processing ${prod.title}...`);
        
        // Randomly pick a main image ID
        const mainImageId = unsplashIds[Math.floor(Math.random() * unsplashIds.length)];
        const mainImageUrl = `https://images.unsplash.com/photo-${mainImageId}?w=800&q=80`;
        const localMainFilename = `prod_${i}_main.jpg`;
        const localMainPath = path.join(assetDir, localMainFilename);
        
        await downloadImage(mainImageUrl, localMainPath);
        
        // Add product to DB
        const dbData = {
            title: prod.title,
            category: prod.category,
            price: prod.price,
            oldPrice: prod.oldPrice,
            discount: '-' + Math.round((1 - (prod.price/prod.oldPrice))*100) + '%',
            shortDesc: prod.shortDesc,
            fullDesc: prod.shortDesc + " This is a complete solution. It has all the necessary features you would expect from a top-tier CodeCanyon product. We have carefully integrated everything so you can launch instantly.",
            features: prod.features,
            included: prod.included,
            image: `assets/products/${localMainFilename}`,
            badge: i < 3 ? 'Best Seller' : '',
            badgeColor: i < 3 ? '#ef4444' : '',
            rating: (4 + Math.random()).toFixed(1),
            reviews: Math.floor(Math.random() * 500) + 50,
            sold: Math.floor(Math.random() * 2000) + 100,
        };
        
        db.createProduct(dbData);
        
        // Let's pretend it has 5 images (we'll just use the same image path for the gallery in the UI, or we can download 4 more)
        console.log(`Saved ${prod.title}`);
    }
    
    console.log("Finished seeding 10+ products!");
}

seedProducts().catch(console.error);
