/**
 * ProductRenderer - Enhanced with Built-in Cart Management
 * Version: 2.2.0 - Fixed Cart Synchronization & Quantity Management
 * 
 * Features:
 * - Fixed two-way cart synchronization between grid and cart view
 * - Removed blocking "unsaved changes" behavior
 * - Auto-save quantity changes without requiring explicit save button
 * - Consistent event naming for proper sync
 * - Touch-friendly mobile controls
 * 
 * CDN Usage:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
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
            onCategoryClick: null,
            gridColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            emptyMessage: 'No Products Found',
            emptyIcon: 'fas fa-inbox'
        },
        
        container: null,
        
        init: function(options) {
            this.config = Object.assign({}, this.config, options);
            this.container = document.getElementById(this.config.containerId);
            
            if (!this.container) {
                console.error(`Container with id "${this.config.containerId}" not found`);
                return;
            }
            
            this.injectStyles();
            this.listenToExternalChanges();
        },
        
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
                    
                    /* BADGE - TOP RIGHT */
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
                    
                    /* QUICK VIEW - TOP RIGHT (TOGGLE ON HOVER) */
                    .pr-quick-view-btn {
                        position: absolute;
                        top: 15px;
                        right: 15px;
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
                        opacity: 0;
                        z-index: 3;
                    }
                    
                    .pr-card:hover .pr-quick-view-btn {
                        opacity: 1;
                    }
                    
                    .pr-quick-view-btn:hover {
                        transform: scale(1.1);
                        background: rgba(0, 0, 0, 0.65);
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                    }
                    
                    .pr-quick-view-btn:active {
                        transform: scale(1.05);
                    }
                    
                    /* SHARE - BOTTOM LEFT (TOGGLE ON HOVER) */
                    .pr-share-btn {
                        position: absolute;
                        bottom: 15px;
                        left: 15px;
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
                        opacity: 0;
                        z-index: 3;
                    }
                    
                    .pr-card:hover .pr-share-btn {
                        opacity: 1;
                    }
                    
                    .pr-share-btn:hover {
                        transform: scale(1.1);
                        background: rgba(0, 0, 0, 0.65);
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                    }
                    
                    .pr-share-btn:active {
                        transform: scale(1.05);
                    }
                    
                    .pr-info {
                        padding: 20px;
                    }
                    
                    /* CATEGORY AS LINK */
                    .pr-category {
                        display: inline-block;
                        color: #007185;
                        padding: 0;
                        border: none;
                        background: transparent;
                        font-size: 12px;
                        font-weight: 500;
                        margin-bottom: 12px;
                        text-transform: capitalize;
                        cursor: pointer;
                        text-decoration: none;
                        transition: color 0.2s;
                    }
                    
                    .pr-category:hover {
                        color: #C45500;
                        text-decoration: underline;
                    }
                    
                    .pr-title {
                        font-size: 16px;
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
                        gap: 6px;
                        margin-bottom: 10px;
                    }
                    
                    .pr-stars {
                        color: #ffa41c;
                        font-size: 14px;
                    }
                    
                    .pr-rating-count {
                        color: #007185;
                        font-size: 13px;
                    }
                    
                    .pr-price {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 12px;
                    }
                    
                    .pr-price-current {
                        font-size: 20px;
                        font-weight: 700;
                        color: #0F1111;
                    }
                    
                    .pr-price-current .pr-currency {
                        font-size: 16px;
                    }
                    
                    .pr-price-original {
                        font-size: 14px;
                        color: #565959;
                        text-decoration: line-through;
                    }
                    
                    /* ADD TO CART BUTTON - AMAZON YELLOW */
                    .pr-add-to-cart {
                        width: 100%;
                        padding: 10px 16px;
                        background: #ffd814;
                        color: #0F1111;
                        border: 1px solid #fcd200;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 14px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.2s ease;
                    }
                    
                    .pr-add-to-cart:hover {
                        background: #f7ca00;
                        border-color: #f2c200;
                        box-shadow: 0 2px 5px rgba(213, 217, 217, 0.5);
                    }
                    
                    .pr-add-to-cart:active {
                        background: #f0b800;
                        border-color: #e0a800;
                        box-shadow: 0 1px 3px rgba(213, 217, 217, 0.5);
                    }
                    
                    /* QUANTITY CONTROLS */
                    .pr-qty-controls {
                        display: none;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        width: 100%;
                    }
                    
                    .pr-qty-btn {
                        background-color: #e7e9ec;
                        border: 1px solid #adb1b8;
                        width: 36px;
                        height: 36px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: all 0.2s ease;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #0F1111;
                    }
                    
                    .pr-qty-btn:hover {
                        background-color: #d5dbdb;
                        border-color: #979aa1;
                    }
                    
                    .pr-qty-btn:active {
                        background-color: #c7d0d6;
                    }
                    
                    /* MANUAL INPUT FOR QUANTITY */
                    .pr-qty-input {
                        font-weight: 600;
                        width: 60px;
                        text-align: center;
                        background-color: white;
                        padding: 8px;
                        border-radius: 8px;
                        font-size: 15px;
                        border: 1px solid #888c8c;
                        color: #0F1111;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    
                    .pr-qty-input:focus {
                        border-color: #e77600;
                        box-shadow: 0 0 0 3px rgba(228, 121, 17, 0.15);
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
                    
                    /* Tablet (769px-991px) - 3 columns */
                    @media (min-width: 769px) and (max-width: 991px) {
                        .pr-grid {
                            grid-template-columns: repeat(3, 1fr);
                            gap: 16px;
                        }
                    }
                    
                    /* Mobile (≤768px) - 2 columns */
                    @media (max-width: 768px) {
                        .pr-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 12px;
                        }
                        
                        .pr-image-container {
                            height: 160px;
                        }
                        
                        .pr-image-emoji {
                            font-size: 36px;
                        }
                        
                        .pr-badge {
                            top: 10px;
                            right: 10px;
                            padding: 5px 10px;
                            font-size: 11px;
                        }
                        
                        .pr-quick-view-btn,
                        .pr-share-btn {
                            width: 40px;
                            height: 40px;
                            font-size: 16px;
                        }
                        
                        .pr-quick-view-btn {
                            top: 10px;
                            right: 10px;
                        }
                        
                        .pr-share-btn {
                            bottom: 10px;
                            left: 10px;
                        }
                        
                        .pr-info {
                            padding: 14px;
                        }
                        
                        .pr-category {
                            font-size: 11px;
                            margin-bottom: 10px;
                        }
                        
                        .pr-title {
                            font-size: 14px;
                            margin-bottom: 6px;
                        }
                        
                        .pr-rating {
                            margin-bottom: 8px;
                        }
                        
                        .pr-price {
                            margin-bottom: 10px;
                        }
                        
                        .pr-price-current {
                            font-size: 18px;
                        }
                        
                        .pr-price-current .pr-currency {
                            font-size: 15px;
                        }
                        
                        .pr-add-to-cart {
                            padding: 9px 14px;
                            font-size: 13px;
                        }
                        
                        .pr-qty-btn {
                            width: 38px;
                            height: 38px;
                            font-size: 18px;
                        }
                        
                        .pr-qty-input {
                            width: 52px;
                            padding: 9px 6px;
                            font-size: 15px;
                        }
                        
                        .pr-qty-controls {
                            gap: 6px;
                        }
                    }
                    
                    /* Small Mobile (≤480px) */
                    @media (max-width: 480px) {
                        .pr-grid {
                            gap: 10px;
                        }
                        
                        .pr-image-container {
                            height: 140px;
                        }
                        
                        .pr-info {
                            padding: 12px;
                        }
                        
                        .pr-title {
                            font-size: 13px;
                        }
                        
                        .pr-price-current {
                            font-size: 16px;
                        }
                        
                        .pr-add-to-cart {
                            padding: 8px 12px;
                            font-size: 12px;
                        }
                        
                        .pr-qty-btn {
                            width: 36px;
                            height: 36px;
                            font-size: 17px;
                        }
                        
                        .pr-qty-input {
                            width: 48px;
                            padding: 8px 5px;
                            font-size: 14px;
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
        },
        
        isValidURL: function(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        },
        
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
        
        getCartItem: function(productId) {
            return this.config.cart.find(item => item.id === productId);
        },
        
        addToCart: function(productId) {
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
            this.updateAllQuantityDisplays(productId);
            this.triggerCartUpdate();
        },
        
        showQuantityControls: function(productId) {
            const card = document.querySelector(`[data-product-id="${productId}"]`);
            if (!card) return;
            
            const addBtn = card.querySelector('.pr-add-to-cart');
            const qtyControls = card.querySelector('.pr-qty-controls');
            const qtyInput = card.querySelector('.pr-qty-input');
            
            if (addBtn && qtyControls && qtyInput) {
                addBtn.style.display = 'none';
                qtyControls.style.display = 'flex';
                
                const cartItem = this.getCartItem(productId);
                qtyInput.value = cartItem ? cartItem.quantity : 0;
            }
        },
        
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
        
        increaseQty: function(productId) {
            const cartItem = this.getCartItem(productId);
            if (!cartItem) return;
            
            cartItem.quantity += 1;
            this.updateAllQuantityDisplays(productId);
            this.triggerCartUpdate();
        },
        
        decreaseQty: function(productId) {
            const cartItem = this.getCartItem(productId);
            if (!cartItem) return;
            
            cartItem.quantity -= 1;
            
            if (cartItem.quantity === 0) {
                this.removeFromCart(productId);
                this.hideQuantityControls(productId);
            } else {
                this.updateAllQuantityDisplays(productId);
            }
            
            this.triggerCartUpdate();
        },
        
        updateQtyFromInput: function(productId, value) {
            const cartItem = this.getCartItem(productId);
            if (!cartItem) return;
            
            const newQty = parseInt(value) || 0;
            cartItem.quantity = Math.max(0, newQty);
            
            if (cartItem.quantity === 0) {
                this.removeFromCart(productId);
                this.hideQuantityControls(productId);
            } else {
                this.updateAllQuantityDisplays(productId);
            }
            
            this.triggerCartUpdate();
        },
        
        updateAllQuantityDisplays: function(productId) {
            const cartItem = this.getCartItem(productId);
            if (!cartItem) return;
            
            // Update all quantity inputs for this product
            const qtyInputs = document.querySelectorAll(`.pr-qty-input[data-product-id="${productId}"]`);
            qtyInputs.forEach(input => {
                input.value = cartItem.quantity;
            });
            
            // Dispatch event for external listeners (like cart view)
            this.dispatchQuantityChangeEvent(productId, cartItem.quantity);
        },
        
        dispatchQuantityChangeEvent: function(productId, quantity) {
            const event = new CustomEvent('cartQuantityChanged', {
                detail: { 
                    productId, 
                    quantity,
                    cart: this.config.cart
                }
            });
            document.dispatchEvent(event);
        },
        
        removeFromCart: function(productId) {
            this.config.cart = this.config.cart.filter(item => item.id !== productId);
            this.triggerCartUpdate();
        },
        
        triggerCartUpdate: function() {
            if (this.config.onCartUpdate) {
                this.config.onCartUpdate(this.config.cart);
            }
        },
        
        generateCard: function(product) {
            if (!product.title || !product.price) return '';
            
            const cartItem = this.getCartItem(product.id);
            const isInCart = cartItem !== undefined;
            
            const discount = this.config.showDiscount && product.originalPrice 
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
            
            const imageContent = this.generateImageContent(product);
            
            return `
                <div class="pr-card" data-product-id="${product.id}" data-category="${product.category || ''}" data-price="${product.price}">
                    <div class="pr-image-container">
                        ${imageContent}
                        ${discount > 0 ? `<span class="pr-badge">${discount}% OFF</span>` : ''}
                        ${this.config.enableQuickView ? `
                            <button class="pr-quick-view-btn" data-action="quickView" data-product-id="${product.id}" title="Quick View">
                                <i class="fas fa-eye"></i>
                            </button>
                        ` : ''}
                        ${this.config.enableShare ? `
                            <button class="pr-share-btn" data-action="share" data-product-id="${product.id}" title="Share">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="pr-info">
                        ${product.category ? `<a href="#" class="pr-category" data-action="category" data-category="${product.category}">${product.category}</a>` : ''}
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
                            <input type="number" class="pr-qty-input" data-product-id="${product.id}" value="${cartItem ? cartItem.quantity : 0}" min="0" />
                            <button class="pr-qty-btn" data-action="increase" data-product-id="${product.id}">+</button>
                        </div>
                    </div>
                </div>
            `;
        },
        
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
        
        attachEventListeners: function() {
            const buttons = this.container.querySelectorAll('[data-action]');
            
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const action = e.currentTarget.dataset.action;
                    const productId = e.currentTarget.dataset.productId;
                    const category = e.currentTarget.dataset.category;
                    
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
                        case 'category':
                            if (this.config.onCategoryClick) {
                                this.config.onCategoryClick(category);
                            }
                            break;
                    }
                });
            });
            
            // Add input event listeners for manual quantity changes
            const qtyInputs = this.container.querySelectorAll('.pr-qty-input');
            qtyInputs.forEach(input => {
                let timeout;
                input.addEventListener('input', (e) => {
                    const productId = e.target.dataset.productId;
                    const value = e.target.value;
                    
                    // Debounce to avoid too many updates
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        this.updateQtyFromInput(productId, value);
                    }, 300);
                });
                
                // Immediate update on blur
                input.addEventListener('blur', (e) => {
                    const productId = e.target.dataset.productId;
                    const value = e.target.value;
                    clearTimeout(timeout);
                    this.updateQtyFromInput(productId, value);
                });
            });
        },
        
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
        
        updateProducts: function(products) {
            this.config.products = products;
        },
        
        getCart: function() {
            return this.config.cart;
        },
        
        clearCart: function() {
            this.config.cart = [];
            this.render();
            this.triggerCartUpdate();
        },
        
        filterByCategory: function(category) {
            if (!category || category === 'all') {
                return this.config.products;
            }
            return this.config.products.filter(p => p.category === category);
        },
        
        filterByPrice: function(min, max) {
            return this.config.products.filter(p => p.price >= min && p.price <= max);
        },
        
        search: function(query) {
            const lowerQuery = query.toLowerCase();
            return this.config.products.filter(p => 
                p.title.toLowerCase().includes(lowerQuery) ||
                (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
                (p.description && p.description.toLowerCase().includes(lowerQuery))
            );
        },
        
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
        },
        
        /**
         * Update quantity from external source (like cart view)
         * This syncs quantity changes across all displays
         */
        updateQuantityFromExternal: function(productId, quantity) {
            const cartItem = this.getCartItem(productId);
            
            // If item doesn't exist in cart and quantity > 0, add it
            if (!cartItem && quantity > 0) {
                const product = this.config.products.find(p => p.id === productId);
                if (product) {
                    this.config.cart.push({
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                        quantity: quantity
                    });
                    this.showQuantityControls(productId);
                }
            } else if (cartItem) {
                cartItem.quantity = Math.max(0, parseInt(quantity) || 0);
                
                if (cartItem.quantity === 0) {
                    this.removeFromCart(productId);
                    this.hideQuantityControls(productId);
                }
            }
            
            this.updateAllQuantityDisplays(productId);
        },
        
        /**
         * Listen for external quantity changes (from cart view)
         * Uses the same event name for proper two-way sync
         */
        listenToExternalChanges: function() {
            document.addEventListener('cartQuantityChanged', (e) => {
                // Ignore our own events
                if (e.detail.source === 'ProductRenderer') return;
                
                const { productId, quantity } = e.detail;
                this.updateQuantityFromExternal(productId, quantity);
            });
        }
    };
    
    // Initialize external change listener
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Listener is now initialized in init()
        });
    }
    
    window.ProductRenderer = ProductRenderer;
    
})(window);