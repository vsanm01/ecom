/**
 * ProductRenderer - Simplified Version with Minimal Quick View
 * Version: 3.1.0 - Clean Product Display & Quick View
 * 
 * Features:
 * - Product image, name, category, description
 * - Quick view button (bottom right)
 * - Minimal quick view modal: image, name, category, description only
 * - Removed: share, badge, rating, reviews, price, add to cart, wishlist, stock
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
            enableQuickView: true,
            onQuickView: null,
            onCategoryClick: null,
            gridColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            emptyMessage: 'No Products Found',
            emptyIcon: 'fas fa-inbox'
        },
        
        container: null,
        currentProduct: null,
        
        init: function(options) {
            this.config = Object.assign({}, this.config, options);
            this.container = document.getElementById(this.config.containerId);
            
            if (!this.container) {
                console.error(`Container with id "${this.config.containerId}" not found`);
                return;
            }
            
            this.injectStyles();
            this.createQuickViewModal();
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
                    
                    /* QUICK VIEW - BOTTOM RIGHT (TOGGLE ON HOVER) */
                    .pr-quick-view-btn {
                        position: absolute;
                        bottom: 15px;
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
                        margin-bottom: 8px;
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
                        margin: 0 0 10px 0;
                        line-height: 1.4;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    
                    .pr-description {
                        font-size: 14px;
                        color: #565959;
                        line-height: 1.5;
                        margin: 0;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    
                    /* ============================================
                       QUICK VIEW MODAL - MINIMAL VERSION
                       ============================================ */
                    .pr-modal-overlay {
                        display: none;
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.75);
                        z-index: 10000;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                        backdrop-filter: blur(4px);
                        -webkit-backdrop-filter: blur(4px);
                    }
                    
                    .pr-modal-overlay.active {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        opacity: 1;
                    }
                    
                    .pr-modal {
                        background: white;
                        border-radius: 16px;
                        max-width: 900px;
                        width: 90%;
                        max-height: 85vh;
                        overflow: hidden;
                        position: relative;
                        transform: scale(0.9);
                        transition: transform 0.3s ease;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    }
                    
                    .pr-modal-overlay.active .pr-modal {
                        transform: scale(1);
                    }
                    
                    .pr-modal-close {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: rgba(0, 0, 0, 0.6);
                        border: none;
                        color: white;
                        font-size: 20px;
                        cursor: pointer;
                        z-index: 10;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                    }
                    
                    .pr-modal-close:hover {
                        background: rgba(0, 0, 0, 0.8);
                        transform: scale(1.1);
                    }
                    
                    .pr-modal-content {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        max-height: 85vh;
                        overflow-y: auto;
                    }
                    
                    .pr-modal-image-section {
                        background: #f8f9fa;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 40px;
                        min-height: 400px;
                    }
                    
                    .pr-modal-image {
                        width: 100%;
                        height: auto;
                        max-height: 500px;
                        object-fit: contain;
                        border-radius: 8px;
                    }
                    
                    .pr-modal-image-emoji {
                        font-size: 120px;
                    }
                    
                    .pr-modal-details {
                        padding: 40px;
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    }
                    
                    .pr-modal-category {
                        display: inline-block;
                        color: #007185;
                        font-size: 13px;
                        font-weight: 500;
                        text-transform: capitalize;
                        cursor: pointer;
                        text-decoration: none;
                        transition: color 0.2s;
                    }
                    
                    .pr-modal-category:hover {
                        color: #C45500;
                        text-decoration: underline;
                    }
                    
                    .pr-modal-title {
                        font-size: 28px;
                        font-weight: 700;
                        color: #212529;
                        margin: 0;
                        line-height: 1.3;
                    }
                    
                    .pr-modal-description {
                        font-size: 15px;
                        color: #565959;
                        line-height: 1.7;
                        margin: 0;
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
                        
                        .pr-quick-view-btn {
                            width: 40px;
                            height: 40px;
                            font-size: 16px;
                            bottom: 10px;
                            right: 10px;
                        }
                        
                        .pr-info {
                            padding: 14px;
                        }
                        
                        .pr-category {
                            font-size: 11px;
                            margin-bottom: 6px;
                        }
                        
                        .pr-title {
                            font-size: 14px;
                            margin-bottom: 8px;
                        }
                        
                        .pr-description {
                            font-size: 13px;
                        }
                        
                        /* Modal Responsive */
                        .pr-modal {
                            width: 95%;
                            max-height: 90vh;
                        }
                        
                        .pr-modal-content {
                            grid-template-columns: 1fr;
                        }
                        
                        .pr-modal-image-section {
                            min-height: 300px;
                            padding: 30px 20px;
                        }
                        
                        .pr-modal-image {
                            max-height: 300px;
                        }
                        
                        .pr-modal-image-emoji {
                            font-size: 80px;
                        }
                        
                        .pr-modal-details {
                            padding: 30px 20px;
                            gap: 16px;
                        }
                        
                        .pr-modal-title {
                            font-size: 22px;
                        }
                        
                        .pr-modal-description {
                            font-size: 14px;
                        }
                        
                        .pr-modal-close {
                            top: 15px;
                            right: 15px;
                            width: 36px;
                            height: 36px;
                            font-size: 18px;
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
                            margin-bottom: 6px;
                        }
                        
                        .pr-description {
                            font-size: 12px;
                        }
                        
                        .pr-modal-title {
                            font-size: 20px;
                        }
                        
                        .pr-modal-description {
                            font-size: 13px;
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
        },
        
        createQuickViewModal: function() {
            if (document.getElementById('pr-quick-view-modal')) return;
            
            const modalHTML = `
                <div id="pr-quick-view-modal" class="pr-modal-overlay">
                    <div class="pr-modal">
                        <button class="pr-modal-close" id="pr-modal-close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="pr-modal-content">
                            <div class="pr-modal-image-section" id="pr-modal-image-section"></div>
                            <div class="pr-modal-details" id="pr-modal-details"></div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById('pr-quick-view-modal');
            const closeBtn = document.getElementById('pr-modal-close-btn');
            
            closeBtn.addEventListener('click', () => this.closeQuickView());
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeQuickView();
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.closeQuickView();
                }
            });
        },
        
        openQuickView: function(productId) {
            const product = this.config.products.find(p => p.id == productId);
            if (!product) return;
            
            this.currentProduct = product;
            
            const modal = document.getElementById('pr-quick-view-modal');
            const imageSection = document.getElementById('pr-modal-image-section');
            const detailsSection = document.getElementById('pr-modal-details');
            
            // Generate image content
            let imageContent = '';
            if (product.image && this.isValidURL(product.image)) {
                imageContent = `
                    <img 
                        src="${product.image}" 
                        alt="${product.title}" 
                        class="pr-modal-image"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                    />
                    <div class="pr-modal-image-emoji" style="display: none;">🛒</div>
                `;
            } else if (product.image && product.image.trim() !== '') {
                imageContent = `<div class="pr-modal-image-emoji">${product.image}</div>`;
            } else {
                imageContent = '<div class="pr-modal-image-emoji">🛒</div>';
            }
            
            imageSection.innerHTML = imageContent;
            
            // Generate details content - MINIMAL VERSION
            detailsSection.innerHTML = `
                ${product.category ? `<a href="#" class="pr-modal-category" data-action="modal-category" data-category="${product.category}">${product.category}</a>` : ''}
                <h2 class="pr-modal-title">${product.title}</h2>
                ${product.description ? `<p class="pr-modal-description">${product.description}</p>` : ''}
            `;
            
            // Attach event listeners for category link in modal
            const categoryLink = detailsSection.querySelector('[data-action="modal-category"]');
            if (categoryLink) {
                categoryLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const category = e.currentTarget.dataset.category;
                    this.closeQuickView();
                    if (this.config.onCategoryClick) {
                        this.config.onCategoryClick(category);
                    }
                });
            }
            
            document.body.style.overflow = 'hidden';
            modal.classList.add('active');
            
            if (this.config.onQuickView) {
                this.config.onQuickView(productId);
            }
        },
        
        closeQuickView: function() {
            const modal = document.getElementById('pr-quick-view-modal');
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentProduct = null;
        },
        
        isValidURL: function(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
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
        
        generateCard: function(product) {
            if (!product.title) return '';
            
            const imageContent = this.generateImageContent(product);
            
            return `
                <div class="pr-card" data-product-id="${product.id}" data-category="${product.category || ''}">
                    <div class="pr-image-container">
                        ${imageContent}
                        ${this.config.enableQuickView ? `
                            <button class="pr-quick-view-btn" data-action="quickView" data-product-id="${product.id}" title="Quick View">
                                <i class="fas fa-eye"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="pr-info">
                        ${product.category ? `<a href="#" class="pr-category" data-action="category" data-category="${product.category}">${product.category}</a>` : ''}
                        <h3 class="pr-title">${product.title}</h3>
                        ${product.description ? `<p class="pr-description">${product.description}</p>` : ''}
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
                        case 'quickView':
                            this.openQuickView(productId);
                            break;
                        case 'category':
                            if (this.config.onCategoryClick) {
                                this.config.onCategoryClick(category);
                            }
                            break;
                    }
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
        
        filterByCategory: function(category) {
            if (!category || category === 'all') {
                return this.config.products;
            }
            return this.config.products.filter(p => p.category === category);
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
                case 'name-asc':
                    return sorted.sort((a, b) => a.title.localeCompare(b.title));
                case 'name-desc':
                    return sorted.sort((a, b) => b.title.localeCompare(a.title));
                default:
                    return sorted;
            }
        }
    };
    
    window.ProductRenderer = ProductRenderer;
    
})(window);