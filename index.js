const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Radar UK</title>
    <script src="https://cdn.jsdelivr.net/npm/lucide@0.344.0/dist/umd/lucide.min.js"></script>
    <style>
        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #3b82f6;
            --accent-hover: #2563eb;
            --border: #334155;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background-color: var(--bg-primary); color: var(--text-main); padding: 2rem 1rem; min-height: 100vh; }
        .container { max-width: 1400px; margin: 0 auto; }
        header { text-align: center; margin-bottom: 2.5rem; }
        header h1 { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 0.5rem; color: #fff; }
        header p { color: var(--text-muted); font-size: 1rem; }
        
        .search-panel { background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 2rem; }
        .search-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .search-row input { flex: 1; background: var(--bg-primary); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: 8px; color: #fff; font-size: 1rem; outline: none; transition: border 0.2s; }
        .search-row input:focus { border-color: var(--accent); }
        .search-row button { background: var(--accent); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s; }
        .search-row button:hover { background: var(--accent-hover); }
        
        .controls-row { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem; }
        .control-group { display: flex; align-items: center; gap: 0.7rem; }
        .control-group label { font-size: 0.85rem; text-transform: uppercase; tracking: 0.05em; color: var(--text-muted); font-weight: 600; }
        .btn-toggle-group { display: flex; background: var(--bg-primary); border: 1px solid var(--border); padding: 0.25rem; border-radius: 8px; }
        .btn-toggle { background: transparent; border: none; color: var(--text-muted); padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.9rem; cursor: pointer; font-weight: 500; }
        .btn-toggle.active { background: var(--accent); color: #fff; }
        select { background: var(--bg-primary); border: 1px solid var(--border); color: #fff; padding: 0.4rem 1rem; border-radius: 8px; outline: none; cursor: pointer; font-size: 0.9rem; }
        
        .results-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media (min-width: 900px) { .results-grid { grid-template-columns: 1fr 1fr; } }
        
        .column { background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; min-height: 400px; }
        .column-header { background: rgba(0,0,0,0.2); padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .column-header h2 { font-size: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .count-badge { background: var(--border); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; color: var(--text-muted); }
        
        .card-list { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; max-height: 70vh; flex: 1; }
        .item-card { background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; display: flex; gap: 1rem; transition: transform 0.2s, border-color 0.2s; text-decoration: none; color: inherit; }
        .item-card:hover { transform: translateY(-2px); border-color: #475569; }
        .item-img { width: 75px; height: 75px; object-fit: cover; border-radius: 6px; background: var(--bg-secondary); flex-shrink: 0; }
        .item-details { display: flex; flex-direction: column; justify-content: space-between; flex: 1; min-width: 0; }
        .item-title { font-weight: 600; font-size: 0.95rem; line-height: 1.3; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.25rem; }
        .item-price { font-size: 1.2rem; font-weight: 700; color: #4ade80; }
        .item-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; }
        
        .status-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px; color: var(--text-muted); text-align: center; gap: 0.5rem; }
        .spinner { border: 3px solid var(--border); border-top: 3px solid var(--accent); border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>GAME RADAR UK</h1>
            <p>Side-by-side local live marketplace comparisons</p>
        </header>

        <div class="search-panel">
            <div class="search-row">
                <input type="text" id="search-input" placeholder="Enter video game title or barcode number (EAN)..." autofocus>
                <button id="search-btn"><i data-lucide="search"></i> Search</button>
            </div>
            <div class="controls-row">
                <div class="control-group">
                    <label>Status</label>
                    <div class="btn-toggle-group">
                        <button class="btn-toggle active" data-status="active">Active</button>
                        <button class="btn-toggle" data-status="sold">Sold</button>
                    </div>
                </div>
                <div class="control-group">
                    <label>Sort By</label>
                    <select id="sort-select">
                        <option value="recent">Most Recent</option>
                        <option value="lo-hi">Price: Low to High</option>
                        <option value="hi-lo">Price: High to Low</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="results-grid">
            <div class="column" id="ebay-column">
                <div class="column-header">
                    <h2>eBay UK</h2>
                    <span class="count-badge" id="ebay-count">0 items</span>
                </div>
                <div class="card-list" id="ebay-list">
                    <div class="status-msg">Enter a search query to pull live data.</div>
                </div>
            </div>

            <div class="column" id="vinted-column">
                <div class="column-header">
                    <h2>Vinted UK</h2>
                    <span class="count-badge" id="vinted-count">0 items</span>
                </div>
                <div class="card-list" id="vinted-list">
                    <div class="status-msg">Enter a search query to pull live data.</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        lucide.createIcons();
        let currentStatus = 'active';
        
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentStatus = e.target.dataset.status;
                triggerSearch();
            });
        });

        document.getElementById('sort-select').addEventListener('change', () => triggerSearch());
        document.getElementById('search-btn').addEventListener('click', () => triggerSearch());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') triggerSearch();
        });

        async function triggerSearch() {
            const query = document.getElementById('search-input').value.trim();
            if (!query) return;
            const sort = document.getElementById('sort-select').value;

            renderLoading('ebay-list');
            renderLoading('vinted-list');

            fetchColumn('ebay', query, currentStatus, sort);
            fetchColumn('vinted', query, currentStatus, sort);
        }

        function renderLoading(targetId) {
            document.getElementById(targetId).innerHTML = \`
                <div class="status-msg">
                    <div class="spinner"></div>
                    <p>Fetching matching listings...</p>
                </div>
            \`;
        }

        async function fetchColumn(platform, query, status, sort) {
            const targetList = document.getElementById(\`\${platform}-list\`);
            const targetCount = document.getElementById(\`\${platform}-count\`);

            try {
                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platform, query, status, sort })
                });
                const data = await response.json();

                if (!data.success || data.items.length === 0) {
                    targetList.innerHTML = '<div class="status-msg">No results found matching your criteria.</div>';
                    targetCount.textContent = '0 items';
                    return;
                }

                targetCount.textContent = \`\${data.items.length} items\`;
                targetList.innerHTML = data.items.map(item => \`
                    <a href="\${item.url}" target="_blank" class="item-card">
                        <img class="item-img" src="\${item.image || 'https://via.placeholder.com/75?text=No+Img'}" alt="Product">
                        <div class="item-details">
                            <div>
                                <div class="item-title" title="\${item.title}">\${item.title}</div>
                            </div>
                            <div>
                                <div class="item-price">£\${item.price.toFixed(2)}</div>
                                <div class="item-meta">
                                    <span>\${item.info || ''}</span>
                                    <span>\${item.dateText || ''}</span>
                                </div>
                            </div>
                        </div>
                    </a>
                \`).join('');
            } catch (err) {
                targetList.innerHTML = '<div class="status-msg">Error communicating with search cluster.</div>';
                targetCount.textContent = 'Error';
            }
        }
    </script>
</body>
</html>
    `);
});

app.post('/api/search', async (req, res) => {
    const { platform, query, status, sort } = req.body;
    try {
        let items = [];
        if (platform === 'ebay') {
            items = await scrapeEbay(query, status, sort);
        } else if (platform === 'vinted') {
            items = await scrapeVinted(query, status, sort);
        }
        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

async function scrapeEbay(query, status, sort) {
    let url = \`https://www.ebay.co.uk/sch/i.html?_nkw=\${encodeURIComponent(query)}&_ipg=25\`;
    if (status === 'sold') {
        url += '&LH_Sold=1&LH_Complete=1';
    }
    if (sort === 'lo-hi') url += '&_sop=15';
    else if (sort === 'hi-lo') url += '&_sop=16';
    else if (sort === 'recent') url += status === 'sold' ? '&_sop=13' : '&_sop=10';

    const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.s-item').each((i, el) => {
        if (i === 0 && $(el).find('.s-item__title').text().includes('Shop on eBay')) return;
        const title = $(el).find('.s-item__title').text().replace(/New Listing/i, '').trim();
        const url = $(el).find('.s-item__link').attr('href');
        const priceText = $(el).find('.s-item__price').text().replace(/[^0-9.]/g, '');
        const price = parseFloat(priceText) || 0;
        const image = $(el).find('.s-item__image-img img').attr('src') || $(el).find('.s-item__image-wrapper img').attr('src');
        const info = $(el).find('.s-item__subtitle').text().trim() || $(el).find('.SECONDARY_INFO').text().trim();
        const dateText = $(el).find('.s-item__title-tag').text().trim();

        if (title && url) {
            results.push({ title, url, price, image, info, dateText });
        }
    });
    return results;
}

async function scrapeVinted(query, status, sort) {
    const results = [];
    try {
        let sortParam = 'time_id_desc';
        if (sort === 'lo-hi') sortParam = 'price_asc';
        if (sort === 'hi-lo') sortParam = 'price_desc';

        const searchUrl = \`https://www.vinted.co.uk/api/v2/catalog/items?search_text=\${encodeURIComponent(query)}&per_page=25&order=\${sortParam}\`;
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*'
            },
            validateStatus: false
        });

        if (response.status === 200 && response.data.items) {
            response.data.items.forEach(item => {
                const isSold = item.status_id === 2 || item.is_sold;
                if (status === 'sold' && !isSold) return;
                if (status === 'active' && isSold) return;

                results.push({
                    title: item.title,
                    url: \`https://www.vinted.co.uk\${item.path}\`,
                    price: parseFloat(item.price.amount) || 0,
                    image: item.photo ? item.photo.url : null,
                    info: item.brand_title || item.size_title,
                    dateText: item.favourite_count ? \`❤️ \${item.favourite_count}\` : ''
                });
            });
        }
    } catch (err) {
        console.error(err.message);
    }
    return results;
}

app.listen(PORT, () => console.log(\`Server listening on port \${PORT}\`));
