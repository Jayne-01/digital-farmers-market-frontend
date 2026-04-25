const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ========== BACKEND CONFIGURATION ==========
const BACKEND_URL = 'https://digital-farmers-market-backend-1.onrender.com';

// ========== MAINTENANCE MODE STATE ==========
let isMaintenanceMode = false;

// Function to fetch maintenance status from backend
async function fetchMaintenanceStatus() {
    try {
        const fetch = await import('node-fetch');
        const response = await fetch.default(`${BACKEND_URL}/api/maintenance-status`);
        const data = await response.json();
        isMaintenanceMode = data.maintenance_mode === true;
        console.log(`🔧 Maintenance mode from backend: ${isMaintenanceMode ? 'ON' : 'OFF'}`);
    } catch (error) {
        console.log('⚠️ Could not fetch maintenance status from backend:', error.message);
        isMaintenanceMode = false;
    }
}

// Fetch maintenance status every 10 seconds
fetchMaintenanceStatus();
setInterval(fetchMaintenanceStatus, 10000);

// ========== MAINTENANCE MIDDLEWARE ==========
app.use((req, res, next) => {
    const requestPath = req.path;
    
    // ALWAYS allow these paths (never redirect)
    const alwaysAllowPaths = [
        '/',                    // Homepage
        '/index.html',          // Homepage
        '/maintenance.html',    // Maintenance page
        '/css/',                // CSS files
        '/js/',                 // JS files  
        '/images/',             // Images
        '/favicon.ico',         // Favicon
        '/Logo.png',            // Logo
        '/admin/',              // ALL admin pages
        '/auth/login',          // Customer login page (allow during maintenance)
        '/auth/login.html',     // Customer login page
        '/auth/register',       // Registration page (allow during maintenance)
        '/auth/register.html',  // Registration page
        '/api/auth/login',      // Customer login API
        '/api/auth/admin/login' // Admin login API
    ];
    
    const isAlwaysAllowed = alwaysAllowPaths.some(path => requestPath.startsWith(path));
    
    if (isAlwaysAllowed) {
        return next();
    }
    
    // For all other paths, if maintenance mode is ON, redirect to maintenance page
    if (isMaintenanceMode) {
        console.log(`🔧 Maintenance mode ON - redirecting ${requestPath} to maintenance page`);
        return res.redirect('/maintenance.html');
    }
    
    next();
});

// Serve static files
app.use(express.static(__dirname));

// Serve all folders
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/auth', express.static(path.join(__dirname, 'auth')));
app.use('/customer', express.static(path.join(__dirname, 'customer')));
app.use('/farmer', express.static(path.join(__dirname, 'farmer')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Handle all HTML routes
const routes = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/auth/login': 'auth/login.html',
    '/auth/login.html': 'auth/login.html',
    '/auth/register': 'auth/register.html',
    '/auth/register.html': 'auth/register.html',
    '/admin/dashboard': 'admin/dashboard.html',
    '/admin/dashboard.html': 'admin/dashboard.html',
    '/admin/users': 'admin/users.html',
    '/admin/users.html': 'admin/users.html',
    '/admin/farmers': 'admin/farmers.html',
    '/admin/farmers.html': 'admin/farmers.html',
    '/admin/products': 'admin/products.html',
    '/admin/products.html': 'admin/products.html',
    '/admin/orders': 'admin/orders.html',
    '/admin/orders.html': 'admin/orders.html',
    '/admin/analytics': 'admin/analytics.html',
    '/admin/analytics.html': 'admin/analytics.html',
    '/admin/settings': 'admin/settings.html',
    '/admin/settings.html': 'admin/settings.html',
    '/admin/login': 'admin/login.html',
    '/admin/login.html': 'admin/login.html',
    '/admin/create-first-admin': 'admin/create-first-admin.html',
    '/admin/create-first-admin.html': 'admin/create-first-admin.html',
    '/farmer/dashboard': 'farmer/dashboard.html',
    '/farmer/dashboard.html': 'farmer/dashboard.html',
    '/farmer/products': 'farmer/products.html',
    '/farmer/products.html': 'farmer/products.html',
    '/farmer/orders': 'farmer/orders.html',
    '/farmer/orders.html': 'farmer/orders.html',
    '/farmer/insights': 'farmer/insights.html',
    '/farmer/insights.html': 'farmer/insights.html',
    '/farmer/profile': 'farmer/profile.html',
    '/farmer/profile.html': 'farmer/profile.html',
    '/farmer/sales': 'farmer/sales.html',
    '/farmer/sales.html': 'farmer/sales.html',
    '/customer/marketplace': 'customer/marketplace.html',
    '/customer/marketplace.html': 'customer/marketplace.html',
    '/customer/cart': 'customer/cart.html',
    '/customer/cart.html': 'customer/cart.html',
    '/customer/orders': 'customer/orders.html',
    '/customer/orders.html': 'customer/orders.html',
    '/customer/profile': 'customer/profile.html',
    '/customer/profile.html': 'customer/profile.html',
};

// Handle all routes
Object.entries(routes).forEach(([route, file]) => {
    app.get(route, (req, res) => {
        const filePath = path.join(__dirname, file);
        res.sendFile(filePath);
    });
});

// Maintenance page route
app.get('/maintenance.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'maintenance.html'));
});

// 404 handler
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Page Not Found</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 50px; }
                h1 { color: #10b981; }
            </style>
        </head>
        <body>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <a href="/" style="color: #10b981;">Go to Homepage</a>
        </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('   🚀 FRONTEND SERVER RUNNING');
    console.log('='.repeat(60));
    console.log(`   📍 URL: http://0.0.0.0:${PORT}`);
    console.log(`   📁 Serving from: ${__dirname}`);
    console.log(`   🔗 Backend: ${BACKEND_URL}`);
    console.log(`   🔧 Maintenance mode: ${isMaintenanceMode ? 'ON' : 'OFF'}`);
    console.log('='.repeat(60) + '\n');
});