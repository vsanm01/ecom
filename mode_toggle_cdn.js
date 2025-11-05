/**
 * ECOM/Catalog Mode Toggle Library
 * Version: 1.0.0
 * Author: Your Name
 * Description: Reusable toggle switch for switching between ECOM and Catalog modes
 * 
 * Usage:
 * 1. Include CSS: <link href="path/to/mode_toggle_styles.css" rel="stylesheet"/>
 * 2. Include JS: <script src="path/to/ecom_catalog_toggle.js"></script>
 * 3. Initialize: ModeToggle.init({ config })
 * 
 * GitHub CDN Example:
 * <script src="https://cdn.jsdelivr.net/gh/username/repo@main/ecom_catalog_toggle.js"></script>
 */

(function(window) {
    'use strict';
    
    const ModeToggle = {
        // Default configuration
        config: {
            // Toggle element IDs
            toggleId: 'modeToggle',
            badgeId: 'modeBadge',
            containerId: 'modeToggleContainer',
            
            // Mode settings
            defaultMode: 'ecom',
            catalogEnabledKey: 'catalogMode', // Key in config object
            
            // Storage
            storageKey: 'shopMode',
            useLocalStorage: true,
            
            // Labels
            ecomLabel: 'Shopping Mode',
            catalogLabel: 'Catalog Mode',
            toggleEcomText: 'ECOM',
            toggleCatalogText: 'CAT',
            disabledTooltip: 'Catalog mode disabled in configuration',
            
            // Config source
            configObject: null, // Will be set to SHOP_CONFIG or custom object
            
            // Callbacks
            onModeChange: null,
            onInit: null,
            beforeSwitch: null,
            afterSwitch: null,
            
            // Notifications
            showNotifications: true,
            notificationCallback: null, // Custom notification function
            
            // Renderers
            ecomRenderer: null,
            catalogRenderer: null,
            productsArray: [],
            
            // Advanced
            autoInject: true, // Auto-inject HTML if container not found
            autoInjectTarget: 'header-actions', // Target element class/id
            debug: false
        },
        
        // Internal state
        state: {
            currentMode: 'ecom',
            catalogEnabled: false,
            initialized: false,
            toggleElement: null,
            badgeElement: null,
            containerElement: null
        },
        
        /**
         * Initialize the toggle system
         * @param {Object} options - Configuration options
         */
        init: function(options) {
            if (this.state.initialized) {
                this.log('Already initialized. Use reinit() to reinitialize.');
                return;
            }
            
            // Merge options with defaults
            this.config = Object.assign({}, this.config, options);
            
            // Set config object reference
            if (!this.config.configObject && typeof SHOP_CONFIG !== 'undefined') {
                this.config.configObject = SHOP_CONFIG;
            }
            
            this.log('Initializing ModeToggle...', this.config);
            
            // Load catalog mode status from config
            this.loadCatalogStatus();
            
            // Load saved mode
            this.loadSavedMode();
            
            // Get DOM elements
            this.getDOMElements();
            
            // Auto-inject HTML if needed
            if (this.config.autoInject && !this.state.toggleElement) {
                this.injectHTML();
            }
            
            // Setup toggle
            this.setupToggle();
            
            // Update UI
            this.updateUI();
            
            // Mark as initialized
            this.state.initialized = true;
            
            // Callback
            if (this.config.onInit) {
                this.config.onInit(this.state.currentMode, this.state.catalogEnabled);
            }
            
            this.log('✅ ModeToggle initialized', {
                mode: this.state.currentMode,
                catalogEnabled: this.state.catalogEnabled
            });
        },
        
        /**
         * Reinitialize the toggle (useful after config changes)
         */
        reinit: function(options) {
            this.state.initialized = false;
            this.init(options);
        },
        
        /**
         * Load catalog mode status from config
         */
        loadCatalogStatus: function() {
            const configObj = this.config.configObject;
            if (!configObj) {
                this.log('⚠️ No config object provided');
                this.state.catalogEnabled = false;
                return;
            }
            
            const catalogValue = configObj[this.config.catalogEnabledKey];
            
            // Check if catalog mode is enabled (TRUE string or boolean)
            if (typeof catalogValue === 'string' && catalogValue.toUpperCase() === 'TRUE') {
                this.state.catalogEnabled = true;
            } else if (catalogValue === true) {
                this.state.catalogEnabled = true;
            } else {
                this.state.catalogEnabled = false;
            }
            
            this.log('📋 Catalog Status:', {
                configValue: catalogValue,
                enabled: this.state.catalogEnabled
            });
        },
        
        /**
         * Load saved mode from localStorage
         */
        loadSavedMode: function() {
            if (!this.config.useLocalStorage) {
                this.state.currentMode = this.config.defaultMode;
                return;
            }
            
            // If catalog is disabled, always use ecom
            if (!this.state.catalogEnabled) {
                this.state.currentMode = 'ecom';
                return;
            }
            
            const saved = localStorage.getItem(this.config.storageKey);
            if (saved && (saved === 'ecom' || saved === 'catalog')) {
                this.state.currentMode = saved;
            } else {
                this.state.currentMode = this.config.defaultMode;
            }
            
            this.log('💾 Loaded mode from storage:', this.state.currentMode);
        },
        
        /**
         * Save current mode to localStorage
         */
        saveMode: function() {
            if (this.config.useLocalStorage) {
                localStorage.setItem(this.config.storageKey, this.state.currentMode);
                this.log('💾 Saved mode:', this.state.currentMode);
            }
        },
        
        /**
         * Get DOM elements
         */
        getDOMElements: function() {
            this.state.toggleElement = document.getElementById(this.config.toggleId);
            this.state.badgeElement = document.getElementById(this.config.badgeId);
            this.state.containerElement = document.getElementById(this.config.containerId);
            
            this.log('🔍 DOM Elements:', {
                toggle: !!this.state.toggleElement,
                badge: !!this.state.badgeElement,
                container: !!this.state.containerElement
            });
        },
        
        /**
         * Auto-inject HTML
         */
        injectHTML: function() {
            const target = document.querySelector('.' + this.config.autoInjectTarget) || 
                          document.getElementById(this.config.autoInjectTarget);
            
            if (!target) {
                this.log('⚠️ Auto-inject target not found:', this.config.autoInjectTarget);
                return;
            }
            
            const html = `
                <div class="mode-toggle-container" id="${this.config.containerId}">
                    <label class="mode-toggle">
                        <input id="${this.config.toggleId}" type="checkbox"/>
                        <span class="toggle-slider">
                            <span class="toggle-label toggle-label-ecom">${this.config.toggleEcomText}</span>
                            <span class="toggle-label toggle-label-cat">${this.config.toggleCatalogText}</span>
                        </span>
                    </label>
                    <span class="mode-badge ecom" id="${this.config.badgeId}">${this.config.ecomLabel}</span>
                </div>
            `;
            
            target.insertAdjacentHTML('afterbegin', html);
            this.getDOMElements();
            
            this.log('✅ HTML injected into:', this.config.autoInjectTarget);
        },
        
        /**
         * Setup toggle event listener
         */
        setupToggle: function() {
            if (!this.state.toggleElement) {
                this.log('⚠️ Toggle element not found');
                return;
            }
            
            // Disable toggle if catalog not enabled
            if (!this.state.catalogEnabled) {
                this.state.toggleElement.disabled = true;
                const label = this.state.toggleElement.parentElement;
                if (label) {
                    label.style.opacity = '0.5';
                    label.style.cursor = 'not-allowed';
                    label.title = this.config.disabledTooltip;
                }
                this.log('🔒 Toggle disabled (catalog not enabled)');
                return;
            }
            
            // Set initial state
            this.state.toggleElement.checked = (this.state.currentMode === 'catalog');
            
            // Add event listener
            this.state.toggleElement.addEventListener('change', (e) => {
                this.handleToggleChange(e.target.checked);
            });
            
            this.log('✅ Toggle listener attached');
        },
        
        /**
         * Handle toggle change
         * @param {Boolean} checked - Toggle state
         */
        handleToggleChange: function(checked) {
            const newMode = checked ? 'catalog' : 'ecom';
            const oldMode = this.state.currentMode;
            
            this.log('🔄 Toggle changed:', { from: oldMode, to: newMode });
            
            // Before switch callback
            if (this.config.beforeSwitch) {
                const proceed = this.config.beforeSwitch(oldMode, newMode);
                if (proceed === false) {
                    // Revert toggle
                    this.state.toggleElement.checked = !checked;
                    this.log('❌ Mode switch cancelled by beforeSwitch callback');
                    return;
                }
            }
            
            // Update mode
            this.state.currentMode = newMode;
            this.saveMode();
            this.updateUI();
            
            // Show notification
            if (this.config.showNotifications) {
                this.notify('info', `Switching to ${newMode.toUpperCase()} mode...`);
            }
            
            // Trigger mode change
            this.triggerModeChange();
            
            // After switch callback
            if (this.config.afterSwitch) {
                this.config.afterSwitch(oldMode, newMode);
            }
        },
        
        /**
         * Update UI elements
         */
        updateUI: function() {
            if (!this.state.badgeElement || !this.state.toggleElement) return;
            
            if (this.state.currentMode === 'catalog') {
                this.state.badgeElement.textContent = this.config.catalogLabel;
                this.state.badgeElement.className = 'mode-badge catalog';
                this.state.toggleElement.checked = true;
            } else {
                this.state.badgeElement.textContent = this.config.ecomLabel;
                this.state.badgeElement.className = 'mode-badge ecom';
                this.state.toggleElement.checked = false;
            }
            
            this.log('🎨 UI updated for mode:', this.state.currentMode);
        },
        
        /**
         * Trigger mode change (initialize appropriate renderer)
         */
        triggerModeChange: function() {
            if (this.config.onModeChange) {
                this.config.onModeChange(this.state.currentMode, this);
                return;
            }
            
            // Default behavior: initialize appropriate renderer
            if (this.state.currentMode === 'catalog' && this.config.catalogRenderer) {
                this.initializeCatalogRenderer();
            } else if (this.state.currentMode === 'ecom' && this.config.ecomRenderer) {
                this.initializeEcomRenderer();
            }
        },
        
        /**
         * Initialize ECOM renderer
         */
        initializeEcomRenderer: function() {
            this.log('🛒 Initializing ECOM renderer...');
            
            if (typeof this.config.ecomRenderer === 'function') {
                this.config.ecomRenderer(this.config.productsArray);
            } else if (this.config.ecomRenderer && typeof this.config.ecomRenderer.init === 'function') {
                this.config.ecomRenderer.init();
            }
            
            this.notify('success', '🛒 Shopping Mode Activated');
        },
        
        /**
         * Initialize Catalog renderer
         */
        initializeCatalogRenderer: function() {
            this.log('📋 Initializing Catalog renderer...');
            
            if (typeof this.config.catalogRenderer === 'function') {
                this.config.catalogRenderer(this.config.productsArray);
            } else if (this.config.catalogRenderer && typeof this.config.catalogRenderer.init === 'function') {
                this.config.catalogRenderer.init();
            }
            
            this.notify('success', '📋 Catalog Mode Activated');
        },
        
        /**
         * Show notification
         */
        notify: function(type, message) {
            if (this.config.notificationCallback) {
                this.config.notificationCallback(type, message);
            } else if (typeof showNotification !== 'undefined') {
                showNotification(type, message);
            } else if (typeof Toastify !== 'undefined') {
                const bgColors = {
                    success: 'linear-gradient(to right, #10b981, #059669)',
                    error: 'linear-gradient(to right, #ef4444, #dc2626)',
                    info: 'linear-gradient(to right, #3b82f6, #2563eb)',
                    warning: 'linear-gradient(to right, #f59e0b, #d97706)'
                };
                Toastify({
                    text: message,
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    style: { background: bgColors[type] || bgColors.info }
                }).showToast();
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        },
        
        /**
         * Logging helper
         */
        log: function(...args) {
            if (this.config.debug) {
                console.log('[ModeToggle]', ...args);
            }
        },
        
        // ============================================
        // PUBLIC API METHODS
        // ============================================
        
        /**
         * Get current mode
         * @returns {String} 'ecom' or 'catalog'
         */
        getCurrentMode: function() {
            return this.state.currentMode;
        },
        
        /**
         * Check if in catalog mode
         * @returns {Boolean}
         */
        isCatalogMode: function() {
            return this.state.currentMode === 'catalog' && this.state.catalogEnabled;
        },
        
        /**
         * Check if in ecom mode
         * @returns {Boolean}
         */
        isEcomMode: function() {
            return this.state.currentMode === 'ecom';
        },
        
        /**
         * Check if catalog is enabled in config
         * @returns {Boolean}
         */
        isCatalogEnabled: function() {
            return this.state.catalogEnabled;
        },
        
        /**
         * Manually switch mode
         * @param {String} mode - 'ecom' or 'catalog'
         */
        switchMode: function(mode) {
            if (mode !== 'ecom' && mode !== 'catalog') {
                this.log('⚠️ Invalid mode:', mode);
                return;
            }
            
            if (!this.state.catalogEnabled && mode === 'catalog') {
                this.log('⚠️ Cannot switch to catalog mode (not enabled)');
                return;
            }
            
            this.state.toggleElement.checked = (mode === 'catalog');
            this.handleToggleChange(this.state.toggleElement.checked);
        },
        
        /**
         * Force mode without triggering callbacks
         * @param {String} mode - 'ecom' or 'catalog'
         */
        setMode: function(mode) {
            if (mode !== 'ecom' && mode !== 'catalog') return;
            
            this.state.currentMode = mode;
            this.saveMode();
            this.updateUI();
        },
        
        /**
         * Update products array
         * @param {Array} products
         */
        updateProducts: function(products) {
            this.config.productsArray = products;
            this.log('📦 Products updated:', products.length);
        },
        
        /**
         * Enable catalog mode programmatically
         */
        enableCatalog: function() {
            this.state.catalogEnabled = true;
            if (this.state.toggleElement) {
                this.state.toggleElement.disabled = false;
                const label = this.state.toggleElement.parentElement;
                if (label) {
                    label.style.opacity = '1';
                    label.style.cursor = 'pointer';
                    label.title = '';
                }
            }
            this.log('✅ Catalog mode enabled');
        },
        
        /**
         * Disable catalog mode programmatically
         */
        disableCatalog: function() {
            this.state.catalogEnabled = false;
            this.state.currentMode = 'ecom';
            this.saveMode();
            this.updateUI();
            if (this.state.toggleElement) {
                this.state.toggleElement.disabled = true;
                const label = this.state.toggleElement.parentElement;
                if (label) {
                    label.style.opacity = '0.5';
                    label.style.cursor = 'not-allowed';
                    label.title = this.config.disabledTooltip;
                }
            }
            this.log('🔒 Catalog mode disabled');
        },
        
        /**
         * Reset to default mode
         */
        reset: function() {
            this.state.currentMode = this.config.defaultMode;
            this.saveMode();
            this.updateUI();
            this.log('🔄 Reset to default mode:', this.config.defaultMode);
        },
        
        /**
         * Destroy the toggle
         */
        destroy: function() {
            if (this.state.toggleElement) {
                this.state.toggleElement.removeEventListener('change', this.handleToggleChange);
            }
            
            if (this.config.autoInject && this.state.containerElement) {
                this.state.containerElement.remove();
            }
            
            this.state.initialized = false;
            this.log('💥 ModeToggle destroyed');
        }
    };
    
    // Export to window
    window.ModeToggle = ModeToggle;
    
    // AMD support
    if (typeof define === 'function' && define.amd) {
        define(function() { return ModeToggle; });
    }
    
    // CommonJS support
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ModeToggle;
    }
    
})(window);