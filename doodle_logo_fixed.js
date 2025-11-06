/**
 * Animated Logo System with GSRCDN Integration
 * Version: 3.2.0 (Fixed for GSRCDN response format)
 * Works with Google Apps Script Web App (GSRCDN) instead of Google Sheets API
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
            
            // GSRCDN Configuration (replaces Google Sheets API)
            scriptUrl: '', // Your GSRCDN script URL
            sheetName: 'Sheet3',
            startRow: 101,
            
            // Cache settings
            cacheKey: 'animatedLogos_cache',
            cacheDuration: 3600000, // 1 hour in milliseconds
            
            cdnPath: '', // e.g., 'https://cdn.jsdelivr.net/gh/username/repo@main/logos/'
            fallbackFormat: 'png',
            clickAction: 'home', // 'home', 'special-page', 'none'
            specialPageUrl: '/special-event',
            
            // Fallback logos if loading fails
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
                // Load logos from GSRCDN
                await this.loadLogosFromGSRCDN();
                
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
         * Load logo configuration from GSRCDN
         */
        loadLogosFromGSRCDN: async function() {
            // Check cache first
            const cachedData = this.getFromCache();
            if (cachedData) {
                console.log('📦 Using cached logo data');
                this.animatedLogos = cachedData;
                return;
            }

            console.log('🔄 Fetching logo data from GSRCDN...');
            
            try {
                let logoData;
                
                if (window.GSRCDN && typeof GSRCDN.getData === 'function') {
                    // Method 1: Use GSRCDN library
                    console.log('📡 Using GSRCDN.getData method');
                    logoData = await GSRCDN.getData(
                        this.config.sheetName,
                        this.config.startRow
                    );
                } else {
                    // Method 2: Direct fetch to GSRCDN endpoint
                    console.log('📡 Using direct fetch method');
                    const requestBody = {
                        action: 'getData',
                        sheetName: this.config.sheetName,
                        startRow: this.config.startRow
                    };
                    
                    const response = await fetch(this.config.scriptUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain',
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    logoData = result;
                }
                
                console.log('📊 Logo data received:', logoData);
                
                if (!logoData) {
                    throw new Error('No logo data returned from GSRCDN');
                }
                
                // Parse the data
                this.animatedLogos = this.parseGSRCDNData(logoData);
                
                // Cache the data
                this.saveToCache(this.animatedLogos);
                
                console.log('✅ Logo data loaded from GSRCDN');
            } catch (error) {
                console.error('❌ Error fetching from GSRCDN:', error);
                throw error;
            }
        },

        /**
         * Parse GSRCDN data into logo configuration
         * GSRCDN returns: { success: true, data: [...] }
         */
        parseGSRCDNData: function(response) {
            console.log('🔍 Parsing GSRCDN response');
            
            // Extract the data array from GSRCDN response
            let rows = [];
            
            if (response && response.success && Array.isArray(response.data)) {
                // Standard GSRCDN response format
                rows = response.data;
                console.log('📊 Found', rows.length, 'logo entries');
            } else if (Array.isArray(response)) {
                // Direct array format
                rows = response;
            } else if (response && Array.isArray(response.data)) {
                // Nested data array
                rows = response.data;
            } else {
                console.error('❌ Invalid data format:', response);
                throw new Error('Invalid GSRCDN response format');
            }
            
            if (!rows || rows.length === 0) {
                throw new Error('No logo data found in response');
            }

            const logos = {};

            rows.forEach((row, index) => {
                // Skip if required fields are missing
                if (!row.eventName || row.eventName === '' || row.eventName === '-') {
                    console.warn('⚠️ Skipping row without eventName:', row);
                    return;
                }
                
                // Check if enabled (default: true)
                const isEnabled = row.enabled !== undefined ? 
                    (row.enabled === true || row.enabled === 'true' || row.enabled === 1) : 
                    true;
                
                if (!isEnabled) {
                    console.log('⏭️ Skipping disabled event:', row.eventName);
                    return;
                }

                const eventKey = row.eventName.toLowerCase().trim();
                
                logos[eventKey] = {
                    src: row.src || 'logo.png',
                    alt: row.alt || 'Logo',
                    animated: row.animated === true || row.animated === 'true' || row.animated === 1,
                    startDate: this.parseDate(row.startDate),
                    endDate: this.parseDate(row.endDate),
                    manual: row.manual === true || row.manual === 'true' || row.manual === 1 || false
                };
                
                console.log(`✅ Parsed logo: ${eventKey}`, logos[eventKey]);
            });

            // Ensure default logo exists
            if (!logos['default']) {
                console.warn('⚠️ No default logo found, using fallback');
                logos['default'] = this.config.fallbackLogos['default'];
            }

            console.log('📦 Total logos loaded:', Object.keys(logos).length);
            return logos;
        },

        /**
         * Parse date from various formats
         * Handles: "12-25", "Sun May 11 2025 00:00:00 GMT+0530", Date objects, "-", null, undefined
         */
        parseDate: function(dateStr) {
            if (!dateStr || dateStr === '-' || dateStr === '' || dateStr === null || dateStr === undefined) {
                return null;
            }
            
            // Convert to string if not already
            dateStr = String(dateStr).trim();
            
            // If already in MM-DD format
            if (/^\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }
            
            // If it's a full date string (like "Sun May 11 2025...")
            try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const parsed = `${month}-${day}`;
                    console.log(`📅 Parsed date "${dateStr}" -> "${parsed}"`);
                    return parsed;
                }
            } catch (e) {
                console.warn('⚠️ Could not parse date:', dateStr);
            }
            
            return null;
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
                console.log('💾 Cached logo data');
            } catch (error) {
                console.warn('⚠️ Failed to save cache:', error);
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
                console.warn('⚠️ Failed to read cache:', error);
                return null;
            }
        },

        clearCache: function() {
            localStorage.removeItem(this.config.cacheKey);
            console.log('🗑️ Cache cleared');
        },

        /**
         * Use fallback logos if GSRCDN fails
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

            console.log('📅 Current date:', currentDate);

            // Check each event
            for (const [eventName, eventData] of Object.entries(this.animatedLogos)) {
                if (eventData.manual) {
                    console.log('⏭️ Skipping manual event:', eventName);
                    continue;
                }
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
            console.log('🏠 Using default logo');
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

            // Build full URL (use src directly if it's already a full URL)
            const logoUrl = logoData.src.startsWith('http') ? 
                logoData.src : 
                this.config.cdnPath + logoData.src;

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
                
                console.log('✅ Loaded logo:', logoData.alt, '(' + this.currentLogo + ')');
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
         * Refresh logos from GSRCDN
         */
        refreshLogos: async function() {
            console.log('🔄 Refreshing logos from GSRCDN...');
            this.clearCache();
            await this.loadLogosFromGSRCDN();
            this.detectCurrentEvent();
            this.loadLogo();
            this.setupClickHandler();
        },

        /**
         * Start auto-check for events (every hour)
         */
        startAutoCheck: function() {
            setInterval(() => {
                console.log('⏰ Auto-checking for logo events...');
                this.detectCurrentEvent();
                this.loadLogo();
            }, 3600000); // 1 hour
            
            // Also refresh from GSRCDN every 24 hours
            setInterval(() => {
                console.log('⏰ Auto-refreshing from GSRCDN...');
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
// 📖 USAGE EXAMPLE IN YOUR BLOGGER TEMPLATE
// ============================================

/*
// In your $(document).ready() function, AFTER GSRCDN is initialized:

$(document).ready(async function() {
    
    // ... other initialization code ...
    
    // Initialize Animated Logo System
    if (SHOP_CONFIG.animatedLogo && SHOP_CONFIG.animatedLogo.enabled) {
        try {
            await AnimatedLogoSystem.init({
                logoContainer: '#headerDoodleLogo',
                width: SHOP_CONFIG.animatedLogo.width,
                height: SHOP_CONFIG.animatedLogo.height,
                
                // GSRCDN Configuration
                scriptUrl: GSRCDN_CONFIG.scriptUrl,
                sheetName: SHOP_CONFIG.animatedLogo.sheetName,
                startRow: SHOP_CONFIG.animatedLogo.startRow,
                
                cdnPath: SHOP_CONFIG.animatedLogo.cdnPath,
                cacheDuration: SHOP_CONFIG.animatedLogo.cacheDuration,
                
                fallbackLogos: {
                    'default': SHOP_CONFIG.animatedLogo.fallbackLogo
                },
                
                clickAction: 'none'
            });
            
            console.log('✅ Current logo:', AnimatedLogoSystem.getCurrentLogo());
            
        } catch (error) {
            console.error('❌ Failed to initialize logo system:', error);
        }
    }
});


// ============================================
// 🛠️ CONSOLE COMMANDS FOR TESTING
// ============================================

// Manually trigger a logo event
AnimatedLogoSystem.triggerLogo('christmas');

// Reset to default logo
AnimatedLogoSystem.resetLogo();

// Refresh from GSRCDN (clears cache)
AnimatedLogoSystem.refreshLogos();

// Clear cache only
AnimatedLogoSystem.clearCache();

// Get current logo info
console.log(AnimatedLogoSystem.getCurrentLogo());

// Get all loaded logos
console.log(AnimatedLogoSystem.getAllLogos());


// ============================================
// 📋 GOOGLE SHEETS FORMAT (Sheet3, Row 100+)
// ============================================

Row 100 (Headers):
eventName | src | alt | animated | startDate | endDate | manual | enabled

Row 101+ (Data):
default | https://example.com/logo.png | Store Logo | FALSE | - | - | FALSE | TRUE
christmas | https://example.com/christmas.png | Christmas Sale | TRUE | 12-15 | 12-26 | FALSE | TRUE
newyear | https://example.com/newyear.png | Happy New Year | TRUE | 12-27 | 01-05 | FALSE | TRUE

Notes:
- Dates can be in MM-DD format (12-25) or full date strings (system will parse)
- Use "-" for empty date fields
- animated: TRUE/FALSE
- manual: TRUE = must trigger manually, FALSE = auto-detect by date
- enabled: TRUE/FALSE = is this event active?

*/