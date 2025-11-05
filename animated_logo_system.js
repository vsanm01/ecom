/**
 * Animated Logo System (Yoodle Style)
 * Version: 1.0.0
 * Dynamic logo manager with animated WebP support
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
            animatedLogos: {
                // Special events with animated WebP logos
                'default': {
                    src: 'logo.png',
                    alt: 'Store Logo',
                    animated: false
                },
                'christmas': {
                    src: 'logo-christmas-animated.webp',
                    alt: 'Christmas Special',
                    animated: true,
                    startDate: '12-15',
                    endDate: '12-26'
                },
                'newyear': {
                    src: 'logo-newyear-animated.webp',
                    alt: 'Happy New Year',
                    animated: true,
                    startDate: '12-27',
                    endDate: '01-05'
                },
                'valentines': {
                    src: 'logo-valentine-animated.webp',
                    alt: 'Valentine\'s Day',
                    animated: true,
                    startDate: '02-10',
                    endDate: '02-15'
                },
                'blackfriday': {
                    src: 'logo-blackfriday-animated.webp',
                    alt: 'Black Friday Sale',
                    animated: true,
                    startDate: '11-20',
                    endDate: '11-28'
                },
                'diwali': {
                    src: 'logo-diwali-animated.webp',
                    alt: 'Diwali Festival',
                    animated: true,
                    startDate: '10-20',
                    endDate: '11-05'
                },
                'sale': {
                    src: 'logo-sale-animated.webp',
                    alt: 'Special Sale',
                    animated: true,
                    manual: true // Manually trigger
                }
            },
            cdnPath: '', // e.g., 'https://cdn.yourdomain.com/logos/'
            fallbackFormat: 'png',
            clickAction: 'home', // 'home', 'special-page', 'none'
            specialPageUrl: '/special-event'
        },

        currentLogo: null,
        
        /**
         * Initialize the logo system
         */
        init: function(userConfig = {}) {
            this.config = { ...this.config, ...userConfig };
            this.detectCurrentEvent();
            this.loadLogo();
            this.setupClickHandler();
            this.startAutoCheck(); // Check for events every hour
            return this;
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
            for (const [eventName, eventData] of Object.entries(this.config.animatedLogos)) {
                if (eventData.manual) continue; // Skip manual events
                if (eventName === 'default') continue;

                if (eventData.startDate && eventData.endDate) {
                    if (this.isDateInRange(currentDate, eventData.startDate, eventData.endDate)) {
                        this.currentLogo = eventName;
                        console.log('Active Event:', eventName);
                        return;
                    }
                }
            }

            // Default logo if no event
            this.currentLogo = 'default';
        },

        /**
         * Check if date is in range
         */
        isDateInRange: function(current, start, end) {
            // Handle year-wrap (like Dec 27 - Jan 5)
            const [startMonth, startDay] = start.split('-').map(Number);
            const [endMonth, endDay] = end.split('-').map(Number);
            const [currentMonth, currentDay] = current.split('-').map(Number);

            if (startMonth > endMonth) {
                // Year wrap case
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
            const logoData = this.config.animatedLogos[this.currentLogo];
            if (!logoData) return;

            const logoImg = document.querySelector(this.config.logoContainer);
            if (!logoImg) {
                console.warn('Logo container not found:', this.config.logoContainer);
                return;
            }

            // Build full URL
            const logoUrl = this.config.cdnPath + logoData.src;

            // Update logo
            logoImg.src = logoUrl;
            logoImg.alt = logoData.alt;
            logoImg.width = this.config.width;
            logoImg.height = this.config.height;

            // Add animation class if animated
            if (logoData.animated) {
                logoImg.classList.add('animated-logo');
                this.preloadImage(logoUrl); // Ensure smooth loading
            } else {
                logoImg.classList.remove('animated-logo');
            }

            // Store current logo info
            logoImg.dataset.logoEvent = this.currentLogo;
            
            console.log('Loaded logo:', logoData.alt);
        },

        /**
         * Preload image for smooth transition
         */
        preloadImage: function(url) {
            const img = new Image();
            img.src = url;
        },

        /**
         * Setup click handler for logo
         */
        setupClickHandler: function() {
            const logoLink = document.querySelector(this.config.logoLink);
            if (!logoLink) return;

            const logoData = this.config.animatedLogos[this.currentLogo];
            
            if (this.config.clickAction === 'special-page' && logoData.animated) {
                logoLink.href = this.config.specialPageUrl;
            } else if (this.config.clickAction === 'home') {
                logoLink.href = '/';
            }
        },

        /**
         * Manually trigger a special logo
         */
        triggerLogo: function(eventName) {
            if (!this.config.animatedLogos[eventName]) {
                console.error('Logo event not found:', eventName);
                return;
            }

            this.currentLogo = eventName;
            this.loadLogo();
            this.setupClickHandler();
        },

        /**
         * Reset to default logo
         */
        resetLogo: function() {
            this.currentLogo = 'default';
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
        },

        /**
         * Add new event logo dynamically
         */
        addEvent: function(eventName, eventData) {
            this.config.animatedLogos[eventName] = eventData;
        },

        /**
         * Get current logo info
         */
        getCurrentLogo: function() {
            return {
                event: this.currentLogo,
                data: this.config.animatedLogos[this.currentLogo]
            };
        }
    };

    // Export to window
    window.AnimatedLogoSystem = AnimatedLogoSystem;

})(window);


// ============================================
// HELPER FUNCTIONS FOR LOGO CREATION
// ============================================

const LogoHelper = {
    /**
     * Create animated WebP from GIF
     * (Run this in browser console with a GIF file)
     */
    convertGifToWebP: async function(gifFile) {
        // This would need a server-side solution or external tool
        console.log('Use online tools like:');
        console.log('1. https://ezgif.com/gif-to-webp');
        console.log('2. https://cloudconvert.com/gif-to-webp');
        console.log('3. Photoshop: File > Export > Save for Web (WebP)');
    },

    /**
     * Generate logo dimensions based on aspect ratio
     */
    calculateDimensions: function(originalWidth, originalHeight, targetWidth) {
        const aspectRatio = originalWidth / originalHeight;
        return {
            width: targetWidth,
            height: Math.round(targetWidth / aspectRatio)
        };
    },

    /**
     * Create CSS for animated logo
     */
    generateCSS: function() {
        return `
/* Animated Logo Styles */
.animated-logo {
    animation: pulse 2s ease-in-out infinite;
}

.animated-logo:hover {
    animation-play-state: paused;
    transform: scale(1.05);
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.02);
    }
}

/* Smooth transitions */
#siteLogo {
    transition: all 0.3s ease;
}

/* Loading state */
#siteLogo[data-loading="true"] {
    opacity: 0.5;
    filter: blur(2px);
}
        `;
    },

    /**
     * Test if browser supports animated WebP
     */
    supportsAnimatedWebP: async function() {
        return new Promise((resolve) => {
            const webP = 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA';
            const img = new Image();
            img.onload = img.onerror = () => {
                resolve(img.height === 1);
            };
            img.src = webP;
        });
    }
};


// ============================================
// USAGE EXAMPLE
// ============================================

/*
// Initialize in your Blogger template
$(document).ready(function() {
    
    // Initialize Animated Logo System
    AnimatedLogoSystem.init({
        logoContainer: '#siteLogo',
        logoLink: '.logo a',
        width: 120,
        height: 55,
        cdnPath: 'https://cdn.jsdelivr.net/gh/yourusername/yourrepo@main/logos/',
        animatedLogos: {
            'default': {
                src: 'logo.png',
                alt: SHOP_CONFIG.businessName,
                animated: false
            },
            'christmas': {
                src: 'logo-christmas.webp',
                alt: 'Christmas Sale',
                animated: true,
                startDate: '12-15',
                endDate: '12-26'
            },
            'newyear': {
                src: 'logo-newyear.webp',
                alt: 'Happy New Year 2025',
                animated: true,
                startDate: '12-27',
                endDate: '01-05'
            },
            'sale': {
                src: 'logo-flash-sale.webp',
                alt: 'Flash Sale!',
                animated: true,
                manual: true
            }
        },
        clickAction: 'home'
    });
    
    // Manually trigger sale logo
    // AnimatedLogoSystem.triggerLogo('sale');
    
    // Reset to default
    // AnimatedLogoSystem.resetLogo();
    
});
*/