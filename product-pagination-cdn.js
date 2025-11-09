/*!
 * Product Pagination Library v1.0.0
 * A flexible, reusable product pagination system with "Show More" functionality
 * 
 * Author: Your Name
 * License: MIT
 * Repository: https://github.com/yourusername/product-pagination
 */

(function(window) {
    'use strict';

    /**
     * ProductPagination Class
     * @class
     */
    class ProductPagination {
        /**
         * Create a ProductPagination instance
         * @param {Object} options - Configuration options
         * @param {number} [options.productsPerPage=50] - Number of products to load per page
         * @param {string} [options.containerSelector='#productsGrid'] - CSS selector for products container
         * @param {string} [options.buttonContainerId='showMoreContainer'] - ID for show more button container
         * @param {Function} [options.onRender] - Custom render callback function
         * @param {Object} [options.renderer] - Custom renderer object with render method
         * @param {Function} [options.onLoadMore] - Callback when more products are loaded
         * @param {Function} [options.onReset] - Callback when pagination is reset
         * @param {Object} [options.messages] - Custom messages
         * @param {Object} [options.styles] - Custom styling options
         */
        constructor(options = {}) {
            // Core properties
            this.allProducts = [];
            this.filteredProducts = [];
            this.displayedProducts = [];
            this.currentPage = 0;
            
            // Configuration
            this.productsPerPage = options.productsPerPage || 50;
            this.containerSelector = options.containerSelector || '#productsGrid';
            this.buttonContainerId = options.buttonContainerId || 'showMoreContainer';
            
            // Callbacks
            this.onRender = options.onRender || null;
            this.renderer = options.renderer || null;
            this.onLoadMore = options.onLoadMore || null;
            this.onReset = options.onReset || null;
            
            // Messages
            this.messages = Object.assign({
                showingText: 'Showing',
                ofText: 'of',
                productsText: 'products',
                loadMoreText: 'Load More Products',
                moreText: 'more',
                allLoadedText: 'All products loaded',
                noProductsText: 'No products found'
            }, options.messages || {});
            
            // Styles
            this.styles = Object.assign({
                buttonColor: '#ffd814',
                buttonColorHover: '#f7ca00',
                buttonTextColor: '#000',
                infoTextColor: '#6b7280',
                successColor: '#10b981',
                warningColor: '#f59e0b'
            }, options.styles || {});
            
            // Auto-inject styles
            if (options.autoInjectStyles !== false) {
                this.injectStyles();
            }
            
            // Version
            this.version = '1.0.0';
        }

        /**
         * Initialize with all products
         * @param {Array} products - Array of product objects
         * @returns {ProductPagination} Returns this for chaining
         */
        setProducts(products) {
            this.allProducts = products || [];
            this.filteredProducts = products || [];
            this.reset();
            return this;
        }

        /**
         * Set filtered products (after category/price filtering)
         * @param {Array} products - Array of filtered product objects
         * @returns {ProductPagination} Returns this for chaining
         */
        setFilteredProducts(products) {
            this.filteredProducts = products || [];
            this.reset();
            return this;
        }

        /**
         * Reset pagination to initial state
         * @returns {ProductPagination} Returns this for chaining
         */
        reset() {
            this.currentPage = 0;
            this.displayedProducts = [];
            this.clearContainer();
            this.loadMore();
            
            if (this.onReset && typeof this.onReset === 'function') {
                this.onReset(this.getStats());
            }
            
            return this;
        }

        /**
         * Load next batch of products
         * @returns {ProductPagination} Returns this for chaining
         */
        loadMore() {
            const start = this.currentPage * this.productsPerPage;
            const end = start + this.productsPerPage;
            const nextBatch = this.filteredProducts.slice(start, end);

            if (nextBatch.length > 0) {
                this.displayedProducts = [...this.displayedProducts, ...nextBatch];
                this.currentPage++;
                this.render();
                
                if (this.onLoadMore && typeof this.onLoadMore === 'function') {
                    this.onLoadMore(nextBatch, this.getStats());
                }
            }

            this.updateShowMoreButton();
            return this;
        }

        /**
         * Check if there are more products to load
         * @returns {boolean}
         */
        hasMore() {
            const totalDisplayed = this.currentPage * this.productsPerPage;
            return totalDisplayed < this.filteredProducts.length;
        }

        /**
         * Get remaining products count
         * @returns {number}
         */
        getRemainingCount() {
            const totalDisplayed = this.currentPage * this.productsPerPage;
            return Math.max(0, this.filteredProducts.length - totalDisplayed);
        }

        /**
         * Clear the products container
         * @returns {ProductPagination} Returns this for chaining
         */
        clearContainer() {
            const container = document.querySelector(this.containerSelector);
            if (container) {
                container.innerHTML = '';
            }
            return this;
        }

        /**
         * Render products using custom or default renderer
         * @returns {ProductPagination} Returns this for chaining
         */
        render() {
            if (this.renderer && typeof this.renderer.render === 'function') {
                // Use custom renderer object
                if (typeof this.renderer.updateProducts === 'function') {
                    this.renderer.updateProducts(this.displayedProducts);
                }
                this.renderer.render(this.displayedProducts);
            } else if (this.onRender && typeof this.onRender === 'function') {
                // Use custom render callback
                this.onRender(this.displayedProducts);
            } else {
                // Use default render
                this.defaultRender();
            }

            // Trigger external refreshes
            this.triggerExternalRefresh();
            return this;
        }

        /**
         * Default render method
         * @private
         */
        defaultRender() {
            const container = document.querySelector(this.containerSelector);
            if (!container) return;

            container.innerHTML = '';
            this.displayedProducts.forEach(product => {
                const productCard = this.createProductCard(product);
                container.appendChild(productCard);
            });
        }

        /**
         * Create product card HTML element
         * @param {Object} product - Product object
         * @returns {HTMLElement}
         * @private
         */
        createProductCard(product) {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <div class="product-image">
                    <img src="${product.image || ''}" alt="${product.title || 'Product'}" loading="lazy">
                </div>
                <h4 class="product-title">${product.title || 'Untitled'}</h4>
                <p class="product-price">${product.price ? '$' + product.price : 'Price not available'}</p>
                <button class="add-to-cart-btn" data-product-id="${product.id || ''}">
                    Add to Cart
                </button>
            `;
            return div;
        }

        /**
         * Create and manage Show More button
         * @private
         */
        updateShowMoreButton() {
            let buttonContainer = document.getElementById(this.buttonContainerId);

            // Create container if it doesn't exist
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.id = this.buttonContainerId;
                buttonContainer.className = 'pp-show-more-container';
                
                const mainContainer = document.querySelector(this.containerSelector);
                if (mainContainer && mainContainer.parentElement) {
                    mainContainer.parentElement.appendChild(buttonContainer);
                }
            }

            if (this.hasMore()) {
                const remaining = this.getRemainingCount();
                const nextLoad = Math.min(this.productsPerPage, remaining);
                
                buttonContainer.innerHTML = `
                    <div class="pp-pagination-info">
                        <p>${this.messages.showingText} ${this.displayedProducts.length} ${this.messages.ofText} ${this.filteredProducts.length} ${this.messages.productsText}</p>
                    </div>
                    <button class="pp-show-more-btn" onclick="window.productPaginationInstance.loadMore()">
                        <i class="pp-icon-plus"></i>
                        ${this.messages.loadMoreText} (${nextLoad} ${this.messages.moreText})
                    </button>
                `;
                buttonContainer.style.display = 'block';
            } else {
                if (this.filteredProducts.length > 0) {
                    buttonContainer.innerHTML = `
                        <div class="pp-pagination-info pp-all-loaded">
                            <p><i class="pp-icon-check"></i> ${this.messages.allLoadedText} (${this.filteredProducts.length})</p>
                        </div>
                    `;
                } else {
                    buttonContainer.innerHTML = `
                        <div class="pp-pagination-info pp-no-products">
                            <p><i class="pp-icon-info"></i> ${this.messages.noProductsText}</p>
                        </div>
                    `;
                }
            }
        }

        /**
         * Trigger external library refreshes
         * @private
         */
        triggerExternalRefresh() {
            // Refresh lightbox (if available)
            if (typeof window.LightboxWrapper !== 'undefined' && window.LightboxWrapper.refresh) {
                setTimeout(() => window.LightboxWrapper.refresh(), 100);
            }

            // Refresh AOS animations (if available)
            if (typeof window.AOS !== 'undefined' && window.AOS.refresh) {
                window.AOS.refresh();
            }

            // Refresh GLightbox (if available)
            if (typeof window.GLightbox !== 'undefined') {
                setTimeout(() => {
                    if (window.glightboxInstance) {
                        window.glightboxInstance.reload();
                    }
                }, 100);
            }
        }

        /**
         * Get pagination statistics
         * @returns {Object} Statistics object
         */
        getStats() {
            return {
                total: this.filteredProducts.length,
                displayed: this.displayedProducts.length,
                remaining: this.getRemainingCount(),
                currentPage: this.currentPage,
                totalPages: Math.ceil(this.filteredProducts.length / this.productsPerPage),
                hasMore: this.hasMore()
            };
        }

        /**
         * Get current displayed products
         * @returns {Array}
         */
        getDisplayedProducts() {
            return this.displayedProducts;
        }

        /**
         * Get filtered products
         * @returns {Array}
         */
        getFilteredProducts() {
            return this.filteredProducts;
        }

        /**
         * Get all products
         * @returns {Array}
         */
        getAllProducts() {
            return this.allProducts;
        }

        /**
         * Jump to specific page
         * @param {number} pageNumber - Page number (1-indexed)
         * @returns {ProductPagination} Returns this for chaining
         */
        goToPage(pageNumber) {
            const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
            if (pageNumber < 1 || pageNumber > totalPages) {
                console.warn('Invalid page number');
                return this;
            }

            this.currentPage = 0;
            this.displayedProducts = [];
            this.clearContainer();

            // Load all pages up to requested page
            for (let i = 0; i < pageNumber; i++) {
                const start = i * this.productsPerPage;
                const end = start + this.productsPerPage;
                const batch = this.filteredProducts.slice(start, end);
                this.displayedProducts = [...this.displayedProducts, ...batch];
            }

            this.currentPage = pageNumber;
            this.render();
            this.updateShowMoreButton();
            return this;
        }

        /**
         * Inject CSS styles into the document
         * @private
         */
        injectStyles() {
            if (document.getElementById('product-pagination-styles')) {
                return; // Styles already injected
            }

            const styles = `
                <style id="product-pagination-styles">
                /* Product Pagination Library Styles */
                .pp-show-more-container {
                    width: 100%;
                    text-align: center;
                    padding: 40px 20px;
                    margin-top: 40px;
                }

                .pp-pagination-info {
                    margin-bottom: 20px;
                }

                .pp-pagination-info p {
                    font-size: 16px;
                    color: ${this.styles.infoTextColor};
                    font-weight: 500;
                    margin: 0;
                }

                .pp-pagination-info.pp-all-loaded p {
                    color: ${this.styles.successColor};
                }

                .pp-pagination-info.pp-no-products p {
                    color: ${this.styles.warningColor};
                }

                .pp-show-more-btn {
                    background: linear-gradient(135deg, ${this.styles.buttonColor} 0%, ${this.styles.buttonColorHover} 100%);
                    color: ${this.styles.buttonTextColor};
                    border: none;
                    padding: 16px 40px;
                    font-size: 16px;
                    font-weight: 600;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(255, 216, 20, 0.3);
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    font-family: inherit;
                }

                .pp-show-more-btn:hover {
                    background: linear-gradient(135deg, ${this.styles.buttonColorHover} 0%, ${this.styles.buttonColor} 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 216, 20, 0.4);
                }

                .pp-show-more-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 10px rgba(255, 216, 20, 0.3);
                }

                .pp-show-more-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Icons (using CSS for fallback) */
                .pp-icon-plus::before {
                    content: "➕ ";
                }

                .pp-icon-check::before {
                    content: "✓ ";
                }

                .pp-icon-info::before {
                    content: "ℹ ";
                }

                /* Loading state */
                .pp-show-more-btn.pp-loading {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .pp-show-more-btn.pp-loading::after {
                    content: "";
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid ${this.styles.buttonTextColor};
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: pp-spin 0.8s linear infinite;
                    margin-left: 10px;
                }

                @keyframes pp-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .pp-show-more-btn {
                        padding: 14px 30px;
                        font-size: 14px;
                    }
                    
                    .pp-pagination-info p {
                        font-size: 14px;
                    }
                    
                    .pp-show-more-container {
                        padding: 30px 15px;
                    }
                }

                /* Default product card styles (if no custom renderer) */
                .product-card {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    transition: all 0.3s ease;
                }

                .product-card:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }

                .product-card .product-image {
                    width: 100%;
                    height: 200px;
                    overflow: hidden;
                    border-radius: 6px;
                    margin-bottom: 12px;
                }

                .product-card .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .product-card .product-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 10px 0;
                    color: #1f2937;
                }

                .product-card .product-price {
                    font-size: 18px;
                    font-weight: 700;
                    color: #10b981;
                    margin: 10px 0;
                }

                .product-card .add-to-cart-btn {
                    width: 100%;
                    padding: 10px;
                    background: ${this.styles.buttonColor};
                    color: ${this.styles.buttonTextColor};
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .product-card .add-to-cart-btn:hover {
                    background: ${this.styles.buttonColorHover};
                }
                </style>
            `;

            const div = document.createElement('div');
            div.innerHTML = styles;
            document.head.appendChild(div.firstChild);
        }

        /**
         * Destroy the pagination instance
         */
        destroy() {
            const buttonContainer = document.getElementById(this.buttonContainerId);
            if (buttonContainer) {
                buttonContainer.remove();
            }
            
            this.allProducts = [];
            this.filteredProducts = [];
            this.displayedProducts = [];
            this.currentPage = 0;
        }
    }

    // Export to window
    window.ProductPagination = ProductPagination;

    // Store global instance reference
    window.productPaginationInstance = null;

    // AMD/CommonJS support
    if (typeof define === 'function' && define.amd) {
        define([], function() { return ProductPagination; });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = ProductPagination;
    }

    // Console info
    console.log('%c Product Pagination Library v1.0.0 loaded', 'color: #10b981; font-weight: bold;');

})(window);
