/**
 * ProductFilterManager - A reusable module for filtering and categorizing products
 * Version: 1.3.0 - Added menu bar style filters
 * 
 * Dependencies:
 * - jQuery (optional, will use vanilla JS if not available)
 * 
 * Usage:
 * const filterManager = new ProductFilterManager({
 *   products: myProducts,
 *   categoryContainer: '#categoryList',
 *   priceFilterSelector: '#priceFilter',
 *   sortFilterSelector: '#sortFilter',
 *   minPriceSelector: '#minPrice',
 *   maxPriceSelector: '#maxPrice',
 *   stockToggleSelector: '#stockToggle',
 *   menuBarContainer: '#filterMenuBar', // NEW: Container for menu bar
 *   enableMenuBar: true, // NEW: Enable menu bar style
 *   onFilterChange: (filteredProducts) => {
 *     console.log('Filtered:', filteredProducts);
 *     renderProducts(filteredProducts);
 *   },
 *   categoryLabels: {
 *     all: 'All Products',
 *     bestsellers: 'Best Sellers'
 *   },
 *   accentColor: '#ffd814',
 *   showOutOfStock: true
 * });
 * 
 * filterManager.init();
 */

class ProductFilterManager {
    constructor(options = {}) {
        this.config = {
            products: options.products || [],
            categoryContainer: options.categoryContainer || '#categoryList',
            priceFilterSelector: options.priceFilterSelector || '#priceFilter',
            sortFilterSelector: options.sortFilterSelector || '#sortFilter',
            minPriceSelector: options.minPriceSelector || '#minPrice',
            maxPriceSelector: options.maxPriceSelector || '#maxPrice',
            stockToggleSelector: options.stockToggleSelector || '#stockToggle',
            menuBarContainer: options.menuBarContainer || '#filterMenuBar', // NEW
            enableMenuBar: options.enableMenuBar !== undefined ? options.enableMenuBar : false, // NEW
            onFilterChange: options.onFilterChange || null,
            onCategoryChange: options.onCategoryChange || null,
            onStockToggle: options.onStockToggle || null,
            categoryLabels: options.categoryLabels || { 
                all: 'All Products',
                bestsellers: 'Best Sellers'
            },
            activeClass: options.activeClass || 'active',
            categoryItemClass: options.categoryItemClass || 'category-item',
            accentColor: options.accentColor || '#ffd814',
            priceRanges: options.priceRanges || [
                { value: '0-50', min: 0, max: 50, label: 'Under $50' },
                { value: '50-100', min: 50, max: 100, label: '$50 - $100' },
                { value: '100-200', min: 100, max: 200, label: '$100 - $200' },
                { value: '200+', min: 200, max: Infinity, label: '$200+' }
            ],
            sortOptions: options.sortOptions || {
                'featured': (a, b) => 0,
                'price-low': (a, b) => a.price - b.price,
                'price-high': (a, b) => b.price - a.price,
                'rating': (a, b) => b.rating - a.rating,
                'newest': null
            },
            bestSellersLimit: options.bestSellersLimit || 50,
            skipHeaderRow: options.skipHeaderRow !== undefined ? options.skipHeaderRow : true,
            headerKeywords: options.headerKeywords || ['category', 'price', 'name', 'title', 'product'],
            showOutOfStock: options.showOutOfStock !== undefined ? options.showOutOfStock : true
        };
        
        this.currentCategory = 'all';
        this.currentPriceRange = 'all';
        this.currentSort = 'featured';
        this.filteredProducts = [];
        this.showOutOfStock = this.config.showOutOfStock;
        this.useJQuery = typeof jQuery !== 'undefined';
    }

    /**
     * Initialize the filter manager
     */
    init() {
        if (this.config.enableMenuBar) {
            this.renderMenuBar();
        } else {
            this.renderCategories();
        }
        this.attachStockToggleListener();
        this.applyAccentColorStyles();
        this.applyFilters();
    }

    /**
     * Render menu bar style filters
     */
    renderMenuBar() {
        const container = this._getElement(this.config.menuBarContainer);
        if (!container) {
            console.warn('Menu bar container not found, falling back to regular categories');
            this.renderCategories();
            return;
        }

        this._empty(container);
        
        // Create menu bar structure
        const menuBar = this._createElement('div');
        menuBar.className = 'pfm-menu-bar';
        
        // Category Menu
        const categoryMenu = this.createMenuDropdown(
            'Categories',
            this.getCategoryMenuItems(),
            this.currentCategory,
            (value) => this.filterByCategory(value)
        );
        
        // Price Range Menu
        const priceMenu = this.createMenuDropdown(
            'Price Range',
            this.getPriceMenuItems(),
            this.currentPriceRange,
            (value) => this.filterByPriceRange(value)
        );
        
        // Sort Menu
        const sortMenu = this.createMenuDropdown(
            'Sort By',
            this.getSortMenuItems(),
            this.currentSort,
            (value) => this.filterBySort(value)
        );
        
        // Stock Toggle (inline)
        const stockToggle = this.createStockToggle();
        
        this._append(menuBar, categoryMenu);
        this._append(menuBar, priceMenu);
        this._append(menuBar, sortMenu);
        this._append(menuBar, stockToggle);
        
        this._append(container, menuBar);
        
        this.injectMenuBarStyles();
    }

    /**
     * Create a dropdown menu
     */
    createMenuDropdown(label, items, currentValue, onSelect) {
        const dropdown = this._createElement('div');
        dropdown.className = 'pfm-menu-dropdown';
        
        const button = this._createElement('button');
        button.className = 'pfm-menu-button';
        
        const currentItem = items.find(item => item.value === currentValue);
        const buttonText = currentItem ? currentItem.label : label;
        button.innerHTML = `${buttonText} <span class="pfm-arrow">▼</span>`;
        
        const menu = this._createElement('div');
        menu.className = 'pfm-menu-content';
        
        items.forEach(item => {
            const menuItem = this._createElement('div');
            menuItem.className = 'pfm-menu-item';
            if (item.value === currentValue) {
                menuItem.classList.add('active');
            }
            
            const checkMark = item.value === currentValue ? '✓ ' : '';
            menuItem.textContent = checkMark + item.label;
            
            this._onClick(menuItem, (e) => {
                e.stopPropagation();
                onSelect(item.value);
                this.closeAllMenus();
                
                // Update button text
                button.innerHTML = `${item.label} <span class="pfm-arrow">▼</span>`;
            });
            
            this._append(menu, menuItem);
        });
        
        this._onClick(button, (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            this.closeAllMenus();
            if (!isOpen) {
                dropdown.classList.add('open');
            }
        });
        
        this._append(dropdown, button);
        this._append(dropdown, menu);
        
        return dropdown;
    }

    /**
     * Create stock toggle for menu bar
     */
    createStockToggle() {
        const toggleContainer = this._createElement('div');
        toggleContainer.className = 'pfm-menu-toggle';
        
        const label = this._createElement('label');
        label.className = 'pfm-toggle-label';
        
        const checkbox = this._createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.showOutOfStock;
        checkbox.className = 'pfm-toggle-checkbox';
        
        const text = this._createElement('span');
        text.textContent = 'Show Out of Stock';
        
        this._onClick(checkbox, () => {
            this.showOutOfStock = checkbox.checked;
            if (this.config.onStockToggle) {
                this.config.onStockToggle(this.showOutOfStock);
            }
            this.applyFilters();
        });
        
        this._append(label, checkbox);
        this._append(label, text);
        this._append(toggleContainer, label);
        
        return toggleContainer;
    }

    /**
     * Get category menu items
     */
    getCategoryMenuItems() {
        const categories = this.getCategories();
        return categories.map(cat => ({
            value: cat,
            label: cat === 'all' 
                ? (this.config.categoryLabels.all || 'All Products')
                : cat === 'bestsellers'
                ? (this.config.categoryLabels.bestsellers || 'Best Sellers')
                : cat
        }));
    }

    /**
     * Get price range menu items
     */
    getPriceMenuItems() {
        return [
            { value: 'all', label: 'All Prices' },
            ...this.config.priceRanges.map(range => ({
                value: range.value,
                label: range.label
            }))
        ];
    }

    /**
     * Get sort menu items
     */
    getSortMenuItems() {
        return [
            { value: 'featured', label: 'Featured' },
            { value: 'price-low', label: 'Price: Low to High' },
            { value: 'price-high', label: 'Price: High to Low' },
            { value: 'rating', label: 'Customer Rating' },
            { value: 'newest', label: 'Newest' }
        ];
    }

    /**
     * Close all dropdown menus
     */
    closeAllMenus() {
        const container = this._getElement(this.config.menuBarContainer);
        if (!container) return;
        
        const dropdowns = container.querySelectorAll('.pfm-menu-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }

    /**
     * Filter by price range
     */
    filterByPriceRange(rangeValue) {
        this.currentPriceRange = rangeValue;
        this._setValue(this.config.priceFilterSelector, rangeValue);
        this.applyFilters();
    }

    /**
     * Filter by sort option
     */
    filterBySort(sortValue) {
        this.currentSort = sortValue;
        this._setValue(this.config.sortFilterSelector, sortValue);
        this.applyFilters();
    }

    /**
     * Inject menu bar styles
     */
    injectMenuBarStyles() {
        const styleId = 'pfm-menubar-styles';
        let styleEl = document.getElementById(styleId);
        
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        styleEl.textContent = `
            .pfm-menu-bar {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                flex-wrap: wrap;
            }
            
            .pfm-menu-dropdown {
                position: relative;
            }
            
            .pfm-menu-button {
                background: white;
                border: 1px solid #ddd;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
                white-space: nowrap;
            }
            
            .pfm-menu-button:hover {
                border-color: ${this.config.accentColor};
                background: #fafafa;
            }
            
            .pfm-menu-dropdown.open .pfm-menu-button {
                border-color: ${this.config.accentColor};
                background: ${this.config.accentColor};
                color: #333;
            }
            
            .pfm-arrow {
                font-size: 10px;
                transition: transform 0.2s;
            }
            
            .pfm-menu-dropdown.open .pfm-arrow {
                transform: rotate(180deg);
            }
            
            .pfm-menu-content {
                position: absolute;
                top: calc(100% + 5px);
                left: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                min-width: 200px;
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            }
            
            .pfm-menu-dropdown.open .pfm-menu-content {
                display: block;
            }
            
            .pfm-menu-item {
                padding: 10px 15px;
                cursor: pointer;
                transition: background 0.2s;
                font-size: 14px;
            }
            
            .pfm-menu-item:hover {
                background: #f5f5f5;
            }
            
            .pfm-menu-item.active {
                background: ${this.config.accentColor};
                color: #333;
                font-weight: 500;
            }
            
            .pfm-menu-toggle {
                margin-left: auto;
            }
            
            .pfm-toggle-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 14px;
                user-select: none;
            }
            
            .pfm-toggle-checkbox {
                width: 18px;
                height: 18px;
                cursor: pointer;
                accent-color: ${this.config.accentColor};
            }
            
            @media (max-width: 768px) {
                .pfm-menu-bar {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .pfm-menu-button {
                    width: 100%;
                    justify-content: space-between;
                }
                
                .pfm-menu-content {
                    left: 0;
                    right: 0;
                    width: 100%;
                }
                
                .pfm-menu-toggle {
                    margin-left: 0;
                }
            }
        `;
    }

    /**
     * Apply accent color to active elements
     */
    applyAccentColorStyles() {
        const styleId = 'pfm-accent-styles';
        let styleEl = document.getElementById(styleId);
        
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        styleEl.textContent = `
            .${this.config.categoryItemClass}.${this.config.activeClass} {
                background-color: ${this.config.accentColor} !important;
                border-color: ${this.config.accentColor} !important;
                color: #333 !important;
            }
            .${this.config.categoryItemClass}.${this.config.activeClass}:hover {
                opacity: 0.9;
            }
        `;
    }

    /**
     * Attach event listener to stock toggle
     */
    attachStockToggleListener() {
        if (this.config.enableMenuBar) return; // Handled in menu bar
        
        const toggle = this._getElement(this.config.stockToggleSelector);
        if (!toggle) return;

        toggle.checked = this.showOutOfStock;

        this._onClick(toggle, () => {
            this.showOutOfStock = toggle.checked;
            
            if (this.config.onStockToggle) {
                this.config.onStockToggle(this.showOutOfStock);
            }
            
            this.applyFilters();
        });
    }

    /**
     * Update products array
     */
    setProducts(products) {
        this.config.products = products;
        if (this.config.enableMenuBar) {
            this.renderMenuBar();
        } else {
            this.renderCategories();
        }
        this.applyFilters();
    }

    /**
     * Check if a product is a header row
     */
    isHeaderRow(product) {
        if (!this.config.skipHeaderRow) return false;
        
        const category = (product.category || '').toString().toLowerCase();
        const isHeader = this.config.headerKeywords.some(keyword => 
            category.includes(keyword)
        );
        
        const hasInvalidPrice = isNaN(parseFloat(product.price));
        
        return isHeader || hasInvalidPrice;
    }

    /**
     * Get valid products (excluding headers and C1)
     */
    getValidProducts() {
        return this.config.products.filter(p => 
            !this.isHeaderRow(p) && p.category !== 'C1'
        );
    }

    /**
     * Get all unique categories from products (excluding C1 and header rows)
     */
    getCategories() {
        const validProducts = this.getValidProducts();
        const categories = [...new Set(validProducts.map(p => p.category))];
        return ['all', 'bestsellers', ...categories];
    }

    /**
     * Render category buttons/filters with tick marks (non-menu bar mode)
     */
    renderCategories() {
        const container = this._getElement(this.config.categoryContainer);
        if (!container) return;

        this._empty(container);
        
        const categories = this.getCategories();
        
        categories.forEach(category => {
            const categoryItem = this._createElement('div');
            this._addClass(categoryItem, this.config.categoryItemClass);
            
            const tickMark = category === this.currentCategory ? '✓ ' : '';
            
            const label = category === 'all' 
                ? (this.config.categoryLabels.all || 'All Products')
                : category === 'bestsellers'
                ? (this.config.categoryLabels.bestsellers || 'Best Sellers')
                : category;
            
            this._setText(categoryItem, tickMark + label);
            
            if (category === this.currentCategory) {
                this._addClass(categoryItem, this.config.activeClass);
            }
            
            this._onClick(categoryItem, () => {
                this.filterByCategory(category);
            });
            
            this._append(container, categoryItem);
        });
    }

    /**
     * Filter products by category
     */
    filterByCategory(category) {
        this.currentCategory = category;
        
        if (!this.config.enableMenuBar) {
            this.updateCategoryUI();
        }
        
        this.applyFilters();
        
        if (this.config.onCategoryChange) {
            this.config.onCategoryChange(category, this.filteredProducts);
        }
    }

    /**
     * Update category UI to show active state with tick marks
     */
    updateCategoryUI() {
        const container = this._getElement(this.config.categoryContainer);
        if (!container) return;

        const items = this._getChildren(container, '.' + this.config.categoryItemClass);
        const categories = this.getCategories();
        
        items.forEach((item, index) => {
            const category = categories[index];
            
            const tickMark = category === this.currentCategory ? '✓ ' : '';
            
            const label = category === 'all' 
                ? (this.config.categoryLabels.all || 'All Products')
                : category === 'bestsellers'
                ? (this.config.categoryLabels.bestsellers || 'Best Sellers')
                : category;
            
            this._setText(item, tickMark + label);
            
            if (category === this.currentCategory) {
                this._addClass(item, this.config.activeClass);
            } else {
                this._removeClass(item, this.config.activeClass);
            }
        });
    }

    /**
     * Get Best Sellers - evenly distributed from each category
     */
    getBestSellers() {
        const limit = this.config.bestSellersLimit;
        const validProducts = this.getValidProducts();
        
        const byCategory = {};
        validProducts.forEach(product => {
            if (!byCategory[product.category]) {
                byCategory[product.category] = [];
            }
            byCategory[product.category].push(product);
        });
        
        const categories = Object.keys(byCategory);
        const productsPerCategory = Math.floor(limit / categories.length);
        
        let bestSellers = [];
        
        categories.forEach(category => {
            const categoryProducts = byCategory[category].slice(0, productsPerCategory);
            bestSellers = bestSellers.concat(categoryProducts);
        });
        
        if (bestSellers.length < limit) {
            const remaining = limit - bestSellers.length;
            const usedIds = new Set(bestSellers.map(p => p.id || p.name));
            
            const additionalProducts = validProducts
                .filter(p => !usedIds.has(p.id || p.name))
                .slice(0, remaining);
            
            bestSellers = bestSellers.concat(additionalProducts);
        }
        
        return bestSellers.slice(0, limit);
    }

    /**
     * Apply all filters (category, price, sort, stock)
     */
    applyFilters() {
        const priceRange = this.currentPriceRange || this._getValue(this.config.priceFilterSelector);
        const sortBy = this.currentSort || this._getValue(this.config.sortFilterSelector);
        const minPrice = parseFloat(this._getValue(this.config.minPriceSelector)) || 0;
        const maxPrice = parseFloat(this._getValue(this.config.maxPriceSelector)) || Infinity;
        
        let filtered;
        
        if (this.currentCategory === 'bestsellers') {
            filtered = this.getBestSellers();
        } else {
            filtered = this.config.products.filter(product => {
                if (this.isHeaderRow(product)) return false;
                if (product.category === 'C1') return false;
                
                const categoryMatch = this.currentCategory === 'all' || 
                                     product.category === this.currentCategory;
                
                const priceMatch = product.price >= minPrice && product.price <= maxPrice;
                
                let rangeMatch = true;
                if (priceRange && priceRange !== 'all') {
                    const range = this.config.priceRanges.find(r => r.value === priceRange);
                    if (range) {
                        rangeMatch = product.price >= range.min && product.price < range.max;
                    }
                }
                
                return categoryMatch && priceMatch && rangeMatch;
            });
        }

        if (!this.showOutOfStock) {
            filtered = filtered.filter(product => {
                return product.inStock === true || product.inStock === undefined;
            });
        }
        
        if (this.currentCategory !== 'bestsellers' && sortBy && this.config.sortOptions[sortBy]) {
            const sortFn = this.config.sortOptions[sortBy];
            if (sortFn === null && sortBy === 'newest') {
                filtered = filtered.reverse();
            } else if (sortFn) {
                filtered.sort(sortFn);
            }
        }
        
        this.filteredProducts = filtered;
        
        if (this.config.onFilterChange) {
            this.config.onFilterChange(this.filteredProducts);
        }
        
        return this.filteredProducts;
    }

    /**
     * Get current filtered products
     */
    getFilteredProducts() {
        return this.filteredProducts;
    }

    /**
     * Get current category
     */
    getCurrentCategory() {
        return this.currentCategory;
    }

    /**
     * Get current stock filter state
     */
    getStockFilterState() {
        return this.showOutOfStock;
    }

    /**
     * Set stock filter state programmatically
     */
    setStockFilterState(show) {
        this.showOutOfStock = show;
        const toggle = this._getElement(this.config.stockToggleSelector);
        if (toggle) {
            toggle.checked = show;
        }
        this.applyFilters();
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        this.currentCategory = 'all';
        this.currentPriceRange = 'all';
        this.currentSort = 'featured';
        this.showOutOfStock = this.config.showOutOfStock;
        
        this._setValue(this.config.priceFilterSelector, 'all');
        this._setValue(this.config.sortFilterSelector, 'featured');
        this._setValue(this.config.minPriceSelector, '');
        this._setValue(this.config.maxPriceSelector, '');
        
        const toggle = this._getElement(this.config.stockToggleSelector);
        if (toggle) {
            toggle.checked = this.showOutOfStock;
        }
        
        if (this.config.enableMenuBar) {
            this.renderMenuBar();
        } else {
            this.updateCategoryUI();
        }
        
        this.applyFilters();
    }

    /**
     * Add custom sort option
     */
    addSortOption(key, sortFunction) {
        this.config.sortOptions[key] = sortFunction;
    }

    /**
     * Add custom price range
     */
    addPriceRange(range) {
        this.config.priceRanges.push(range);
    }

    /**
     * Set accent color dynamically
     */
    setAccentColor(color) {
        this.config.accentColor = color;
        this.applyAccentColorStyles();
        if (this.config.enableMenuBar) {
            this.injectMenuBarStyles();
        }
    }

    // ============================================
    // DOM HELPER METHODS (jQuery/Vanilla JS)
    // ============================================

    _getElement(selector) {
        if (this.useJQuery) {
            const el = $(selector);
            return el.length > 0 ? el[0] : null;
        }
        return document.querySelector(selector);
    }

    _createElement(tag) {
        return document.createElement(tag);
    }

    _addClass(element, className) {
        if (this.useJQuery) {
            $(element).addClass(className);
        } else {
            element.classList.add(className);
        }
    }

    _removeClass(element, className) {
        if (this.useJQuery) {
            $(element).removeClass(className);
        } else {
            element.classList.remove(className);
        }
    }

    _setText(element, text) {
        if (this.useJQuery) {
            $(element).text(text);
        } else {
            element.textContent = text;
        }
    }

    _getText(element) {
        if (this.useJQuery) {
            return $(element).text();
        }
        return element.textContent;
    }

    _onClick(element, handler) {
        if (this.useJQuery) {
            $(element).on('click', handler);
        } else {
            element.addEventListener('click', handler);
        }
    }

    _append(parent, child) {
        if (this.useJQuery) {
            $(parent).append(child);
        } else {
            parent.appendChild(child);
        }
    }

    _empty(element) {
        if (this.useJQuery) {
            $(element).empty();
        } else {
            element.innerHTML = '';
        }
    }

    _getValue(selector) {
        const element = this._getElement(selector);
        if (!element) return null;
        return element.value;
    }

    _setValue(selector, value) {
        const element = this._getElement(selector);
        if (element) {
            element.value = value;
        }
    }

    _getChildren(parent, selector) {
        if (this.useJQuery) {
            return $(parent).find(selector).toArray();
        }
        return Array.from(parent.querySelectorAll(selector));
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        const container = this._getElement(
            this.config.enableMenuBar ? this.config.menuBarContainer : this.config.categoryContainer
        );
        if (container) {
            this._empty(container);
        }
        
        // Close all menus
        this.closeAllMenus();
        
        // Remove event listener for closing menus
        document.removeEventListener('click', this.documentClickHandler);
        
        // Remove dynamic styles
        const styleEl = document.getElementById('pfm-accent-styles');
        if (styleEl) {
            styleEl.remove();
        }
        
        const menuStyleEl = document.getElementById('pfm-menubar-styles');
        if (menuStyleEl) {
            menuStyleEl.remove();
        }
        
        this.filteredProducts = [];
        this.currentCategory = 'all';
        this.currentPriceRange = 'all';
        this.currentSort = 'featured';
        this.showOutOfStock = this.config.showOutOfStock;
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.pfm-menu-dropdown')) {
        document.querySelectorAll('.pfm-menu-dropdown').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }
});

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductFilterManager;
}

if (typeof window !== 'undefined') {
    window.ProductFilterManager = ProductFilterManager;
}