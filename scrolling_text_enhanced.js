/**
 * ScrollingText.js - Google Sheets Integration (ENHANCED)
 * Auto-rotating scrolling text with colors, backgrounds, and blink effects
 * Version: 2.0.0
 * 
 * Google Sheet Structure:
 * Sheet Name: "Sheet3"
 * 
 * Columns:
 * A: effect (rainbow, neon, disco, fire, matrix, marquee, gradient-flow, typewriter, flash-highlight, glow-pulse, blink, pulse-blink)
 * B: message (Your text message with emojis)
 * C: active (yes/no - to enable/disable messages)
 * D: priority (1-10 - higher shows more often)
 * E: textColor (optional - hex color like #FF0000 or color name like red)
 * F: bgColor (optional - hex color like #000000 or color name like black)
 * G: blinkSpeed (optional - slow/medium/fast - default: medium)
 * 
 * Example Rows:
 * rainbow | 🎉 Welcome! | yes | 5 | #FFFFFF | #FF0000 | medium
 * blink | ⚡ FLASH SALE! | yes | 8 | yellow | black | fast
 * neon | 💎 New Arrivals | yes | 5 | #00FFFF | transparent | slow
 */

(function(global) {
    'use strict';

    class ScrollingTextManager {
        constructor(options = {}) {
            this.options = {
                // Google Sheets API Config
                useGSRCDN: options.useGSRCDN !== false,
                sheetName: options.sheetName || 'Sheet3',
                
                // Selectors
                containerSelector: options.containerSelector || '.scrolling-text',
                textSelector: options.textSelector || '#scrolling-text',
                
                // Timing
                changeInterval: options.changeInterval || 5000,
                scrollSpeed: options.scrollSpeed || 20,
                
                // Features
                pauseOnHover: options.pauseOnHover !== false,
                randomOrder: options.randomOrder || false,
                enableLogging: options.enableLogging || false,
                
                // NEW: Color & Blink defaults
                defaultTextColor: options.defaultTextColor || null,
                defaultBgColor: options.defaultBgColor || null,
                defaultBlinkSpeed: options.defaultBlinkSpeed || 'medium',
                
                // Fallback messages
                fallbackMessages: options.fallbackMessages || [
                    { effect: 'rainbow', message: '🎉 Welcome to our store!', textColor: '#FFFFFF', bgColor: 'transparent' },
                    { effect: 'blink', message: '⚡ Flash Sale!', textColor: 'yellow', bgColor: 'red', blinkSpeed: 'fast' },
                    { effect: 'neon', message: '💎 Amazing deals!', textColor: '#00FFFF', bgColor: '#000000' },
                    { effect: 'pulse-blink', message: '🔥 Hot deals!', textColor: 'orange', bgColor: 'black', blinkSpeed: 'medium' }
                ],
                
                // Callbacks
                onLoad: options.onLoad || null,
                onError: options.onError || null,
                onChange: options.onChange || null
            };

            this.messages = [];
            this.currentIndex = 0;
            this.intervalId = null;
            this.container = null;
            this.textElement = null;
            this.isInitialized = false;

            // Available effects (EXPANDED LIST)
            this.availableEffects = [
                // Original effects
                'rainbow', 'neon', 'disco', 'fire', 'matrix',
                'marquee', 'gradient-flow', 'typewriter', 
                'flash-highlight', 'glow-pulse',
                
                // Blink effects
                'blink', 'pulse-blink', 'color-shift',
                
                // NEW: Shake & Bounce effects
                'shake', 'bounce', 'swing', 'wobble', 'jello',
                
                // NEW: Rotate & Flip effects
                'rotate', 'flip-horizontal', 'flip-vertical', 'spin',
                
                // NEW: Scale & Zoom effects
                'zoom-in', 'zoom-out', 'pulse-scale', 'heartbeat',
                
                // NEW: Slide effects
                'slide-left', 'slide-right', 'slide-up', 'slide-down',
                
                // NEW: Fade effects
                'fade-in-out', 'fade-pulse', 'flicker',
                
                // NEW: Glitch & Tech effects
                'glitch', 'glitch-rgb', 'scan-lines', 'hologram', 'cyber-wave',
                
                // NEW: Gradient effects
                'gradient-rainbow', 'gradient-sunset', 'gradient-ocean', 'gradient-fire',
                
                // NEW: Shadow & Glow effects
                'shadow-pulse', 'neon-glow', 'electric', 'glow-wave',
                
                // NEW: Border effects
                'border-flash', 'border-glow', 'outline-pulse',
                
                // NEW: 3D effects
                'text-3d', 'float-3d', 'pop-3d',
                
                // NEW: Wave effects
                'wave', 'wave-reverse', 'ripple',
                
                // NEW: Combination effects
                'rainbow-bounce', 'neon-shake', 'fire-pulse', 'matrix-glitch'
            ];

            // Blink speed mappings (in seconds)
            this.blinkSpeeds = {
                'slow': 1.5,
                'medium': 0.8,
                'fast': 0.4
            };
        }

        /**
         * Initialize the scrolling text system
         */
        async init() {
            this.log('Initializing ScrollingText Manager...');

            // Get DOM elements
            this.container = document.querySelector(this.options.containerSelector);
            this.textElement = document.querySelector(this.options.textSelector);

            if (!this.container || !this.textElement) {
                this.error('Container or text element not found');
                return false;
            }

            // Inject CSS for new effects
            this.injectBlinkStyles();

            // Load messages from Google Sheets
            await this.loadMessagesFromSheet();

            // Setup hover pause
            if (this.options.pauseOnHover) {
                this.setupHoverPause();
            }

            // Start auto-rotation
            this.startRotation();

            this.isInitialized = true;
            this.log('ScrollingText Manager initialized successfully');

            if (this.options.onLoad) {
                this.options.onLoad(this.messages);
            }

            return true;
        }

        /**
         * Inject CSS for blink and color effects
         */
        injectBlinkStyles() {
            const styleId = 'scrolling-text-blink-styles';
            if (document.getElementById(styleId)) return;

            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* Blink effect */
                .blink-effect {
                    animation: blink-animation var(--blink-speed, 0.8s) infinite;
                }

                @keyframes blink-animation {
                    0%, 49% { opacity: 1; }
                    50%, 100% { opacity: 0; }
                }

                /* Pulse blink effect (smooth fade) */
                .pulse-blink-effect {
                    animation: pulse-blink-animation var(--blink-speed, 0.8s) infinite;
                }

                @keyframes pulse-blink-animation {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.2; }
                }

                /* Color shift effect */
                .color-shift-effect {
                    animation: color-shift-animation 3s infinite;
                }

                @keyframes color-shift-animation {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }

                /* Smooth transitions for color changes */
                .scrolling-text {
                    transition: background-color 0.3s ease, color 0.3s ease;
                }
            `;
            document.head.appendChild(style);
            this.log('✅ Blink styles injected');
        }

        /**
         * Load messages from Google Sheets - ENHANCED VERSION
         */
        async loadMessagesFromSheet() {
            this.log('📡 Loading messages from Google Sheets...');

            try {
                let scriptUrl = this.options.scriptUrl;
                
                if (!scriptUrl && typeof GSRCDN_CONFIG !== 'undefined' && GSRCDN_CONFIG.scriptUrl) {
                    scriptUrl = GSRCDN_CONFIG.scriptUrl;
                }
                
                if (!scriptUrl && typeof GSRCDN !== 'undefined' && GSRCDN.config && GSRCDN.config.scriptUrl) {
                    scriptUrl = GSRCDN.config.scriptUrl;
                }

                if (!scriptUrl) {
                    throw new Error('❌ No script URL found');
                }

                const url = `${scriptUrl}?sheet=Sheet3&type=scrolling`;
                this.log(`🔗 Fetching from: ${url}`);

                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                this.log('📦 Raw response:', result);

                if (result.error) {
                    throw new Error(result.error);
                }

                // Parse the Sheet3 data with NEW color columns
                if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                    this.log(`✅ Found ${result.count} active messages`);
                    
                    this.messages = result.data.map(item => ({
                        effect: String(item.effect || 'rainbow').toLowerCase().trim(),
                        message: String(item.message || '').trim(),
                        priority: parseInt(item.priority) || 1,
                        textColor: item.textColor || this.options.defaultTextColor,
                        bgColor: item.bgColor || this.options.defaultBgColor,
                        blinkSpeed: item.blinkSpeed || this.options.defaultBlinkSpeed
                    }));
                    
                } else if (Array.isArray(result.data) && result.data.length > 0) {
                    this.messages = this.parseSheetData(result.data);
                } else if (Array.isArray(result) && result.length > 0) {
                    this.messages = this.parseSheetData(result);
                } else {
                    throw new Error('No valid data found');
                }

                this.messages = this.validateMessages(this.messages);
                this.log(`✅ Validated ${this.messages.length} messages`);

                if (this.messages.length === 0) {
                    this.log('⚠️ No valid messages, using fallback');
                    this.messages = this.options.fallbackMessages;
                } else {
                    this.messages = this.expandMessagesByPriority(this.messages);
                    this.log(`📊 Expanded to ${this.messages.length} messages`);
                }

                if (this.options.randomOrder) {
                    this.shuffleMessages();
                    this.log('🔀 Messages shuffled');
                }

                this.log('✅ Messages loaded successfully!');

            } catch (error) {
                this.error('❌ Error loading messages:', error);
                this.messages = this.options.fallbackMessages;
                
                if (this.options.onError) {
                    this.options.onError(error);
                }
            }
        }

        /**
         * Parse Google Sheets data - ENHANCED with color columns
         */
        parseSheetData(data) {
            const messages = [];

            data.forEach((row, index) => {
                if (index === 0) return; // Skip header

                const effect = row[0] ? row[0].toString().toLowerCase().trim() : '';
                const message = row[1] ? row[1].toString().trim() : '';
                const active = row[2] ? row[2].toString().toLowerCase().trim() : 'yes';
                const priority = row[3] ? parseInt(row[3]) : 1;
                const textColor = row[4] ? row[4].toString().trim() : this.options.defaultTextColor;
                const bgColor = row[5] ? row[5].toString().trim() : this.options.defaultBgColor;
                const blinkSpeed = row[6] ? row[6].toString().toLowerCase().trim() : this.options.defaultBlinkSpeed;

                if (active === 'yes' && message && this.availableEffects.includes(effect)) {
                    messages.push({ effect, message, priority, textColor, bgColor, blinkSpeed });
                }
            });

            return messages;
        }

        /**
         * Validate messages
         */
        validateMessages(messages) {
            return messages.filter(msg => {
                return msg.effect && 
                       msg.message && 
                       this.availableEffects.includes(msg.effect);
            });
        }

        /**
         * Expand messages based on priority
         */
        expandMessagesByPriority(messages) {
            const expanded = [];
            
            messages.forEach(msg => {
                const priority = Math.max(1, Math.min(parseInt(msg.priority) || 1, 10));
                
                for (let i = 0; i < priority; i++) {
                    expanded.push({
                        effect: msg.effect,
                        message: msg.message,
                        priority: msg.priority,
                        textColor: msg.textColor,
                        bgColor: msg.bgColor,
                        blinkSpeed: msg.blinkSpeed
                    });
                }
            });
            
            return expanded;
        }

        /**
         * Shuffle messages array
         */
        shuffleMessages() {
            for (let i = this.messages.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.messages[i], this.messages[j]] = [this.messages[j], this.messages[i]];
            }
        }

        /**
         * Start automatic rotation
         */
        startRotation() {
            this.changeMessage();

            this.intervalId = setInterval(() => {
                this.changeMessage();
            }, this.options.changeInterval);

            this.log('Auto-rotation started');
        }

        /**
         * Stop automatic rotation
         */
        stopRotation() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                this.log('Auto-rotation stopped');
            }
        }

        /**
         * Change to next message - ENHANCED with colors and blink
         */
        changeMessage() {
            if (this.messages.length === 0) return;

            const currentMessage = this.messages[this.currentIndex];

            // Remove all effect classes
            this.availableEffects.forEach(effect => {
                this.container.classList.remove(effect);
            });

            // Remove blink effect classes
            this.textElement.classList.remove('blink-effect', 'pulse-blink-effect', 'color-shift-effect');

            // Add new effect class
            this.container.classList.add(currentMessage.effect);

            // Apply text color
            if (currentMessage.textColor) {
                this.textElement.style.color = currentMessage.textColor;
            } else {
                this.textElement.style.color = '';
            }

            // Apply background color
            if (currentMessage.bgColor) {
                this.container.style.backgroundColor = currentMessage.bgColor;
            } else {
                this.container.style.backgroundColor = '';
            }

            // Apply blink effects
            if (currentMessage.effect === 'blink') {
                this.textElement.classList.add('blink-effect');
                const speed = this.blinkSpeeds[currentMessage.blinkSpeed] || this.blinkSpeeds.medium;
                this.textElement.style.setProperty('--blink-speed', `${speed}s`);
            } else if (currentMessage.effect === 'pulse-blink') {
                this.textElement.classList.add('pulse-blink-effect');
                const speed = this.blinkSpeeds[currentMessage.blinkSpeed] || this.blinkSpeeds.medium;
                this.textElement.style.setProperty('--blink-speed', `${speed}s`);
            } else if (currentMessage.effect === 'color-shift') {
                this.textElement.classList.add('color-shift-effect');
            }

            // Update text
            this.textElement.textContent = currentMessage.message;

            // Callback
            if (this.options.onChange) {
                this.options.onChange(currentMessage, this.currentIndex);
            }

            this.log(`Changed to effect: ${currentMessage.effect}, color: ${currentMessage.textColor}, bg: ${currentMessage.bgColor}`);

            // Move to next message
            this.currentIndex = (this.currentIndex + 1) % this.messages.length;
        }

        /**
         * Setup hover pause functionality
         */
        setupHoverPause() {
            this.container.addEventListener('mouseenter', () => {
                this.stopRotation();
            });

            this.container.addEventListener('mouseleave', () => {
                this.startRotation();
            });
        }

        /**
         * Reload messages from Sheet
         */
        async reload() {
            this.log('Reloading messages...');
            this.stopRotation();
            await this.loadMessagesFromSheet();
            this.currentIndex = 0;
            this.startRotation();
        }

        /**
         * Get current message
         */
        getCurrentMessage() {
            return this.messages[this.currentIndex];
        }

        /**
         * Get all messages
         */
        getAllMessages() {
            return this.messages;
        }

        /**
         * Add custom message dynamically - ENHANCED
         */
        addMessage(effect, message, priority = 1, textColor = null, bgColor = null, blinkSpeed = 'medium') {
            if (this.availableEffects.includes(effect)) {
                const count = Math.max(1, Math.min(priority, 10));
                for (let i = 0; i < count; i++) {
                    this.messages.push({ effect, message, priority, textColor, bgColor, blinkSpeed });
                }
                this.log(`Added custom message with effect: ${effect}`);
                return true;
            }
            return false;
        }

        /**
         * Set messages manually (bypass Sheet)
         */
        setMessages(messages) {
            this.messages = this.validateMessages(messages);
            this.currentIndex = 0;
            this.log(`Manually set ${this.messages.length} messages`);
        }

        /**
         * Logging helper
         */
        log(...args) {
            if (this.options.enableLogging) {
                console.log('[ScrollingText]', ...args);
            }
        }

        /**
         * Error logging
         */
        error(...args) {
            console.error('[ScrollingText]', ...args);
        }

        /**
         * Destroy instance
         */
        destroy() {
            this.stopRotation();
            
            // Clear inline styles
            if (this.textElement) {
                this.textElement.style.color = '';
                this.textElement.classList.remove('blink-effect', 'pulse-blink-effect', 'color-shift-effect');
            }
            
            if (this.container) {
                this.container.style.backgroundColor = '';
            }
            
            this.container = null;
            this.textElement = null;
            this.messages = [];
            this.isInitialized = false;
            this.log('Instance destroyed');
        }
    }

    // Export to global scope
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ScrollingTextManager;
    } else if (typeof define === 'function' && define.amd) {
        define(function() { return ScrollingTextManager; });
    } else {
        global.ScrollingTextManager = ScrollingTextManager;
    }

})(typeof window !== 'undefined' ? window : this);


/**
 * ============================================
 * USAGE EXAMPLES
 * ============================================
 */

/*

// BASIC USAGE
const scrollingText = new ScrollingTextManager({
    enableLogging: true
});
scrollingText.init();


// ADVANCED USAGE WITH DEFAULTS
const scrollingText = new ScrollingTextManager({
    sheetName: 'Sheet3',
    changeInterval: 5000,
    randomOrder: true,
    enableLogging: true,
    
    // Set default colors if not specified in sheet
    defaultTextColor: '#FFFFFF',
    defaultBgColor: 'transparent',
    defaultBlinkSpeed: 'medium',
    
    onLoad: (messages) => {
        console.log('Loaded ' + messages.length + ' messages');
    },
    
    onChange: (message, index) => {
        console.log('Effect:', message.effect, 'Color:', message.textColor);
    }
});

scrollingText.init();


// ADD CUSTOM MESSAGE WITH COLORS
scrollingText.addMessage('blink', '⚡ SALE NOW!', 5, 'yellow', 'red', 'fast');


// GOOGLE SHEET EXAMPLE ROWS:
// 
// Column A (effect) | Column B (message) | Column C (active) | Column D (priority) | Column E (textColor) | Column F (bgColor) | Column G (blinkSpeed)
// -----------------|-------------------|------------------|-------------------|-------------------|------------------|-------------------
// blink            | ⚡ FLASH SALE!     | yes              | 8                 | yellow            | red              | fast
// rainbow          | 🎉 Welcome!        | yes              | 5                 | #FFFFFF           | #000080          | medium
// pulse-blink      | 🔥 Hot Deal!       | yes              | 7                 | orange            | black            | slow
// neon             | 💎 New Arrivals    | yes              | 5                 | #00FFFF           | transparent      | medium
// color-shift      | 🌈 Amazing!        | yes              | 6                 |                   | #1a1a1a          |

*/