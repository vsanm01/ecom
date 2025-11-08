/**
 * ShopCart.js v1.1.0
 * Enhanced shopping cart library with order placement and POS billing
 * (c) 2025
 * MIT License
 */

(function(global) {
    'use strict';

    class ShopCart {
        constructor(options = {}) {
            this.cart = [];
            this.products = [];
            this.tempEdits = new Map();
            this.options = {
                currency: options.currency || '$',
                locale: options.locale || 'en-US',
                primaryColor: options.primaryColor || '#2596be',
                onCartUpdate: options.onCartUpdate || null,
                onNotification: options.onNotification || null,
                onUnsavedChanges: options.onUnsavedChanges || null,
                onOrderPlaced: options.onOrderPlaced || null,
                whatsappNumber: options.whatsappNumber || '',
                storeName: options.storeName || 'My Store',
                selectors: {
                    cartItems: options.selectors?.cartItems || '#cartItems',
                    cartCount: options.selectors?.cartCount || '#cartCount',
                    cartTotal: options.selectors?.cartTotal || '#cartTotal',
                    cartSidebar: options.selectors?.cartSidebar || '#cartSidebar',
                    wishlistSidebar: options.selectors?.wishlistSidebar || '#wishlistSidebar'
                }
            };

            this.loadCart();
            this.injectStyles();
        }

        injectStyles() {
            if (document.getElementById('shopcart-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'shopcart-styles';
            style.textContent = `
                .quantity-btn, .save-qty-btn, .cancel-qty-btn, .remove-btn {
                    transition: all 0.3s ease;
                }
                
                .quantity-btn {
                    background: #e5e7eb;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    color: #374151;
                }
                
                .quantity-btn:hover:not(:disabled) {
                    background: #d1d5db;
                }
                
                .quantity-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                
                .save-qty-btn {
                    background: ${this.options.primaryColor};
                    color: white;
                    border: none;
                    padding: 6px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 13px;
                    margin-left: 8px;
                }
                
                .save-qty-btn:hover {
                    background: ${this.adjustColor(this.options.primaryColor, -20)};
                }
                
                .cancel-qty-btn {
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 13px;
                    margin-left: 4px;
                }
                
                .cancel-qty-btn:hover {
                    background: #4b5563;
                }
                
                .remove-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    margin-top: 8px;
                    font-size: 14px;
                }
                
                .remove-btn:hover {
                    color: #dc2626;
                }
                
                .quantity-input {
                    width: 50px;
                    text-align: center;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 4px;
                    font-size: 14px;
                    margin: 0 4px;
                }
                
                .quantity-input:focus {
                    outline: none;
                    border-color: ${this.options.primaryColor};
                }
                
                .quantity-controls {
                    display: flex;
                    align-items: center;
                    margin-top: 8px;
                    flex-wrap: wrap;
                    gap: 4px;
                }
                
                .item-edited {
                    background: #fef3c7;
                    border-left: 3px solid #f59e0b;
                    padding-left: 8px;
                }
                
                .unsaved-badge {
                    background: #f59e0b;
                    color: white;
                    font-size: 11px;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-weight: 600;
                    margin-left: 8px;
                }
                
                .cart-item {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    border-bottom: 1px solid #e5e7eb;
                    transition: background 0.2s;
                }
                
                .cart-item-image {
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    overflow: hidden;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f3f4f6;
                    font-size: 32px;
                }
                
                .cart-item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .cart-item-info {
                    flex: 1;
                }
                
                .cart-item-title {
                    font-weight: 600;
                    font-size: 15px;
                    margin-bottom: 4px;
                    color: #111827;
                }
                
                .cart-item-price {
                    color: #6b7280;
                    font-size: 14px;
                    margin-bottom: 8px;
                }
                
                .item-subtotal {
                    font-size: 14px;
                    color: #374151;
                    margin-top: 8px;
                }
                
                .stock-status {
                    font-size: 12px;
                    margin-top: 6px;
                }
                
                .stock-available {
                    color: #059669;
                }
                
                .stock-low {
                    color: #d97706;
                    font-weight: 600;
                }
                
                .stock-out {
                    color: #dc2626;
                    font-weight: 600;
                }
                
                .shopcart-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 9999;
                    min-width: 300px;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .notification-success {
                    border-left: 4px solid #10b981;
                }
                
                .notification-error {
                    border-left: 4px solid #ef4444;
                }
                
                .notification-warning {
                    border-left: 4px solid #f59e0b;
                }
                
                .notification-info {
                    border-left: 4px solid ${this.options.primaryColor};
                }
                
                /* Checkout Modal */
                .checkout-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .checkout-modal {
                    background: white;
                    border-radius: 12px;
                    padding: 32px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
                    animation: scaleIn 0.3s ease;
                }
                
                @keyframes scaleIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                .checkout-modal h2 {
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    color: #111827;
                }
                
                .checkout-modal p {
                    margin: 0 0 24px 0;
                    color: #6b7280;
                    font-size: 15px;
                }
                
                .checkout-options {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .checkout-option-btn {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 16px;
                }
                
                .checkout-option-btn:hover {
                    border-color: ${this.options.primaryColor};
                    background: #f9fafb;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .checkout-option-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    flex-shrink: 0;
                }
                
                .whatsapp-icon {
                    background: #25D366;
                    color: white;
                }
                
                .pos-icon {
                    background: #6366f1;
                    color: white;
                }
                
                .checkout-option-content {
                    flex: 1;
                    text-align: left;
                }
                
                .checkout-option-title {
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 4px;
                }
                
                .checkout-option-desc {
                    font-size: 13px;
                    color: #6b7280;
                }
                
                .modal-close-btn {
                    margin-top: 16px;
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    background: white;
                    color: #374151;
                    cursor: pointer;
                    font-size: 15px;
                    transition: all 0.2s;
                }
                
                .modal-close-btn:hover {
                    background: #f3f4f6;
                }
                
                /* POS Receipt */
                .pos-receipt-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 2500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                }
                
                .pos-receipt {
                    background: white;
                    width: 400px;
                    max-width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    border-radius: 8px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                    font-family: 'Courier New', monospace;
                }
                
                .pos-receipt-content {
                    padding: 30px;
                }
                
                .pos-header {
                    text-align: center;
                    border-bottom: 2px dashed #000;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                
                .pos-store-name {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                
                .pos-receipt-title {
                    font-size: 18px;
                    margin-bottom: 12px;
                }
                
                .pos-date {
                    font-size: 12px;
                    color: #666;
                }
                
                .pos-items {
                    margin-bottom: 20px;
                }
                
                .pos-item {
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .pos-item-name {
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                
                .pos-item-details {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                }
                
                .pos-totals {
                    border-top: 2px dashed #000;
                    padding-top: 16px;
                    margin-top: 16px;
                }
                
                .pos-total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                
                .pos-total-row.grand-total {
                    font-size: 18px;
                    font-weight: bold;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 2px solid #000;
                }
                
                .pos-footer {
                    text-align: center;
                    margin-top: 24px;
                    padding-top: 20px;
                    border-top: 2px dashed #000;
                    font-size: 12px;
                    color: #666;
                }
                
                .pos-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }
                
                .pos-btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                
                .pos-btn-print {
                    background: ${this.options.primaryColor};
                    color: white;
                }
                
                .pos-btn-print:hover {
                    background: ${this.adjustColor(this.options.primaryColor, -20)};
                }
                
                .pos-btn-close {
                    background: #6b7280;
                    color: white;
                }
                
                .pos-btn-close:hover {
                    background: #4b5563;
                }
                
                @media print {
                    .pos-receipt-container {
                        background: white;
                        position: static;
                    }
                    
                    .pos-receipt {
                        box-shadow: none;
                        max-height: none;
                        width: 100%;
                    }
                    
                    .pos-actions {
                        display: none;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        adjustColor(color, amount) {
            const hex = color.replace('#', '');
            const num = parseInt(hex, 16);
            const r = Math.max(0, Math.min(255, (num >> 16) + amount));
            const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
            const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
            return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
        }

        setProducts(products) {
            this.products = products;
        }

        formatPrice(price) {
            return this.options.currency + price.toFixed(2);
        }

        isValidURL(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        }

        showNotification(type, message) {
            if (this.options.onNotification) {
                this.options.onNotification(type, message);
                return;
            }
            
            const existing = document.querySelectorAll('.shopcart-notification');
            existing.forEach(el => el.remove());
            
            const notification = document.createElement('div');
            notification.className = `shopcart-notification notification-${type}`;
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 20px;">
                        ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 2px;">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div style="font-size: 14px; color: #6b7280;">${message}</div>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        $(selector) {
            return document.querySelector(selector);
        }

        $$(selector) {
            return document.querySelectorAll(selector);
        }

        hasUnsavedChanges() {
            return this.tempEdits.size > 0;
        }

        getUnsavedCount() {
            return this.tempEdits.size;
        }

        // Show checkout modal
        showCheckoutModal(checkoutData = null) {
            const overlay = document.createElement('div');
            overlay.className = 'checkout-modal-overlay';
            overlay.innerHTML = `
                <div class="checkout-modal">
                    <h2>Choose Checkout Method</h2>
                    <p>How would you like to complete this order?</p>
                    
                    <div class="checkout-options">
                        <button class="checkout-option-btn" data-method="whatsapp">
                            <div class="checkout-option-icon whatsapp-icon">
                                📱
                            </div>
                            <div class="checkout-option-content">
                                <div class="checkout-option-title">WhatsApp Order</div>
                                <div class="checkout-option-desc">Send order details via WhatsApp</div>
                            </div>
                        </button>
                        
                        <button class="checkout-option-btn" data-method="pos">
                            <div class="checkout-option-icon pos-icon">
                                🧾
                            </div>
                            <div class="checkout-option-content">
                                <div class="checkout-option-title">POS Billing</div>
                                <div class="checkout-option-desc">Generate printable receipt</div>
                            </div>
                        </button>
                    </div>
                    
                    <button class="modal-close-btn">Cancel</button>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Event listeners
            overlay.querySelector('[data-method="whatsapp"]').addEventListener('click', () => {
                overlay.remove();
                this.handleWhatsAppCheckout(checkoutData);
            });
            
            overlay.querySelector('[data-method="pos"]').addEventListener('click', () => {
                overlay.remove();
                this.showPOSReceipt(checkoutData);
            });
            
            overlay.querySelector('.modal-close-btn').addEventListener('click', () => {
                overlay.remove();
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
        }

        // Handle WhatsApp checkout
        handleWhatsAppCheckout(checkoutData) {
            const cartItems = this.getCart();
            const total = this.getCartTotal();
            
            let message = `*New Order from ${this.options.storeName}*\n\n`;
            message += `*Items:*\n`;
            
            cartItems.forEach(item => {
                message += `• ${item.title} x${item.quantity} - ${this.formatPrice(item.price * item.quantity)}\n`;
            });
            
            message += `\n*Total: ${this.formatPrice(total)}*\n\n`;
            
            if (checkoutData) {
                message += `*Customer Details:*\n`;
                if (checkoutData.name) message += `Name: ${checkoutData.name}\n`;
                if (checkoutData.email) message += `Email: ${checkoutData.email}\n`;
                if (checkoutData.phone) message += `Phone: ${checkoutData.phone}\n`;
                if (checkoutData.address) message += `Address: ${checkoutData.address}\n`;
            }
            
            const encodedMessage = encodeURIComponent(message);
            const whatsappURL = `https://wa.me/${this.options.whatsappNumber}?text=${encodedMessage}`;
            
            window.open(whatsappURL, '_blank');
            
            // Clear cart after order
            this.placeOrder(checkoutData);
        }

        // Show POS Receipt
        showPOSReceipt(checkoutData) {
            const cartItems = this.getCart();
            const total = this.getCartTotal();
            const itemCount = this.getCartCount();
            const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
            const currentDate = new Date().toLocaleString();
            
            const receiptContainer = document.createElement('div');
            receiptContainer.className = 'pos-receipt-container';
            
            let itemsHTML = '';
            cartItems.forEach(item => {
                const subtotal = item.price * item.quantity;
                itemsHTML += `
                    <div class="pos-item">
                        <div class="pos-item-name">${item.title}</div>
                        <div class="pos-item-details">
                            <span>${item.quantity} x ${this.formatPrice(item.price)}</span>
                            <span>${this.formatPrice(subtotal)}</span>
                        </div>
                    </div>
                `;
            });
            
            let customerHTML = '';
            if (checkoutData) {
                customerHTML = `
                    <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                        <div style="font-weight: bold; margin-bottom: 8px;">CUSTOMER DETAILS</div>
                        ${checkoutData.name ? `<div>Name: ${checkoutData.name}</div>` : ''}
                        ${checkoutData.phone ? `<div>Phone: ${checkoutData.phone}</div>` : ''}
                        ${checkoutData.email ? `<div>Email: ${checkoutData.email}</div>` : ''}
                        ${checkoutData.address ? `<div>Address: ${checkoutData.address}</div>` : ''}
                    </div>
                `;
            }
            
            receiptContainer.innerHTML = `
                <div class="pos-receipt">
                    <div class="pos-receipt-content">
                        <div class="pos-header">
                            <div class="pos-store-name">${this.options.storeName}</div>
                            <div class="pos-receipt-title">SALES RECEIPT</div>
                            <div class="pos-date">Order #${orderNumber}</div>
                            <div class="pos-date">${currentDate}</div>
                        </div>
                        
                        ${customerHTML}
                        
                        <div class="pos-items">
                            ${itemsHTML}
                        </div>
                        
                        <div class="pos-totals">
                            <div class="pos-total-row">
                                <span>Items:</span>
                                <span>${itemCount}</span>
                            </div>
                            <div class="pos-total-row">
                                <span>Subtotal:</span>
                                <span>${this.formatPrice(total)}</span>
                            </div>
                            <div class="pos-total-row grand-total">
                                <span>TOTAL:</span>
                                <span>${this.formatPrice(total)}</span>
                            </div>
                        </div>
                        
                        <div class="pos-footer">
                            <div>Thank you for your purchase!</div>
                            <div style="margin-top: 8px;">Please come again</div>
                        </div>
                        
                        <div class="pos-actions">
                            <button class="pos-btn pos-btn-print">🖨️ Print</button>
                            <button class="pos-btn pos-btn-close">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(receiptContainer);
            
            // Event listeners
            receiptContainer.querySelector('.pos-btn-print').addEventListener('click', () => {
                window.print();
            });
            
            receiptContainer.querySelector('.pos-btn-close').addEventListener('click', () => {
                receiptContainer.remove();
                // Clear cart after closing receipt
                this.placeOrder(checkoutData);
            });
            
            receiptContainer.addEventListener('click', (e) => {
                if (e.target === receiptContainer) {
                    receiptContainer.remove();
                    this.placeOrder(checkoutData);
                }
            });
        }

        // Place order and clear cart
        placeOrder(checkoutData = null) {
            const orderData = {
                orderNumber: 'ORD-' + Date.now().toString().slice(-6),
                items: [...this.cart],
                total: this.getCartTotal(),
                itemCount: this.getCartCount(),
                customer: checkoutData,
                timestamp: new Date().toISOString()
            };
            
            // Trigger callback if provided
            if (this.options.onOrderPlaced) {
                this.options.onOrderPlaced(orderData);
            }
            
            // Clear the cart
            this.cart = [];
            this.tempEdits.clear();
            this.saveCart();
            this.updateCartUI();
            this.notifyUnsavedChanges();
            
            this.showNotification('success', 'Order placed successfully! Cart cleared.');
        }

        addToCart(productId, quantity = 1) {
            const product = this.products.find(p => p.id === productId);
            
            if (!product) {
                this.showNotification('error', 'Product not found');
                return false;
            }
            
            if (product.stock !== undefined && product.stock <= 0) {
                this.showNotification('warning', 'Product is out of stock');
                return false;
            }
            
            const existingItem = this.cart.find(item => item.id === productId);
            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (product.stock !== undefined && newQuantity > product.stock) {
                    this.showNotification('warning', `Maximum stock reached (${product.stock} available)`);
                    existingItem.quantity = product.stock;
                } else {
                    existingItem.quantity = newQuantity;
                }
            } else {
                const finalQuantity = product.stock !== undefined ? Math.min(quantity, product.stock) : quantity;
                this.cart.push({...product, quantity: finalQuantity});
            }
            
            this.saveCart();
            this.updateCartUI();
            this.showNotification('success', `${product.title} added to cart!`);
            return true;
        }

        startEditQuantity(productId, change) {
            const product = this.products.find(p => p.id === productId);
            const cartItem = this.cart.find(item => item.id === productId);
            
            if (!product || !cartItem) {
                this.showNotification('error', 'Product not found');
                return;
            }
            
            let currentTemp = this.tempEdits.get(productId) ?? cartItem.quantity;
            let newQuantity = currentTemp + change;
            
            if (newQuantity < 0) {
                this.showNotification('warning', 'Quantity cannot be negative');
                return;
            }
            
            if (newQuantity === 0) {
                this.tempEdits.set(productId, 0);
                this.updateCartUI();
                this.notifyUnsavedChanges();
                return;
            }
            
            if (product.stock !== undefined && newQuantity > product.stock) {
                this.showNotification('warning', `Maximum stock reached (${product.stock} available)`);
                return;
            }
            
            this.tempEdits.set(productId, newQuantity);
            this.updateCartUI();
            this.notifyUnsavedChanges();
        }

        setTempQuantity(productId, value) {
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
            
            if (product.stock !== undefined && quantity > product.stock) {
                this.showNotification('warning', `Only ${product.stock} items available`);
                quantity = product.stock;
            }
            
            this.tempEdits.set(productId, quantity);
            this.updateCartUI();
            this.notifyUnsavedChanges();
        }

        saveQuantity(productId) {
            const tempQuantity = this.tempEdits.get(productId);
            
            if (tempQuantity === undefined) {
                this.showNotification('info', 'No changes to save');
                return;
            }
            
            if (tempQuantity === 0) {
                if (confirm('Remove this item from cart?')) {
                    this.removeFromCart(productId);
                } else {
                    this.tempEdits.delete(productId);
                    this.updateCartUI();
                }
                return;
            }
            
            const cartItem = this.cart.find(item => item.id === productId);
            if (cartItem) {
                cartItem.quantity = tempQuantity;
                this.tempEdits.delete(productId);
                this.saveCart();
                this.updateCartUI();
                this.showNotification('success', 'Quantity updated successfully');
                this.notifyUnsavedChanges();
            }
        }

        cancelQuantity(productId) {
            this.tempEdits.delete(productId);
            this.updateCartUI();
            this.notifyUnsavedChanges();
            this.showNotification('info', 'Changes cancelled');
        }

        saveAllQuantities() {
            if (!this.hasUnsavedChanges()) {
                this.showNotification('info', 'No changes to save');
                return;
            }
            
            const itemsToRemove = [];
            
            this.tempEdits.forEach((quantity, productId) => {
                if (quantity === 0) {
                    itemsToRemove.push(productId);
                } else {
                    const cartItem = this.cart.find(item => item.id === productId);
                    if (cartItem) {
                        cartItem.quantity = quantity;
                    }
                }
            });
            
            if (itemsToRemove.length > 0) {
                if (confirm(`Remove ${itemsToRemove.length} item(s) from cart?`)) {
                    itemsToRemove.forEach(id => this.removeFromCart(id));
                }
            }
            
            this.tempEdits.clear();
            this.saveCart();
            this.updateCartUI();
            this.showNotification('success', 'All changes saved');
            this.notifyUnsavedChanges();
        }

        cancelAllQuantities() {
            if (!this.hasUnsavedChanges()) {
                return;
            }
            
            if (confirm('Discard all unsaved changes?')) {
                this.tempEdits.clear();
                this.updateCartUI();
                this.showNotification('info', 'All changes cancelled');
                this.notifyUnsavedChanges();
            }
        }

        notifyUnsavedChanges() {
            if (this.options.onUnsavedChanges) {
                this.options.onUnsavedChanges(this.hasUnsavedChanges(), this.getUnsavedCount());
            }
        }

        removeFromCart(productId) {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.tempEdits.delete(productId);
            this.saveCart();
            this.updateCartUI();
            this.showNotification('info', 'Item removed from cart');
            this.notifyUnsavedChanges();
        }

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
                const stock = product?.stock;
                const hasUnsaved = this.tempEdits.has(item.id);
                const displayQuantity = hasUnsaved ? this.tempEdits.get(item.id) : item.quantity;
                const itemSubtotal = item.price * item.quantity;
                const tempSubtotal = item.price * displayQuantity;
                
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
                let stockText = stock ? `${stock} available` : '';
                if (stock !== undefined) {
                    if (stock <= 0) {
                        stockClass = 'stock-out';
                        stockText = 'Out of stock';
                    } else if (stock <= 5) {
                        stockClass = 'stock-low';
                        stockText = `Only ${stock} left`;
                    }
                }
                
                const cartItem = document.createElement('div');
                cartItem.className = `cart-item ${hasUnsaved ? 'item-edited' : ''}`;
                cartItem.dataset.itemId = item.id;
                cartItem.innerHTML = `
                    <div class="cart-item-image">${itemImageContent}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-title">
                            ${item.title}
                            ${hasUnsaved ? '<span class="unsaved-badge">UNSAVED</span>' : ''}
                        </div>
                        <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                        
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="decrease" data-product-id="${item.id}" 
                                ${displayQuantity <= 0 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${displayQuantity}" 
                                   min="0" ${stock !== undefined ? `max="${stock}"` : ''} 
                                   data-product-id="${item.id}">
                            <button class="quantity-btn" data-action="increase" data-product-id="${item.id}" 
                                ${stock !== undefined && displayQuantity >= stock ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                            ${hasUnsaved ? `
                                <button class="save-qty-btn" data-product-id="${item.id}">Save</button>
                                <button class="cancel-qty-btn" data-product-id="${item.id}">Cancel</button>
                            ` : ''}
                        </div>
                        
                        <div class="item-subtotal">
                            ${hasUnsaved && tempSubtotal !== itemSubtotal ? `
                                <span style="text-decoration: line-through; color: #9ca3af;">${this.formatPrice(itemSubtotal)}</span>
                                → <strong>${this.formatPrice(tempSubtotal)}</strong>
                            ` : `Subtotal: <strong>${this.formatPrice(itemSubtotal)}</strong>`}
                        </div>
                        
                        ${stockText ? `<div class="stock-status ${stockClass}">${stockText}</div>` : ''}
                        
                        <button class="remove-btn" data-product-id="${item.id}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                `;
                
                cartItems.appendChild(cartItem);
            });
            
            if (cartCount) cartCount.textContent = itemCount;
            if (cartTotal) cartTotal.textContent = this.formatPrice(total);
            
            this.attachCartEventListeners();
            
            if (this.options.onCartUpdate) {
                this.options.onCartUpdate(this.cart, total, itemCount);
            }
        }

        attachCartEventListeners() {
            this.$('.quantity-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const productId = btn.dataset.productId;
                    const action = btn.dataset.action;
                    const change = action === 'increase' ? 1 : -1;
                    this.startEditQuantity(productId, change);
                });
            });

            this.$('.quantity-input').forEach(input => {
                input.addEventListener('change', () => {
                    const productId = input.dataset.productId;
                    this.setTempQuantity(productId, input.value);
                });
            });

            this.$('.save-qty-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const productId = btn.dataset.productId;
                    this.saveQuantity(productId);
                });
            });

            this.$('.cancel-qty-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const productId = btn.dataset.productId;
                    this.cancelQuantity(productId);
                });
            });

            this.$('.remove-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const productId = btn.dataset.productId;
                    this.removeFromCart(productId);
                });
            });
        }

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

        closeCart() {
            if (this.hasUnsavedChanges()) {
                if (!confirm('You have unsaved changes. Close anyway?')) {
                    return false;
                }
                this.tempEdits.clear();
            }
            
            const cartSidebar = this.$(this.options.selectors.cartSidebar);
            if (cartSidebar) {
                cartSidebar.classList.remove('active');
            }
            this.hideOverlay();
            return true;
        }

        showOverlay() {
            if (!this.$('.shopcart-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'shopcart-overlay';
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1500;';
                overlay.addEventListener('click', () => this.closeCart());
                document.body.appendChild(overlay);
            }
        }

        hideOverlay() {
            const overlay = this.$('.shopcart-overlay');
            if (overlay) {
                overlay.remove();
            }
        }

        getCart() {
            return this.cart;
        }

        getCartTotal() {
            return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        }

        getCartCount() {
            return this.cart.reduce((count, item) => count + item.quantity, 0);
        }

        clearCart() {
            if (confirm('Clear all items from cart?')) {
                this.cart = [];
                this.tempEdits.clear();
                this.saveCart();
                this.updateCartUI();
                this.showNotification('info', 'Cart cleared');
                this.notifyUnsavedChanges();
            }
        }

        saveCart() {
            try {
                localStorage.setItem('shopcart_items', JSON.stringify(this.cart));
            } catch (e) {
                console.warn('Could not save cart to localStorage:', e);
            }
        }

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