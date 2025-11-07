/**
 * Animated Logo System with GSRCDN Integration - ENHANCED
 * Version: 4.0.0
 * Improvements: Priority system, transitions, retry logic, validation, analytics
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
            
            // GSRCDN Configuration
            scriptUrl: '',
            sheetName: 'Sheet3',
            startRow: 101,
            
            // Cache settings
            cacheKey: 'animatedLogos_cache',
            cacheDuration: 3600000, // 1 hour
            
            // NEW: Retry configuration
            maxRetries: 3,
            retryDelay: 2000, // 2 seconds
            
            // NEW: Transition settings
            enableTransitions: true,
            transitionDuration: 300, // ms
            
            cdnPath: '',
            fallbackFormat: 'png',
            clickAction: 'home',
            specialPageUrl: '/special-event',
            
            // NEW: Analytics callback
            onLogoChange: null, // function(eventName, logoData) {}
            
            // NEW: Debug mode
            debug: false,
            
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
        retryCount: 0,
        autoCheckInterval: null,
        autoRefreshInterval: null,
        
        /**
         * Initialize the logo system
         */
        init: async function(userConfig = {}) {
            this.config = { ...this.config, ...userConfig };
            
            this.log('🚀 Initializing Animated Logo System v4.0.0');
            
            try {
                // Load logos from GSRCDN with retry logic
                await this.loadLogosFromGSRCDNWithRetry();
                
                // Detect and load current event
                this.detectCurrentEvent();
                this.loadLogo();
                this.setupClickHandler();
                this.startAutoCheck();
                
                this.log('✅ Animated Logo System initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize logo system:', error);
                this.useFallbackLogos();
            }
            
            return this;
        },

        /**
         * NEW: Retry wrapper for GSRCDN calls
         */
        loadLogosFromGSRCDNWithRetry: async function() {
            for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
                try {
                    await this.loadLogosFromGSRCDN();
                    return; // Success
                } catch (error) {
                    this.log(`⚠️ Attempt ${attempt}/${this.config.maxRetries} failed:`, error.message);
                    
                    if (attempt < this.config.maxRetries) {
                        this.log(`⏳ Retrying in ${this.config.retryDelay}ms...`);
                        await this.sleep(this.config.retryDelay);
                    } else {
                        throw error; // Max retries reached
                    }
                }
            }
        },

        /**
         * Load logo configuration from GSRCDN
         */
        loadLogosFromGSRCDN: async function() {
            // Check cache first
            const cachedData = this.getFromCache();
            if (cachedData) {
                this.log('📦 Using cached logo data');
                this.animatedLogos = cachedData;
                return;
            }

            this.log('📡 Fetching logo data from GSRCDN...');
            
            try {
                let logoData;
                
                if (window.GSRCDN && typeof GSRCDN.getData === 'function') {
                    this.log('📡 Using GSRCDN.getData method');
                    logoData = await GSRCDN.getData(
                        this.config.sheetName,
                        this.config.startRow
                    );
                } else {
                    this.log('📡 Using direct fetch method');
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
                
                this.log('📊 Logo data received:', logoData);
                
                if (!logoData) {
                    throw new Error('No logo data returned from GSRCDN');
                }
                
                // Parse and validate the data
                this.animatedLogos = this.parseGSRCDNData(logoData);
                
                // NEW: Validate logo configuration
                this.validateLogoConfig();
                
                // Cache the data
                this.saveToCache(this.animatedLogos);
                
                this.log('✅ Logo data loaded from GSRCDN');
            } catch (error) {
                console.error('❌ Error fetching from GSRCDN:', error);
                throw error;
            }
        },

        /**
         * Parse GSRCDN data into logo configuration
         */
        parseGSRCDNData: function(response) {
            this.log('🔍 Parsing GSRCDN response');
            
            let rows = [];
            
            if (response && response.success && Array.isArray(response.data)) {
                rows = response.data;
                this.log('📊 Found', rows.length, 'logo entries');
            } else if (Array.isArray(response)) {
                rows = response;
            } else if (response && Array.isArray(response.data)) {
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
                    this.log('⚠️ Skipping row without eventName:', row);
                    return;
                }
                
                // Check if enabled (default: true)
                const isEnabled = row.enabled !== undefined ? 
                    (row.enabled === true || row.enabled === 'true' || row.enabled === 1) : 
                    true;
                
                if (!isEnabled) {
                    this.log('⏭️ Skipping disabled event:', row.eventName);
                    return;
                }

                const eventKey = row.eventName.toLowerCase().trim();
                
                logos[eventKey] = {
                    src: row.src || 'logo.png',
                    alt: row.alt || 'Logo',
                    animated: row.animated === true || row.animated === 'true' || row.animated === 1,
                    startDate: this.parseDate(row.startDate),
                    endDate: this.parseDate(row.endDate),
                    manual: row.manual === true || row.manual === 'true' || row.manual === 1 || false,
                    priority: this.parsePriority(row.priority), // NEW: Priority support
                    link: row.link || null // NEW: Custom link support
                };
                
                this.log(`✅ Parsed logo: ${eventKey}`, logos[eventKey]);
            });

            // Ensure default logo exists
            if (!logos['default']) {
                this.log('⚠️ No default logo found, using fallback');
                logos['default'] = this.config.fallbackLogos['default'];
            }

            this.log('📦 Total logos loaded:', Object.keys(logos).length);
            return logos;
        },

        /**
         * NEW: Parse priority (higher = more important)
         */
        parsePriority: function(priority) {
            if (!priority || priority === '-' || priority === '') return 0;
            const parsed = parseInt(priority, 10);
            return isNaN(parsed) ? 0 : parsed;
        },

        /**
         * Parse date from various formats
         */
        parseDate: function(dateStr) {
            if (!dateStr || dateStr === '-' || dateStr === '' || dateStr === null || dateStr === undefined) {
                return null;
            }
            
            dateStr = String(dateStr).trim();
            
            if (/^\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }
            
            try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const parsed = `${month}-${day}`;
                    this.log(`📅 Parsed date "${dateStr}" -> "${parsed}"`);
                    return parsed;
                }
            } catch (e) {
                this.log('⚠️ Could not parse date:', dateStr);
            }
            
            return null;
        },

        /**
         * NEW: Validate logo configuration
         */
        validateLogoConfig: function() {
            const issues = [];
            
            for (const [eventName, logoData] of Object.entries(this.animatedLogos)) {
                // Check for valid image URLs
                if (!logoData.src || logoData.src === '') {
                    issues.push(`Event "${eventName}" has no image source`);
                }
                
                // Check date logic
                if (logoData.startDate && logoData.endDate) {
                    const [startM, startD] = logoData.startDate.split('-').map(Number);
                    const [endM, endD] = logoData.endDate.split('-').map(Number);
                    
                    // Warn if dates seem suspicious (but allow year wrapping)
                    if (startM === endM && startD > endD) {
                        issues.push(`Event "${eventName}" has start date after end date in same month`);
                    }
                }
            }
            
            if (issues.length > 0) {
                console.warn('⚠️ Logo configuration issues:', issues);
            }
            
            return issues.length === 0;
        },

        /**
         * Cache management
         */
        saveToCache: function(data) {
            try {
                const cacheData = {
                    timestamp: Date.now(),
                    data: data,
                    version: '4.0.0' // NEW: Version tracking
                };
                localStorage.setItem(this.config.cacheKey, JSON.stringify(cacheData));
                this.log('💾 Cached logo data');
            } catch (error) {
                this.log('⚠️ Failed to save cache:', error);
            }
        },

        getFromCache: function() {
            try {
                const cached = localStorage.getItem(this.config.cacheKey);
                if (!cached) return null;

                const cacheData = JSON.parse(cached);
                const now = Date.now();

                // NEW: Check version compatibility
                if (cacheData.version !== '4.0.0') {
                    this.log('🔄 Cache version mismatch, invalidating');
                    localStorage.removeItem(this.config.cacheKey);
                    return null;
                }

                if (now - cacheData.timestamp < this.config.cacheDuration) {
                    return cacheData.data;
                }

                localStorage.removeItem(this.config.cacheKey);
                return null;
            } catch (error) {
                this.log('⚠️ Failed to read cache:', error);
                return null;
            }
        },

        clearCache: function() {
            localStorage.removeItem(this.config.cacheKey);
            this.log('🗑️ Cache cleared');
        },

        useFallbackLogos: function() {
            this.log('⚠️ Using fallback logos');
            this.animatedLogos = this.config.fallbackLogos;
            this.currentLogo = 'default';
            this.loadLogo();
        },

        /**
         * NEW: Detect current event with priority support
         */
        detectCurrentEvent: function() {
            const today = new Date();
            const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
            const currentDay = String(today.getDate()).padStart(2, '0');
            const currentDate = `${currentMonth}-${currentDay}`;

            this.log('📅 Current date:', currentDate);

            // NEW: Find all active events with priority
            const activeEvents = [];

            for (const [eventName, eventData] of Object.entries(this.animatedLogos)) {
                if (eventData.manual) {
                    this.log('⏭️ Skipping manual event:', eventName);
                    continue;
                }
                if (eventName === 'default') continue;

                if (eventData.startDate && eventData.endDate) {
                    if (this.isDateInRange(currentDate, eventData.startDate, eventData.endDate)) {
                        activeEvents.push({
                            name: eventName,
                            priority: eventData.priority || 0,
                            data: eventData
                        });
                        this.log('✅ Active event found:', eventName, '(priority:', eventData.priority || 0, ')');
                    }
                }
            }

            // NEW: Sort by priority (highest first)
            if (activeEvents.length > 0) {
                activeEvents.sort((a, b) => b.priority - a.priority);
                this.currentLogo = activeEvents[0].name;
                this.log('🎯 Selected Event:', this.currentLogo, '(priority:', activeEvents[0].priority, ')');
                
                if (activeEvents.length > 1) {
                    this.log('ℹ️ Other active events:', activeEvents.slice(1).map(e => e.name).join(', '));
                }
            } else {
                this.currentLogo = 'default';
                this.log('🏠 Using default logo');
            }
        },

        isDateInRange: function(current, start, end) {
            const [startMonth, startDay] = start.split('-').map(Number);
            const [endMonth, endDay] = end.split('-').map(Number);
            const [currentMonth, currentDay] = current.split('-').map(Number);

            if (startMonth > endMonth) {
                return (
                    (currentMonth === startMonth && currentDay >= startDay) ||
                    (currentMonth === endMonth && currentDay <= endDay) ||
                    (currentMonth > startMonth || currentMonth < endMonth)
                );
            } else {
                return (
                    (currentMonth === startMonth && currentDay >= startDay) ||
                    (currentMonth === endMonth && currentDay <= endDay) ||
                    (currentMonth > startMonth && currentMonth < endMonth)
                );
            }
        },

        /**
         * NEW: Load logo with smooth transitions
         */
        loadLogo: function(force = false) {
            const logoData = this.animatedLogos[this.currentLogo];
            if (!logoData) {
                this.log('⚠️ Logo data not found for:', this.currentLogo);
                return;
            }

            const logoImg = document.querySelector(this.config.logoContainer);
            if (!logoImg) {
                this.log('⚠️ Logo container not found:', this.config.logoContainer);
                return;
            }

            // Skip if same logo (unless forced)
            if (!force && logoImg.dataset.logoEvent === this.currentLogo) {
                this.log('ℹ️ Logo already loaded:', this.currentLogo);
                return;
            }

            const logoUrl = logoData.src.startsWith('http') ? 
                logoData.src : 
                this.config.cdnPath + logoData.src;

            logoImg.dataset.loading = 'true';

            // NEW: Smooth transition
            if (this.config.enableTransitions) {
                logoImg.style.transition = `opacity ${this.config.transitionDuration}ms ease-in-out`;
                logoImg.style.opacity = '0';
            }

            this.preloadImage(logoUrl, () => {
                setTimeout(() => {
                    logoImg.src = logoUrl;
                    logoImg.alt = logoData.alt;
                    logoImg.width = this.config.width;
                    logoImg.height = this.config.height;

                    if (logoData.animated) {
                        logoImg.classList.add('animated-logo');
                    } else {
                        logoImg.classList.remove('animated-logo');
                    }

                    logoImg.dataset.logoEvent = this.currentLogo;
                    logoImg.dataset.loading = 'false';
                    
                    // NEW: Fade in
                    if (this.config.enableTransitions) {
                        logoImg.style.opacity = '1';
                    }
                    
                    this.log('✅ Loaded logo:', logoData.alt, '(' + this.currentLogo + ')');
                    
                    // NEW: Analytics callback
                    if (this.config.onLogoChange && typeof this.config.onLogoChange === 'function') {
                        this.config.onLogoChange(this.currentLogo, logoData);
                    }
                }, this.config.enableTransitions ? this.config.transitionDuration : 0);
            });
        },

        preloadImage: function(url, callback) {
            const img = new Image();
            img.onload = () => {
                if (callback) callback();
            };
            img.onerror = () => {
                console.error('❌ Failed to load logo:', url);
                if (callback) callback();
            };
            img.src = url;
        },

        /**
         * NEW: Enhanced click handler with custom links
         */
        setupClickHandler: function() {
            const logoLink = document.querySelector(this.config.logoLink);
            if (!logoLink) return;

            const logoData = this.animatedLogos[this.currentLogo];
            
            // NEW: Custom link support
            if (logoData?.link && logoData.link !== '') {
                logoLink.href = logoData.link;
            } else if (this.config.clickAction === 'special-page' && logoData?.animated) {
                logoLink.href = this.config.specialPageUrl;
            } else if (this.config.clickAction === 'home') {
                logoLink.href = '/';
            }
        },

        triggerLogo: function(eventName) {
            if (!this.animatedLogos[eventName]) {
                console.error('❌ Logo event not found:', eventName);
                return;
            }

            this.currentLogo = eventName;
            this.loadLogo(true); // Force reload
            this.setupClickHandler();
            this.log('🎯 Manually triggered logo:', eventName);
        },

        resetLogo: function() {
            this.currentLogo = 'default';
            this.loadLogo(true);
            this.setupClickHandler();
            this.log('🔄 Reset to default logo');
        },

        refreshLogos: async function() {
            this.log('🔄 Refreshing logos from GSRCDN...');
            this.clearCache();
            await this.loadLogosFromGSRCDNWithRetry();
            this.detectCurrentEvent();
            this.loadLogo(true);
            this.setupClickHandler();
        },

        /**
         * NEW: Better interval management
         */
        startAutoCheck: function() {
            // Clear existing intervals
            this.stopAutoCheck();
            
            // Check for event changes every hour
            this.autoCheckInterval = setInterval(() => {
                this.log('⏰ Auto-checking for logo events...');
                this.detectCurrentEvent();
                this.loadLogo();
            }, 3600000);
            
            // Refresh from GSRCDN every 24 hours
            this.autoRefreshInterval = setInterval(() => {
                this.log('⏰ Auto-refreshing from GSRCDN...');
                this.refreshLogos();
            }, 86400000);
        },

        /**
         * NEW: Stop auto-check intervals
         */
        stopAutoCheck: function() {
            if (this.autoCheckInterval) {
                clearInterval(this.autoCheckInterval);
                this.autoCheckInterval = null;
            }
            if (this.autoRefreshInterval) {
                clearInterval(this.autoRefreshInterval);
                this.autoRefreshInterval = null;
            }
            this.log('⏸️ Auto-check stopped');
        },

        getCurrentLogo: function() {
            return {
                event: this.currentLogo,
                data: this.animatedLogos[this.currentLogo]
            };
        },

        getAllLogos: function() {
            return this.animatedLogos;
        },

        /**
         * NEW: Get active events (currently in date range)
         */
        getActiveEvents: function() {
            const today = new Date();
            const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
            const currentDay = String(today.getDate()).padStart(2, '0');
            const currentDate = `${currentMonth}-${currentDay}`;

            const active = [];
            for (const [eventName, eventData] of Object.entries(this.animatedLogos)) {
                if (eventName === 'default' || eventData.manual) continue;
                if (eventData.startDate && eventData.endDate) {
                    if (this.isDateInRange(currentDate, eventData.startDate, eventData.endDate)) {
                        active.push({
                            name: eventName,
                            ...eventData
                        });
                    }
                }
            }
            return active;
        },

        /**
         * NEW: Utility functions
         */
        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        log: function(...args) {
            if (this.config.debug) {
                console.log('[AnimatedLogo]', ...args);
            }
        },

        /**
         * NEW: Destroy instance (cleanup)
         */
        destroy: function() {
            this.stopAutoCheck();
            this.animatedLogos = {};
            this.currentLogo = null;
            this.log('💥 AnimatedLogoSystem destroyed');
        }
    };

    window.AnimatedLogoSystem = AnimatedLogoSystem;

})(window);

/* 
====================================
NEW FEATURES IN v4.0.0:
====================================

1. PRIORITY SYSTEM
   - Logos can have priority values (higher = more important)
   - If multiple events are active, highest priority wins
   - Add "priority" column in your sheet (e.g., 10, 5, 1)

2. SMOOTH TRANSITIONS
   - Fade in/out when changing logos
   - Configurable transition duration
   - Can be disabled: enableTransitions: false

3. RETRY LOGIC
   - Automatically retries failed GSRCDN requests
   - Configurable retry count and delay
   - More resilient to network issues

4. VALIDATION
   - Validates logo configuration after loading
   - Warns about missing images or invalid dates
   - Helps catch configuration errors early

5. CUSTOM LINKS
   - Each logo can have its own link URL
   - Add "link" column in your sheet
   - Overrides default clickAction

6. ANALYTICS CALLBACK
   - onLogoChange callback fires when logo changes
   - Track logo views in Google Analytics
   - Example: onLogoChange: (name, data) => gtag('event', 'logo_view', {event_name: name})

7. DEBUG MODE
   - Enable detailed logging: debug: true
   - Helps troubleshooting without cluttering console

8. VERSION TRACKING
   - Cache includes version number
   - Prevents issues when upgrading
   - Auto-invalidates old cache

9. BETTER CLEANUP
   - stopAutoCheck() to pause timers
   - destroy() to fully cleanup instance
   - Prevents memory leaks

10. UTILITY METHODS
    - getActiveEvents() - see all currently active events
    - Force reload: loadLogo(true)
    - Better error messages

====================================
UPDATED GOOGLE SHEETS FORMAT:
====================================

Row 100 (Headers):
eventName | src | alt | animated | startDate | endDate | manual | enabled | priority | link

Row 101+ (Data):
default | logo.png | Store Logo | FALSE | - | - | FALSE | TRUE | 0 | 
christmas | xmas.png | Christmas | TRUE | 12-15 | 12-26 | FALSE | TRUE | 10 | /christmas-sale
flashsale | flash.png | Flash Sale | TRUE | 11-07 | 11-07 | FALSE | TRUE | 20 | /flash-sale
newyear | ny.png | New Year | TRUE | 12-27 | 01-05 | FALSE | TRUE | 5 | 

====================================
USAGE EXAMPLE:
====================================

await AnimatedLogoSystem.init({
    logoContainer: '#siteLogo',
    scriptUrl: GSRCDN_CONFIG.scriptUrl,
    sheetName: 'Sheet3',
    startRow: 101,
    
    // NEW OPTIONS
    debug: true,
    enableTransitions: true,
    transitionDuration: 400,
    maxRetries: 3,
    retryDelay: 2000,
    
    onLogoChange: (eventName, logoData) => {
        console.log('Logo changed to:', eventName);
        // Track in analytics
        if (window.gtag) {
            gtag('event', 'logo_view', {
                event_name: eventName,
                event_category: 'logo'
            });
        }
    }
});

// NEW: Get all active events
console.log('Active events:', AnimatedLogoSystem.getActiveEvents());

// NEW: Stop auto-checking (if needed)
AnimatedLogoSystem.stopAutoCheck();

// NEW: Clean up when done
AnimatedLogoSystem.destroy();

*/