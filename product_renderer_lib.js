/**
 * ProductRenderer - A reusable product grid rendering library
 * Version: 1.0.0
 * 
 * Usage:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
 * <script src="product-renderer.js"></script>
 * 
 * ProductRenderer.init({
 *   containerId: 'productsGrid',
 *   products: yourProductsArray,
 *   wishlist: yourWishlistArray,
 *   currency: '₹',
 *   onAddToCart: (productId) => { ... },
 *   onQuickView: (productId) => { ... },
 *   onToggleWishlist: (productId) => { ... },
 *   onShare: (productId) => { ... }
 * });
 * 
 * ProductRenderer.render();
 * ProductRenderer.render(filteredProducts); // Render specific products
 */

(function(window) {
    'use strict';
    
    const ProductRenderer = {
        config: {
            containerId: 'productsGrid',
            products: [],
            wishlist: [],
            currency: '$',
            showDiscount: true,
            showRating: true,
            enableQuickView: true,
            enableWishlist: true,
            enableShare: true,
            enableLightbox: false,
            onAddToCart: null,
            onQuickView: null,
            onToggleWishlist: null,
            onShare: null,
            gridColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            emptyMessage: 'No Products Found',
            emptyIcon: 'fas fa-inbox'
        },
        
        container: null,
        
        /**
         * Initialize the library with configuration
         */
        init: function(options) {
            this.config = Object.assign({}, this.config, options);
            this.container = document.getElementById(this.config.containerId);
            
            if (!this.container) {
                console.error(`Container with id "${this.config.containerId}" not found`);
                return;
            }
            
            this.injectStyles();
        },
        
        /**
         * Inject required CSS styles
         */
        injectStyles: function() {
            if (document.getElementById('pr-styles')) return;
            
            const styles = `
                <style id="pr-styles">
                    .pr-grid {
                        display: grid;
                        grid-template-columns: ${this.config.gridColumns};
                        gap: 30px;
                        width: 100%;
                    }
                    
                    .pr-empty {
                        grid-column: 1/-1;
                        text-align: center;
                        padding: 60px 20px;
                    }
                    
                    .pr-empty-icon {
                        font-size: 64px;
                        color: #d1d5db;
                        margin-bottom: 20px;
                    }
                    
                    .pr-empty-message {
                        color: #6b7280;
                        font-size: 20px;
                        font-weight: 600;
                        margin: 0;
                    }
                    
                    .pr-card {
                        background: white;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        transition: transform 0.3s, box-shadow 0.3s;
                        position: relative;
                    }
                    
                    .pr-card:hover {
                        transform: translateY(-8px);
                        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
                    }
                    
                    .pr-image-container {
                        position: relative;
                        width: 100%;
                        height: 280px;
                        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                    }
                    
                    .pr-image {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.5s;
                    }
                    
                    .pr-card:hover .pr-image {
                        transform: scale(1.1);
                    }
                    
                    .pr-image-emoji {
                        font-size: 80px;
                    }
                    
                    .pr-badge {
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-weight: 700;
                        font-size: 12px;
                        box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
                        z-index: 2;
                    }
                    
                    .pr-actions {
                        position: absolute;
                        top: 15px;
                        left: 15px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        opacity: 0;
                        transform: translateX(-20px);
                        transition: all 0.3s;
                        z-index: 2;
                    }
                    
                    .pr-card:hover .pr-actions {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    
                    .pr-action-btn {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.95);
                        border: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        color: #4b5563;
                        font-size: 16px;
                    }
                    
                    .pr-action-btn:hover {
                        transform: scale(1.1);
                        background: white;
                        color: #6366f1;
                    }
                    
                    .pr-action-btn.pr-wishlist-active {
                        background: #fef2f2;
                        color: #ef4444;
                    }
                    
                    .pr-action-btn.pr-wishlist-active:hover {
                        background: #fee2e2;
                    }
                    
                    .pr-info {
                        padding: 20px;
                    }
                    
                    .pr-category {
                        color: #6366f1;
                        font-size: 12px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 8px;
                    }
                    
                    .pr-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0 0 12px 0;
                        line-height: 1.4;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    
                    .pr-rating {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 12px;
                    }
                    
                    .pr-stars {
                        color: #fbbf24;
                        font-size: 14px;
                    }
                    
                    .pr-rating-count {
                        color: #9ca3af;
                        font-size: 13px;
                    }
                    
                    .pr-price {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    
                    .pr-price-current {
                        font-size: 24px;
                        font-weight: 700;
                        color: #10b981;
                    }
                    
                    .pr-price-original {
                        font-size: 16px;
                        color: #9ca3af;
                        text-decoration: line-through;
                    }
                    
                    .pr-add-to-cart {
                        width: 100%;
                        padding: 14px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-weight: 600;
                        font-size: 15px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.3s;
                    }
                    
                    .pr-add-to-cart:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
                    }
                    
                    .pr-add-to-cart:active {
                        transform: translateY(0);
                    }
                    
                    @media (max-width: 768px) {
                        .pr-grid {
                            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                            gap: 15px;
                        }
                        
                        .pr-image-container {
                            height: 200px;
                        }
                        
                        .pr-info {
                            padding: 15px;
                        }
                        
                        .pr-title {
                            font-size: 16px;
                        }
                        
                        .pr-price-current {
                            font-size: 20px;
                        }
                        
                        .pr-actions {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
        },
        
        /**
         * Check if URL is valid
         */
        isValidURL: function(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        },
        
        /**
         * Generate star rating HTML
         */
        generateStars: function(rating) {
            let stars = '';
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 !== 0;
            
            for (let i = 0; i < fullStars; i++) {
                stars += '<i class="fas fa-star"></i>';
            }
            
            if (hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            }
            
            const emptyStars = 5 - Math.ceil(rating);
            for (let i = 0; i < emptyStars; i++) {
                stars += '<i class="far fa-star"></i>';
            }
            
            return stars;
        },
        
        /**
         * Generate image content HTML
         */
        generateImageContent: function(product) {
            if (product.image && this.isValidURL(product.image)) {
                return `
                    <img 
                        src="${product.image}" 
                        alt="${product.title}" 
                        class="pr-image"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                    />
                    <div class="pr-image-emoji" style="display: none;">🛒</div>
                `;
            } else if (product.image && product.image.trim() !== '') {
                return `<div class="pr-image-emoji">${product.image}</div>`;
            } else {
                return '<div class="pr-image-emoji">🛒</div>';
            }
        },
        
        /**
         * Generate action buttons HTML
         */
        generateActions: function(product, isInWishlist) {
            let actions = '';
            
            if (this.config.enableQuickView) {
                actions += `
                    <button class="pr-action-btn" data-action="quickView" data-product-id="${product.id}" title="Quick View">
                        <i class="fas fa-eye"></i>
                    </button>
                `;
            }
            
            if (this.config.enableWishlist) {
                actions += `
                    <button class="pr-action-btn ${isInWishlist ? 'pr-wishlist-active' : ''}" data-action="toggleWishlist" data-product-id="${product.id}" title="Add to Wishlist">
                        <i class="fas fa-heart"></i>
                    </button>
                `;
            }
            
            if (this.config.enableShare) {
                actions += `
                    <button class="pr-action-btn" data-action="share" data-product-id="${product.id}" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                `;
            }
            
            return actions ? `<div class="pr-actions">${actions}</div>` : '';
        },
        
        /**
         * Generate product card HTML
         */
        generateCard: function(product) {
            if (!product.title || !product.price) return '';
            
            const isInWishlist = this.config.wishlist.some(item => item.id === product.id);
            const discount = this.config.showDiscount && product.originalPrice 
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
            
            const imageContent = this.generateImageContent(product);
            const actions = this.generateActions(product, isInWishlist);
            
            return `
                <div class="pr-card" data-product-id="${product.id}" data-category="${product.category || ''}" data-price="${product.price}">
                    <div class="pr-image-container">
                        ${imageContent}
                        ${discount > 0 ? `<span class="pr-badge">${discount}% OFF</span>` : ''}
                        ${actions}
                    </div>
                    <div class="pr-info">
                        ${product.category ? `<div class="pr-category">${product.category}</div>` : ''}
                        <h3 class="pr-title">${product.title}</h3>
                        ${this.config.showRating && product.rating ? `
                            <div class="pr-rating">
                                <div class="pr-stars">${this.generateStars(product.rating)}</div>
                                ${product.reviews ? `<span class="pr-rating-count">(${product.reviews})</span>` : ''}
                            </div>
                        ` : ''}
                        <div class="pr-price">
                            <span class="pr-price-current">${this.config.currency}${product.price.toFixed(2)}</span>
                            ${product.originalPrice ? `<span class="pr-price-original">${this.config.currency}${product.originalPrice.toFixed(2)}</span>` : ''}
                        </div>
                        <button class="pr-add-to-cart" data-action="addToCart" data-product-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;
        },
        
        /**
         * Generate empty state HTML
         */
        generateEmptyState: function() {
            return `
                <div class="pr-empty">
                    <div class="pr-empty-icon">
                        <i class="${this.config.emptyIcon}"></i>
                    </div>
                    <h3 class="pr-empty-message">${this.config.emptyMessage}</h3>
                </div>
            `;
        },
        
        /**
         * Attach event listeners to action buttons
         */
        attachEventListeners: function() {
            const buttons = this.container.querySelectorAll('[data-action]');
            
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = e.currentTarget.dataset.action;
                    const productId = e.currentTarget.dataset.productId;
                    
                    switch(action) {
                        case 'addToCart':
                            if (this.config.onAddToCart) {
                                this.config.onAddToCart(productId);
                            }
                            break;
                        case 'quickView':
                            if (this.config.onQuickView) {
                                this.config.onQuickView(productId);
                            }
                            break;
                        case 'toggleWishlist':
                            if (this.config.onToggleWishlist) {
                                this.config.onToggleWishlist(productId);
                                e.currentTarget.classList.toggle('pr-wishlist-active');
                            }
                            break;
                        case 'share':
                            if (this.config.onShare) {
                                this.config.onShare(productId);
                            }
                            break;
                    }
                });
            });
        },
        
        /**
         * Render products to the container
         */
        render: function(productsToRender) {
            if (!this.container) {
                console.error('Container not initialized. Call init() first.');
                return;
            }
            
            // Use provided products or default to config products
            const products = productsToRender || this.config.products;
            
            // Clear container
            this.container.innerHTML = '';
            
            // Add grid class
            if (!this.container.classList.contains('pr-grid')) {
                this.container.classList.add('pr-grid');
            }
            
            // Check if products exist
            if (!products || products.length === 0) {
                this.container.innerHTML = this.generateEmptyState();
                return;
            }
            
            // Generate and append product cards
            products.forEach(product => {
                const cardHTML = this.generateCard(product);
                if (cardHTML) {
                    this.container.insertAdjacentHTML('beforeend', cardHTML);
                }
            });
            
            // Attach event listeners
            this.attachEventListeners();
        },
        
        /**
         * Update products array
         */
        updateProducts: function(products) {
            this.config.products = products;
        },
        
        /**
         * Update wishlist array
         */
        updateWishlist: function(wishlist) {
            this.config.wishlist = wishlist;
        },
        
        /**
         * Filter products by category
         */
        filterByCategory: function(category) {
            if (!category || category === 'all') {
                return this.config.products;
            }
            return this.config.products.filter(p => p.category === category);
        },
        
        /**
         * Filter products by price range
         */
        filterByPrice: function(min, max) {
            return this.config.products.filter(p => p.price >= min && p.price <= max);
        },
        
        /**
         * Search products by text
         */
        search: function(query) {
            const lowerQuery = query.toLowerCase();
            return this.config.products.filter(p => 
                p.title.toLowerCase().includes(lowerQuery) ||
                (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
                (p.description && p.description.toLowerCase().includes(lowerQuery))
            );
        },
        
        /**
         * Sort products
         */
        sort: function(products, sortBy) {
            const sorted = [...products];
            
            switch(sortBy) {
                case 'price-asc':
                    return sorted.sort((a, b) => a.price - b.price);
                case 'price-desc':
                    return sorted.sort((a, b) => b.price - a.price);
                case 'name-asc':
                    return sorted.sort((a, b) => a.title.localeCompare(b.title));
                case 'name-desc':
                    return sorted.sort((a, b) => b.title.localeCompare(a.title));
                case 'rating':
                    return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                default:
                    return sorted;
            }
        }
    };
    
    // Expose to global scope
    window.ProductRenderer = ProductRenderer;
    
})(window);