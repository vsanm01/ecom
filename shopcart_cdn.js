/**
 * ShopCart.js v1.0.0
 * A simple, dependency-free shopping cart library
 * (c) 2025
 * MIT License
 */

(function(global) {
    'use strict';

    class ShopCart {
        constructor(options = {}) {
            this.cart = [];
            this.products = [];
            this.options = {
                currency: options.currency || '$',
                locale: options.locale || 'en-US',
                onCartUpdate: options.onCartUpdate || null,
                onNotification: options.onNotification || null,
                selectors: {
                    cartItems: options.selectors?.cartItems || '#cartItems',
                    cartCount: options.selectors?.cartCount || '#cartCount',
                    cartTotal: options.selectors?.cartTotal || '#cartTotal',
                    cartSidebar: options.selectors?.cartSidebar || '#cartSidebar',
                    wishlistSidebar: options.selectors?.wishlistSidebar || '#wishlistSidebar'
                }
            };

            // Load cart from localStorage if available
            this.loadCart();
        }

        // Initialize with products
        setProducts(products) {
            this.products = products;
        }

        // Format price
        formatPrice(price) {
            return this.options.currency + price.toFixed(2);
        }

        // Check if URL is valid
        isValidURL(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        }

        // Show notification
        showNotification(type, message) {
            if (this.options.onNotification) {
                this.options.onNotification(type, message);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }

        // Get element
        $(selector) {
            return document.querySelector(selector);
        }

        // Get all elements
        $$(selector) {
            return document.querySelectorAll(selector);
        }

        // Add to cart
        addToCart(productId, quantity = 1) {
            const product = this.products.find(p => p.id === productId);
            
            if (!product) {
                this.showNotification('error', 'Product not found');
                return false;
            }
            
            if (product.stock <= 0) {
                this.showNotification('warning', 'Product is out of stock');
                return false;
            }
            
            const existingItem = this.cart.find(item => item.id === productId);
            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > product.stock) {
                    this.showNotification('warning', `Maximum stock reached (${product.stock} available)`);
                    existingItem.quantity = product.stock;
                } else {
                    existingItem.quantity = newQuantity;
                }
            } else {
                this.cart.push({...product, quantity: Math.min(quantity, product.stock)});
            }
            
            this.saveCart();
            this.updateCartUI();
            this.showNotification('success', `${product.title} added to cart!`);
            return true;
        }

        // Remove from cart
        removeFromCart(productId) {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.saveCart();
            this.updateCartUI();
            this.showNotification('info', 'Item removed from cart');
        }

        // Update quantity
        updateQuantity(productId, change) {
            const product = this.products.find(p => p.id === productId);
            const cartItem = this.cart.find(item => item.id === productId);
            
            if (!product || !cartItem) {
                this.showNotification('error', 'Product not found');
                return;
            }
            
            const newQuantity = cartItem.quantity + change;
            
            if (newQuantity < 0) {
                this.showNotification('warning', 'Quantity cannot be negative');
                return;
            }
            
            if (newQuantity === 0) {
                if (confirm('Remove this item from cart?')) {
                    this.removeFromCart(productId);
                }
                return;
            }
            
            if (newQuantity > product.stock) {
                this.showNotification('warning', `Maximum stock reached (${product.stock} available)`);
                return;
            }
            
            cartItem.quantity = newQuantity;
            this.saveCart();
            this.updateCartUI();
            
            if (change > 0) {
                this.showNotification('success', 'Quantity increased');
            } else {
                this.showNotification('info', 'Quantity decreased');
            }
        }

        // Set quantity
        setQuantity(productId, value) {
            const product = this.products.find(p => p.id === productId);
            const cartItem = this.cart.find(item => item.id === productId);
            
            if (!product || !cartItem) {
                this.showNotification('error', 'Product not found');
                return;
            }
            
            let quantity = parseInt(value);
            
            if (isNaN(quantity) || quantity < 0) {
                this.showNotification('warning', 'Please enter a valid quantity');
                this.updateCartUI();
                return;
            }
            
            if (quantity === 0) {
                if (confirm('Remove this item from cart?')) {
                    this.removeFromCart(productId);
                } else {
                    this.updateCartUI();
                }
                return;
            }
            
            if (quantity > product.stock) {
                this.showNotification('warning', `Only ${product.stock} items available`);
                cartItem.quantity = product.stock;
            } else {
                cartItem.quantity = quantity;
            }
            
            this.saveCart();
            this.updateCartUI();
        }

        // Update cart UI
        updateCartUI() {
            const cartItems = this.$(this.options.selectors.cartItems);
            const cartCount = this.$(this.options.selectors.cartCount);
            const cartTotal = this.$(this.options.selectors.cartTotal);
            
            if (!cartItems) return;
            
            cartItems.innerHTML = '';
            
            if (this.cart.length === 0) {
                cartItems.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 50px 20px;">Your cart is empty</p>';
                if (cartCount) cartCount.textContent = '0';
                if (cartTotal) cartTotal.textContent = this.formatPrice(0);
                
                if (this.options.onCartUpdate) {
                    this.options.onCartUpdate(this.cart, 0, 0);
                }
                return;
            }
            
            let total = 0;
            let itemCount = 0;
            
            this.cart.forEach(item => {
                const product = this.products.find(p => p.id === item.id);
                const stock = product ? product.stock : 0;
                const itemSubtotal = item.price * item.quantity;
                total += itemSubtotal;
                itemCount += item.quantity;
                
                let itemImageContent;
                if (item.image && this.isValidURL(item.image)) {
                    itemImageContent = `<img src="${item.image}" alt="${item.title}" />`;
                } else if (item.image && item.image.trim() !== '') {
                    itemImageContent = item.image;
                } else {
                    itemImageContent = '🛒';
                }
                
                let stockClass = 'stock-available';
                let stockText = `${stock} available`;
                if (stock <= 0) {
                    stockClass = 'stock-out';
                    stockText = 'Out of stock';
                } else if (stock <= 5) {
                    stockClass = 'stock-low';
                    stockText = `Only ${stock} left`;
                }
                
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.dataset.itemId = item.id;
                cartItem.innerHTML = `
                    <div class="cart-item-image">${itemImageContent}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                        
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="decrease" data-product-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${item.quantity}" 
                                   min="0" max="${stock}" 
                                   data-product-id="${item.id}">
                            <button class="quantity-btn" data-action="increase" data-product-id="${item.id}" ${item.quantity >= stock ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <div class="item-subtotal">
                            Subtotal: <strong>${this.formatPrice(itemSubtotal)}</strong>
                        </div>
                        
                        <div class="stock-status ${stockClass}">
                            ${stockText}
                        </div>
                        
                        <button class="remove-btn" data-product-id="${item.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; margin-top: 8px;">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                `;
                
                cartItems.appendChild(cartItem);
            });
            
            if (cartCount) cartCount.textContent = itemCount;
            if (cartTotal) cartTotal.textContent = this.formatPrice(total);
            
            // Attach event listeners
            this.attachCartEventListeners();
            
            if (this.options.onCartUpdate) {
                this.options.onCartUpdate(this.cart, total, itemCount);
            }
        }

        // Attach event listeners to cart items
        attachCartEventListeners() {
            // Quantity buttons
            this.$$('.quantity-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = btn.dataset.productId;
                    const action = btn.dataset.action;
                    const change = action === 'increase' ? 1 : -1;
                    this.updateQuantity(productId, change);
                });
            });

            // Quantity inputs
            this.$$('.quantity-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const productId = input.dataset.productId;
                    this.setQuantity(productId, input.value);
                });
            });

            // Remove buttons
            this.$$('.remove-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = btn.dataset.productId;
                    this.removeFromCart(productId);
                });
            });
        }

        // Toggle cart
        toggleCart() {
            const cartSidebar = this.$(this.options.selectors.cartSidebar);
            const wishlistSidebar = this.$(this.options.selectors.wishlistSidebar);
            
            if (wishlistSidebar) {
                wishlistSidebar.classList.remove('active');
            }
            
            if (cartSidebar) {
                cartSidebar.classList.toggle('active');
                
                if (cartSidebar.classList.contains('active')) {
                    this.showOverlay();
                } else {
                    this.hideOverlay();
                }
            }
        }

        // Close cart
        closeCart() {
            const cartSidebar = this.$(this.options.selectors.cartSidebar);
            if (cartSidebar) {
                cartSidebar.classList.remove('active');
            }
            this.hideOverlay();
        }

        // Show overlay
        showOverlay() {
            if (!this.$('.shopcart-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'shopcart-overlay';
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1500;';
                overlay.addEventListener('click', () => this.closeCart());
                document.body.appendChild(overlay);
            }
        }

        // Hide overlay
        hideOverlay() {
            const overlay = this.$('.shopcart-overlay');
            if (overlay) {
                overlay.remove();
            }
        }

        // Get cart data
        getCart() {
            return this.cart;
        }

        // Get cart total
        getCartTotal() {
            return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        }

        // Get cart count
        getCartCount() {
            return this.cart.reduce((count, item) => count + item.quantity, 0);
        }

        // Clear cart
        clearCart() {
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            this.showNotification('info', 'Cart cleared');
        }

        // Save cart to localStorage
        saveCart() {
            try {
                localStorage.setItem('shopcart_items', JSON.stringify(this.cart));
            } catch (e) {
                console.warn('Could not save cart to localStorage:', e);
            }
        }

        // Load cart from localStorage
        loadCart() {
            try {
                const saved = localStorage.getItem('shopcart_items');
                if (saved) {
                    this.cart = JSON.parse(saved);
                }
            } catch (e) {
                console.warn('Could not load cart from localStorage:', e);
            }
        }
    }

    // Export for different module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ShopCart;
    } else if (typeof define === 'function' && define.amd) {
        define(function() { return ShopCart; });
    } else {
        global.ShopCart = ShopCart;
    }

})(typeof window !== 'undefined' ? window : this);
