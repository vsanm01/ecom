/**
 * ShopCart.js v2.0.0
 * Enhanced shopping cart library with checkout selection modal
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
                currency: options.currency || '₹',
                locale: options.locale || 'en-US',
                primaryColor: options.primaryColor || '#2596be',
                whatsappColor: options.whatsappColor || '#25d366',
                businessName: options.businessName || 'ShopHub',
                businessPhone: options.businessPhone || '9134567890',
                countryCode: options.countryCode || '91',
                businessEmail: options.businessEmail || 'support@shop.com',
                deliveryCharge: options.deliveryCharge || 50,
                freeDeliveryAbove: options.freeDeliveryAbove || 1000,
                taxRate: options.taxRate || 0.18, // 18% GST
                onCartUpdate: options.onCartUpdate || null,
                onNotification: options.onNotification || null,
                onUnsavedChanges: options.onUnsavedChanges || null,
                onCheckoutComplete: options.onCheckoutComplete || null,
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
            this.createCheckoutModals();
        }

        // Inject custom styles
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

                /* Checkout Modal Styles */
                .shopcart-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    z-index: 3000;
                    align-items: center;
                    justify-content: center;
                }

                .shopcart-modal.show {
                    display: flex;
                }

                .shopcart-modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    animation: zoomIn 0.3s;
                }

                @keyframes zoomIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .shopcart-modal-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    z-index: 1;
                }

                .shopcart-modal-body {
                    padding: 40px;
                }

                .checkout-selection {
                    text-align: center;
                }

                .checkout-selection h2 {
                    font-size: 28px;
                    margin-bottom: 10px;
                    color: #1f2937;
                }

                .checkout-selection p {
                    color: #6b7280;
                    margin-bottom: 30px;
                    font-size: 16px;
                }

                .checkout-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-top: 30px;
                }

                .checkout-option {
                    background: white;
                    border: 3px solid #e5e7eb;
                    border-radius: 16px;
                    padding: 30px 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                }

                .checkout-option:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                }

                .checkout-option.whatsapp {
                    border-color: ${this.options.whatsappColor};
                }

                .checkout-option.whatsapp:hover {
                    background: linear-gradient(135deg, ${this.options.whatsappColor} 0%, #128c7e 100%);
                    color: white;
                }

                .checkout-option.pos {
                    border-color: ${this.options.primaryColor};
                }

                .checkout-option.pos:hover {
                    background: linear-gradient(135deg, ${this.options.primaryColor} 0%, ${this.adjustColor(this.options.primaryColor, -20)} 100%);
                    color: white;
                }

                .checkout-option i {
                    font-size: 48px;
                    margin-bottom: 15px;
                }

                .checkout-option.whatsapp i {
                    color: ${this.options.whatsappColor};
                }

                .checkout-option.pos i {
                    color: ${this.options.primaryColor};
                }

                .checkout-option:hover i {
                    color: white;
                }

                .checkout-option h3 {
                    font-size: 20px;
                    margin-bottom: 10px;
                    font-weight: 600;
                }

                .checkout-option p {
                    font-size: 14px;
                    margin: 0;
                    opacity: 0.8;
                }

                .checkout-form-content {
                    max-width: 500px;
                    padding: 2rem;
                }

                .checkout-form-content h3 {
                    margin-bottom: 20px;
                    font-size: 24px;
                }

                .form-group {
                    position: relative;
                    margin-bottom: 1.5rem;
                }

                .form-group.has-title .form-label {
                    position: absolute;
                    top: -8px;
                    left: 12px;
                    background: white;
                    padding: 0 8px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #495057;
                    z-index: 1;
                }

                .form-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    outline: none;
                    font-size: 14px;
                }

                .form-input:focus {
                    border-color: ${this.options.primaryColor};
                }

                .radio-group {
                    display: flex;
                    gap: 1rem;
                }

                .radio-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .order-btn {
                    width: 100%;
                    padding: 1rem;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-top: 1rem;
                    font-size: 16px;
                }

                .order-btn:hover {
                    background: #059669;
                }

                .back-btn {
                    width: 100%;
                    padding: 1rem;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-top: 0.5rem;
                    font-size: 16px;
                }

                .back-btn:hover {
                    background: #5a6268;
                }

                .pos-receipt {
                    max-width: 400px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                }

                .pos-header {
                    text-align: center;
                    border-bottom: 2px dashed #ddd;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }

                .pos-header h2 {
                    font-size: 24px;
                    margin-bottom: 5px;
                }

                .pos-header p {
                    color: #6b7280;
                    font-size: 14px;
                    margin: 3px 0;
                }

                .pos-items {
                    margin: 20px 0;
                }

                .pos-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #f0f0f0;
                }

                .pos-item-details {
                    flex: 1;
                }

                .pos-item-name {
                    font-weight: 600;
                    margin-bottom: 3px;
                }

                .pos-item-qty {
                    color: #6b7280;
                    font-size: 14px;
                }

                .pos-item-price {
                    font-weight: 600;
                    color: ${this.options.primaryColor};
                }

                .pos-totals {
                    border-top: 2px solid #ddd;
                    padding-top: 15px;
                    margin-top: 15px;
                }

                .pos-total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    font-size: 14px;
                }

                .pos-total-row.grand-total {
                    font-size: 18px;
                    font-weight: 700;
                    border-top: 2px dashed #ddd;
                    padding-top: 15px;
                    margin-top: 10px;
                }

                .pos-footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px dashed #ddd;
                }

                .pos-footer p {
                    color: #6b7280;
                    font-size: 14px;
                    margin: 5px 0;
                }

                .print-btn {
                    width: 100%;
                    padding: 1rem;
                    background: ${this.options.primaryColor};
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-top: 20px;
                    font-size: 16px;
                }

                .print-btn:hover {
                    background: ${this.adjustColor(this.options.primaryColor, -20)};
                }

                @media (max-width: 768px) {
                    .checkout-options {
                        grid-template-columns: 1fr;
                    }
                    .shopcart-modal-body {
                        padding: 20px;
                    }
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .pos-receipt, .pos-receipt * {
                        visibility: visible;
                    }
                    .pos-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print-btn, .back-btn, .shopcart-modal-close {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Create checkout modals
        createCheckoutModals() {
            // Create selection modal
            const selectionModal = document.createElement('div');
            selectionModal.id = 'shopcartCheckoutSelection';
            selectionModal.className = 'shopcart-modal';
            selectionModal.innerHTML = `
                <div class="shopcart-modal-content">
                    <button class="shopcart-modal-close" onclick="window.shopCartInstance.closeCheckoutSelection()">×</button>
                    <div class="shopcart-modal-body">
                        <div class="checkout-selection">
                            <h2>Choose Checkout Method</h2>
                            <p>Select how you'd like to complete your order</p>
                            
                            <div class="checkout-options">
                                <div class="checkout-option whatsapp" onclick="window.shopCartInstance.selectWhatsAppCheckout()">
                                    <i class="fab fa-whatsapp"></i>
                                    <h3>WhatsApp Order</h3>
                                    <p>Send order via WhatsApp for confirmation</p>
                                </div>
                                
                                <div class="checkout-option pos" onclick="window.shopCartInstance.selectPOSBilling()">
                                    <i class="fas fa-receipt"></i>
                                    <h3>POS Billing</h3>
                                    <p>Generate instant receipt</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(selectionModal);

            // Create WhatsApp form modal
            const whatsappModal = document.createElement('div');
            whatsappModal.id = 'shopcartWhatsAppForm';
            whatsappModal.className = 'shopcart-modal';
            whatsappModal.innerHTML = `
                <div class="shopcart-modal-content">
                    <button class="shopcart-modal-close" onclick="window.shopCartInstance.closeWhatsAppForm()">×</button>
                    <div class="shopcart-modal-body checkout-form-content">
                        <h3><i class="fab fa-whatsapp" style="color: ${this.options.whatsappColor};"></i> WhatsApp Checkout</h3>
                        <form id="shopcartCheckoutForm">
                            <div class="form-group has-title">
                                <label class="form-label" for="shopcartCustomerName">Full Name *</label>
                                <input class="form-input" id="shopcartCustomerName" placeholder="Enter your full name" required type="text">
                            </div>
                            
                            <div class="form-group has-title">
                                <label class="form-label" for="shopcartCustomerPhone">Mobile Number *</label>
                                <input class="form-input" id="shopcartCustomerPhone" placeholder="Enter 10-digit mobile number" required type="tel">
                            </div>
                            
                            <div class="form-group has-title">
                                <label class="form-label" for="shopcartCustomerEmail">Email ID <span style="color: #6c757d; font-size: 11px;">(Optional)</span></label>
                                <input class="form-input" id="shopcartCustomerEmail" placeholder="Enter your email address" type="email">
                            </div>
                            
                            <div class="form-group has-title">
                                <label class="form-label" for="shopcartCustomerAddress">Delivery Address *</label>
                                <textarea class="form-input" id="shopcartCustomerAddress" placeholder="Enter your complete delivery address" required rows="3"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Delivery Option *</label>
                                <div class="radio-group">
                                    <div class="radio-item">
                                        <input id="shopcartPickup" name="shopcartDelivery" type="radio" value="pickup">
                                        <label for="shopcartPickup">Store Pickup</label>
                                    </div>
                                    <div class="radio-item">
                                        <input checked id="shopcartHomeDelivery" name="shopcartDelivery" type="radio" value="home">
                                        <label for="shopcartHomeDelivery">Home Delivery</label>
                                    </div>
                                </div>
                            </div>
                            
                            <button class="order-btn" onclick="window.shopCartInstance.processWhatsAppOrder(); return false;" type="button">
                                <i class="fab fa-whatsapp"></i> Send Order via WhatsApp
                            </button>
                            <button class="back-btn" onclick="window.shopCartInstance.backToSelection(); return false;" type="button">
                                <i class="fas fa-arrow-left"></i> Back
                            </button>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(whatsappModal);

            // Create POS receipt modal
            const posModal = document.createElement('div');
            posModal.id = 'shopcartPOSReceipt';
            posModal.className = 'shopcart-modal';
            posModal.innerHTML = `
                <div class="shopcart-modal-content">
                    <button class="shopcart-modal-close" onclick="window.shopCartInstance.closePOSReceipt()">×</button>
                    <div class="shopcart-modal-body">
                        <div class="pos-receipt" id="shopcartPOSReceiptContent">
                            <!-- Will be populated dynamically -->
                        </div>
                        <button class="print-btn" onclick="window.shopCartInstance.printReceipt()">
                            <i class="fas fa-print"></i> Print Receipt
                        </button>
                        <button class="back-btn" onclick="window.shopCartInstance.backToSelection(); return false;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(posModal);

            // Store instance globally for onclick handlers
            window.shopCartInstance = this;

            // Close modals on outside click
            document.querySelectorAll('.shopcart-modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('show');
                    }
                });
            });
        }

        // Adjust color brightness
        adjustColor(color, amount) {
            const hex = color.replace('#', '');
            const num = parseInt(hex, 16);
            const r = Math.max(0, Math.min(255, (num >> 16) + amount));
            const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
            const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
            return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
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

        // Get element
        $(selector) {
            return document.querySelector(selector);
        }

        // Get all elements
        $$(selector) {
            return document.querySelectorAll(selector);
        }

        // Check for unsaved changes
        hasUnsavedChanges() {
            return this.tempEdits.size > 0;
        }

        // Get unsaved changes count
        getUnsavedCount() {
            return this.tempEdits.size;
        }

        // Add to cart
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

        // Start editing quantity (temporary)
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

        // Set quantity directly (temporary)
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

        // Save quantity changes
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

        // Cancel quantity changes
        cancelQuantity(productId) {
            this.tempEdits.delete(productId);
            this.updateCartUI();
            this.notifyUnsavedChanges();
            this.showNotification('info', 'Changes cancelled');
        }

        // Save all quantity changes
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

        // Cancel all quantity changes
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

        // Notify about unsaved changes
        notifyUnsavedChanges() {
            if (this.options.onUnsavedChanges) {
                this.options.onUnsavedChanges(this.hasUnsavedChanges(), this.getUnsavedCount());
            }
        }

        // Remove from cart
        removeFromCart(productId) {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.tempEdits.delete(productId);
            this.saveCart();
            this.updateCartUI();
            this.showNotification('info', 'Item removed from cart');
            this.notifyUnsavedChanges();
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

        // Attach event listeners to cart items
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
            if (confirm('Clear all items from cart?')) {
                this.cart = [];
                this.tempEdits.clear();
                this.saveCart();
                this.updateCartUI();
                this.showNotification('info', 'Cart cleared');
                this.notifyUnsavedChanges();
            }
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

        // ===== CHECKOUT METHODS =====

        // Proceed to checkout
        proceedToCheckout() {
            if (this.cart.length === 0) {
                this.showNotification('warning', 'Your cart is empty!');
                return;
            }

            if (this.hasUnsavedChanges()) {
                this.showNotification('warning', 'Please save or cancel your changes before checkout');
                return;
            }

            this.openCheckoutSelection();
        }

        // Open checkout selection modal
        openCheckoutSelection() {
            this.$('#shopcartCheckoutSelection').classList.add('show');
        }

        // Close checkout selection modal
        closeCheckoutSelection() {
            this.$('#shopcartCheckoutSelection').classList.remove('show');
        }

        // Select WhatsApp checkout
        selectWhatsAppCheckout() {
            this.closeCheckoutSelection();
            this.$('#shopcartWhatsAppForm').classList.add('show');
        }

        // Close WhatsApp form
        closeWhatsAppForm() {
            this.$('#shopcartWhatsAppForm').classList.remove('show');
        }

        // Select POS billing
        selectPOSBilling() {
            this.closeCheckoutSelection();
            this.generatePOSReceipt();
            this.$('#shopcartPOSReceipt').classList.add('show');
        }

        // Close POS receipt
        closePOSReceipt() {
            this.$('#shopcartPOSReceipt').classList.remove('show');
        }

        // Back to selection
        backToSelection() {
            this.closeWhatsAppForm();
            this.closePOSReceipt();
            this.openCheckoutSelection();
        }

        // Process WhatsApp order
        processWhatsAppOrder() {
            const name = this.$('#shopcartCustomerName').value.trim();
            const phone = this.$('#shopcartCustomerPhone').value.trim();
            const email = this.$('#shopcartCustomerEmail').value.trim();
            const address = this.$('#shopcartCustomerAddress').value.trim();
            const delivery = this.$('input[name="shopcartDelivery"]:checked').value;

            if (!name || !phone || !address) {
                this.showNotification('warning', 'Please fill in all required fields');
                return;
            }

            const subtotal = this.getCartTotal();
            const deliveryCharge = delivery === 'pickup' ? 0 : 
                (subtotal >= this.options.freeDeliveryAbove ? 0 : this.options.deliveryCharge);
            const total = subtotal + deliveryCharge;

            let message = `*NEW ORDER*\n\n`;
            message += `*Customer Details:*\n`;
            message += `Name: ${name}\n`;
            message += `Phone: ${phone}\n`;
            if (email) message += `Email: ${email}\n`;
            message += `Address: ${address}\n`;
            message += `Delivery: ${delivery === 'pickup' ? 'Store Pickup' : 'Home Delivery'}\n\n`;
            
            message += `*Order Items:*\n`;
            this.cart.forEach((item, index) => {
                message += `${index + 1}. ${item.title}\n`;
                message += `   Qty: ${item.quantity} × ${this.formatPrice(item.price)} = ${this.formatPrice(item.price * item.quantity)}\n\n`;
            });
            
            message += `*Order Summary:*\n`;
            message += `Subtotal: ${this.formatPrice(subtotal)}\n`;
            message += `Delivery: ${this.formatPrice(deliveryCharge)}\n`;
            message += `*Total: ${this.formatPrice(total)}*\n\n`;
            message += `Order ID: ORD${Date.now()}\n`;
            message += `Date: ${new Date().toLocaleString()}`;

            const whatsappUrl = `https://wa.me/${this.options.countryCode}${this.options.businessPhone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            this.showNotification('success', 'Order sent successfully via WhatsApp! 🎉');
            this.closeWhatsAppForm();

            if (this.options.onCheckoutComplete) {
                this.options.onCheckoutComplete('whatsapp', {
                    name, phone, email, address, delivery, total, orderId: 'ORD' + Date.now()
                });
            }
        }

        // Generate POS receipt
        generatePOSReceipt() {
            const subtotal = this.getCartTotal();
            const deliveryCharge = subtotal >= this.options.freeDeliveryAbove ? 0 : this.options.deliveryCharge;
            const tax = (subtotal + deliveryCharge) * this.options.taxRate;
            const total = subtotal + deliveryCharge + tax;

            const now = new Date();
            const orderId = 'ORD' + Date.now();

            let receiptHTML = `
                <div class="pos-header">
                    <h2><i class="fas fa-shopping-bag"></i> ${this.options.businessName}</h2>
                    <p><i class="fas fa-phone"></i> +${this.options.countryCode} ${this.options.businessPhone}</p>
                    <p><i class="fas fa-envelope"></i> ${this.options.businessEmail}</p>
                    <p style="margin-top: 10px; font-weight: 600;">TAX INVOICE</p>
                    <p>Date: ${now.toLocaleString()}</p>
                    <p>Order #: ${orderId}</p>
                </div>

                <div class="pos-items">
            `;

            this.cart.forEach(item => {
                receiptHTML += `
                    <div class="pos-item">
                        <div class="pos-item-details">
                            <div class="pos-item-name">${item.title}</div>
                            <div class="pos-item-qty">${item.quantity} × ${this.formatPrice(item.price)}</div>
                        </div>
                        <div class="pos-item-price">${this.formatPrice(item.price * item.quantity)}</div>
                    </div>
                `;
            });

            receiptHTML += `
                </div>

                <div class="pos-totals">
                    <div class="pos-total-row">
                        <span>Subtotal:</span>
                        <span>${this.formatPrice(subtotal)}</span>
                    </div>
                    <div class="pos-total-row">
                        <span>Delivery Charge:</span>
                        <span>${this.formatPrice(deliveryCharge)}</span>
                    </div>
                    <div class="pos-total-row">
                        <span>Tax (${(this.options.taxRate * 100).toFixed(0)}% GST):</span>
                        <span>${this.formatPrice(tax)}</span>
                    </div>
                    <div class="pos-total-row grand-total">
                        <span>TOTAL:</span>
                        <span>${this.formatPrice(total)}</span>
                    </div>
                </div>

                <div class="pos-footer">
                    <p>Thank you for shopping with us!</p>
                    <p>Visit us at www.${this.options.businessName.toLowerCase()}.com</p>
                    <p style="margin-top: 10px; font-style: italic;">*** This is a computer generated receipt ***</p>
                </div>
            `;

            this.$('#shopcartPOSReceiptContent').innerHTML = receiptHTML;

            if (this.options.onCheckoutComplete) {
                this.options.onCheckoutComplete('pos', {
                    orderId, total, subtotal, deliveryCharge, tax
                });
            }
        }

        // Print receipt
        printReceipt() {
            window.print();
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
            