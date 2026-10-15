'use strict';

const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);
const restaurantName = process.env.RESTAURANT_NAME || 'Harbour Table';

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

const menu = [
  { id: 'jollof-rice', name: 'Jollof Rice', category: 'Mains', price: 3500, currency: 'NGN', available: true },
  { id: 'grilled-chicken', name: 'Grilled Chicken', category: 'Mains', price: 5500, currency: 'NGN', available: true },
  { id: 'plantain', name: 'Fried Plantain', category: 'Sides', price: 1500, currency: 'NGN', available: true },
  { id: 'zobo', name: 'Zobo', category: 'Drinks', price: 1000, currency: 'NGN', available: true }
];

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'restaurant-app' });
});

app.get('/api/menu', (_req, res) => {
  res.status(200).json({ restaurant: restaurantName, items: menu });
});

app.get('/', (_req, res) => {
  const cards = menu.map(item => `
    <article class="menu-card">
      <div class="dish-icon" aria-hidden="true">${item.category === 'Drinks' ? '🥤' : item.category === 'Sides' ? '🍌' : '🍲'}</div>
      <div><span class="category">${escapeHtml(item.category)}</span>
      <h3>${escapeHtml(item.name)}</h3>
      <p class="price">${new Intl.NumberFormat('en-NG', { style: 'currency', currency: item.currency, maximumFractionDigits: 0 }).format(item.price)}</p></div>
    </article>`).join('');

  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Fresh meals and warm hospitality at ${escapeHtml(restaurantName)}.">
  <title>${escapeHtml(restaurantName)} | Fresh food, good company</title>
  <style>
    :root{color-scheme:light;--ink:#1e293b;--muted:#64748b;--cream:#fffaf0;--green:#166534;--gold:#f59e0b}
    *{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--cream)}
    header{display:flex;align-items:center;justify-content:space-between;padding:1.2rem max(5vw,1.2rem);background:white}
    .brand{font-weight:850;font-size:1.25rem;color:var(--green)}nav a{color:var(--ink);text-decoration:none;margin-left:1rem;font-weight:650}
    .hero{padding:5.5rem max(5vw,1.2rem);background:linear-gradient(120deg,#14532d,#166534 55%,#854d0e);color:white}
    .hero-inner{max-width:1050px;margin:auto}.eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:.8rem;font-weight:800;color:#fde68a}
    h1{font-size:clamp(2.5rem,6vw,5rem);line-height:1.02;max-width:780px;margin:.8rem 0 1.2rem}.hero p{font-size:1.15rem;max-width:600px;line-height:1.7;color:#f0fdf4}
    .cta{display:inline-block;background:#fbbf24;color:#422006;text-decoration:none;font-weight:800;padding:.9rem 1.2rem;border-radius:.7rem;margin-top:.8rem}
    main{max-width:1050px;margin:auto;padding:3.5rem max(5vw,1.2rem)}.section-heading{display:flex;justify-content:space-between;gap:1rem;align-items:end;flex-wrap:wrap}
    h2{font-size:2rem;margin:0 0 .4rem}.muted{color:var(--muted)}.menu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;margin-top:1.5rem}
    .menu-card{display:flex;gap:1rem;align-items:center;background:white;padding:1.1rem;border:1px solid #f1e8d5;border-radius:1rem;box-shadow:0 8px 25px #4220060a}
    .dish-icon{font-size:2rem;background:#fef3c7;border-radius:.8rem;padding:.8rem}.category{font-size:.75rem;color:var(--green);font-weight:800;text-transform:uppercase;letter-spacing:.08em}
    h3{margin:.3rem 0}.price{margin:.3rem 0 0;font-weight:850}.about{margin-top:3rem;padding:2rem;background:#ecfdf5;border-radius:1rem;line-height:1.7}
    footer{background:#172554;color:#e2e8f0;padding:1.6rem max(5vw,1.2rem);text-align:center}
    @media(max-width:520px){header{align-items:flex-start;gap:.6rem;flex-direction:column}nav a{margin:0 1rem 0 0}.hero{padding-top:4rem;padding-bottom:4rem}}
  </style>
</head>
<body>
  <header><div class="brand">🍽 ${escapeHtml(restaurantName)}</div><nav><a href="#menu">Menu</a><a href="#about">About</a></nav></header>
  <section class="hero"><div class="hero-inner"><div class="eyebrow">Made fresh, served with heart</div>
    <h1>Good food brings everyone to the table.</h1>
    <p>Discover comforting favourites, local flavours and a welcoming place to share a meal with the people who matter.</p>
    <a class="cta" href="#menu">Explore our menu ↓</a>
  </div></section>
  <main>
    <section id="menu"><div class="section-heading"><div><h2>Customer favourites</h2><p class="muted">A sample menu to get you started.</p></div></div>
      <div class="menu-grid">${cards}</div></section>
    <section id="about" class="about"><h2>Welcome to our table</h2><p>We believe a great meal starts with care, quality ingredients and generous hospitality. Visit us for a relaxed meal and a warm welcome.</p><p class="muted">This starter site demonstrates a deployable restaurant landing page. Add your real address, opening hours, contact details and ordering workflow before launch.</p></section>
  </main>
  <footer>© ${new Date().getFullYear()} ${escapeHtml(restaurantName)} · Fresh food, good company</footer>
</body></html>`);
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Restaurant app listening on port ${port}`);
  });
}

module.exports = { app, menu };
