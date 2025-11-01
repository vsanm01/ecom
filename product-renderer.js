/**
 * ProductRenderer - Enhanced with Built-in Cart Management
 * Version: 2.0.0 - Complete Cart System with Quantity Controls
 * 
 * Features:
 * - Built-in cart management with +/- controls
 * - Visual state changes (button transforms to controls)
 * - Safety checks and user guidance messages
 * - Auto-remove at quantity 0
 * - Touch-friendly mobile controls (44px minimum)
 * - No wishlist features
 * - Improved action button positioning and sizing
 * - Always visible buttons on mobile/tablet
 * 
 * CDN Usage:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
 * <script src="product_renderer_dark.js"></script>
 * 
 * ProductRenderer.init({
 *   containerId: 'productsGrid',
 *   products: yourProductsArray,
 *   currency: '₹',
 *   onQuickView: (productId) => { console.log('Quick view:', productId); },
 *   onShare: (productId) => { console.log('Share:', productId); },
 *   onCartUpdate: (cart) => { console.log('Cart updated:', cart); }
 * });
 * 
 * ProductRenderer.render();
 */

(function(window) {
    'use strict';
    
    const ProductRenderer = {
        config: {
            containerId: 'productsGrid',
            products: [],
            cart: [],
            currency: '$',
            showDiscount: true,
            showRating: true,
            enableQuickView: true,
            enableShare: true,
            onQuickView: null,
            onShare: null,
            onCartUpdate: null,
            gridColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
            this.createSafetyMessage();
        },
        
        /**
         * Create safety message overlay
         */
        createSafetyMessage: function() {
            if (document.getElementById('pr-safety-message')) return;
            
            const messageHTML = `
                <div id="pr-safety-message" class="pr-safety-message">
                    <div class="pr-spinner"></div>
                    <div class="pr-safety-text">Please save your quantity changes before proceeding!</div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', messageHTML);
        },
        
        /**
         * Show safety message
         */
        showSafetyMessage: function(message = 'Please save your quantity changes before proceeding!') {
            const messageEl = document.getElementById('pr-safety-message');
            const textEl = messageEl.querySelector('.pr-safety-text');
            
            textEl.textContent = message;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        },
        
        /**
         * Check for unsaved changes
         */
        hasUnsavedChanges: function() {
            const qtyControls = document.querySelectorAll('.pr-qty-controls');
            for (let control of qtyControls) {
                if (control.style.display === 'flex') {
                    return true;
                }
            }
            return false;
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
                        grid-template-columns: repeat(5, 1fr);
                        gap: 20px;
                        width: 100%;
                        margin-bottom: 40px;
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
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                        border: 1px solid #f1f3f4;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        position: relative;
                    }
                    
                    .pr-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                    }
                    
                    .pr-image-container {
                        position: relative;
                        width: 100%;
                        height: 220px;
                        background: #f8f9fa;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        border-bottom: 1px solid #f1f3f4;
                    }
                    
                    .pr-image {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.3s ease;
                    }
                    
                    .pr-card:hover .pr-image {
                        transform: scale(1.05);
                    }
                    
                    .pr-image-emoji {
                        font-size: 48px;
                    }
                    
                    /* UNIFIED BADGE STYLING - DARK TRANSPARENT BACKDROP */
                    .pr-badge {
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        background: rgba(0, 0, 0, 0.50);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-weight: 700;
                        font-size: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        border: 1px solid rgba(0, 0, 0, 0.7);
                        z-index: 2;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    }
                    
                    /* UNIFIED ACTION BUTTONS - DARK TRANSPARENT BACKDROP (DESKTOP: HOVER) */
                    .pr-actions {
                        position: absolute;
                        top: 15px;
                        left: 15px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        opacity: 0;
                        transform: translateX(-10px);
                        transition: all 0.3s ease;
                        z-index: 2;
                    }
                    
                    .pr-card:hover .pr-actions {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    
                    .pr-action-btn {
                        width: 44px;
                        height: 44px;
                        border-radius: 22px;
                        background: rgba(0, 0, 0, 0.50);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(0, 0, 0, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        color: white;
                        font-size: 18px;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    }
                    
                    .pr-action-btn:hover {
                        transform: scale(1.1);
                        background: rgba(0, 0, 0, 0.65);
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                    }
                    
                    .pr-action-btn:active {
                        transform: scale(1.05);
                    }
                    
                    .pr-info {
                        padding: 20px;
                    }
                    
                    .pr-category {
                        display: inline-block;
                        color: #0066cc;
                        padding: 0;
                        border: none;
                        background: transparent;
                        font-size: 12px;
                        font-weight: 500;
                        margin-bottom: 16px;
                        text-transform: capitalize;
                        cursor: pointer;
                        text-decoration: underline;
                        transition: color 0.3s;
                    }
                    
                    .pr-category:hover {
                        color: #004499;
                    }
                    
                    .pr-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #212529;
                        margin: 0 0 8px 0;
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
                        gap: 4px;
                        margin-bottom: 16px;
                    }
                    
                    .pr-price-current {
                        font-size: 24px;
                        font-weight: 700;
                        color: #495057;
                    }
                    
                    .pr-price-current .pr-currency {
                        font-size: 20px;
                    }
                    
                    .pr-price-original {
                        font-size: 16px;
                        color: #9ca3af;
                        text-decoration: line-through;
                    }
                    
                    /* ADD TO CART BUTTON */
                    .pr-add-to-cart {
                        width: 100%;
                        padding: 12px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 16px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                    }
                    
                    .pr-add-to-cart:hover {
                        background: #45a049;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                    }
                    
                    .pr-add-to-cart:active {
                        transform: translateY(0);
                    }
                    
                    /* QUANTITY CONTROLS */
                    .pr-qty-controls {
                        display: none;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        width: 100%;
                    }
                    
                    .pr-qty-btn {
                        background-color: #ddd;
                        border: none;
                        width: 38px;
                        height: 38px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: all 0.3s ease;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #333;
                    }
                    
                    .pr-qty-btn:hover {
                        background-color: #ccc;
                        transform: scale(1.05);
                    }
                    
                    .pr-qty-btn:active {
                        transform: scale(0.98);
                    }
                    
                    .pr-qty-display {
                        font-weight: bold;
                        min-width: 45px;
                        text-align: center;
                        background-color: #f8f9fa;
                        padding: 9px;
                        border-radius: 8px;
                        font-size: 17px;
                        border: 1px solid #e0e0e0;
                    }
                    
                    .pr-save-btn {
                        background-color: #ffd814;
                        color: black;
                        border: none;
                        padding: 9px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 14px;
                        transition: all 0.3s ease;
                    }
                    
                    .pr-save-btn:hover {
                        background-color: #f7ca00;
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(255, 216, 20, 0.4);
                    }
                    
                    .pr-save-btn:active {
                        transform: translateY(0);
                    }
                    
                    /* SAFETY MESSAGE */
                    .pr-safety-message {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background-color: rgba(255, 255, 255, 0.98);
                        border: 2px solid #ff4444;
                        border-radius: 12px;
                        padding: 25px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        z-index: 10000;
                        display: none;
                        text-align: center;
                        max-width: 320px;
                        width: 90%;
                    }
                    
                    .pr-spinner {
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #ff4444;
                        border-radius: 50%;
                        width: 35px;
                        height: 35px;
                        animation: pr-spin 1s linear infinite;
                        margin: 0 auto 18px;
                    }
                    
                    @keyframes pr-spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    .pr-safety-text {
                        color: #ff4444;
                        font-weight: bold;
                        font-size: 15px;
                        line-height: 1.5;
                    }
                    
                    /* Desktop Large (≥1200px) - 5 columns */
                    @media (min-width: 1200px) {
                        .pr-grid {
                            grid-template-columns: repeat(5, 1fr);
                            gap: 20px;
                        }
                    }
                    
                    /* Desktop (992px-1199px) - 4 columns */
                    @media (min-width: 992px) and (max-width: 1199px) {
                        .pr-grid {
                            grid-template-columns: repeat(4, 1fr);
                            gap: 18px;
                        }
                    }
                    
                    /* Tablet (769px-991px) - 3 columns - ALWAYS VISIBLE BUTTONS */
                    @media (min-width: 769px) and (max-width: 991px) {
                        .pr-grid {
                            grid-template-columns: repeat(3, 1fr);
                            gap: 16px;
                        }
                        
                        /* Tablet - Always visible action buttons */
                        .pr-actions {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }
                    
                    /* Mobile (≤768px) - 2 columns - ALWAYS VISIBLE BUTTONS */
                    @media (max-width: 768px) {
                        .pr-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 15px;
                        }
                        
                        .pr-image-container {
                            height: 140px;
                        }
                        
                        .pr-image-emoji {
                            font-size: 32px;
                        }
                        
                        /* MOBILE BADGE */
                        .pr-badge {
                            top: 10px;
                            right: 10px;
                            padding: 5px 11px;
                            border-radius: 16px;
                            font-size: 11px;
                            font-weight: 600;
                        }
                        
                        /* MOBILE ACTION BUTTONS - ALWAYS VISIBLE & LARGER */
                        .pr-actions {
                            opacity: 1;
                            transform: translateX(0);
                            top: 10px;
                            left: 10px;
                            gap: 10px;
                        }
                        
                        .pr-action-btn {
                            width: 40px;
                            height: 40px;
                            font-size: 16px;
                            border-radius: 20px;
                        }
                        
                        .pr-action-btn:hover {
                            transform: scale(1);
                            background: rgba(0, 0, 0, 0.60);
                        }
                        
                        .pr-action-btn:active {
                            transform: scale(0.95);
                            background: rgba(0, 0, 0, 0.70);
                        }
                        
                        .pr-info {
                            padding: 12px;
                        }
                        
                        .pr-category {
                            font-size: 11px;
                            margin-bottom: 10px;
                        }
                        
                        .pr-title {
                            font-size: 14px;
                            margin-bottom: 6px;
                        }
                        
                        .pr-price {
                            margin-bottom: 12px;
                        }
                        
                        .pr-price-current {
                            font-size: 18px;
                        }
                        
                        .pr-price-current .pr-currency {
                            font-size: 16px;
                        }
                        
                        /* MOBILE - LARGER TOUCH-FRIENDLY CONTROLS (44px) */
                        .pr-add-to-cart {
                            padding: 12px 16px;
                            font-size: 14px;
                            font-weight: 600;
                            min-height: 44px;
                        }
                        
                        .pr-qty-btn {
                            width: 44px;
                            height: 44px;
                            font-size: 20px;
                            border-radius: 10px;
                        }
                        
                        .pr-qty-display {
                            min-width: 50px;
                            padding: 11px;
                            font-size: 18px;
                            border-radius: 10px;
                        }
                        
                        .pr-save-btn {
                            padding: 12px 20px;
                            font-size: 14px;
                            font-weight: 600;
                            min-height: 44px;
                            min-width: 75px;
                            border-radius: 10px;
                        }
                        
                        .pr-qty-controls {
                            gap: 8px;
                        }
                    }
                    
                    /* Small Mobile (≤480px) - 2 columns */
                    @media (max-width: 480px) {
                        .pr-grid {
                            gap: 12px;
                        }
                        
                        .pr-image-container {
                            height: 130px;
                        }
                        
                        .pr-image-emoji {
                            font-size: 30px;
                        }
                        
                        /* SMALL MOBILE BADGE */
                        .pr-badge {
                            top: 8px;
                            right: 8px;
                            padding: 4px 10px;
                            border-radius: 14px;
                            font-size: 10px;
                        }
                        
                        /* SMALL MOBILE ACTION BUTTONS - LARGER SIZE */
                        .pr-actions {
                            top: 8px;
                            left: 8px;
                            gap: 8px;
                        }
                        
                        .pr-action-btn {
                            width: 38px;
                            height: 38px;
                            font-size: 15px;
                            border-radius: 19px;
                        }
                        
                        .pr-info {
                            padding: 10px;
                        }
                        
                        .pr-category {
                            font-size: 10px;
                            margin-bottom: 8px;
                        }
                        
                        .pr-title {
                            font-size: 13px;
                            margin-bottom: 5px;
                        }
                        
                        .pr-price-current {
                            font-size: 16px;
                        }
                        
                        .pr-price-current .pr-currency {
                            font-size: 14px;
                        }
                        
                        /* SMALL MOBILE - TOUCH-FRIENDLY CONTROLS */
                        .pr-add-to-cart {
                            padding: 12px 14px;
                            font-size: 13px;
                            min-height: 44px;
                        }
                        
                        .pr-qty-btn {
                            width: 44px;
                            height: 44px;
                            font-size: 19px;
                        }
                        
                        .pr-qty-display {
                            min-width: 48px;
                            padding: 10px;
                            font-size: 17px;
                        }
                        
                        .pr-save-btn {
                            padding: 12px 18px;
                            font-size: 13px;
                            min-height: 44px;
                            min-width: 70px;
                        }
                    }
                    
                    /* Extra Small Mobile (≤360px) */
                    @media (max-width: 360px) {
                        .pr-grid {
                            gap: 10px;
                        }
                        
                        .pr-image-container {
                            height: 120px;
                        }
                        
                        .pr-actions {
                            gap: 7px;
                            top: 7px;
                            left: 7px;
                        }
                        
                        .pr-action-btn {
                            width: 36px;
                            height: 36px;
                            font-size: 14px;
                        }
                        
                        .pr-badge {
                            top: 7px;
                            right: 7px;
                            padding: 3px 9px;
                            font-size: 9px;
                        }
                        
                        .pr-title {
                            font-size: 12px;
                        }
                        
                        .pr-add-to-cart {
                            font-size: 12px;
                            padding: 11px 12px;
                            min-height: 44px;
                        }
                        
                        .pr-qty-btn {
                            width: 42px;
                            height: 42px;
                            font-size: 18px;
                        }
                        
                        .pr-qty-display {
                            min-width: 45px;
                            font-size: 16px;
                        }
                        
                        .pr-save-btn {
                            padding: 11px 16px;
                            font-size: 12px;
                            min-width: 65px;
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
        generateActions: function(product) {
            let actions = '';
            
            if (this.config.enableQuickView) {
                actions += `
                    <button class="pr-action-btn" data-action="quickView" data-product-id="${product.id}" title="Quick View">
                        <i class="fas fa-eye"></i>
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
         * Get cart item for product
         */
        getCartItem: function(productId) {
            return this.config.cart.find(item => item.id === productId);
        },
        
        /**
         * Add to cart
         */
        addToCart: function(productId) {
            if (this.hasUnsavedChanges()) {
                this.showSafetyMessage();
                return;
            }
            
            const product = this.config.products.find(p => p.id === productId);
            if (!product) return;
            
            const existingItem = this.getCartItem(productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.config.cart.push({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    category: product.category,
                    quantity: 1
                });
            }
            
            this.showQuantityControls(productId);
            this.triggerCartUpdate();
        },
        
        /**
         * Show quantity controls
         */
        showQuantityControls: function(productId) {
            const card = document.querySelector(`[data-product-id="${productId}"]`);
            if (!card) return;
            
            const addBtn = card.querySelector('.pr-add-to-cart');
            const qtyControls = card.querySelector('.pr-qty-controls');
            const qtyDisplay = card.querySelector('.pr-qty-display');
            
            if (addBtn && qtyControls && qtyDisplay) {
                addBtn.style.display = 'none';
                qtyControls.style.display = 'flex';
                
                const cartItem = this.getCartItem(productId);
                qtyDisplay.textContent = cartItem ? cartItem.quantity : 0;
            }
        },
        
        /**
         * Hide quantity controls
         */
        hideQuantityControls: function(productId) {
            const card = document.querySelector(`[data-product-id="${productId}"]`);
            if (!card) return;
            
            const addBtn = card.querySelector('.pr-add-to-cart');
            const qtyControls = card.querySelector('.pr-qty-controls');
            
            if (addBtn && qtyControls) {
                addBtn.style.display = 'flex';
                qtyControls.style.display = 'none';
            }
        },
        
        /**
         * Increase quantity
         */
        increaseQty: function(productId) {
            const cartItem = this.getCartItem(productId);
            if (!cartItem) return;
            
            cartItem.quantity += 1;
            
            const qtyDisplay = document.querySelector(`[data-product-id="${productId}"] .pr-qty-display`);
            if (qtyDisplay) {
                qtyDisplay.textContent = cartItem.quantity;
            }
        },
        
        /**
         * Decrease quantity
         */
        decreaseQty: function(productId) {
            const cartItem = this.getCartItem(productId);
            if (!cartItem) return;
            
            cartItem.quantity -= 1;
            
            const qtyDisplay = document.querySelector(`[data-product-id="${productId}"] .pr-qty-display`);
            if (qtyDisplay) {
                qtyDisplay.textContent = cartItem.quantity;
            }
            
            // Auto-remove at quantity 0
            if (cartItem.quantity === 0) {
                this.removeFromCart(productId);
                this.hideQuantityControls(productId);
            }
        },
        
        /**
         * Save quantity changes
         */
        saveQty: function(productId) {
            this.hideQuantityControls(productId);
            this.triggerCartUpdate();
        },
        
        /**
         * Remove from cart
         */
        removeFromCart: function(productId) {
            this.config.cart = this.config.cart.filter(item => item.id !== productId);
            this.triggerCartUpdate();
        },
        
        /**
         * Trigger cart update callback
         */
        triggerCartUpdate: function() {
            if (this.config.onCartUpdate) {
                this.config.onCartUpdate(this.config.cart);
            }
        },
        
        /**
         * Generate product card HTML
         */
        generateCard: function(product) {
            if (!product.title || !product.price) return '';
            
            const cartItem = this.getCartItem(product.id);
            const isInCart = cartItem !== undefined;
            
            const discount = this.config.showDiscount && product.originalPrice 
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
            
            const imageContent = this.generateImageContent(product);
            const actions = this.generateActions(product);
            
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
                            <span class="pr-price-current"><span class="pr-currency">${this.config.currency}</span>${product.price.toFixed(2)}</span>
                            ${product.originalPrice ? `<span class="pr-price-original">${this.config.currency}${product.originalPrice.toFixed(2)}</span>` : ''}
                        </div>
                        <button class="pr-add-to-cart" data-action="addToCart" data-product-id="${product.id}" style="display: ${isInCart ? 'none' : 'flex'}">
                            Add to Cart
                        </button>
                        <div class="pr-qty-controls" data-product-id="${product.id}" style="display: ${isInCart ? 'flex' : 'none'}">
                            <button class="pr-qty-btn" data-action="decrease" data-product-id="${product.id}">−</button>
                            <span class="pr-qty-display">${cartItem ? cartItem.quantity : 0}</span>
                            <button class="pr-qty-btn" data-action="increase" data-product-id="${product.id}">+</button>
                            <button class="pr-save-btn" data-action="save" data-product-id="${product.id}">Save</button>
                        </div>
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
                            this.addToCart(productId);
                            break;
                        case 'increase':
                            this.increaseQty(productId);
                            break;
                        case 'decrease':
                            this.decreaseQty(productId);
                            break;
                        case 'save':
                            this.saveQty(productId);
                            break;
                        case 'quickView':
                            if (this.config.onQuickView) {
                                this.config.onQuickView(productId);
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
            
            const products = productsToRender || this.config.products;
            
            this.container.innerHTML = '';
            
            if (!this.container.classList.contains('pr-grid')) {
                this.container.classList.add('pr-grid');
            }
            
            if (!products || products.length === 0) {
                this.container.innerHTML = this.generateEmptyState();
                return;
            }
            
            products.forEach(product => {
                const cardHTML = this.generateCard(product);
                if (cardHTML) {
                    this.container.insertAdjacentHTML('beforeend', cardHTML);
                }
            });
            
            this.attachEventListeners();
        },
        
        /**
         * Update products array
         */
        updateProducts: function(products) {
            this.config.products = products;
        },
        
        /**
         * Get current cart
         */
        getCart: function() {
            return this.config.cart;
        },
        
        /**
         * Clear cart
         */
        clearCart: function() {
            this.config.cart = [];
            this.render();
            this.triggerCartUpdate();
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