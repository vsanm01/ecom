// ============================================
// PRODUCT FETCHER LIBRARY USAGE EXAMPLE
// ============================================

// STEP 1: Include required CDN libraries in your HTML
/*
<script src='https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js'></script>
<script src='https://cdn.jsdelivr.net/gh/vsanm01/ecom@main/secure_api_cdn.js'></script>
<script src='https://cdn.jsdelivr.net/gh/vsanm01/ecom@main/gdrive-image-handler-cdn.js'></script>
<script src='https://cdn.jsdelivr.net/gh/vsanm01/ecom@main/product-fetcher-cdn.js'></script>
*/

// STEP 2: Configure GSRCDN (as before)
const GSRCDN_CONFIG = {
    scriptUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    apiToken: 'your_api_token',
    hmacSecret: 'your_hmac_secret',
    rateLimitEnabled: true,
    maxRequests: 100,
    debug: true
};

GSRCDN.configure(GSRCDN_CONFIG);

// STEP 3: Initialize Product Fetcher
ProductFetcher.init({
    sheetName: 'products',
    imageSize: 400,
    placeholderImage: 'https://via.placeholder.com/300x300?text=No+Image',
    autoCalculateOriginalPrice: true,
    priceMarkupPercent: 30,
    onSuccess: (products) => {
        console.log('✅ Products loaded:', products.length);
        renderProducts(products);
        renderCategories();
    },
    onError: (error) => {
        console.error('❌ Error loading products:', error);
        showNotification('error', 'Failed to load products');
    }
});

// STEP 4: Fetch products
async function fetchProductsFromSheet() {
    return await ProductFetcher.fetch();
}

// ============================================
// USAGE EXAMPLES
// ============================================

// Get all products
function getAllProducts() {
    return ProductFetcher.getAll();
}

// Get product by ID
function getProductById(productId) {
    return ProductFetcher.getById(productId);
}

// Filter by category
function filterByCategory(category) {
    const filtered = ProductFetcher.filterByCategory(category);
    renderProducts(filtered);
}

// Search products
function searchProducts() {
    const query = $('#searchInput').val();
    const results = ProductFetcher.search(query);
    renderProducts(results);
    showNotification('info', 'Found ' + results.length + ' results');
}

// Apply multiple filters
function applyFilters() {
    const priceRange = $('#priceFilter').val();
    const sortBy = $('#sortFilter').val();
    const minPrice = parseFloat($('#minPrice').val()) || 0;
    const maxPrice = parseFloat($('#maxPrice').val()) || Infinity;
    
    let filters = {
        category: currentCategory !== 'all' ? currentCategory : undefined,
        minPrice: minPrice,
        maxPrice: maxPrice,
        minStock: 1
    };
    
    // Parse price range filter
    if (priceRange === '0-50') {
        filters.maxPrice = 50;
    } else if (priceRange === '50-100') {
        filters.minPrice = 50;
        filters.maxPrice = 100;
    } else if (priceRange === '100-200') {
        filters.minPrice = 100;
        filters.maxPrice = 200;
    } else if (priceRange === '200+') {
        filters.minPrice = 200;
    }
    
    // Apply sorting
    if (sortBy === 'price-low') {
        filters.sortBy = 'price';
        filters.sortOrder = 'asc';
    } else if (sortBy === 'price-high') {
        filters.sortBy = 'price';
        filters.sortOrder = 'desc';
    } else if (sortBy === 'rating') {
        filters.sortBy = 'rating';
        filters.sortOrder = 'desc';
    } else if (sortBy === 'newest') {
        filters.sortBy = 'createdAt';
        filters.sortOrder = 'desc';
    }
    
    const filtered = ProductFetcher.applyFilters(filters);
    renderProducts(filtered);
}

// Get all categories for filter
function renderCategories() {
    const categoryList = $('#categoryList');
    const categories = ['all', ...ProductFetcher.getCategories()];
    
    categoryList.empty();
    categories.forEach(category => {
        const categoryItem = $('<div></div>')
            .addClass('category-item')
            .text(category === 'all' ? 'All Products' : category)
            .toggleClass('active', category === currentCategory)
            .on('click', function() {
                currentCategory = category;
                filterByCategory(category);
            });
        categoryList.append(categoryItem);
    });
}

// Get featured products
function getFeaturedProducts() {
    return ProductFetcher.getFeatured();
}

// Sort products
function sortProducts(field, order) {
    const sorted = ProductFetcher.sortBy(field, order);
    renderProducts(sorted);
}

// Get product count
function getProductCount() {
    return ProductFetcher.getCount();
}

// Filter by price range
function filterByPriceRange(min, max) {
    const filtered = ProductFetcher.filterByPriceRange(min, max);
    renderProducts(filtered);
}

// Filter by stock
function getInStockProducts() {
    const inStock = ProductFetcher.filterByStock(1);
    renderProducts(inStock);
}

// Quick view using the library
function quickView(productId) {
    const product = ProductFetcher.getById(productId);
    
    if (!product) {
        showNotification('error', 'Product not found');
        return;
    }
    
    const isInWishlist = wishlist.some(item => item.id === product.id);
    
    let imageContent;
    if (product.image && isValidURL(product.image)) {
        imageContent = '<img src="' + product.image + '" alt="' + product.title + '" class="glightbox-trigger" data-image="' + product.image + '" data-title="' + product.title + '" data-description="₹' + product.price.toFixed(2) + '" />';
    } else {
        imageContent = '🛒';
    }
    
    const modalContent = `
        <div class="quick-view-content">
            <div class="quick-view-image">${imageContent}</div>
            <div class="quick-view-info">
                <div class="quick-view-category">${product.category}</div>
                <h2>${product.title}</h2>
                <div class="quick-view-rating">
                    <div class="stars">${generateStars(product.rating)}</div>
                    <span class="rating-count">(${product.reviews} reviews)</span>
                </div>
                <div class="quick-view-price">
                    <span class="price-current">₹${product.price.toFixed(2)}</span>
                    <span class="price-original">₹${product.originalPrice.toFixed(2)}</span>
                    <span style="background: #fef3c7; color: #d97706; padding: 5px 10px; border-radius: 5px; font-weight: 600; font-size: 14px;">SAVE ${product.discount}%</span>
                </div>
                <div class="quick-view-description">
                    <p>${product.description || 'Experience premium quality with this exceptional product.'}</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <span style="color: ${product.stock > 10 ? '#10b981' : product.stock > 0 ? '#f59e0b' : '#ef4444'}; font-weight: 600;">
                        <i class="fas fa-box"></i> 
                        ${product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Only ' + product.stock + ' left!' : 'Out of Stock'}
                    </span>
                </div>
                <div class="quick-view-actions">
                    <button class="btn btn-primary" onclick="addToCart('${product.id}'); closeModal();" style="flex: 1; padding: 15px;">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="action-icon ${isInWishlist ? 'wishlist-active' : ''}" onclick="toggleWishlist('${product.id}')" style="padding: 15px 20px; font-size: 18px; position: static; opacity: 1;">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    $('#quickViewBody').html(modalContent);
    $('#quickViewModal').addClass('show');
    
    setTimeout(initGLightbox, 100);
}

// Initialize on document ready
$(document).ready(async function() {
    // Show loading state
    $('#productsGrid').html('<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 48px; color: var(--primary-color);"></i><p style="color: #6b7280; margin-top: 20px;">Loading products...</p></div>');
    
    // Fetch products using the library
    await fetchProductsFromSheet();
    
    // Update UI
    updateCartUI();
    updateWishlistUI();
    initGLightbox();
});
