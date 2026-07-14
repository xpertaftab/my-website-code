const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('./backend/models/database');

const dbPath = path.join(__dirname, 'backend', 'data', 'database.sqlite');
const db = new Database(dbPath);

const assetDir = path.join(__dirname, 'assets', 'products');

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

const unsplashIds = [
    '1551288049-bebda4e38f71', '1460925895917-afdab827c52f', '1555066931-4365d14bab8c', '1504868584819-f8e8b4b6d7e3', 
    '1531403009284-440f080d1e12', '1498050108023-c5249f4df085', '1461749280684-dccba630e2f6', '1517694712202-14dd9538aa97',
    '1507238691740-14c27d7620f1', '1522881115143-ef7b5a837a78', '1454165804606-c3d57bc86b40', '1457305237443-44c3d5a30b89'
];

async function updateGalleries() {
    await db.init();
    
    const products = db.getProducts();
    console.log(`Found ${products.length} products to update.`);
    
    for (let i = 0; i < products.length; i++) {
        const prod = products[i];
        console.log(`Adding gallery to ${prod.title}...`);
        
        let gallery = [prod.image]; // Start with the main image
        
        // Download 4 more images
        for (let j = 1; j <= 4; j++) {
            const randomId = unsplashIds[Math.floor(Math.random() * unsplashIds.length)];
            const imageUrl = `https://images.unsplash.com/photo-${randomId}?w=800&q=80`;
            const filename = `prod_${prod.id}_gallery_${j}.jpg`;
            const filepath = path.join(assetDir, filename);
            
            await downloadImage(imageUrl, filepath);
            gallery.push(`assets/products/${filename}`);
        }
        
        db.updateProduct(prod.id, { gallery: gallery });
        console.log(`Updated ${prod.title} with 5 images.`);
    }
    
    console.log("Finished updating galleries!");
}

updateGalleries().catch(console.error);
