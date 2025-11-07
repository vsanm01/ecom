/**
 * ProductRenderer - A reusable product grid rendering library with integrated Quick View
 * Version: 2.0.0 - Self-contained with built-in Quick View modal
 * 
 * Usage:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
 * <script src="product-renderer.js"></script>
 * 
 * ProductRenderer.init({
 *   containerId: 'productsGrid',
 *   products: yourProductsArray,
 *   currency: '₹',
 *   onAddToCart: (productId) => { ... },
 *   onShare: (productId) => { ... }
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
            currency: '$',
            showDiscount: true,
            showRating: true,
            enableQuickView: true,
            enableShare: true,
            onAddToCart: null,
            onShare: null,
            onNotification: null,
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
            this.injectQuickViewModal();
            this.attachQuickViewListeners();
        },
        
        /**
         * Inject required CSS styles (includes Quick View modal styles)
         */
        injectStyles: function() {
            if (document.getElementById('pr-styles')) return;
            
            const styles = `
                <style id="pr-styles">
                    /* ===== PRODUCT GRID STYLES ===== */
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
                    
                    .pr-actions {
                        position: absolute;
                        bottom: 15px;
                        left: 15px;
                        right: 15px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        opacity: 0;
                        transform: translateY(10px);
                        transition: all 0.3s;
                        z-index: 2;
                    }
                    
                    .pr-card:hover .pr-actions {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    
                    .pr-action-btn {
                        width: 40px;
                        height: 40px;
                        border-radius: 20px;
                        background: rgba(0, 0, 0, 0.50);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(0, 0, 0, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        color: white;
                        font-size: 16px;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    }
                    
                    .pr-action-btn:hover {
                        transform: scale(1.1);
                        background: rgba(0, 0, 0, 0.65);
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
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
                    
                    .pr-add-to-cart {
                        width: 100%;
                        padding: 12px;
                        background: #ffd814;
                        color: black;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 16px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.3s;
                    }
                    
                    .pr-add-to-cart:hover {
                        background: #f7ca00;
                        transform: translateY(-1px);
                    }
                    
                    .pr-add-to-cart:active {
                        transform: translateY(0);
                    }
                    
                    /* ===== QUICK VIEW MODAL STYLES ===== */
                    .pr-qv-modal {
                        display: none;
                        position: fixed;
                        z-index: 10000;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        backdrop-filter: blur(5px);
                        animation: pr-qv-fadeIn 0.3s ease;
                    }
                    
                    .pr-qv-modal.show {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .pr-qv-modal-dialog {
                        background: white;
                        border-radius: 16px;
                        max-width: 900px;
                        width: 90%;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        animation: pr-qv-slideUp 0.3s ease;
                    }
                    
                    .pr-qv-modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 30px;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    
                    .pr-qv-modal-title {
                        font-size: 24px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0;
                    }
                    
                    .pr-qv-close {
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
                    
                    .pr-qv-close:hover {
                        background: #f3f4f6;
                        color: #111827;
                    }
                    
                    .pr-qv-modal-body {
                        padding: 30px;
                    }
                    
                    .pr-qv-content {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                    }
                    
                    .pr-qv-image {
                        text-align: center;
                        background: #f9fafb;
                        border-radius: 12px;
                        padding: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 300px;
                    }
                    
                    .pr-qv-image img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 8px;
                        transition: transform 0.3s;
                    }
                    
                    .pr-qv-image img:hover {
                        transform: scale(1.05);
                    }
                    
                    .pr-qv-image-emoji {
                        font-size: 120px;
                    }
                    
                    .pr-qv-info {
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .pr-qv-category {
                        color: #6366f1;
                        font-weight: 600;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    
                    .pr-qv-title {
                        font-size: 28px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0;
                        line-height: 1.3;
                    }
                    
                    .pr-qv-rating {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .pr-qv-stars {
                        color: #fbbf24;
                        font-size: 16px;
                    }
                    
                    .pr-qv-rating-count {
                        color: #6b7280;
                        font-size: 14px;
                    }
                    
                    .pr-qv-price {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        flex-wrap: wrap;
                    }
                    
                    .pr-qv-price-current {
                        font-size: 32px;
                        font-weight: 700;
                        color: #10b981;
                    }
                    
                    .pr-qv-price-original {
                        font-size: 20px;
                        color: #9ca3af;
                        text-decoration: line-through;
                    }
                    
                    .pr-qv-discount-badge {
                        background: #fef3c7;
                        color: #d97706;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .pr-qv-description {
                        color: #4b5563;
                        line-height: 1.6;
                        font-size: 15px;
                    }
                    
                    .pr-qv-stock {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-weight: 600;
                        font-size: 15px;
                    }
                    
                    .pr-qv-stock.in-stock { color: #10b981; }
                    .pr-qv-stock.low-stock { color: #f59e0b; }
                    .pr-qv-stock.out-stock { color: #ef4444; }
                    
                    .pr-qv-actions {
                        display: flex;
                        gap: 12px;
                        margin-top: 10px;
                    }
                    
                    .pr-qv-btn {
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
                    
                    .pr-qv-btn-primary {
                        background: #ffd814;
                        color: #000;
                        flex: 1;
                    }
                    
                    .pr-qv-btn-primary:hover {
                        background: #f7ca00;
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(255, 216, 20, 0.4);
                    }
                    
                    .pr-qv-btn-icon {
                        background: #f3f4f6;
                        color: #4b5563;
                        padding: 15px 20px;
                        font-size: 18px;
                    }
                    
                    .pr-qv-btn-icon:hover {
                        background: #e5e7eb;
                        color: #111827;
                    }
                    
                    @keyframes pr-qv-fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes pr-qv-slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    /* ===== RESPONSIVE STYLES ===== */
                    @media (min-width: 1200px) {
                        .pr-grid {
                            grid-template-columns: repeat(5, 1fr);
                            gap: 20px;
                        }
                    }
                    
                    @media (min-width: 992px) and (max-width: 1199px) {
                        .pr-grid {
                            grid-template-columns: repeat(4, 1fr);
                            gap: 18px;
                        }
                    }
                    
                    @media (min-width: 769px) and (max-width: 991px) {
                        .pr-grid {
                            grid-template-columns: repeat(3, 1fr);
                            gap: 16px;
                        }
                    }
                    
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
                        
                        .pr-badge {
                            top: 8px;
                            right: 8px;
                            padding: 4px 10px;
                            border-radius: 14px;
                            font-size: 10px;
                            font-weight: 600;
                        }
                        
                        .pr-actions {
                            opacity: 1;
                            transform: translateY(0);
                            bottom: 8px;
                            left: 8px;
                            right: 8px;
                        }
                        
                        .pr-action-btn {
                            width: 32px;
                            height: 32px;
                            font-size: 13px;
                            border-radius: 16px;
                        }
                        
                        .pr-action-btn:hover {
                            transform: scale(1);
                        }
                        
                        .pr-info {
                            padding: 12px;
                        }
                        
                        .pr-category {
                            font-size: 10px;
                            margin-bottom: 10px;
                        }
                        
                        .pr-title {
                            font-size: 14px;
                            margin-bottom: 5px;
                        }
                        
                        .pr-price {
                            margin-bottom: 10px;
                        }
                        
                        .pr-price-current {
                            font-size: 18px;
                        }
                        
                        .pr-price-current .pr-currency {
                            font-size: 16px;
                        }
                        
                        .pr-add-to-cart {
                            padding: 8px;
                            font-size: 12px;
                        }
                        
                        /* Quick View Modal - Mobile */
                        .pr-qv-content {
                            grid-template-columns: 1fr;
                            gap: 20px;
                        }
                        
                        .pr-qv-modal-dialog {
                            width: 95%;
                            margin: 20px;
                        }
                        
                        .pr-qv-title {
                            font-size: 22px;
                        }
                        
                        .pr-qv-price-current {
                            font-size: 26px;
                        }
                        
                        .pr-qv-actions {
                            flex-wrap: wrap;
                        }
                        
                        .pr-qv-btn-primary {
                            flex: 1 1 100%;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .pr-grid {
                            gap: 12px;
                        }
                        
                        .pr-image-container {
                            height: 120px;
                        }
                        
                        .pr-image-emoji {
                            font-size: 28px;
                        }
                        
                        .pr-badge {
                            top: 6px;
                            right: 6px;
                            padding: 3px 8px;
                            border-radius: 12px;
                            font-size: 9px;
                        }
                        
                        .pr-actions {
                            bottom: 6px;
                            left: 6px;
                            right: 6px;
                        }
                        
                        .pr-action-btn {
                            width: 30px;
                            height: 30px;
                            font-size: 12px;
                            border-radius: 15px;
                        }
                        
                        .pr-info {
                            padding: 10px;
                        }
                        
                        .pr-title {
                            font-size: 13px;
                        }
                        
                        .pr-price-current {
                            font-size: 16px;
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
        },
        
        /**
         * Inject Quick View modal HTML structure
         */
        injectQuickViewModal: function() {
            if (document.getElementById('pr-qv-modal')) return;
            
            const modal = `
                <div id="pr-qv-modal" class="pr-qv-modal">
                    <div class="pr-qv-modal-dialog">
                        <div class="pr-qv-modal-header">
                            <h3 class="pr-qv-modal-title">Quick View</h3>
                            <button class="pr-qv-close" id="pr-qv-close-btn">&times;</button>
                        </div>
                        <div class="pr-qv-modal-body" id="pr-qv-body"></div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modal);
        },
        
        /**
         * Attach Quick View modal listeners
         */
        attachQuickViewListeners: function() {
            const modal = document.getElementById('pr-qv-modal');
            const closeBtn = document.getElementById('pr-qv-close-btn');
            
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeQuickView();
                    }
                });
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeQuickView();
                });
            }
            
            // ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeQuickView();
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
            let actions = '<div class="pr-actions">';
            
            if (this.config.enableShare) {
                actions += `
                    <button class="pr-action-btn" data-action="share" data-product-id="${product.id}" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                `;
            } else {
                actions += '<div></div>';
            }
            
            if (this.config.enableQuickView) {
                actions += `
                    <button class="pr-action-btn" data-action="quickView" data-product-id="${product.id}" title="Quick View">
                        <i class="fas fa-eye"></i>
                    </button>
                `;
            }
            
            actions += '</div>';
            return actions;
        },
        
        /**
         * Generate product card HTML
         */
        generateCard: function(product) {
            if (!product.title || !product.price) return '';
            
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
                        <button class="pr-add-to-cart" data-action="addToCart" data-product-id="${product.id}">
                             Add to Cart
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
         * Show Quick View modal for a product
         */
        showQuickView: function(productId) {
            const product = this.config.products.find(p => p.id === productId);
            
            if (!product) {
                this.showNotification('error', 'Product not found');
                return;
            }
            
            const discount = product.originalPrice 
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
            
            // Determine image content
            let imageContent;
            if (product.image && this.isValidURL(product.image)) {
                imageContent = `<img src="${product.image}" alt="${product.title}" />`;
            } else if (product.image && product.image.trim() !== '') {
                imageContent = `<div class="pr-qv-image-emoji">${product.image}</div>`;
            } else {
                imageContent = '<div class="pr-qv-image-emoji">🛒</div>';
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
                <div class="pr-qv-content">
                    <div class="pr-qv-image">
                        ${imageContent}
                    </div>
                    <div class="pr-qv-info">
                        ${product.category ? `<div class="pr-qv-category">${product.category}</div>` : ''}
                        <h2 class="pr-qv-title">${product.title}</h2>
                        ${product.rating ? `
                            <div class="pr-qv-rating">
                                <div class="pr-qv-stars">${this.generateStars(product.rating)}</div>
                                ${product.reviews ? `<span class="pr-qv-rating-count">(${product.reviews} reviews)</span>` : ''}
                            </div>
                        ` : ''}
                        <div class="pr-qv-price">
                            <span class="pr-qv-price-current">${this.config.currency}${product.price.toFixed(2)}</span>
                            ${product.originalPrice ? `<span class="pr-qv-price-original">${this.config.currency}${product.originalPrice.toFixed(2)}</span>` : ''}
                            ${discount > 0 ? `<span class="pr-qv-discount-badge">SAVE ${discount}%</span>` : ''}
                        </div>
                        <div class="pr-qv-description">
                            <p>${product.description || 'Experience premium quality with this exceptional product. Crafted with attention to detail and designed for your satisfaction.'}</p>
                        </div>
                        ${product.stock !== undefined ? `
                            <div class="pr-qv-stock ${stockClass}">
                                <i class="fas fa-box"></i>
                                <span>${stockText}</span>
                            </div>
                        ` : ''}
                        <div class="pr-qv-actions">
                            <button class="pr-qv-btn pr-qv-btn-primary" data-action="addToCart" data-product-id="${product.id}">
                                <i class="fas fa-shopping-cart"></i>
                                Add to Cart
                            </button>
                            ${this.config.enableShare ? `
                                <button class="pr-qv-btn pr-qv-btn-icon" data-action="share" data-product-id="${product.id}">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            const body = document.getElementById('pr-qv-body');
            body.innerHTML = modalContent;
            
            // Attach action listeners to modal buttons
            this.attachModalActionListeners();
            
            // Show modal
            const modal = document.getElementById('pr-qv-modal');
            modal.classList.add('show');
        },
        
        /**
         * Close Quick View modal
         */
        closeQuickView: function() {
            const modal = document.getElementById('pr-qv-modal');
            modal.classList.remove('show');
        },
        
        /**
         * Attach action listeners to modal buttons
         */
        attachModalActionListeners: function() {
            const modalButtons = document.querySelectorAll('#pr-qv-modal [data-action]');
            
            modalButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    const productId = e.currentTarget.dataset.productId;
                    
                    switch(action) {
                        case 'addToCart':
                            if (this.config.onAddToCart) {
                                this.config.onAddToCart(productId);
                                this.closeQuickView();
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
                            this.showQuickView(productId);
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