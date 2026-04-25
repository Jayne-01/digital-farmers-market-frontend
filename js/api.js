const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const PORT = 3000;

// ========== MAINTENANCE MODE STATE ==========
let isMaintenanceMode = false;

// Function to fetch maintenance status from backend using native http
function fetchMaintenanceStatus() {
    const options = {
        hostname: 'digital-farmers-market-backend-1.onrender.com',
        port: 443,  // HTTPS port
        path: '/api/maintenance-status',
        method: 'GET',
        timeout: 5000,
        headers: {
            'Host': 'digital-farmers-market-backend-1.onrender.com'
        }
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                isMaintenanceMode = json.maintenance_mode === true;
                console.log(`🔧 Maintenance mode from backend: ${isMaintenanceMode ? 'ON' : 'OFF'}`);
            } catch (e) {
                console.log('Error parsing maintenance response');
            }
        });
    });
    
    req.on('error', (error) => {
        console.log('⚠️ Could not fetch maintenance status from backend:', error.message);
        isMaintenanceMode = false;
    });
    
    req.on('timeout', () => {
        req.destroy();
        isMaintenanceMode = false;
    });
    
    req.end();
}

// Fetch maintenance status every 10 seconds
fetchMaintenanceStatus();
setInterval(fetchMaintenanceStatus, 10000);

// ========== MAINTENANCE MIDDLEWARE - ALLOW ADMIN PAGES ==========
app.use((req, res, next) => {
    // Skip maintenance check for:
    // - Maintenance page itself
    // - Static assets (CSS, JS, images)
    // - Admin pages (so admin can login and turn off maintenance)
    // - Admin API routes
    const skipPaths = [
        '/maintenance.html',
        '/css/',
        '/js/',
        '/images/',
        '/favicon.ico',
        '/Logo.png',
        '/admin/',              // ALLOW ALL ADMIN PAGES
        '/admin/login',         // Allow admin login page
        '/admin/login.html',
        '/admin/dashboard',
        '/admin/dashboard.html',
        '/admin/settings',
        '/admin/settings.html',
        '/api/auth/admin/login' // Allow admin login API call
    ];
    
    const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
    
    if (shouldSkip) {
        return next();
    }
    
    // If maintenance mode is ON, redirect to maintenance page
    if (isMaintenanceMode) {
        console.log(`🔧 Maintenance mode ON - redirecting ${req.path} to maintenance page`);
        return res.redirect('/maintenance.html');
    }
    
    next();
});

// Serve static files
app.use(express.static(__dirname));

// Explicitly serve all folders
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/auth', express.static(path.join(__dirname, 'auth')));
app.use('/customer', express.static(path.join(__dirname, 'customer')));
app.use('/farmer', express.static(path.join(__dirname, 'farmer')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Proxy middleware to forward API requests to backend
// Remove the leading /api from the path to avoid double /api
// Proxy middleware to forward API requests to backend
app.use('/api', (req, res) => {
    const backendUrl = `https://digital-farmers-market-backend-1.onrender.com${req.url}`;
    console.log(`🔄 Proxying API request: ${req.method} ${req.url} -> ${backendUrl}`);
    
    const options = {
        hostname: 'digital-farmers-market-backend-1.onrender.com',
        port: 443,  // HTTPS port
        path: req.url,
        method: req.method,
        headers: req.headers
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (error) => {
        console.error('Proxy error:', error.message);
        res.status(500).json({ error: 'Backend server not available' });
    });
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.pipe(proxyReq);
    } else {
        proxyReq.end();
    }
});

// Handle all HTML routes
const routes = {
    '/': 'index.html',
    '/index.html': 'index.html',
    
    // Auth routes
    '/auth/login': 'auth/login.html',
    '/auth/login.html': 'auth/login.html',
    '/auth/register': 'auth/register.html',
    '/auth/register.html': 'auth/register.html',
    
    // Admin routes
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
    
    // Farmer routes
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
    
    // Customer routes
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
        console.log(`Serving: ${filePath}`);
        res.sendFile(filePath);
    });
});

// Maintenance page route (bypasses maintenance check)
app.get('/maintenance.html', (req, res) => {
    const filePath = path.join(__dirname, 'maintenance.html');
    res.sendFile(filePath);
});

// 404 handler
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    
    if (req.headers.accept?.includes('text/html')) {
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
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('   🚀 FRONTEND SERVER RUNNING');
    console.log('='.repeat(60));
    console.log(`   📍 URL: http://localhost:${PORT}`);
    console.log(`   📁 Serving from: ${__dirname}`);
    console.log(`   🔧 Maintenance mode: ${isMaintenanceMode ? 'ON' : 'OFF'}`);
    console.log('='.repeat(60));
    
    // Check if all required files exist
    const fs = require('fs');
    const requiredFiles = [
        'css/style.css',
        'css/components.css',
        'css/responsive.css',
        'js/api.js',
        'maintenance.html'
    ];
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`   ✅ Found: ${file}`);
        } else {
            console.log(`   ❌ Missing: ${file}`);
        }
    });
    console.log('='.repeat(60) + '\n');
});