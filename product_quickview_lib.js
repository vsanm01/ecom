/**
 * ProductQuickView - A reusable product quick view library
 * Version: 1.0.0
 * 
 * Usage:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
 * <script src="product-quickview.js"></script>
 * 
 * ProductQuickView.init({
 *   products: yourProductsArray,
 *   wishlist: yourWishlistArray,
 *   currency: '₹',
 *   onAddToCart: (productId) => { ... },
 *   onToggleWishlist: (productId) => { ... },
 *   onShare: (productId) => { ... }
 * });
 * 
 * ProductQuickView.show(productId);
 */

(function(window) {
    'use strict';
    
    const ProductQuickView = {
        config: {
            products: [],
            wishlist: [],
            currency: '$',
            onAddToCart: null,
            onToggleWishlist: null,
            onShare: null,
            onNotification: null,
            lightboxEnabled: true
        },
        
        /**
         * Initialize the library with configuration
         */
        init: function(options) {
            this.config = Object.assign({}, this.config, options);
            this.injectStyles();
            this.injectModal();
            this.attachEventListeners();
        },
        
        /**
         * Inject required CSS styles
         */
        injectStyles: function() {
            if (document.getElementById('pqv-styles')) return;
            
            const styles = `
                <style id="pqv-styles">
                    .pqv-modal {
                        display: none;
                        position: fixed;
                        z-index: 10000;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        backdrop-filter: blur(5px);
                        animation: pqv-fadeIn 0.3s ease;
                    }
                    
                    .pqv-modal.show {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .pqv-modal-dialog {
                        background: white;
                        border-radius: 16px;
                        max-width: 900px;
                        width: 90%;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        animation: pqv-slideUp 0.3s ease;
                    }
                    
                    .pqv-modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 30px;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    
                    .pqv-modal-title {
                        font-size: 24px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0;
                    }
                    
                    .pqv-close {
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: #6b7280;
                        padding: 0;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 8px;
                        transition: all 0.2s;
                    }
                    
                    .pqv-close:hover {
                        background: #f3f4f6;
                        color: #111827;
                    }
                    
                    .pqv-modal-body {
                        padding: 30px;
                    }
                    
                    .pqv-content {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                    }
                    
                    .pqv-image {
                        text-align: center;
                        background: #f9fafb;
                        border-radius: 12px;
                        padding: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 300px;
                    }
                    
                    .pqv-image img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: transform 0.3s;
                    }
                    
                    .pqv-image img:hover {
                        transform: scale(1.05);
                    }
                    
                    .pqv-image-emoji {
                        font-size: 120px;
                    }
                    
                    .pqv-info {
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .pqv-category {
                        color: #6366f1;
                        font-weight: 600;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    
                    .pqv-title {
                        font-size: 28px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0;
                        line-height: 1.3;
                    }
                    
                    .pqv-rating {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .pqv-stars {
                        color: #fbbf24;
                        font-size: 16px;
                    }
                    
                    .pqv-rating-count {
                        color: #6b7280;
                        font-size: 14px;
                    }
                    
                    .pqv-price {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        flex-wrap: wrap;
                    }
                    
                    .pqv-price-current {
                        font-size: 32px;
                        font-weight: 700;
                        color: #10b981;
                    }
                    
                    .pqv-price-original {
                        font-size: 20px;
                        color: #9ca3af;
                        text-decoration: line-through;
                    }
                    
                    .pqv-discount-badge {
                        background: #fef3c7;
                        color: #d97706;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .pqv-description {
                        color: #4b5563;
                        line-height: 1.6;
                        font-size: 15px;
                    }
                    
                    .pqv-stock {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-weight: 600;
                        font-size: 15px;
                    }
                    
                    .pqv-stock.in-stock { color: #10b981; }
                    .pqv-stock.low-stock { color: #f59e0b; }
                    .pqv-stock.out-stock { color: #ef4444; }
                    
                    .pqv-actions {
                        display: flex;
                        gap: 12px;
                        margin-top: 10px;
                    }
                    
                    .pqv-btn {
                        padding: 15px 30px;
                        border: none;
                        border-radius: 10px;
                        font-weight: 600;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.3s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }
                    
                    .pqv-btn-primary {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        flex: 1;
                    }
                    
                    .pqv-btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
                    }
                    
                    .pqv-btn-icon {
                        background: #f3f4f6;
                        color: #4b5563;
                        padding: 15px 20px;
                        font-size: 18px;
                    }
                    
                    .pqv-btn-icon:hover {
                        background: #e5e7eb;
                        color: #111827;
                    }
                    
                    .pqv-btn-icon.active {
                        background: #fef2f2;
                        color: #ef4444;
                    }
                    
                    @keyframes pqv-fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes pqv-slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    @media (max-width: 768px) {
                        .pqv-content {
                            grid-template-columns: 1fr;
                            gap: 20px;
                        }
                        
                        .pqv-modal-dialog {
                            width: 95%;
                            margin: 20px;
                        }
                        
                        .pqv-title {
                            font-size: 22px;
                        }
                        
                        .pqv-price-current {
                            font-size: 26px;
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
        },
        
        /**
         * Inject modal HTML structure
         */
        injectModal: function() {
            if (document.getElementById('pqv-modal')) return;
            
            const modal = `
                <div id="pqv-modal" class="pqv-modal">
                    <div class="pqv-modal-dialog">
                        <div class="pqv-modal-header">
                            <h3 class="pqv-modal-title">Quick View</h3>
                            <button class="pqv-close" onclick="ProductQuickView.close()">&times;</button>
                        </div>
                        <div class="pqv-modal-body" id="pqv-body"></div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modal);
        },
        
        /**
         * Attach event listeners
         */
        attachEventListeners: function() {
            const modal = document.getElementById('pqv-modal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.close();
                    }
                });
            }
            
            // ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.close();
                }
            });
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
         * Show notification
         */
        showNotification: function(type, message) {
            if (this.config.onNotification) {
                this.config.onNotification(type, message);
            } else {
                alert(message);
            }
        },
        
        /**
         * Show quick view for a product
         */
        show: function(productId) {
            const product = this.config.products.find(p => p.id === productId);
            
            if (!product) {
                this.showNotification('error', 'Product not found');
                return;
            }
            
            const isInWishlist = this.config.wishlist.some(item => item.id === product.id);
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            
            // Determine image content
            let imageContent;
            if (product.image && this.isValidURL(product.image)) {
                imageContent = `<img src="${product.image}" alt="${product.title}" />`;
            } else if (product.image && product.image.trim() !== '') {
                imageContent = `<div class="pqv-image-emoji">${product.image}</div>`;
            } else {
                imageContent = '<div class="pqv-image-emoji">🛒</div>';
            }
            
            // Determine stock status
            let stockClass = 'out-stock';
            let stockText = 'Out of Stock';
            if (product.stock > 10) {
                stockClass = 'in-stock';
                stockText = 'In Stock';
            } else if (product.stock > 0) {
                stockClass = 'low-stock';
                stockText = `Only ${product.stock} left!`;
            }
            
            const modalContent = `
                <div class="pqv-content">
                    <div class="pqv-image">
                        ${imageContent}
                    </div>
                    <div class="pqv-info">
                        <div class="pqv-category">${product.category}</div>
                        <h2 class="pqv-title">${product.title}</h2>
                        <div class="pqv-rating">
                            <div class="pqv-stars">${this.generateStars(product.rating)}</div>
                            <span class="pqv-rating-count">(${product.reviews} reviews)</span>
                        </div>
                        <div class="pqv-price">
                            <span class="pqv-price-current">${this.config.currency}${product.price.toFixed(2)}</span>
                            <span class="pqv-price-original">${this.config.currency}${product.originalPrice.toFixed(2)}</span>
                            <span class="pqv-discount-badge">SAVE ${discount}%</span>
                        </div>
                        <div class="pqv-description">
                            <p>${product.description || 'Experience premium quality with this exceptional product. Crafted with attention to detail and designed for your satisfaction.'}</p>
                        </div>
                        <div class="pqv-stock ${stockClass}">
                            <i class="fas fa-box"></i>
                            <span>${stockText}</span>
                        </div>
                        <div class="pqv-actions">
                            <button class="pqv-btn pqv-btn-primary" data-action="addToCart" data-product-id="${product.id}">
                                <i class="fas fa-shopping-cart"></i>
                                Add to Cart
                            </button>
                            <button class="pqv-btn pqv-btn-icon ${isInWishlist ? 'active' : ''}" data-action="toggleWishlist" data-product-id="${product.id}">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button class="pqv-btn pqv-btn-icon" data-action="share" data-product-id="${product.id}">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            const body = document.getElementById('pqv-body');
            body.innerHTML = modalContent;
            
            // Attach action listeners
            this.attachActionListeners();
            
            // Show modal
            const modal = document.getElementById('pqv-modal');
            modal.classList.add('show');
        },
        
        /**
         * Attach action listeners to buttons
         */
        attachActionListeners: function() {
            const buttons = document.querySelectorAll('[data-action]');
            
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    const productId = e.currentTarget.dataset.productId;
                    
                    switch(action) {
                        case 'addToCart':
                            if (this.config.onAddToCart) {
                                this.config.onAddToCart(productId);
                                this.close();
                            }
                            break;
                        case 'toggleWishlist':
                            if (this.config.onToggleWishlist) {
                                this.config.onToggleWishlist(productId);
                                e.currentTarget.classList.toggle('active');
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
         * Close the modal
         */
        close: function() {
            const modal = document.getElementById('pqv-modal');
            modal.classList.remove('show');
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
        }
    };
    
    // Expose to global scope
    window.ProductQuickView = ProductQuickView;
    
})(window);