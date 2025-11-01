/**
 * ProductRenderer Catalog - Image-Centric Product Display
 * Version: 1.0.0
 * 
 * Features:
 * - Clean catalog layout with focus on product images
 * - Product name, category, and description display
 * - Quick view button in bottom right corner
 * - Responsive grid layout
 * - Touch-friendly mobile controls
 * 
 * CDN Usage:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
 */

(function(window) {
    'use strict';
    
    const ProductCatalog = {
        config: {
            containerId: 'catalogGrid',
            products: [],
            onQuickView: null,
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
        },
        
        injectStyles: function() {
            if (document.getElementById('pc-styles')) return;
            
            const styles = `
                <style id="pc-styles">
                    .pc-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 24px;
                        width: 100%;
                        margin-bottom: 40px;
                    }
                    
                    .pc-empty {
                        grid-column: 1/-1;
                        text-align: center;
                        padding: 60px 20px;
                    }
                    
                    .pc-empty-icon {
                        font-size: 64px;
                        color: #d1d5db;
                        margin-bottom: 20px;
                    }
                    
                    .pc-empty-message {
                        color: #6b7280;
                        font-size: 20px;
                        font-weight: 600;
                        margin: 0;
                    }
                    
                    .pc-card {
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                        border: 1px solid #e5e7eb;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        position: relative;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .pc-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
                    }
                    
                    .pc-image-container {
                        position: relative;
                        width: 100%;
                        height: 280px;
                        background: #f9fafb;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                    }
                    
                    .pc-image {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.3s ease;
                    }
                    
                    .pc-card:hover .pc-image {
                        transform: scale(1.08);
                    }
                    
                    .pc-image-emoji {
                        font-size: 64px;
                    }
                    
                    /* QUICK VIEW - BOTTOM RIGHT */
                    .pc-quick-view-btn {
                        position: absolute;
                        bottom: 16px;
                        right: 16px;
                        width: 48px;
                        height: 48px;
                        border-radius: 24px;
                        background: rgba(0, 0, 0, 0.75);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                        color: white;
                        font-size: 20px;
                        opacity: 0;
                        z-index: 3;
                    }
                    
                    .pc-card:hover .pc-quick-view-btn {
                        opacity: 1;
                    }
                    
                    .pc-quick-view-btn:hover {
                        transform: scale(1.1);
                        background: rgba(0, 0, 0, 0.85);
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
                    }
                    
                    .pc-quick-view-btn:active {
                        transform: scale(1.05);
                    }
                    
                    .pc-info {
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        flex: 1;
                    }
                    
                    /* CATEGORY AS LINK */
                    .pc-category {
                        display: inline-block;
                        color: #6366f1;
                        padding: 0;
                        border: none;
                        background: transparent;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        cursor: pointer;
                        text-decoration: none;
                        transition: color 0.2s;
                    }
                    
                    .pc-category:hover {
                        color: #4f46e5;
                        text-decoration: underline;
                    }
                    
                    .pc-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0;
                        line-height: 1.4;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    
                    .pc-description {
                        font-size: 14px;
                        color: #6b7280;
                        line-height: 1.6;
                        margin: 0;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    
                    /* Desktop Large (≥1200px) - 4 columns */
                    @media (min-width: 1200px) {
                        .pc-grid {
                            grid-template-columns: repeat(4, 1fr);
                            gap: 24px;
                        }
                    }
                    
                    /* Desktop (992px-1199px) - 3 columns */
                    @media (min-width: 992px) and (max-width: 1199px) {
                        .pc-grid {
                            grid-template-columns: repeat(3, 1fr);
                            gap: 20px;
                        }
                    }
                    
                    /* Tablet (769px-991px) - 2 columns */
                    @media (min-width: 769px) and (max-width: 991px) {
                        .pc-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 18px;
                        }
                        
                        .pc-image-container {
                            height: 240px;
                        }
                    }
                    
                    /* Mobile (≤768px) - 2 columns */
                    @media (max-width: 768px) {
                        .pc-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 14px;
                        }
                        
                        .pc-image-container {
                            height: 180px;
                        }
                        
                        .pc-image-emoji {
                            font-size: 48px;
                        }
                        
                        .pc-quick-view-btn {
                            width: 42px;
                            height: 42px;
                            font-size: 18px;
                            bottom: 12px;
                            right: 12px;
                        }
                        
                        .pc-info {
                            padding: 14px;
                            gap: 6px;
                        }
                        
                        .pc-category {
                            font-size: 11px;
                        }
                        
                        .pc-title {
                            font-size: 15px;
                        }
                        
                        .pc-description {
                            font-size: 13px;
                            -webkit-line-clamp: 2;
                        }
                    }
                    
                    /* Small Mobile (≤480px) - 1 column */
                    @media (max-width: 480px) {
                        .pc-grid {
                            grid-template-columns: 1fr;
                            gap: 16px;
                        }
                        
                        .pc-image-container {
                            height: 240px;
                        }
                        
                        .pc-image-emoji {
                            font-size: 64px;
                        }
                        
                        .pc-info {
                            padding: 18px;
                            gap: 8px;
                        }
                        
                        .pc-title {
                            font-size: 18px;
                        }
                        
                        .pc-description {
                            font-size: 14px;
                            -webkit-line-clamp: 3;
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
        
        generateImageContent: function(product) {
            if (product.image && this.isValidURL(product.image)) {
                return `
                    <img 
                        src="${product.image}" 
                        alt="${product.title}" 
                        class="pc-image"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                    />
                    <div class="pc-image-emoji" style="display: none;">🛍️</div>
                `;
            } else if (product.image && product.image.trim() !== '') {
                return `<div class="pc-image-emoji">${product.image}</div>`;
            } else {
                return '<div class="pc-image-emoji">🛍️</div>';
            }
        },
        
        generateCard: function(product) {
            if (!product.title) return '';
            
            const imageContent = this.generateImageContent(product);
            const description = product.description || '';
            
            return `
                <div class="pc-card" data-product-id="${product.id}" data-category="${product.category || ''}">
                    <div class="pc-image-container">
                        ${imageContent}
                        <button class="pc-quick-view-btn" data-action="quickView" data-product-id="${product.id}" title="Quick View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="pc-info">
                        ${product.category ? `<a href="#" class="pc-category" data-action="category" data-category="${product.category}">${product.category}</a>` : ''}
                        <h3 class="pc-title">${product.title}</h3>
                        ${description ? `<p class="pc-description">${description}</p>` : ''}
                    </div>
                </div>
            `;
        },
        
        generateEmptyState: function() {
            return `
                <div class="pc-empty">
                    <div class="pc-empty-icon">
                        <i class="${this.config.emptyIcon}"></i>
                    </div>
                    <h3 class="pc-empty-message">${this.config.emptyMessage}</h3>
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
                            if (this.config.onQuickView) {
                                this.config.onQuickView(productId);
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
        },
        
        render: function(productsToRender) {
            if (!this.container) {
                console.error('Container not initialized. Call init() first.');
                return;
            }
            
            const products = productsToRender || this.config.products;
            
            this.container.innerHTML = '';
            
            if (!this.container.classList.contains('pc-grid')) {
                this.container.classList.add('pc-grid');
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
                case 'category':
                    return sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
                default:
                    return sorted;
            }
        }
    };
    
    window.ProductCatalog = ProductCatalog;
    
})(window);