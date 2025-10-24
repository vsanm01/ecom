// ============================================
// ENHANCED GLIGHTBOX WRAPPER LIBRARY
// ============================================

const EnhancedLightbox = {
    instance: null,
    
    // Configuration
    config: {
        selector: '.glightbox-trigger',
        openEffect: 'zoom',
        closeEffect: 'fade',
        closeButton: true,
        touchNavigation: true,
        keyboardNavigation: true,
        loop: true,
        zoomable: true,
        draggable: true,
        dragToleranceX: 50,
        dragToleranceY: 50,
        skin: 'clean',
        closeOnOutsideClick: true,
        
        // E-commerce specific
        moreText: 'See more',
        moreLength: 60,
        slideEffect: 'slide',
        
        // Custom callbacks
        onOpen: function() {
            console.log('Lightbox opened');
        },
        onClose: function() {
            console.log('Lightbox closed');
        },
        beforeSlideChange: function(prevSlide, currentSlide) {
            console.log('Slide changing from', prevSlide, 'to', currentSlide);
        },
        afterSlideChange: function(prevSlide, currentSlide) {
            console.log('Slide changed');
        }
    },
    
    // Initialize GLightbox
    init: function(customConfig = {}) {
        // Merge custom config with defaults
        const finalConfig = { ...this.config, ...customConfig };
        
        // Initialize GLightbox
        if (typeof GLightbox !== 'undefined') {
            this.instance = GLightbox(finalConfig);
            console.log('✅ Enhanced GLightbox initialized');
            return this.instance;
        } else {
            console.error('❌ GLightbox library not found');
            return null;
        }
    },
    
    // Open single image
    openImage: function(imageUrl, title = '', description = '') {
        if (!this.instance) {
            this.init();
        }
        
        const lightbox = GLightbox({
            elements: [{
                href: imageUrl,
                type: 'image',
                title: title,
                description: description
            }],
            ...this.config
        });
        
        lightbox.open();
    },
    
    // Open product gallery
    openGallery: function(images) {
        if (!this.instance) {
            this.init();
        }
        
        const elements = images.map(img => ({
            href: img.url || img,
            type: 'image',
            title: img.title || '',
            description: img.description || ''
        }));
        
        const lightbox = GLightbox({
            elements: elements,
            ...this.config
        });
        
        lightbox.open();
    },
    
    // Open product with zoom
    openProductZoom: function(product) {
        const images = [];
        
        // Main image
        if (product.image) {
            images.push({
                url: product.image,
                title: product.title,
                description: `
                    <div class="lightbox-product-info">
                        <h3>${product.title}</h3>
                        <p class="price">₹${product.price}</p>
                        <p class="category">${product.category}</p>
                    </div>
                `
            });
        }
        
        // Additional images
        if (product.gallery && product.gallery.length > 0) {
            product.gallery.forEach(img => {
                images.push({
                    url: img,
                    title: product.title,
                    description: ''
                });
            });
        }
        
        this.openGallery(images);
    },
    
    // Refresh/reinitialize lightbox
    refresh: function() {
        if (this.instance) {
            this.instance.reload();
            console.log('🔄 GLightbox refreshed');
        }
    },
    
    // Destroy instance
    destroy: function() {
        if (this.instance) {
            this.instance.destroy();
            this.instance = null;
            console.log('🗑️ GLightbox destroyed');
        }
    }
};

// ============================================
// PRODUCT IMAGE HANDLER WITH GLIGHTBOX
// ============================================

const ProductImageHandler = {
    // View single product image
    viewImage: function(imageUrl, productTitle = '') {
        EnhancedLightbox.openImage(
            imageUrl,
            productTitle,
            `<div class="lightbox-actions">
                <button onclick="addToCart()">Add to Cart</button>
                <button onclick="toggleWishlist()">Add to Wishlist</button>
            </div>`
        );
    },
    
    // View product gallery
    viewGallery: function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        EnhancedLightbox.openProductZoom(product);
    },
    
    // Quick view with image zoom
    quickViewWithZoom: function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        // Open quick view modal first
        ProductQuickView.show(productId);
        
        // Add zoom handler to modal image
        setTimeout(() => {
            const modalImage = document.querySelector('#quickViewModal .quick-view-image img');
            if (modalImage) {
                modalImage.style.cursor = 'zoom-in';
                modalImage.onclick = function() {
                    EnhancedLightbox.openProductZoom(product);
                };
            }
        }, 100);
    }
};

// ============================================
// AUTO-INITIALIZE ON DOCUMENT READY
// ============================================

$(document).ready(function() {
    // Initialize Enhanced Lightbox
    EnhancedLightbox.init({
        // Custom configuration for your theme
        skin: 'clean',
        closeButton: true,
        touchNavigation: true,
        keyboardNavigation: true,
        loop: true,
        zoomable: true,
        draggable: true,
        closeOnOutsideClick: true,
        
        // Callbacks
        onOpen: function() {
            console.log('Product image viewer opened');
        },
        onClose: function() {
            console.log('Product image viewer closed');
        }
    });
    
    // Add click handlers to product images
    $('.product-image img').each(function() {
        const img = $(this);
        const imageUrl = img.attr('src') || img.data('image');
        const productTitle = img.closest('.product-card').find('.product-title').text();
        
        // Make images zoomable
        img.addClass('glightbox-trigger');
        img.attr('data-glightbox', 'title: ' + productTitle);
        img.css('cursor', 'zoom-in');
        
        // Add click handler
        img.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            ProductImageHandler.viewImage(imageUrl, productTitle);
        });
    });
    
    console.log('✅ Enhanced GLightbox initialized with product images');
});

// ============================================
// GLOBAL HELPER FUNCTIONS
// ============================================

// View product image (called from HTML)
function viewProductImage(imageUrl, title = '') {
    ProductImageHandler.viewImage(imageUrl, title);
}

// View product gallery (called from HTML)
function viewProductGallery(productId) {
    ProductImageHandler.viewGallery(productId);
}

// Quick view with zoom (called from HTML)
function quickViewWithImageZoom(productId) {
    ProductImageHandler.quickViewWithZoom(productId);
}

// Refresh lightbox (useful after dynamic content updates)
function refreshLightbox() {
    EnhancedLightbox.refresh();
}

// ============================================
// CUSTOM STYLES FOR ENHANCED LIGHTBOX
// ============================================

const customStyles = `
<style>
/* Enhanced GLightbox Styles */
.glightbox-container {
    z-index: 9999 !important;
}

.gslide-image img {
    max-width: 95vw !important;
    max-height: 95vh !important;
    width: auto !important;
    height: auto !important;
    object-fit: contain !important;
}

.gslide-media {
    max-width: 95vw !important;
    max-height: 95vh !important;
}

.glightbox-container .gslide-description {
    background: rgba(0, 0, 0, 0.9) !important;
    padding: 25px !important;
    font-size: 16px !important;
    border-top: 2px solid var(--primary-color);
}

.glightbox-container .gslide-title {
    font-size: 24px !important;
    font-weight: 600 !important;
    margin-bottom: 15px !important;
    color: white !important;
}

.lightbox-product-info {
    color: white;
    text-align: center;
}

.lightbox-product-info h3 {
    font-size: 22px;
    margin-bottom: 10px;
    color: white;
}

.lightbox-product-info .price {
    font-size: 28px;
    font-weight: bold;
    color: var(--success-color);
    margin: 10px 0;
}

.lightbox-product-info .category {
    font-size: 14px;
    color: #ddd;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.lightbox-actions {
    margin-top: 20px;
    display: flex;
    gap: 15px;
    justify-content: center;
}

.lightbox-actions button {
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.lightbox-actions button:first-child {
    background: var(--success-color);
    color: white;
}

.lightbox-actions button:last-child {
    background: var(--danger-color);
    color: white;
}

.lightbox-actions button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* Product image cursor */
.product-image img {
    cursor: zoom-in !important;
    transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
    transform: scale(1.05);
}

/* Loading spinner for images */
.gloader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .gslide-image img {
        max-width: 98vw !important;
        max-height: 90vh !important;
    }
    
    .glightbox-container .gslide-description {
        padding: 15px !important;
        font-size: 14px !important;
    }
    
    .glightbox-container .gslide-title {
        font-size: 18px !important;
    }
    
    .lightbox-actions {
        flex-direction: column;
    }
    
    .lightbox-actions button {
        width: 100%;
    }
}

/* Zoom animation */
.gslide.zoomed .gslide-image img {
    cursor: zoom-out !important;
}

/* Navigation arrows styling */
.gnext, .gprev {
    background: rgba(0, 0, 0, 0.7) !important;
    width: 50px !important;
    height: 50px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.3s !important;
}

.gnext:hover, .gprev:hover {
    background: var(--primary-color) !important;
    transform: scale(1.1) !important;
}

/* Close button styling */
.gclose {
    background: rgba(0, 0, 0, 0.7) !important;
    width: 45px !important;
    height: 45px !important;
    border-radius: 50% !important;
    transition: all 0.3s !important;
}

.gclose:hover {
    background: var(--danger-color) !important;
    transform: rotate(90deg) scale(1.1) !important;
}
</style>
`;

// Inject custom styles
$('head').append(customStyles);

console.log('✅ Enhanced GLightbox configuration loaded');
