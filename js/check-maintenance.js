// =====================================================
// MAINTENANCE MODE CHECKER
// This script runs on all dashboard pages to check if
// the system is in maintenance mode and redirect accordingly
// =====================================================

(function() {
    const BACKEND_URL = 'http://localhost:5000';
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentPath = window.location.pathname;
    
    // If no token exists, user is not logged in - redirect to login page
    if (!token) {
        console.log('🔒 No token found, redirecting to login...');
        window.location.href = '/auth/login.html';
        return;
    }
    
    // ALLOW ADMIN USERS to access admin pages during maintenance
    if (user.role === 'ADMIN' && currentPath.includes('/admin/')) {
        console.log('👑 Admin user on admin page - access granted during maintenance');
        return;
    }
    
    // For non-admin users, check maintenance status using the admin endpoint
    console.log('🔍 Checking maintenance mode status...');
    
    // Use the admin maintenance endpoint (not auth)
    fetch(BACKEND_URL + '/api/maintenance-status', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
        }
        return response.json();
    })
    .then(function(data) {
        console.log('📡 Maintenance status response:', data);
        
        // If maintenance mode is ON
        if (data.maintenance_mode === true) {
            console.log('🔧 Maintenance mode is ACTIVE - redirecting to maintenance page');
            
            // Clear all user session data
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to maintenance page
            window.location.href = '/maintenance.html';
        } else {
            console.log('✅ Maintenance mode is OFF - normal operation');
        }
    })
    .catch(function(err) {
        console.log('⚠️ Maintenance check failed - allowing page to load:', err.message);
    });
})();