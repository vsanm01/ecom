/**
 * ScrollingText.js - Google Sheets Integration
 * Auto-rotating scrolling text effects with messages from Google Sheets
 * Version: 1.0.0
 * 
 * Google Sheet Structure:
 * Sheet Name: "Sheet3"
 * 
 * Columns:
 * A: effect (rainbow, neon, disco, fire, matrix, marquee, gradient-flow, typewriter, flash-highlight, glow-pulse)
 * B: message (Your text message with emojis)
 * C: active (yes/no - to enable/disable messages)
 * D: priority (1-10 - higher shows more often)
 * 
 * Example Row:
 * rainbow | 🎉 Welcome to our store! Amazing products await! | yes | 5
 */

(function(global) {
    'use strict';

    class ScrollingTextManager {
        constructor(options = {}) {
            this.options = {
                // Google Sheets API Config (uses your existing GSRCDN_CONFIG)
                useGSRCDN: options.useGSRCDN !== false,
                sheetName: options.sheetName || 'Sheet3',
                
                // Selectors
                containerSelector: options.containerSelector || '.scrolling-text',
                textSelector: options.textSelector || '#scrolling-text',
                
                // Timing
                changeInterval: options.changeInterval || 5000, // 5 seconds
                scrollSpeed: options.scrollSpeed || 20, // seconds for one scroll
                
                // Features
                pauseOnHover: options.pauseOnHover !== false,
                randomOrder: options.randomOrder || false,
                enableLogging: options.enableLogging || false,
                
                // Fallback messages (if Sheet fails to load)
                fallbackMessages: options.fallbackMessages || [
                    { effect: 'rainbow', message: '🎉 Welcome to our store! Check out our amazing products!' },
                    { effect: 'neon', message: '⚡ Flash Sale! Limited time only!' },
                    { effect: 'disco', message: '🎊 Party Time! Latest arrivals!' },
                    { effect: 'fire', message: '🔥 Hot deals burning now!' },
                    { effect: 'matrix', message: '💻 Enter the matrix of savings...' }
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

            // Available effects
            this.availableEffects = [
                'rainbow', 'neon', 'disco', 'fire', 'matrix',
                'marquee', 'gradient-flow', 'typewriter', 
                'flash-highlight', 'glow-pulse'
            ];
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
 * Load messages from Google Sheets
 */
async loadMessagesFromSheet() {
    this.log('Loading messages from Google Sheets...');

    try {
        // Get script URL from GSRCDN_CONFIG if available
        const scriptUrl = (typeof GSRCDN_CONFIG !== 'undefined' && GSRCDN_CONFIG.scriptUrl) 
            ? GSRCDN_CONFIG.scriptUrl 
            : this.options.scriptUrl;

        if (!scriptUrl) {
            throw new Error('No script URL provided. Set GSRCDN_CONFIG.scriptUrl or pass scriptUrl option.');
        }

        // Fetch messages from Google Sheets with type=scrolling for public endpoint
        const url = `${scriptUrl}?sheet=${this.options.sheetName}&type=scrolling`;
        this.log(`Fetching from: ${url}`);

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Check for API errors
        if (result.error) {
            throw new Error(result.error);
        }

        // Parse response data from the new public endpoint format
        if (result.success && Array.isArray(result.data)) {
            // Data is already in the correct format: { effect, message, priority, row }
            this.messages = result.data.map(item => ({
                effect: item.effect,
                message: item.message,
                priority: item.priority || 1
            }));
            this.log(`✅ Loaded ${this.messages.length} messages from Sheet3 (${result.count} active)`);
        } else if (Array.isArray(result.data)) {
            // Fallback for older response format
            this.messages = this.parseSheetData(result.data);
            this.log(`Loaded ${this.messages.length} messages from Sheet`);
        } else {
            throw new Error('Invalid response format from API');
        }

        // Validate messages
        this.messages = this.validateMessages(this.messages);

        if (this.messages.length === 0) {
            this.log('⚠️ No valid messages found, using fallback');
            this.messages = this.options.fallbackMessages;
        }

        // Expand messages based on priority
        this.messages = this.expandMessagesByPriority(this.messages);

        // Shuffle if random order
        if (this.options.randomOrder) {
            this.shuffleMessages();
        }

    } catch (error) {
        this.error('Error loading messages from Sheet:', error);
        this.messages = this.options.fallbackMessages;
        
        if (this.options.onError) {
            this.options.onError(error);
        }
    }
}


/**
 * Expand messages based on priority (duplicate high priority messages)
 */
expandMessagesByPriority(messages) {
    const expanded = [];
    messages.forEach(msg => {
        const count = Math.max(1, Math.min(msg.priority || 1, 10));
        for (let i = 0; i < count; i++) {
            expanded.push({ ...msg });
        }
    });
    return expanded;
}

        /**
         * Parse Google Sheets data
         */
        parseSheetData(data) {
            const messages = [];

            data.forEach((row, index) => {
                // Skip header row
                if (index === 0) return;

                const effect = row[0] ? row[0].toString().toLowerCase().trim() : '';
                const message = row[1] ? row[1].toString().trim() : '';
                const active = row[2] ? row[2].toString().toLowerCase().trim() : 'yes';
                const priority = row[3] ? parseInt(row[3]) : 1;

                // Only add active messages with valid effect
                if (active === 'yes' && message && this.availableEffects.includes(effect)) {
                    // Add message multiple times based on priority
                    const count = Math.max(1, Math.min(priority, 10));
                    for (let i = 0; i < count; i++) {
                        messages.push({ effect, message, priority });
                    }
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
            // Show first message immediately
            this.changeMessage();

            // Set up interval
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
         * Change to next message
         */
        changeMessage() {
            if (this.messages.length === 0) return;

            // Get current message
            const currentMessage = this.messages[this.currentIndex];

            // Remove all effect classes
            this.availableEffects.forEach(effect => {
                this.container.classList.remove(effect);
            });

            // Add new effect class
            this.container.classList.add(currentMessage.effect);

            // Update text
            this.textElement.textContent = currentMessage.message;

            // Callback
            if (this.options.onChange) {
                this.options.onChange(currentMessage, this.currentIndex);
            }

            this.log(`Changed to effect: ${currentMessage.effect}`);

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
         * Add custom message dynamically
         */
        addMessage(effect, message, priority = 1) {
            if (this.availableEffects.includes(effect)) {
                const count = Math.max(1, Math.min(priority, 10));
                for (let i = 0; i < count; i++) {
                    this.messages.push({ effect, message, priority });
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

// BASIC USAGE (uses existing GSRCDN_CONFIG)
const scrollingText = new ScrollingTextManager();
scrollingText.init();


// ADVANCED USAGE
const scrollingText = new ScrollingTextManager({
    sheetName: 'Sheet3',
    changeInterval: 5000,
    randomOrder: true,
    enableLogging: true,
    
    onLoad: (messages) => {
        console.log('Loaded ' + messages.length + ' messages');
    },
    
    onChange: (message, index) => {
        console.log('Changed to:', message.effect);
    },
    
    onError: (error) => {
        console.error('Error:', error);
    }
});

scrollingText.init();


// RELOAD MESSAGES FROM SHEET
scrollingText.reload();


// ADD CUSTOM MESSAGE
scrollingText.addMessage('rainbow', '🎁 Special promotion!', 5);


// GET CURRENT MESSAGE
const current = scrollingText.getCurrentMessage();


// STOP/START ROTATION
scrollingText.stopRotation();
scrollingText.startRotation();


// DESTROY INSTANCE
scrollingText.destroy();

*/
