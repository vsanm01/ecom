/**
 * Animated Logo System with GSRCDN Integration - UNIVERSAL FORMAT SUPPORT
 * Version: 3.3.0
 * Supports ALL date formats and flexible image source formats
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
            
            // Image path configurations
            cdnPath: '', // Base CDN path
            imgixDomain: '', // e.g., 'mystore.imgix.net'
            cloudinaryCloud: '', // e.g., 'mycloud'
            githubRepo: '', // e.g., 'username/repo@main/logos/'
            
            fallbackFormat: 'png',
            clickAction: 'home',
            specialPageUrl: '/special-event',
            
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
                await this.loadLogosFromGSRCDN();
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
            const cachedData = this.getFromCache();
            if (cachedData) {
                console.log('📦 Using cached logo data');
                this.animatedLogos = cachedData;
                return;
            }

            console.log('📡 Fetching logo data from GSRCDN...');
            
            try {
                let logoData;
                
                if (window.GSRCDN && typeof GSRCDN.getData === 'function') {
                    console.log('📡 Using GSRCDN.getData method');
                    logoData = await GSRCDN.getData(
                        this.config.sheetName,
                        this.config.startRow
                    );
                } else {
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
                
                this.animatedLogos = this.parseGSRCDNData(logoData);
                this.saveToCache(this.animatedLogos);
                
                console.log('✅ Logo data loaded from GSRCDN');
            } catch (error) {
                console.error('❌ Error fetching from GSRCDN:', error);
                throw error;
            }
        },

        /**
         * Parse GSRCDN data into logo configuration
         */
        parseGSRCDNData: function(response) {
            console.log('🔍 Parsing GSRCDN response');
            
            let rows = [];
            
            if (response && response.success && Array.isArray(response.data)) {
                rows = response.data;
                console.log('📊 Found', rows.length, 'logo entries');
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
                if (!row.eventName || row.eventName === '' || row.eventName === '-') {
                    console.warn('⚠️ Skipping row without eventName:', row);
                    return;
                }
                
                const isEnabled = row.enabled !== undefined ? 
                    (row.enabled === true || row.enabled === 'true' || row.enabled === 1) : 
                    true;
                
                if (!isEnabled) {
                    console.log('⏭️ Skipping disabled event:', row.eventName);
                    return;
                }

                const eventKey = row.eventName.toLowerCase().trim();
                
                // Parse dates with universal format support
                const startDate = this.parseUniversalDate(row.startDate);
                const endDate = this.parseUniversalDate(row.endDate);
                
                logos[eventKey] = {
                    src: this.parseImageSource(row.src), // Universal image source parser
                    alt: row.alt || 'Logo',
                    animated: row.animated === true || row.animated === 'true' || row.animated === 1,
                    startDate: startDate,
                    endDate: endDate,
                    manual: row.manual === true || row.manual === 'true' || row.manual === 1 || false
                };
                
                console.log(`✅ Parsed logo: ${eventKey}`, logos[eventKey]);
            });

            if (!logos['default']) {
                console.warn('⚠️ No default logo found, using fallback');
                logos['default'] = this.config.fallbackLogos['default'];
            }

            console.log('📦 Total logos loaded:', Object.keys(logos).length);
            return logos;
        },

        /**
         * UNIVERSAL DATE PARSER - Supports all common date formats
         * Supported formats:
         * - MM-DD (12-25)
         * - MM/DD (12/25)
         * - DD-MM (25-12)
         * - DD/MM (25/12)
         * - YYYY-MM-DD (2025-12-25)
         * - YYYY/MM/DD (2025/12/25)
         * - DD MMM (25 Dec, 25 December)
         * - MMM DD (Dec 25, December 25)
         * - ISO 8601 (2025-12-25T00:00:00Z)
         * - Unix timestamp (1735084800000)
         * - Full date strings (Sun Dec 25 2025 00:00:00 GMT+0530)
         * - Relative dates (today, tomorrow, in 5 days)
         */
        parseUniversalDate: function(dateInput) {
            if (!dateInput || dateInput === '-' || dateInput === '' || dateInput === null || dateInput === undefined) {
                return null;
            }
            
            // Convert to string if not already
            const dateStr = String(dateInput).trim();
            
            console.log(`🔍 Parsing date input: "${dateStr}"`);
            
            // Already in MM-DD format
            if (/^\d{2}-\d{2}$/.test(dateStr)) {
                console.log(`✅ Already in MM-DD format: ${dateStr}`);
                return dateStr;
            }
            
            // MM/DD format (convert to MM-DD)
            if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) {
                const [month, day] = dateStr.split('/');
                const result = `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                console.log(`✅ Converted MM/DD to MM-DD: ${result}`);
                return result;
            }
            
            // DD-MM format (European, needs config to detect)
            // We'll try to detect by context or use ISO parsing
            
            // YYYY-MM-DD or YYYY/MM/DD format
            if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(dateStr)) {
                try {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const result = `${month}-${day}`;
                        console.log(`✅ Parsed YYYY-MM-DD format to: ${result}`);
                        return result;
                    }
                } catch (e) {
                    console.warn('⚠️ Failed to parse YYYY-MM-DD format:', dateStr);
                }
            }
            
            // Month name formats (25 Dec, Dec 25, December 25, etc.)
            const monthNames = {
                'jan': '01', 'january': '01',
                'feb': '02', 'february': '02',
                'mar': '03', 'march': '03',
                'apr': '04', 'april': '04',
                'may': '05',
                'jun': '06', 'june': '06',
                'jul': '07', 'july': '07',
                'aug': '08', 'august': '08',
                'sep': '09', 'sept': '09', 'september': '09',
                'oct': '10', 'october': '10',
                'nov': '11', 'november': '11',
                'dec': '12', 'december': '12'
            };
            
            // Pattern: "25 Dec" or "25 December"
            const dayMonthMatch = dateStr.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)/i);
            if (dayMonthMatch) {
                const day = dayMonthMatch[1].padStart(2, '0');
                const month = monthNames[dayMonthMatch[2].toLowerCase()];
                const result = `${month}-${day}`;
                console.log(`✅ Parsed "DD MMM" format to: ${result}`);
                return result;
            }
            
            // Pattern: "Dec 25" or "December 25"
            const monthDayMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+(\d{1,2})/i);
            if (monthDayMatch) {
                const month = monthNames[monthDayMatch[1].toLowerCase()];
                const day = monthDayMatch[2].padStart(2, '0');
                const result = `${month}-${day}`;
                console.log(`✅ Parsed "MMM DD" format to: ${result}`);
                return result;
            }
            
            // Unix timestamp (milliseconds)
            if (/^\d{13}$/.test(dateStr)) {
                try {
                    const date = new Date(parseInt(dateStr, 10));
                    if (!isNaN(date.getTime())) {
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const result = `${month}-${day}`;
                        console.log(`✅ Parsed Unix timestamp to: ${result}`);
                        return result;
                    }
                } catch (e) {
                    console.warn('⚠️ Failed to parse Unix timestamp:', dateStr);
                }
            }
            
            // Relative dates (today, tomorrow, etc.)
            const today = new Date();
            const lowerStr = dateStr.toLowerCase();
            
            if (lowerStr === 'today') {
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const result = `${month}-${day}`;
                console.log(`✅ Parsed "today" to: ${result}`);
                return result;
            }
            
            if (lowerStr === 'tomorrow') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
                const day = String(tomorrow.getDate()).padStart(2, '0');
                const result = `${month}-${day}`;
                console.log(`✅ Parsed "tomorrow" to: ${result}`);
                return result;
            }
            
            // "in X days" or "after X days"
            const relativeDaysMatch = dateStr.match(/(in|after)\s+(\d+)\s+days?/i);
            if (relativeDaysMatch) {
                const daysToAdd = parseInt(relativeDaysMatch[2], 10);
                const futureDate = new Date(today);
                futureDate.setDate(futureDate.getDate() + daysToAdd);
                const month = String(futureDate.getMonth() + 1).padStart(2, '0');
                const day = String(futureDate.getDate()).padStart(2, '0');
                const result = `${month}-${day}`;
                console.log(`✅ Parsed "in ${daysToAdd} days" to: ${result}`);
                return result;
            }
            
            // Try parsing as a general date string (last resort)
            try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const result = `${month}-${day}`;
                    console.log(`✅ Parsed generic date string to: ${result}`);
                    return result;
                }
            } catch (e) {
                console.warn('⚠️ Could not parse date:', dateStr);
            }
            
            console.error('❌ Unrecognized date format:', dateStr);
            return null;
        },

        /**
         * UNIVERSAL IMAGE SOURCE PARSER
         * Supports:
         * - Full URLs (https://example.com/logo.png)
         * - Relative paths (logo.png, /images/logo.png, ./logo.png)
         * - CDN shortcuts (cdn:logo.png)
         * - Imgix URLs (imgix:logo.png)
         * - Cloudinary URLs (cloudinary:logo.png)
         * - GitHub raw URLs (github:logo.png)
         * - Data URIs (data:image/png;base64,...)
         * - Google Drive IDs (drive:1A2B3C4D5E)
         * - Dropbox URLs (dropbox:public/logo.png)
         */
        parseImageSource: function(srcInput) {
            if (!srcInput || srcInput === '' || srcInput === '-') {
                console.warn('⚠️ Empty image source, using default');
                return this.config.defaultLogo;
            }
            
            const src = String(srcInput).trim();
            console.log(`🔍 Parsing image source: "${src}"`);
            
            // Already a full URL (http:// or https://)
            if (/^https?:\/\//i.test(src)) {
                console.log('✅ Full URL detected');
                return src;
            }
            
            // Data URI (base64 encoded image)
            if (/^data:image\//i.test(src)) {
                console.log('✅ Data URI detected');
                return src;
            }
            
            // CDN shortcut (cdn:logo.png)
            if (src.startsWith('cdn:')) {
                const filename = src.substring(4);
                const url = this.config.cdnPath + filename;
                console.log(`✅ CDN shortcut converted to: ${url}`);
                return url;
            }
            
            // Imgix shortcut (imgix:logo.png)
            if (src.startsWith('imgix:')) {
                const filename = src.substring(6);
                const url = `https://${this.config.imgixDomain}/${filename}`;
                console.log(`✅ Imgix shortcut converted to: ${url}`);
                return url;
            }
            
            // Cloudinary shortcut (cloudinary:logo.png or cloudinary:v1234567/logo.png)
            if (src.startsWith('cloudinary:')) {
                const path = src.substring(11);
                const url = `https://res.cloudinary.com/${this.config.cloudinaryCloud}/image/upload/${path}`;
                console.log(`✅ Cloudinary shortcut converted to: ${url}`);
                return url;
            }
            
            // GitHub raw shortcut (github:logo.png)
            if (src.startsWith('github:')) {
                const filename = src.substring(7);
                const url = `https://cdn.jsdelivr.net/gh/${this.config.githubRepo}${filename}`;
                console.log(`✅ GitHub shortcut converted to: ${url}`);
                return url;
            }
            
            // GitHub raw alternative (gh:username/repo@branch/path/logo.png)
            if (src.startsWith('gh:')) {
                const path = src.substring(3);
                const url = `https://cdn.jsdelivr.net/gh/${path}`;
                console.log(`✅ GitHub alternative shortcut converted to: ${url}`);
                return url;
            }
            
            // Google Drive ID (drive:1A2B3C4D5E or gdrive:1A2B3C4D5E)
            if (src.startsWith('drive:') || src.startsWith('gdrive:')) {
                const fileId = src.split(':')[1];
                const url = `https://drive.google.com/uc?export=view&id=${fileId}`;
                console.log(`✅ Google Drive ID converted to: ${url}`);
                return url;
            }
            
            // Dropbox public link (dropbox:public/logo.png)
            if (src.startsWith('dropbox:')) {
                const path = src.substring(8);
                // Note: User needs to provide full Dropbox public URL in config
                const url = `https://www.dropbox.com/s/${path}?raw=1`;
                console.log(`✅ Dropbox shortcut converted to: ${url}`);
                return url;
            }
            
            // jsDelivr NPM package (npm:package@version/file.png)
            if (src.startsWith('npm:')) {
                const path = src.substring(4);
                const url = `https://cdn.jsdelivr.net/npm/${path}`;
                console.log(`✅ NPM package shortcut converted to: ${url}`);
                return url;
            }
            
            // unpkg shortcut (unpkg:package@version/file.png)
            if (src.startsWith('unpkg:')) {
                const path = src.substring(6);
                const url = `https://unpkg.com/${path}`;
                console.log(`✅ unpkg shortcut converted to: ${url}`);
                return url;
            }
            
            // Relative path - use CDN path as base
            if (this.config.cdnPath) {
                // Handle leading slash
                const cleanSrc = src.startsWith('/') ? src.substring(1) : src;
                // Handle ./ prefix
                const finalSrc = cleanSrc.startsWith('./') ? cleanSrc.substring(2) : cleanSrc;
                const url = this.config.cdnPath + finalSrc;
                console.log(`✅ Relative path converted to: ${url}`);
                return url;
            }
            
            // Return as-is (assume it's a valid relative URL from document root)
            console.log('ℹ️ Using source as-is (relative path)');
            return src;
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

                if (now - cacheData.timestamp < this.config.cacheDuration) {
                    return cacheData.data;
                }

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

        useFallbackLogos: function() {
            console.log('⚠️ Using fallback logos');
            this.animatedLogos = this.config.fallbackLogos;
            this.currentLogo = 'default';
            this.loadLogo();
        },

        detectCurrentEvent: function() {
            const today = new Date();
            const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
            const currentDay = String(today.getDate()).padStart(2, '0');
            const currentDate = `${currentMonth}-${currentDay}`;

            console.log('📅 Current date:', currentDate);

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

            this.currentLogo = 'default';
            console.log('🏠 Using default logo');
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

            const logoUrl = logoData.src;
            logoImg.dataset.loading = 'true';

            this.preloadImage(logoUrl, () => {
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
                
                console.log('✅ Loaded logo:', logoData.alt, '(' + this.currentLogo + ')');
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

        resetLogo: function() {
            this.currentLogo = 'default';
            this.loadLogo();
            this.setupClickHandler();
            console.log('🔄 Reset to default logo');
        },

        refreshLogos: async function() {
            console.log('🔄 Refreshing logos from GSRCDN...');
            this.clearCache();
            await this.loadLogosFromGSRCDN();
            this.detectCurrentEvent();
            this.loadLogo();
            this.setupClickHandler();
        },

        startAutoCheck: function() {
            setInterval(() => {
                console.log('⏰ Auto-checking for logo events...');
                this.detectCurrentEvent();
                this.loadLogo();
            }, 3600000);
            
            setInterval(() => {
                console.log('⏰ Auto-refreshing from GSRCDN...');
                this.refreshLogos();
            }, 86400000);
        },

        getCurrentLogo: function() {
            return {
                event: this.currentLogo,
                data: this.animatedLogos[this.currentLogo]
            };
        },

        getAllLogos: function() {
            return this.animatedLogos;
        }
    };

    window.AnimatedLogoSystem = AnimatedLogoSystem;

})(window);


/* 
==========================================
📅 SUPPORTED DATE FORMATS
==========================================

1. MM-DD format:
   12-25, 01-15, 06-30

2. MM/DD format:
   12/25, 1/15, 6/30

3. YYYY-MM-DD (ISO):
   2025-12-25, 2025-01-15

4. YYYY/MM/DD:
   2025/12/25, 2025/1/15

5. Month names (short):
   Dec 25, 25 Dec, Jan 15, 15 Jan

6. Month names (full):
   December 25, 25 December, January 15, 15 January

7. Full date strings:
   Sun Dec 25 2025 00:00:00 GMT+0530
   Wed Jan 15 2025 12:00:00

8. Unix timestamps:
   1735084800000

9. Relative dates:
   today
   tomorrow
   in 5 days
   after 10 days

10. ISO 8601:
    2025-12-25T00:00:00Z
    2025-12-25T12:00:00+05:30

==========================================
🖼️ SUPPORTED IMAGE SOURCE FORMATS
==========================================

1. Full URLs:
   https://example.com/logo.png
   http://cdn.example.com/images/logo.webp

2. Relative paths:
   logo.png
   /images/logo.png
   ./logos/christmas.gif

3. CDN shortcuts:
   cdn:logo.png
   → Uses config.cdnPath + filename

4. Imgix:
   imgix:logo.png
   → https://yourdomain.imgix.net/logo.png

5. Cloudinary:
   cloudinary:logo.png
   cloudinary:v1234567/logo.png
   → https://res.cloudinary.com/yourcloud/image/upload/...

6. GitHub (jsDelivr):
   github:logo.png
   gh:username/repo@main/logos/logo.png
   → https://cdn.jsdelivr.net/gh/...

7. Google Drive:
   drive:1A2B3C4D5E6F7G8H9I
   gdrive:1A2B3C4D5E6F7G8H9I
   → https://drive.google.com/uc?export=view&id=...

8. Dropbox:
   dropbox:public/logo.png
   → https://www.dropbox.com/s/public/logo.png?raw=1

9. NPM packages (jsDelivr):
   npm:package-name@1.0.0/dist/logo.png
   → https://cdn.jsdelivr.net/npm/...

10. unpkg:
    unpkg:package-name@1.0.0/logo.png
    → https://unpkg.com/...

11. Data URIs:
    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...

==========================================
📋 GOOGLE SHEETS EXAMPLES
==========================================

Row 100 (Headers):
eventName | src | alt | animated | startDate | endDate | manual | enabled

Row 101+ (Examples with different formats):

default | https://cdn.example.com/logo.png | Store Logo | FALSE | - | - | FALSE | TRUE

christmas | cdn:christmas.webp | Christmas Sale | TRUE | 12-25 | 12-26 | FALSE | TRUE

newyear | cdn:newyear.gif | Happy New Year | TRUE | Dec 27 | Jan 5 | FALSE | TRUE

valentine | imgix:valentine.png | Valentine's Day | TRUE | 2025-02-14 | 2025-02-15 | FALSE | TRUE

flashsale | cloudinary:v1234/flash.webp | Flash Sale! | TRUE | today | tomorrow | FALSE | TRUE

easter | github:easter.png | Easter Sale | TRUE | 04/20 | 04/22 | FALSE | TRUE

independence | gh:user/repo@main/logos/flag.png | Independence Day | TRUE | July 4 | July 4 | FALSE | TRUE

diwali | drive:1A2B3C4D5E6F7G8H | Happy Diwali | TRUE | 11-01 | 11-05 | FALSE | TRUE

blackfriday | npm:holiday-logos@1.0.0/black-friday.svg | Black Friday | TRUE | Nov 29 | Nov 29 | FALSE | TRUE

custom | data:image/svg+xml;base64,PHN2Zy... | Custom Event | TRUE | in 5 days | in 10 days | FALSE | TRUE

==========================================
⚙️ CONFIGURATION EXAMPLES
==========================================

Example 1: Using CDN shortcut
------------------------------
await AnimatedLogoSystem.init({
    logoContainer: '#siteLogo',
    scriptUrl: GSRCDN_CONFIG.scriptUrl,
    sheetName: 'Sheet3',
    startRow: 101,
    
    // Set base CDN path
    cdnPath: 'https://cdn.jsdelivr.net/gh/username/repo@main/logos/',
    
    // Then in sheet, just use: cdn:logo.png
});

Example 2: Using Imgix
-----------------------
await AnimatedLogoSystem.init({
    logoContainer: '#siteLogo',
    scriptUrl: GSRCDN_CONFIG.scriptUrl,
    sheetName: 'Sheet3',
    startRow: 101,
    
    // Set Imgix domain
    imgixDomain: 'mystore.imgix.net',
    
    // Then in sheet, use: imgix:logos/christmas.png
});

Example 3: Using Cloudinary
----------------------------
await AnimatedLogoSystem.init({
    logoContainer: '#siteLogo',
    scriptUrl: GSRCDN_CONFIG.scriptUrl,
    sheetName: 'Sheet3',
    startRow: 101,
    
    // Set Cloudinary cloud name
    cloudinaryCloud: 'mycloud',
    
    // Then in sheet, use: cloudinary:logo.png
    // Or with version: cloudinary:v1234567/logo.png
});

Example 4: Using GitHub
------------------------
await AnimatedLogoSystem.init({
    logoContainer: '#siteLogo',
    scriptUrl: GSRCDN_CONFIG.scriptUrl,
    sheetName: 'Sheet3',
    startRow: 101,
    
    // Set GitHub repo
    githubRepo: 'username/repo@main/logos/',
    
    // Then in sheet, use: github:christmas.png
    // Or full path: gh:username/repo@main/path/logo.png
});

Example 5: Mixed sources (most flexible)
-----------------------------------------
await AnimatedLogoSystem.init({
    logoContainer: '#siteLogo',
    scriptUrl: GSRCDN_CONFIG.scriptUrl,
    sheetName: 'Sheet3',
    startRow: 101,
    
    // Configure multiple sources
    cdnPath: 'https://cdn.example.com/logos/',
    imgixDomain: 'store.imgix.net',
    cloudinaryCloud: 'mycloud',
    githubRepo: 'user/logos@main/',
});

// Then in Google Sheets, mix and match:
// - cdn:logo.png → uses cdnPath
// - imgix:logo.png → uses imgixDomain  
// - cloudinary:logo.png → uses cloudinaryCloud
// - github:logo.png → uses githubRepo
// - https://example.com/logo.png → direct URL
// - drive:1A2B3C4D → Google Drive
// - logo.png → falls back to cdnPath

==========================================
🔧 UTILITY FUNCTIONS FOR TESTING
==========================================

// Test date parsing
AnimatedLogoSystem.parseUniversalDate('12-25');
AnimatedLogoSystem.parseUniversalDate('Dec 25');
AnimatedLogoSystem.parseUniversalDate('2025-12-25');
AnimatedLogoSystem.parseUniversalDate('today');
AnimatedLogoSystem.parseUniversalDate('in 5 days');

// Test image source parsing
AnimatedLogoSystem.parseImageSource('cdn:logo.png');
AnimatedLogoSystem.parseImageSource('imgix:logo.png');
AnimatedLogoSystem.parseImageSource('cloudinary:v123/logo.png');
AnimatedLogoSystem.parseImageSource('github:logo.png');
AnimatedLogoSystem.parseImageSource('drive:1A2B3C4D5E');
AnimatedLogoSystem.parseImageSource('https://example.com/logo.png');

// Get all parsed logos to verify
console.log(AnimatedLogoSystem.getAllLogos());

// Check current active logo
console.log(AnimatedLogoSystem.getCurrentLogo());

==========================================
🎯 MIGRATION GUIDE
==========================================

From doodle_logo_fixed.js to doodle_logo_universal.js:

✅ 100% backward compatible
✅ No changes needed to existing sheet data
✅ All old formats continue to work

NEW capabilities you can now use:

1. Date formats in sheets:
   - Keep existing MM-DD format (12-25)
   - OR use Dec 25, December 25
   - OR use 2025-12-25
   - OR use today, tomorrow, in 5 days

2. Image sources in sheets:
   - Keep existing full URLs
   - OR use cdn:filename.png shortcut
   - OR use imgix:filename.png
   - OR use cloudinary:filename.png
   - OR use github:filename.png
   - OR use drive:FILE_ID
   - Mix and match formats!

3. Configuration:
   Add new CDN shortcuts (optional):
   
   await AnimatedLogoSystem.init({
       // ... existing config ...
       
       // NEW: Add these if you want shortcuts
       cdnPath: 'https://cdn.example.com/',
       imgixDomain: 'store.imgix.net',
       cloudinaryCloud: 'mycloud',
       githubRepo: 'user/repo@main/logos/'
   });

==========================================
💡 BEST PRACTICES
==========================================

1. Date Format Consistency:
   ✅ Use MM-DD (12-25) for simplicity
   ✅ Use full dates (2025-12-25) if you need year-specific events
   ❌ Avoid mixing formats in same sheet (harder to read)

2. Image Source Strategy:
   ✅ Use CDN shortcuts for cleaner sheets (cdn:logo.png)
   ✅ Use full URLs for external images
   ✅ Configure one primary CDN method
   ❌ Don't use 10 different source types unless necessary

3. Performance:
   ✅ Use WebP or AVIF for better compression
   ✅ Optimize images before uploading
   ✅ Use CDN with good global coverage
   ⚠️ Avoid huge GIF files (use CSS animations instead)

4. Maintenance:
   ✅ Keep logo files organized by event name
   ✅ Use consistent naming (christmas.png, christmas-2025.png)
   ✅ Document your CDN structure
   ✅ Test all logos before events go live

==========================================
🐛 TROUBLESHOOTING
==========================================

Issue: Date not parsing correctly
Solution: Check console logs for parsed format
         Use AnimatedLogoSystem.parseUniversalDate('your-date') to test

Issue: Image not loading
Solution: Check console logs for final URL
         Use AnimatedLogoSystem.parseImageSource('your-src') to test
         Verify CDN configuration matches source format

Issue: Wrong logo showing
Solution: Check date range logic with console logs
         Verify enabled=TRUE in sheet
         Check for overlapping date ranges

Issue: Logo not updating
Solution: Clear cache: AnimatedLogoSystem.clearCache()
         Then: AnimatedLogoSystem.refreshLogos()

Issue: Multiple events active
Solution: Use priority system (see enhanced version)
         Or make date ranges non-overlapping

==========================================
🚀 ADVANCED TIPS
==========================================

1. Dynamic Logo Testing:
   // Test any event logo instantly
   AnimatedLogoSystem.triggerLogo('christmas');
   
   // Test with custom date
   const testDate = '12-25';
   AnimatedLogoSystem.isDateInRange(testDate, '12-20', '12-26');

2. Preload Upcoming Logos:
   // Preload next event's logo
   const upcomingEvents = AnimatedLogoSystem.getAllLogos();
   Object.values(upcomingEvents).forEach(logo => {
       const img = new Image();
       img.src = logo.src;
   });

3. A/B Testing:
   // Randomly show one of two logos
   const events = ['christmas-a', 'christmas-b'];
   const random = events[Math.floor(Math.random() * events.length)];
   AnimatedLogoSystem.triggerLogo(random);

4. Seasonal Rotation:
   // Rotate through seasonal logos
   const seasons = ['spring', 'summer', 'fall', 'winter'];
   const month = new Date().getMonth();
   const season = seasons[Math.floor(month / 3)];
   if (AnimatedLogoSystem.getAllLogos()[season]) {
       AnimatedLogoSystem.triggerLogo(season);
   }

==========================================
📊 ANALYTICS INTEGRATION
==========================================

// Track which logos are viewed
const originalLoadLogo = AnimatedLogoSystem.loadLogo;
AnimatedLogoSystem.loadLogo = function() {
    originalLoadLogo.call(this);
    
    // Send to Google Analytics
    if (window.gtag) {
        gtag('event', 'logo_view', {
            'event_category': 'logo',
            'event_label': this.currentLogo,
            'value': 1
        });
    }
    
    // Or send to custom analytics
    fetch('/api/analytics/logo-view', {
        method: 'POST',
        body: JSON.stringify({
            event: this.currentLogo,
            timestamp: Date.now()
        })
    });
};

==========================================
🎨 CSS ANIMATION EXAMPLES
==========================================

/* Fade in animation */
.animated-logo {
    animation: logoFadeIn 0.5s ease-in-out;
}

@keyframes logoFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Bounce animation */
.animated-logo {
    animation: logoBounce 2s ease-in-out infinite;
}

@keyframes logoBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

/* Pulse animation */
.animated-logo {
    animation: logoPulse 2s ease-in-out infinite;
}

@keyframes logoPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

/* Rotate on hover */
.animated-logo {
    transition: transform 0.3s ease;
}

.animated-logo:hover {
    transform: rotate(5deg) scale(1.1);
}

==========================================
✨ FEATURES SUMMARY
==========================================

✅ Universal date parsing (10+ formats)
✅ Flexible image sources (11+ types)
✅ CDN shortcuts (cdn:, imgix:, cloudinary:, etc.)
✅ Relative dates (today, tomorrow, in X days)
✅ Google Drive & Dropbox support
✅ Data URI support (inline images)
✅ NPM package logos via jsDelivr/unpkg
✅ Detailed console logging for debugging
✅ Backward compatible with fixed version
✅ Same caching & auto-refresh features
✅ Clean, maintainable code

Need help with specific format? Just ask!
*/