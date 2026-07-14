const fs = require('fs');

const code = fs.readFileSync('js/main.js', 'utf8');
const lines = code.split('\n');

let startIndex = -1;
let endIndex = -1;

for(let i=0; i<lines.length; i++){
    if(lines[i].includes('let currentProductId = null;')) startIndex = i;
    if(lines[i].includes('// Directly show product detail, bypass showPage to avoid override issues')) endIndex = i;
}

if (startIndex !== -1 && endIndex !== -1) {
const newLogic = `let currentProductId = null;

window.openProduct = function(id) {
    const p = window.PRODUCTS_DATA ? window.PRODUCTS_DATA[id] : null;
    if (!p) return;
    currentProductId = id;

    try {
        if(document.getElementById('pdBreadcrumbTitle')) document.getElementById('pdBreadcrumbTitle').innerText = p.title;
        if(document.getElementById('pdHeroImage')) document.getElementById('pdHeroImage').src = p.image;
        
        const thumbContainer = document.getElementById('pdThumbnailsContainer');
        if (thumbContainer) {
            thumbContainer.innerHTML = '';
            const gallery = (p.gallery && p.gallery.length > 0) ? p.gallery : [p.image];
            gallery.forEach((imgSrc, idx) => {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = 'Thumb';
                img.style.cursor = 'pointer';
                if (idx === 0) img.className = 'active';
                img.onclick = () => {
                    document.getElementById('pdHeroImage').src = imgSrc;
                    Array.from(thumbContainer.children).forEach(c => c.classList.remove('active'));
                    img.classList.add('active');
                };
                thumbContainer.appendChild(img);
            });
        }
        
        if(document.getElementById('pdCategory')) document.getElementById('pdCategory').innerText = p.category;
        if(document.getElementById('pdTitle')) document.getElementById('pdTitle').innerText = p.title;
        if(document.getElementById('pdRating')) document.getElementById('pdRating').innerText = p.rating ? p.rating.toFixed(1) : "5.0";
        if(document.getElementById('pdReviewCount')) document.getElementById('pdReviewCount').innerText = p.reviews || "0";
        if(document.getElementById('pdSoldCount')) document.getElementById('pdSoldCount').innerText = p.sold || "0";
        if(document.getElementById('pdShortDesc')) document.getElementById('pdShortDesc').innerText = p.shortDesc;
        if(document.getElementById('pdCurrentPrice')) document.getElementById('pdCurrentPrice').innerText = p.price;
        if(document.getElementById('pdOldPrice')) document.getElementById('pdOldPrice').innerText = 'USD ' + p.oldPrice;

        const discBadge = document.getElementById('pdBadgeDiscount');
        if (discBadge) {
            discBadge.innerText = p.discount;
            discBadge.style.display = p.discount ? 'block' : 'none';
        }

        const featBadge = document.getElementById('pdBadgeFeatured');
        if (featBadge) {
            if (p.badge) {
                featBadge.innerText = p.badge.replace('? ', '').replace('?? ', '');
                featBadge.style.display = 'block';
            } else {
                featBadge.style.display = 'none';
            }
        }

        const waLink = 'https://wa.me/923281270900?text=' + encodeURIComponent(p.whatsappMsg || '');
        if(document.getElementById('pdBuyNow')) document.getElementById('pdBuyNow').href = waLink;

        if(document.getElementById('pdFullDesc')) document.getElementById('pdFullDesc').innerHTML = \`<p>\${p.fullDesc}</p>\`;
        if(document.getElementById('pdFeatures')) document.getElementById('pdFeatures').innerHTML = (p.features||[]).map(f => \`<li>\${f}</li>\`).join('');

        const reviewsEl = document.getElementById('pdReviews');
        if (reviewsEl) {
            const fakeReviews = [
                { name: "Shikha Rajani", avatar: "S", date: "5/9/2026", text: "This is really good script and working fine" },
                { name: "John Doe", avatar: "J", date: "4/20/2026", text: "Excellent product, exactly what I needed for my project. highly recommended." }
            ];
            
            let revHtml = '';
            fakeReviews.forEach(r => {
                revHtml += \`
                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
                    <div class="pd-rev-header">
                        <div class="pd-rev-left">
                            <div class="pd-rev-avatar">\${r.avatar}</div>
                            <div>
                                <div class="pd-rev-name">\${r.name}</div>
                                <div class="pd-stars" style="font-size:0.8rem; letter-spacing:1px; color:#ffb800;">
                                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                                </div>
                            </div>
                        </div>
                        <div class="pd-rev-date">\${r.date}</div>
                    </div>
                    <div class="pd-rev-text">\${r.text}</div>
                </div>
                \`;
            });
            reviewsEl.innerHTML = revHtml;
        }

        const popGrid = document.getElementById('pdPopularGrid');
        const mainGrid = document.querySelector('#shopPage .services-grid');
        if (popGrid && mainGrid) {
            popGrid.innerHTML = mainGrid.innerHTML;
        }
    } catch(e) {
        console.error("Error setting product details:", e);
    }
`;

    const before = lines.slice(0, startIndex).join('\n');
    const after = lines.slice(endIndex).join('\n');
    fs.writeFileSync('js/main.js', before + '\n' + newLogic + '\n    ' + after);
    console.log('Fixed main.js successfully');
} else {
    console.log('Indices not found:', startIndex, endIndex);
}
