/**
 * Animated Logo System with Google Sheets Integration
 * Version: 2.0.0
 * Dynamic logo manager with Google Sheets configuration
 */

(function(window) {
    'use strict';

    const AnimatedLogoSystem = {
        config: {
            logoContainer: '#siteLogo',
            logoLink: '.logo a',
            defaultLogo: 'logo.png',
            width: 120,
            height: 55,
            
            // Google Sheets Configuration
            googleSheetId: '', // Your Google Sheet ID
            googleSheetName: 'LogoEvents', // Sheet tab name
            googleApiKey: '', // Your Google API Key
            
            // Cache settings
            cacheKey: 'animatedLogos_cache',
            cacheDuration: 3600000, // 1 hour in milliseconds
            
            cdnPath: '', // e.g., 'https://cdn.yourdomain.com/logos/'
            fallbackFormat: 'png',
            clickAction: 'home', // 'home', 'special-page', 'none'
            specialPageUrl: '/special-event',
            
            // Fallback logos if Google Sheets fails
            fallbackLogos: {
                'default': {
                    src: 'logo.png',
                    alt: 'Store Logo',
                    animated: false
                }
            }
        },

        animatedLogos: {},
        currentLogo: null,
        isLoading: false,
        
        /**
         * Initialize the logo system
         */
        init: async function(userConfig = {}) {
            this.config = { ...this.config, ...userConfig };
            
            try {
                // Load logos from Google Sheets
                await this.loadLogosFromSheet();
                
                // Detect and load current event
                this.detectCurrentEvent();
                this.loadLogo();
                this.setupClickHandler();
                this.startAutoCheck();
                
                console.log('✅ Animated Logo System initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize logo system:', error);
                this.useFallbackLogos();
            }
            
            return this;
        },

        /**
         * Load logo configuration from Google Sheets
         */
        loadLogosFromSheet: async function() {
            // Check cache first
            const cachedData = this.getFromCache();
            if (cachedData) {
                console.log('📦 Using cached logo data');
                this.animatedLogos = cachedData;
                return;
            }

            // Fetch from Google Sheets
            console.log('🔄 Fetching logo data from Google Sheets...');
            
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.googleSheetId}/values/${this.config.googleSheetName}?key=${this.config.googleApiKey}`;
            
            try {
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                this.animatedLogos = this.parseSheetData(data.values);
                
                // Cache the data
                this.saveToCache(this.animatedLogos);
                
                console.log('✅ Logo data loaded from Google Sheets');
            } catch (error) {
                console.error('❌ Error fetching from Google Sheets:', error);
                throw error;
            }
        },

        /**
         * Parse Google Sheets data into logo configuration
         * Expected columns: eventName | src | alt | animated | startDate | endDate | manual | enabled
         */
        parseSheetData: function(rows) {
            if (!rows || rows.length < 2) {
                throw new Error('Invalid sheet data');
            }

            const logos = {};
            const headers = rows[0].map(h => h.toLowerCase().trim());
            
            // Find column indices
            const eventNameIdx = headers.indexOf('eventname');
            const srcIdx = headers.indexOf('src');
            const altIdx = headers.indexOf('alt');
            const animatedIdx = headers.indexOf('animated');
            const startDateIdx = headers.indexOf('startdate');
            const endDateIdx = headers.indexOf('enddate');
            const manualIdx = headers.indexOf('manual');
            const enabledIdx = headers.indexOf('enabled');

            // Parse data rows (skip header)
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                
                // Skip empty rows
                if (!row[eventNameIdx]) continue;
                
                // Check if enabled (default: true)
                const enabled = enabledIdx >= 0 ? 
                    (row[enabledIdx]?.toLowerCase() === 'true' || row[enabledIdx] === '1' || row[enabledIdx]?.toLowerCase() === 'yes') : 
                    true;
                
                if (!enabled) continue;

                const eventName = row[eventNameIdx].toLowerCase().trim();
                
                logos[eventName] = {
                    src: row[srcIdx] || 'logo.png',
                    alt: row[altIdx] || 'Logo',
                    animated: row[animatedIdx]?.toLowerCase() === 'true' || row[animatedIdx] === '1',
                    startDate: row[startDateIdx] || null,
                    endDate: row[endDateIdx] || null,
                    manual: row[manualIdx]?.toLowerCase() === 'true' || row[manualIdx] === '1' || false
                };
            }

            // Ensure default logo exists
            if (!logos['default']) {
                logos['default'] = this.config.fallbackLogos['default'];
            }

            return logos;
        },

        /**
         * Cache management
         */
        saveToCache: function(data) {
            try {
                const cacheData = {
                    timestamp: Date.now(),
                    data: data
                };
                localStorage.setItem(this.config.cacheKey, JSON.stringify(cacheData));
            } catch (error) {
                console.warn('Failed to save cache:', error);
            }
        },

        getFromCache: function() {
            try {
                const cached = localStorage.getItem(this.config.cacheKey);
                if (!cached) return null;

                const cacheData = JSON.parse(cached);
                const now = Date.now();

                // Check if cache is still valid
                if (now - cacheData.timestamp < this.config.cacheDuration) {
                    return cacheData.data;
                }

                // Cache expired
                localStorage.removeItem(this.config.cacheKey);
                return null;
            } catch (error) {
                console.warn('Failed to read cache:', error);
                return null;
            }
        },

        clearCache: function() {
            localStorage.removeItem(this.config.cacheKey);
            console.log('🗑️ Cache cleared');
        },

        /**
         * Use fallback logos if Google Sheets fails
         */
        useFallbackLogos: function() {
            console.log('⚠️ Using fallback logos');
            this.animatedLogos = this.config.fallbackLogos;
            this.currentLogo = 'default';
            this.loadLogo();
        },

        /**
         * Detect which event logo should be displayed
         */
        detectCurrentEvent: function() {
            const today = new Date();
            const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
            const currentDay = String(today.getDate()).padStart(2, '0');
            const currentDate = `${currentMonth}-${currentDay}`;

            // Check each event
            for (const [eventName, eventData] of Object.entries(this.animatedLogos)) {
                if (eventData.manual) continue; // Skip manual events
                if (eventName === 'default') continue;

                if (eventData.startDate && eventData.endDate) {
                    if (this.isDateInRange(currentDate, eventData.startDate, eventData.endDate)) {
                        this.currentLogo = eventName;
                        console.log('🎯 Active Event:', eventName);
                        return;
                    }
                }
            }

            // Default logo if no event
            this.currentLogo = 'default';
            console.log('📍 Using default logo');
        },

        /**
         * Check if date is in range (handles year-wrap)
         */
        isDateInRange: function(current, start, end) {
            const [startMonth, startDay] = start.split('-').map(Number);
            const [endMonth, endDay] = end.split('-').map(Number);
            const [currentMonth, currentDay] = current.split('-').map(Number);

            if (startMonth > endMonth) {
                // Year wrap case (e.g., Dec 27 - Jan 5)
                return (
                    (currentMonth === startMonth && currentDay >= startDay) ||
                    (currentMonth === endMonth && currentDay <= endDay) ||
                    (currentMonth > startMonth || currentMonth < endMonth)
                );
            } else {
                // Normal case
                return (
                    (currentMonth === startMonth && currentDay >= startDay) ||
                    (currentMonth === endMonth && currentDay <= endDay) ||
                    (currentMonth > startMonth && currentMonth < endMonth)
                );
            }
        },

        /**
         * Load the appropriate logo
         */
        loadLogo: function() {
            const logoData = this.animatedLogos[this.currentLogo];
            if (!logoData) {
                console.warn('⚠️ Logo data not found for:', this.currentLogo);
                return;
            }

            const logoImg = document.querySelector(this.config.logoContainer);
            if (!logoImg) {
                console.warn('⚠️ Logo container not found:', this.config.logoContainer);
                return;
            }

            // Build full URL
            const logoUrl = this.config.cdnPath + logoData.src;

            // Update logo with loading state
            logoImg.dataset.loading = 'true';

            // Preload image first
            this.preloadImage(logoUrl, () => {
                logoImg.src = logoUrl;
                logoImg.alt = logoData.alt;
                logoImg.width = this.config.width;
                logoImg.height = this.config.height;

                // Add animation class if animated
                if (logoData.animated) {
                    logoImg.classList.add('animated-logo');
                } else {
                    logoImg.classList.remove('animated-logo');
                }

                // Store current logo info
                logoImg.dataset.logoEvent = this.currentLogo;
                logoImg.dataset.loading = 'false';
                
                console.log('✅ Loaded logo:', logoData.alt);
            });
        },

        /**
         * Preload image for smooth transition
         */
        preloadImage: function(url, callback) {
            const img = new Image();
            img.onload = () => {
                if (callback) callback();
            };
            img.onerror = () => {
                console.error('❌ Failed to load logo:', url);
                if (callback) callback(); // Still call callback to remove loading state
            };
            img.src = url;
        },

        /**
         * Setup click handler for logo
         */
        setupClickHandler: function() {
            const logoLink = document.querySelector(this.config.logoLink);
            if (!logoLink) return;

            const logoData = this.animatedLogos[this.currentLogo];
            
            if (this.config.clickAction === 'special-page' && logoData?.animated) {
                logoLink.href = this.config.specialPageUrl;
            } else if (this.config.clickAction === 'home') {
                logoLink.href = '/';
            }
        },

        /**
         * Manually trigger a special logo
         */
        triggerLogo: function(eventName) {
            if (!this.animatedLogos[eventName]) {
                console.error('❌ Logo event not found:', eventName);
                return;
            }

            this.currentLogo = eventName;
            this.loadLogo();
            this.setupClickHandler();
            console.log('🎯 Manually triggered logo:', eventName);
        },

        /**
         * Reset to default logo
         */
        resetLogo: function() {
            this.currentLogo = 'default';
            this.loadLogo();
            this.setupClickHandler();
            console.log('🔄 Reset to default logo');
        },

        /**
         * Refresh logos from Google Sheets
         */
        refreshLogos: async function() {
            console.log('🔄 Refreshing logos from Google Sheets...');
            this.clearCache();
            await this.loadLogosFromSheet();
            this.detectCurrentEvent();
            this.loadLogo();
            this.setupClickHandler();
        },

        /**
         * Start auto-check for events (every hour)
         */
        startAutoCheck: function() {
            setInterval(() => {
                this.detectCurrentEvent();
                this.loadLogo();
            }, 3600000); // 1 hour
            
            // Also refresh from sheets every 24 hours
            setInterval(() => {
                this.refreshLogos();
            }, 86400000); // 24 hours
        },

        /**
         * Get current logo info
         */
        getCurrentLogo: function() {
            return {
                event: this.currentLogo,
                data: this.animatedLogos[this.currentLogo]
            };
        },

        /**
         * Get all logos
         */
        getAllLogos: function() {
            return this.animatedLogos;
        }
    };

    // Export to window
    window.AnimatedLogoSystem = AnimatedLogoSystem;

})(window);


// ============================================
// USAGE EXAMPLE
// ============================================

/*
// Initialize in your Blogger template
$(document).ready(async function() {
    
    // Initialize Animated Logo System with Google Sheets
    await AnimatedLogoSystem.init({
        logoContainer: '#siteLogo',
        logoLink: '.logo a',
        width: 120,
        height: 55,
        
        // Google Sheets Configuration
        googleSheetId: 'YOUR_GOOGLE_SHEET_ID', // Get from sheet URL
        googleSheetName: 'LogoEvents', // Your sheet tab name
        googleApiKey: 'YOUR_GOOGLE_API_KEY', // Create in Google Cloud Console
        
        cdnPath: 'https://cdn.jsdelivr.net/gh/yourusername/yourrepo@main/logos/',
        
        // Cache settings
        cacheDuration: 3600000, // 1 hour
        
        // Fallback logos (in case Google Sheets fails)
        fallbackLogos: {
            'default': {
                src: 'logo.png',
                alt: SHOP_CONFIG.businessName,
                animated: false
            }
        },
        
        clickAction: 'home'
    });
    
    // Manually trigger a logo
    // AnimatedLogoSystem.triggerLogo('flashsale');
    
    // Refresh logos from Google Sheets
    // AnimatedLogoSystem.refreshLogos();
    
    // Clear cache and reload
    // AnimatedLogoSystem.clearCache();
    
    // Get current logo info
    // console.log(AnimatedLogoSystem.getCurrentLogo());
    
});


// ============================================
// GOOGLE SHEETS SETUP INSTRUCTIONS
// ============================================

STEP 1: Create a Google Sheet with these columns:
-----------------------------------------------
eventName | src | alt | animated | startDate | endDate | manual | enabled
-----------------------------------------------

STEP 2: Add your logo events (example data):
-----------------------------------------------
default | logo.png | Store Logo | FALSE | | | FALSE | TRUE
christmas | logo-christmas.webp | Christmas Sale | TRUE | 12-15 | 12-26 | FALSE | TRUE
newyear | logo-newyear.webp | Happy New Year 2025 | TRUE | 12-27 | 01-05 | FALSE | TRUE
valentine | logo-valentine.webp | Valentine's Day Special | TRUE | 02-10 | 02-15 | FALSE | TRUE
diwali | logo-diwali.webp | Diwali Festival | TRUE | 10-20 | 11-05 | FALSE | TRUE
blackfriday | logo-blackfriday.webp | Black Friday Sale | TRUE | 11-23 | 11-28 | FALSE | TRUE
flashsale | logo-flashsale.webp | Flash Sale! | TRUE | | | TRUE | FALSE
-----------------------------------------------

Column explanations:
- eventName: Unique identifier (lowercase, no spaces)
- src: Filename of logo image
- alt: Alt text for the logo
- animated: TRUE/FALSE - is it an animated WebP?
- startDate: MM-DD format (e.g., 12-15)
- endDate: MM-DD format (e.g., 12-26)
- manual: TRUE/FALSE - must be triggered manually?
- enabled: TRUE/FALSE - is this event active?

STEP 3: Get Google Sheets API Key
-----------------------------------------------
1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable "Google Sheets API"
4. Create credentials > API Key
5. Restrict the API key to "Google Sheets API" only
6. (Optional) Add HTTP referrer restrictions for security

STEP 4: Make your sheet public
-----------------------------------------------
1. Click "Share" button in your Google Sheet
2. Change to "Anyone with the link can view"
3. Copy the Sheet ID from the URL:
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   
STEP 5: Test your setup
-----------------------------------------------
Test URL format:
https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/LogoEvents?key=YOUR_API_KEY

If it returns JSON data, you're all set! 🎉

*/