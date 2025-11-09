/**
 * Enhanced CheckoutSystem v2.1.0
 * NEW FEATURES:
 * - PNG receipt download
 * - Tax calculation in WhatsApp messages
 * - html2canvas integration
 * (c) 2025 | MIT License
 */

(function(global) {
    'use strict';

    class EnhancedCheckoutSystem {
        constructor(options = {}) {
            this.options = {
                // Basic Configuration
                primaryColor: options.primaryColor || '#2596be',
                whatsappColor: options.whatsappColor || '#25d366',
                currency: options.currency || '₹',
                currencyPosition: options.currencyPosition || 'before',
                businessName: options.businessName || 'ShopHub',
                businessPhone: options.businessPhone || '9134567890',
                countryCode: options.countryCode || '91',
                businessEmail: options.businessEmail || 'support@shop.com',
                
                // Pricing Configuration
                deliveryCharge: options.deliveryCharge || 50,
                freeDeliveryAbove: options.freeDeliveryAbove || 1000,
                taxRate: options.taxRate || 0.18,
                
                // Order ID Configuration (NEW)
                orderPrefix: options.orderPrefix || 'SHOP',
                orderStartNumber: options.orderStartNumber || 1,
                orderDateFormat: options.orderDateFormat || 'YYYYMMDD', // or 'DDMMYYYY'
                
                // NEW: Tax Configuration
                showTaxInWhatsApp: options.showTaxInWhatsApp !== false, // ✅ NEW
                taxLabel: options.taxLabel || 'GST', // ✅ NEW
                
                // NEW: PNG Download Configuration
                enablePNGDownload: options.enablePNGDownload !== false, // ✅ NEW
                pngFileName: options.pngFileName || 'receipt', // ✅ NEW
                pngQuality: options.pngQuality || 1.0, // ✅ NEW (0.0 to 1.0)
                
                // Message Template Configuration
                messageTemplate: options.messageTemplate || 'default',
                separatorChar: options.separatorChar || '─',
                separatorLength: options.separatorLength || 30,
                useBoldHeaders: options.useBoldHeaders !== false,
                showItemNumbers: options.showItemNumbers !== false,
                groupByCategory: options.groupByCategory || false,
                includeTimestamp: options.includeTimestamp !== false,
                includeWebsiteUrl: options.includeWebsiteUrl !== false,
                
                // Date/Time Configuration
                dateFormat: options.dateFormat || 'locale',
                timeFormat: options.timeFormat || '12h',
                
                // Validation Configuration
                validatePhone: options.validatePhone !== false,
                validateEmail: options.validateEmail || false,
                validateAddress: options.validateAddress !== false,
                minOrderAmount: options.minOrderAmount || 0,
                maxOrderAmount: options.maxOrderAmount || 0,
                requiredFields: options.requiredFields || ['name', 'phone', 'address'],
                
                // Custom Fields
                customFields: options.customFields || [],
                
                // UI Configuration
                showWhatsApp: options.showWhatsApp !== false,
                showPOS: options.showPOS !== false,
                showPreview: options.showPreview !== false,
                useModal: options.useModal !== false,
                
                // Callbacks
                onCheckoutComplete: options.onCheckoutComplete || null,
                onValidationError: options.onValidationError || null,
                onBeforeSend: options.onBeforeSend || null,
                customMessageGenerator: options.customMessageGenerator || null,
                customValidator: options.customValidator || null,
                onPNGDownloadStart: options.onPNGDownloadStart || null, // ✅ NEW
                onPNGDownloadComplete: options.onPNGDownloadComplete || null // ✅ NEW
            };

            this.cart = [];
            this.currentView = 'selection';
            this.validationErrors = [];
            this.orderCounter = this.options.orderStartNumber;
            
            if (this.options.useModal) {
                this.injectStyles();
                this.createModals();
            }
        }

        // ============ ORDER ID GENERATOR (NEW) ============
        
        generateOrderId() {
            const date = new Date();
            let dateStr = '';
            
            if (this.options.orderDateFormat === 'YYYYMMDD') {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dateStr = `${year}${month}${day}`;
            } else if (this.options.orderDateFormat === 'DDMMYYYY') {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dateStr = `${day}${month}${year}`;
            }
            
            const orderNum = String(this.orderCounter).padStart(3, '0');
            this.orderCounter++;
            
            return `${this.options.orderPrefix}-${orderNum}-${dateStr}`;
        }

        // ============ UTILITY METHODS ============
        
        formatPrice(price) {
            const formatted = typeof price === 'number' ? price.toFixed(2) : price;
            return this.options.currencyPosition === 'after' 
                ? `${formatted}${this.options.currency}`
                : `${this.options.currency}${formatted}`;
        }

        getCartTotal() {
            return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }

        createSeparator() {
            return this.options.separatorChar.repeat(this.options.separatorLength);
        }

        bold(text) {
            return this.options.useBoldHeaders ? `*${text}*` : text;
        }

        formatDateTime(date) {
            const d = date || new Date();
            
            if (this.options.dateFormat === 'iso') {
                return d.toISOString();
            } else if (this.options.dateFormat === 'locale') {
                const dateStr = d.toLocaleDateString();
                const timeStr = this.options.timeFormat === '12h' 
                    ? d.toLocaleTimeString('en-US', { hour12: true })
                    : d.toLocaleTimeString('en-US', { hour12: false });
                return `${dateStr} ${timeStr}`;
            }
            return d.toString();
        }

        adjustColor(color, amount) {
            const hex = color.replace('#', '');
            const num = parseInt(hex, 16);
            const r = Math.max(0, Math.min(255, (num >> 16) + amount));
            const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
            const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
            return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
        }

        // ============ VALIDATION ENGINE ============
        
        validateOrder(orderData) {
            this.validationErrors = [];

            if (this.options.requiredFields.includes('name')) {
                if (!orderData.name || orderData.name.trim() === '') {
                    this.validationErrors.push('Customer name is required');
                } else if (orderData.name.trim().length < 2) {
                    this.validationErrors.push('Name must be at least 2 characters');
                }
            }

            if (this.options.requiredFields.includes('phone')) {
                if (!orderData.phone || orderData.phone.trim() === '') {
                    this.validationErrors.push('Mobile number is required');
                } else if (this.options.validatePhone) {
                    const phoneRegex = /^[0-9]{10}$/;
                    if (!phoneRegex.test(orderData.phone.replace(/\D/g, ''))) {
                        this.validationErrors.push('Mobile number must be 10 digits');
                    }
                }
            }

            if (this.options.validateEmail && orderData.email && orderData.email.trim() !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(orderData.email)) {
                    this.validationErrors.push('Invalid email address');
                }
            }

            if (this.options.requiredFields.includes('address')) {
                if (!orderData.address || orderData.address.trim() === '') {
                    this.validationErrors.push('Delivery address is required');
                } else if (orderData.address.trim().length < 10) {
                    this.validationErrors.push('Please enter complete delivery address');
                }
            }

            if (!orderData.cart || orderData.cart.length === 0) {
                this.validationErrors.push('Cart is empty');
            }

            if (this.options.minOrderAmount > 0 && orderData.subtotal < this.options.minOrderAmount) {
                this.validationErrors.push(
                    `Minimum order amount is ${this.formatPrice(this.options.minOrderAmount)}`
                );
            }

            if (this.options.maxOrderAmount > 0 && orderData.subtotal > this.options.maxOrderAmount) {
                this.validationErrors.push(
                    `Maximum order amount is ${this.formatPrice(this.options.maxOrderAmount)}`
                );
            }

            if (this.options.customValidator) {
                const customErrors = this.options.customValidator(orderData);
                if (customErrors && customErrors.length > 0) {
                    this.validationErrors.push(...customErrors);
                }
            }

            return {
                isValid: this.validationErrors.length === 0,
                errors: this.validationErrors
            };
        }

        // ============ MESSAGE TEMPLATES WITH TAX ============
        
        generateDefaultMessage(orderData) {
            let message = '';

            message += this.bold('NEW ORDER') + '%0A';
            message += this.createSeparator() + '%0A%0A';

            // Customer Information
            message += this.bold('CUSTOMER DETAILS') + '%0A';
            message += `Name: ${orderData.name}%0A`;
            message += `Mobile: ${orderData.phone}%0A`;
            if (orderData.email) message += `Email: ${orderData.email}%0A`;
            message += '%0A';

            // Delivery Information
            message += this.bold('DELIVERY DETAILS') + '%0A';
            message += `Type: ${orderData.delivery === 'pickup' ? 'Store Pickup' : 'Home Delivery'}%0A`;
            if (orderData.address) message += `Address: ${orderData.address}%0A`;
            message += '%0A';

            // Custom Fields
            if (this.options.customFields.length > 0) {
                this.options.customFields.forEach(field => {
                    if (orderData[field.key]) {
                        message += `${field.label}: ${orderData[field.key]}%0A`;
                    }
                });
                message += '%0A';
            }

            message += this.createSeparator() + '%0A';
            message += this.bold('ORDER ITEMS') + '%0A';
            message += this.createSeparator() + '%0A';

            // Order Items
            if (this.options.groupByCategory && orderData.cart.some(item => item.category)) {
                const grouped = {};
                orderData.cart.forEach(item => {
                    const category = item.category || 'Other';
                    if (!grouped[category]) grouped[category] = [];
                    grouped[category].push(item);
                });

                Object.keys(grouped).forEach(category => {
                    message += `%0A${this.bold(category)}%0A`;
                    grouped[category].forEach((item, index) => {
                        const itemTotal = item.price * item.quantity;
                        const prefix = this.options.showItemNumbers ? `${index + 1}. ` : '• ';
                        message += `${prefix}${item.title} × ${item.quantity} = ${this.formatPrice(itemTotal)}%0A`;
                    });
                });
            } else {
                orderData.cart.forEach((item, index) => {
                    const itemTotal = item.price * item.quantity;
                    const prefix = this.options.showItemNumbers ? `${index + 1}. ` : '• ';
                    message += `${prefix}${item.title} × ${item.quantity} = ${this.formatPrice(itemTotal)}%0A`;
                });
            }

            message += '%0A' + this.createSeparator() + '%0A';

            // ✅ NEW: Pricing Summary WITH TAX
            message += `Subtotal: ${this.formatPrice(orderData.subtotal)}%0A`;
            if (orderData.deliveryCharge > 0) {
                message += `Delivery: ${this.formatPrice(orderData.deliveryCharge)}%0A`;
            }
            
            // ✅ NEW: Add Tax to WhatsApp Message
            if (this.options.showTaxInWhatsApp && orderData.tax > 0) {
                const taxPercent = (this.options.taxRate * 100).toFixed(0);
                message += `${this.options.taxLabel} (${taxPercent}%): ${this.formatPrice(orderData.tax)}%0A`;
            }
            
            message += this.bold(`TOTAL: ${this.formatPrice(orderData.total)}`) + '%0A';
            message += this.createSeparator() + '%0A';

            // Footer
            if (this.options.includeTimestamp) {
                message += `Date: ${this.formatDateTime()}%0A`;
            }
            message += `Order ID: ${orderData.orderId}%0A`;
            if (this.options.includeWebsiteUrl) {
                message += `Website: ${window.location.origin}%0A`;
            }

            return message;
        }

        generateMinimalMessage(orderData) {
            let message = '';

            message += `${this.bold('Order from:')} ${orderData.name}%0A`;
            message += `${this.bold('Phone:')} ${orderData.phone}%0A%0A`;

            orderData.cart.forEach((item, index) => {
                message += `${index + 1}. ${item.title} × ${item.quantity}%0A`;
            });

            message += `%0A${this.bold('Total:')} ${this.formatPrice(orderData.total)}%0A`;
            message += `Order ID: ${orderData.orderId}`;

            return message;
        }

        generateDetailedMessage(orderData) {
            let message = '';

            message += this.bold(`ORDER #${orderData.orderId}`) + '%0A';
            message += this.createSeparator() + '%0A%0A';

            // Customer Section
            message += this.bold('CUSTOMER DETAILS') + '%0A';
            message += `Name: ${orderData.name}%0A`;
            message += `Mobile: ${orderData.phone}%0A`;
            if (orderData.email) message += `Email: ${orderData.email}%0A`;
            message += '%0A';

            // Delivery Section
            message += this.bold('DELIVERY DETAILS') + '%0A';
            message += `Type: ${orderData.delivery === 'pickup' ? 'Store Pickup' : 'Home Delivery'}%0A`;
            if (orderData.address) message += `Address: ${orderData.address}%0A`;
            message += '%0A';

            // Items Section
            message += this.bold('ORDER ITEMS') + '%0A';
            message += this.createSeparator() + '%0A';

            orderData.cart.forEach((item, index) => {
                message += `${index + 1}. ${this.bold(item.title)}%0A`;
                message += `   Price: ${this.formatPrice(item.price)}%0A`;
                message += `   Qty: ${item.quantity}%0A`;
                message += `   Subtotal: ${this.formatPrice(item.price * item.quantity)}%0A`;
                if (index < orderData.cart.length - 1) message += '%0A';
            });

            message += this.createSeparator() + '%0A';

            // ✅ NEW: Payment Summary WITH TAX
            message += this.bold('PAYMENT SUMMARY') + '%0A';
            message += `Items Total: ${this.formatPrice(orderData.subtotal)}%0A`;
            if (orderData.deliveryCharge > 0) {
                message += `Delivery: ${this.formatPrice(orderData.deliveryCharge)}%0A`;
            }
            
            // ✅ NEW: Add Tax
            if (this.options.showTaxInWhatsApp && orderData.tax > 0) {
                const taxPercent = (this.options.taxRate * 100).toFixed(0);
                message += `${this.options.taxLabel} (${taxPercent}%): ${this.formatPrice(orderData.tax)}%0A`;
            }
            
            message += this.createSeparator() + '%0A';
            message += this.bold(`GRAND TOTAL: ${this.formatPrice(orderData.total)}`) + '%0A';
            message += this.createSeparator() + '%0A%0A';

            // Footer
            message += `Order Date: ${this.formatDateTime()}%0A`;
            if (this.options.includeWebsiteUrl) {
                message += `Website: ${window.location.origin}%0A`;
            }
            message += `%0AThank you for your order!`;

            return message;
        }

        generateMessage(orderData) {
            if (this.options.customMessageGenerator) {
                return this.options.customMessageGenerator(orderData, this);
            }

            switch (this.options.messageTemplate) {
                case 'minimal':
                    return this.generateMinimalMessage(orderData);
                case 'detailed':
                    return this.generateDetailedMessage(orderData);
                default:
                    return this.generateDefaultMessage(orderData);
            }
        }

        // ============ PREVIEW FUNCTIONALITY ============
        
        previewMessage(orderData) {
            const message = this.generateMessage(orderData);
            return decodeURIComponent(message.replace(/%0A/g, '\n'));
        }

        showMessagePreview() {
            const orderData = this.buildOrderData();
            
            if (!orderData) {
                alert('Unable to read form data. Please try again.');
                return;
            }
            
            const validation = this.validateOrder(orderData);

            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return;
            }

            const previewText = this.previewMessage(orderData);
            const previewModal = `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #1f2937;">Message Preview</h4>
                    <pre style="white-space: pre-wrap; font-family: monospace; background: white; padding: 15px; border-radius: 4px; border: 1px solid #e5e7eb;">${previewText}</pre>
                    <button class="checkout-btn checkout-btn-primary" id="confirmSendPreview">
                        <i class="fab fa-whatsapp"></i> Send This Message
                    </button>
                    <button class="checkout-btn checkout-btn-secondary" id="cancelPreview">
                        <i class="fas fa-arrow-left"></i> Edit Order
                    </button>
                </div>
            `;

            const formContainer = this.modal.querySelector('#checkoutWhatsAppView');
            const existingPreview = formContainer.querySelector('.preview-container');
            if (existingPreview) existingPreview.remove();

            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-container';
            previewDiv.innerHTML = previewModal;
            formContainer.appendChild(previewDiv);

            formContainer.querySelector('#checkoutWhatsAppForm').style.display = 'none';

            previewDiv.querySelector('#confirmSendPreview').addEventListener('click', () => {
                this.sendWhatsAppOrder(orderData);
            });

            previewDiv.querySelector('#cancelPreview').addEventListener('click', () => {
                previewDiv.remove();
                formContainer.querySelector('#checkoutWhatsAppForm').style.display = 'block';
            });
        }

        // ============ VALIDATION ERROR DISPLAY ============
        
        showValidationErrors(errors) {
            const errorHTML = `
                <div style="background: #fee; border: 2px solid #fcc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="color: #c33; margin-top: 0;">
                        <i class="fas fa-exclamation-triangle"></i> Validation Errors
                    </h4>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${errors.map(err => `<li style="color: #c33; margin: 5px 0;">${err}</li>`).join('')}
                    </ul>
                </div>
            `;

            const formContainer = this.modal.querySelector('#checkoutWhatsAppView');
            const existingError = formContainer.querySelector('.error-container');
            if (existingError) existingError.remove();

            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-container';
            errorDiv.innerHTML = errorHTML;
            formContainer.insertBefore(errorDiv, formContainer.querySelector('#checkoutWhatsAppForm'));

            if (this.options.onValidationError) {
                this.options.onValidationError(errors);
            }

            setTimeout(() => errorDiv.remove(), 5000);
        }

        // ============ ORDER DATA BUILDER WITH TAX ============
        
        buildOrderData() {
            const name = this.modal.querySelector('#customerName').value.trim();
            const phone = this.modal.querySelector('#customerPhone').value.trim();
            const email = this.modal.querySelector('#customerEmail').value.trim();
            const address = this.modal.querySelector('#customerAddress').value.trim();
            const delivery = this.modal.querySelector('input[name="delivery"]:checked').value;

            const subtotal = this.getCartTotal();
            const deliveryCharge = delivery === 'pickup' ? 0 : 
                (subtotal >= this.options.freeDeliveryAbove ? 0 : this.options.deliveryCharge);
            
            // ✅ NEW: Calculate Tax
            const tax = (subtotal + deliveryCharge) * this.options.taxRate;
            const total = subtotal + deliveryCharge + tax;
            
            const orderId = 'ORD' + Date.now();

            const orderData = {
                name,
                phone,
                email,
                address,
                delivery,
                cart: this.cart,
                subtotal,
                deliveryCharge,
                tax, // ✅ NEW
                total,
                orderId,
                timestamp: new Date()
            };

            this.options.customFields.forEach(field => {
                const input = this.modal.querySelector(`#${field.key}`);
                if (input) {
                    orderData[field.key] = input.value;
                }
            });

            return orderData;
        }

        // ============ WHATSAPP PROCESSING ============
        
        processWhatsAppOrder() {
            const orderData = this.buildOrderData();
            
            if (!orderData) {
                alert('Unable to read form data. Please try again.');
                return;
            }
            
            const validation = this.validateOrder(orderData);

            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return;
            }

            if (this.options.showPreview) {
                this.showMessagePreview();
            } else {
                this.sendWhatsAppOrder(orderData);
            }
        }

        sendWhatsAppOrder(orderData) {
            if (this.options.onBeforeSend) {
                const shouldContinue = this.options.onBeforeSend(orderData);
                if (shouldContinue === false) return;
            }

            const message = this.generateMessage(orderData);
            const whatsappUrl = `https://wa.me/${this.options.countryCode}${this.options.businessPhone}?text=${message}`;
            window.open(whatsappUrl, '_blank');

            if (this.options.onCheckoutComplete) {
                this.options.onCheckoutComplete('whatsapp', orderData);
            }

            this.close();
            alert('Order sent successfully via WhatsApp! 🎉');
        }

        // ============ POS RECEIPT GENERATION WITH TAX ============
        
        generatePOSReceipt() {
            const subtotal = this.getCartTotal();
            const deliveryCharge = subtotal >= this.options.freeDeliveryAbove ? 0 : this.options.deliveryCharge;
            const tax = (subtotal + deliveryCharge) * this.options.taxRate;
            const total = subtotal + deliveryCharge + tax;
            const orderId = this.generateOrderId();

            let receiptHTML = `
                <div class="pos-header">
                    <h2><i class="fas fa-shopping-bag"></i> ${this.options.businessName}</h2>
                    <p><i class="fas fa-phone"></i> +${this.options.countryCode} ${this.options.businessPhone}</p>
                    <p><i class="fas fa-envelope"></i> ${this.options.businessEmail}</p>
                    <p style="margin-top: 10px; font-weight: 600;">TAX INVOICE</p>
                    <p>Date: ${this.formatDateTime()}</p>
                    <p>Order #: ${orderId}</p>
                </div>
                <div class="pos-items">
            `;

            if (this.options.groupByCategory && this.cart.some(item => item.category)) {
                const grouped = {};
                this.cart.forEach(item => {
                    const category = item.category || 'Other';
                    if (!grouped[category]) grouped[category] = [];
                    grouped[category].push(item);
                });

                Object.keys(grouped).forEach(category => {
                    receiptHTML += `<div style="font-weight: 600; margin-top: 15px; color: ${this.options.primaryColor};">${category}</div>`;
                    grouped[category].forEach(item => {
                        const itemName = item.title || item.name || 'Item';
                        receiptHTML += `
                            <div class="pos-item">
                                <div class="pos-item-details">
                                    <div class="pos-item-name">${itemName}</div>
                                    <div class="pos-item-qty">${item.quantity} × ${this.formatPrice(item.price)}</div>
                                </div>
                                <div class="pos-item-price">${this.formatPrice(item.price * item.quantity)}</div>
                            </div>
                        `;
                    });
                });
            } else {
                this.cart.forEach(item => {
                    const itemName = item.title || item.name || 'Item';
                    receiptHTML += `
                        <div class="pos-item">
                            <div class="pos-item-details">
                                <div class="pos-item-name">${itemName}</div>
                                <div class="pos-item-qty">${item.quantity} × ${this.formatPrice(item.price)}</div>
                            </div>
                            <div class="pos-item-price">${this.formatPrice(item.price * item.quantity)}</div>
                        </div>
                    `;
                });
            }

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
                        <span>Tax (${(this.options.taxRate * 100).toFixed(0)}% ${this.options.taxLabel}):</span>
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

            this.modal.querySelector('#posReceiptContent').innerHTML = receiptHTML;

            if (this.options.onCheckoutComplete) {
                this.options.onCheckoutComplete('pos', { orderId, total, subtotal, deliveryCharge, tax });
            }
        }

        // ============ PNG DOWNLOAD FUNCTIONALITY (NEW) ============
        
        async downloadReceiptAsPNG() {
            // Check if html2canvas is loaded
            if (typeof html2canvas === 'undefined') {
                alert('PNG download requires html2canvas library. Please include it:\n<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>');
                return;
            }

            try {
                // Callback before download starts
                if (this.options.onPNGDownloadStart) {
                    this.options.onPNGDownloadStart();
                }

                const receiptElement = this.modal.querySelector('#posReceiptContent');
                
                // Show loading indicator
                const downloadBtn = this.modal.querySelector('#downloadReceiptPNG');
                const originalText = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PNG...';
                downloadBtn.disabled = true;

                // Generate canvas from HTML
                const canvas = await html2canvas(receiptElement, {
                    scale: 2, // Higher quality
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: receiptElement.scrollWidth,
                    windowHeight: receiptElement.scrollHeight
                });

                // Convert to blob
                canvas.toBlob((blob) => {
                    // Create download link
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const timestamp = Date.now();
                    link.download = `${this.options.pngFileName}-${timestamp}.png`;
                    link.href = url;
                    link.click();

                    // Cleanup
                    URL.revokeObjectURL(url);

                    // Restore button
                    downloadBtn.innerHTML = originalText;
                    downloadBtn.disabled = false;

                    // Callback after download completes
                    if (this.options.onPNGDownloadComplete) {
                        this.options.onPNGDownloadComplete({ timestamp, fileName: link.download });
                    }

                    alert('Receipt downloaded successfully! 📥');
                }, 'image/png', this.options.pngQuality);

            } catch (error) {
                console.error('PNG Download Error:', error);
                alert('Failed to download receipt. Please try again.');
                
                const downloadBtn = this.modal.querySelector('#downloadReceiptPNG');
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download as PNG';
                downloadBtn.disabled = false;
            }
        }

        // ============ STYLES INJECTION ============
        
        injectStyles() {
            if (document.getElementById('checkout-system-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'checkout-system-styles';
            style.textContent = `
                .checkout-system-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }
                .checkout-system-modal.show { display: flex; }
                .checkout-system-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    animation: zoomIn 0.3s;
                }
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .checkout-system-close {
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
                    transition: transform 0.2s;
                    color: #6b7280;
                }
                .checkout-system-close:hover {
                    transform: rotate(90deg);
                    color: #374151;
                }
                .checkout-system-body { padding: 40px; }
                .checkout-selection { text-align: center; }
                .checkout-selection h2 {
                    font-size: 28px;
                    margin-bottom: 10px;
                    color: #1f2937;
                    font-weight: 700;
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
                    position: relative;
                    overflow: hidden;
                }
                .checkout-option::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 0;
                }
                .checkout-option:hover::before { opacity: 1; }
                .checkout-option > * {
                    position: relative;
                    z-index: 1;
                }
                .checkout-option:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                }
                .checkout-option.whatsapp {
                    border-color: ${this.options.whatsappColor};
                }
                .checkout-option.whatsapp::before {
                    background: linear-gradient(135deg, ${this.options.whatsappColor} 0%, #128c7e 100%);
                }
                .checkout-option.whatsapp:hover { color: white; }
                .checkout-option.pos {
                    border-color: ${this.options.primaryColor};
                }
                .checkout-option.pos::before {
                    background: linear-gradient(135deg, ${this.options.primaryColor} 0%, ${this.adjustColor(this.options.primaryColor, -20)} 100%);
                }
                .checkout-option.pos:hover { color: white; }
                .checkout-option i {
                    font-size: 48px;
                    margin-bottom: 15px;
                    display: block;
                    transition: transform 0.3s ease;
                }
                .checkout-option:hover i { transform: scale(1.1); }
                .checkout-option.whatsapp i { color: ${this.options.whatsappColor}; }
                .checkout-option.pos i { color: ${this.options.primaryColor}; }
                .checkout-option:hover i { color: white; }
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
                .checkout-whatsapp-form { display: none; }
                .checkout-whatsapp-form.active { display: block; }
                .checkout-whatsapp-form h3 {
                    margin-bottom: 20px;
                    font-size: 24px;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .checkout-whatsapp-form h3 i { color: ${this.options.whatsappColor}; }
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
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    outline: none;
                    font-size: 14px;
                    transition: border-color 0.3s;
                    font-family: inherit;
                }
                .form-input:focus { border-color: ${this.options.primaryColor}; }
                .radio-group {
                    display: flex;
                    gap: 1rem;
                }
                .radio-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }
                .radio-item input[type="radio"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                .checkout-btn {
                    width: 100%;
                    padding: 1rem;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .checkout-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .checkout-btn-primary {
                    background: #10b981;
                    color: white;
                    margin-top: 1rem;
                }
                .checkout-btn-primary:hover:not(:disabled) {
                    background: #059669;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
                .checkout-btn-secondary {
                    background: #6b7280;
                    color: white;
                    margin-top: 0.5rem;
                }
                .checkout-btn-secondary:hover { background: #4b5563; }
                .checkout-btn-print {
                    background: ${this.options.primaryColor};
                    color: white;
                    margin-top: 1.5rem;
                }
                .checkout-btn-print:hover:not(:disabled) {
                    background: ${this.adjustColor(this.options.primaryColor, -20)};
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px ${this.options.primaryColor}40;
                }
                .checkout-btn-download {
                    background: #8b5cf6;
                    color: white;
                    margin-top: 0.5rem;
                }
                .checkout-btn-download:hover:not(:disabled) {
                    background: #7c3aed;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                }
                .checkout-pos-receipt { display: none; }
                .checkout-pos-receipt.active { display: block; }
                .pos-receipt-content {
                    max-width: 400px;
                    margin: 0 auto;
                    background: white;
                    padding: 20px;
                }
                
                /* Print styles - FIX for multiple pages issue */
                @media print {
                    /* Reset everything */
                    * {
                        visibility: hidden !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Only show receipt and its children */
                    #posReceiptContent,
                    #posReceiptContent * {
                        visibility: visible !important;
                    }
                    
                    /* Remove modal completely */
                    .checkout-system-modal,
                    .checkout-system-content,
                    .checkout-system-body {
                        background: none !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    
                    /* Position receipt at top */
                    #posReceiptContent {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 80mm !important;
                        margin: 0 !important;
                        padding: 5mm !important;
                    }
                    
                    /* Force single page */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    
                    /* Hide all buttons */
                    button, .checkout-btn {
                        display: none !important;
                    }
                    
                    /* Page settings */
                    @page {
                        size: 80mm auto;
                        margin: 5mm;
                    }
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
                    color: #1f2937;
                }
                .pos-header p {
                    color: #6b7280;
                    font-size: 14px;
                    margin: 3px 0;
                }
                .pos-items { margin: 20px 0; }
                .pos-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                .pos-item-details { flex: 1; }
                .pos-item-name {
                    font-weight: 600;
                    margin-bottom: 3px;
                    color: #374151;
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
                    color: #1f2937;
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
                @media (max-width: 768px) {
                    .checkout-options { grid-template-columns: 1fr; }
                    .checkout-system-body { padding: 30px 20px; }
                    .checkout-selection h2 { font-size: 24px; }
                    .checkout-system-content { width: 95%; }
                }
            `;
            document.head.appendChild(style);
        }

        // ============ MODAL CREATION ============
        
        createModals() {
            const modal = document.createElement('div');
            modal.id = 'checkoutSystemModal';
            modal.className = 'checkout-system-modal';
            
            modal.innerHTML = `
                <div class="checkout-system-content">
                    <button class="checkout-system-close" id="checkoutSystemClose">×</button>
                    <div class="checkout-system-body">
                        
                        <!-- Selection View -->
                        <div class="checkout-selection" id="checkoutSelectionView">
                            <h2>Choose Checkout Method</h2>
                            <p>Select how you'd like to complete your order</p>
                            
                            <div class="checkout-options">
                                ${this.options.showWhatsApp ? `
                                <div class="checkout-option whatsapp" id="selectWhatsApp">
                                    <i class="fab fa-whatsapp"></i>
                                    <h3>WhatsApp Order</h3>
                                    <p>Send order via WhatsApp</p>
                                </div>
                                ` : ''}
                                
                                ${this.options.showPOS ? `
                                <div class="checkout-option pos" id="selectPOS">
                                    <i class="fas fa-receipt"></i>
                                    <h3>POS Billing</h3>
                                    <p>Generate instant receipt</p>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- WhatsApp Form -->
                        <div class="checkout-whatsapp-form" id="checkoutWhatsAppView">
                            <h3>
                                <i class="fab fa-whatsapp"></i>
                                WhatsApp Checkout
                            </h3>
                            <form id="checkoutWhatsAppForm">
                                <div class="form-group has-title">
                                    <label class="form-label" for="customerName">Full Name *</label>
                                    <input class="form-input" id="customerName" placeholder="Enter your full name" type="text">
                                </div>
                                
                                <div class="form-group has-title">
                                    <label class="form-label" for="customerPhone">Mobile Number *</label>
                                    <input class="form-input" id="customerPhone" placeholder="Enter 10-digit mobile number" type="tel">
                                </div>
                                
                                <div class="form-group has-title">
                                    <label class="form-label" for="customerEmail">Email ID</label>
                                    <input class="form-input" id="customerEmail" placeholder="Enter your email address" type="email">
                                </div>
                                
                                <div class="form-group has-title">
                                    <label class="form-label" for="customerAddress">Delivery Address *</label>
                                    <textarea class="form-input" id="customerAddress" placeholder="Enter your complete delivery address" rows="3"></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label" style="position: static; font-size: 14px; margin-bottom: 10px; display: block;">Delivery Option *</label>
                                    <div class="radio-group">
                                        <label class="radio-item">
                                            <input id="deliveryPickup" name="delivery" type="radio" value="pickup">
                                            <span>Store Pickup</span>
                                        </label>
                                        <label class="radio-item">
                                            <input checked id="deliveryHome" name="delivery" type="radio" value="home">
                                            <span>Home Delivery</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <button class="checkout-btn checkout-btn-primary" id="submitWhatsAppOrder" type="button">
                                    <i class="fab fa-whatsapp"></i> ${this.options.showPreview ? 'Preview Message' : 'Send Order via WhatsApp'}
                                </button>
                                <button class="checkout-btn checkout-btn-secondary" id="backFromWhatsApp" type="button">
                                    <i class="fas fa-arrow-left"></i> Back
                                </button>
                            </form>
                        </div>

                        <!-- POS Receipt -->
                        <div class="checkout-pos-receipt" id="checkoutPOSView">
                            <div class="pos-receipt-content" id="posReceiptContent"></div>
                            <button class="checkout-btn checkout-btn-print" id="printReceipt">
                                <i class="fas fa-print"></i> Print Receipt
                            </button>
                            ${this.options.enablePNGDownload ? `
                            <button class="checkout-btn checkout-btn-download" id="downloadReceiptPNG">
                                <i class="fas fa-download"></i> Download as PNG
                            </button>
                            ` : ''}
                            <button class="checkout-btn checkout-btn-secondary" id="backFromPOS">
                                <i class="fas fa-arrow-left"></i> Back
                            </button>
                        </div>

                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            this.modal = modal;
            this.attachEventListeners();
        }

        attachEventListeners() {
            this.modal.querySelector('#checkoutSystemClose').addEventListener('click', () => this.close());
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
            
            const whatsappBtn = this.modal.querySelector('#selectWhatsApp');
            if (whatsappBtn) {
                whatsappBtn.addEventListener('click', () => this.showWhatsAppForm());
            }
            
            const posBtn = this.modal.querySelector('#selectPOS');
            if (posBtn) {
                posBtn.addEventListener('click', () => this.showPOSReceipt());
            }
            
            this.modal.querySelector('#submitWhatsAppOrder').addEventListener('click', () => this.processWhatsAppOrder());
            this.modal.querySelector('#backFromWhatsApp').addEventListener('click', () => this.showSelection());
            this.modal.querySelector('#printReceipt').addEventListener('click', () => this.printReceipt());
            
            const downloadBtn = this.modal.querySelector('#downloadReceiptPNG');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => this.downloadReceiptAsPNG());
            }
            
            this.modal.querySelector('#backFromPOS').addEventListener('click', () => this.showSelection());
        }

        // ============ VIEW MANAGEMENT ============
        
        open(cartItems) {
            if (!cartItems || cartItems.length === 0) {
                alert('Cart is empty!');
                return;
            }
            
            this.cart = cartItems;
            this.modal.classList.add('show');
            this.showSelection();
        }

        close() {
            this.modal.classList.remove('show');
            this.showSelection();
        }

        showSelection() {
            this.currentView = 'selection';
            this.modal.querySelector('#checkoutSelectionView').style.display = 'block';
            this.modal.querySelector('#checkoutWhatsAppView').classList.remove('active');
            this.modal.querySelector('#checkoutPOSView').classList.remove('active');
        }

        showWhatsAppForm() {
            this.currentView = 'whatsapp';
            this.modal.querySelector('#checkoutSelectionView').style.display = 'none';
            this.modal.querySelector('#checkoutWhatsAppView').classList.add('active');
            this.modal.querySelector('#checkoutPOSView').classList.remove('active');
            
            const form = this.modal.querySelector('#checkoutWhatsAppForm');
            form.style.display = 'block';
            const preview = this.modal.querySelector('.preview-container');
            if (preview) preview.remove();
            const error = this.modal.querySelector('.error-container');
            if (error) error.remove();
        }

        showPOSReceipt() {
            this.currentView = 'pos';
            this.generatePOSReceipt();
            this.modal.querySelector('#checkoutSelectionView').style.display = 'none';
            this.modal.querySelector('#checkoutWhatsAppView').classList.remove('active');
            this.modal.querySelector('#checkoutPOSView').classList.add('active');
        }

        printReceipt() {
            window.print();
        }

        // ============ PUBLIC API METHODS ============
        
        sendOrder(orderData) {
            const validation = this.validateOrder(orderData);
            
            if (!validation.isValid) {
                if (this.options.onValidationError) {
                    this.options.onValidationError(validation.errors);
                }
                return { success: false, errors: validation.errors };
            }

            if (this.options.onBeforeSend) {
                const shouldContinue = this.options.onBeforeSend(orderData);
                if (shouldContinue === false) {
                    return { success: false, message: 'Cancelled by beforeSend callback' };
                }
            }

            const message = this.generateMessage(orderData);
            const whatsappUrl = `https://wa.me/${this.options.countryCode}${this.options.businessPhone}?text=${message}`;
            window.open(whatsappUrl, '_blank');

            if (this.options.onCheckoutComplete) {
                this.options.onCheckoutComplete('whatsapp', orderData);
            }

            return { success: true, orderData, message };
        }

        quickSend(name, phone, cart, options = {}) {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const deliveryCharge = options.deliveryCharge || 0;
            const tax = (subtotal + deliveryCharge) * this.options.taxRate;
            const total = subtotal + deliveryCharge + tax;

            const orderData = {
                name,
                phone,
                email: options.email || '',
                address: options.address || '',
                delivery: options.delivery || 'home',
                cart,
                subtotal,
                deliveryCharge,
                tax,
                total,
                orderId: this.generateOrderId(),
                timestamp: new Date(),
                ...options
            };

            return this.sendOrder(orderData);
        }

        getPreview(orderData) {
            return this.previewMessage(orderData);
        }

        updateConfig(newConfig) {
            this.options = { ...this.options, ...newConfig };
            return this;
        }

        validate(orderData) {
            return this.validateOrder(orderData);
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EnhancedCheckoutSystem;
    } else if (typeof define === 'function' && define.amd) {
        define(function() { return EnhancedCheckoutSystem; });
    } else {
        global.EnhancedCheckoutSystem = EnhancedCheckoutSystem;
    }

})(typeof window !== 'undefined' ? window : this);
                