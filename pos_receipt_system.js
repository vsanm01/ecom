// ============================================
// POS RECEIPT SYSTEM - REPLACEMENT FOR WHATSAPP BILLING
// ============================================

class POSReceiptSystem {
    constructor(config = {}) {
        this.config = {
            businessName: config.businessName || 'ShopHub',
            businessAddress: config.businessAddress || '123 Main Street, City, State',
            businessPhone: config.businessPhone || '+91 1234567890',
            businessEmail: config.businessEmail || 'support@shop.com',
            taxRate: config.taxRate || 0, // 0% for no tax, 0.18 for 18% GST
            currency: config.currency || '₹',
            currencyPosition: config.currencyPosition || 'before',
            showTax: config.showTax || false,
            printAutomatically: config.printAutomatically || true,
            logo: config.logo || null,
            footerMessage: config.footerMessage || 'Thank you for shopping with us!',
            onSuccess: config.onSuccess || function() {},
            onError: config.onError || function() {},
            onBeforePrint: config.onBeforePrint || function() { return true; }
        };
    }

    formatCurrency(amount) {
        const formatted = parseFloat(amount).toFixed(2);
        return this.config.currencyPosition === 'before' 
            ? this.config.currency + formatted 
            : formatted + this.config.currency;
    }

    generateReceiptHTML(orderData) {
        const subtotal = orderData.subtotal || 0;
        const deliveryCharge = orderData.deliveryCharge || 0;
        const taxAmount = this.config.showTax ? (subtotal * this.config.taxRate) : 0;
        const total = subtotal + deliveryCharge + taxAmount;
        
        const date = new Date();
        const receiptDate = date.toLocaleDateString();
        const receiptTime = date.toLocaleTimeString();
        const receiptNo = orderData.orderId || 'RCP' + Date.now();

        let itemsHTML = '';
        orderData.cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            itemsHTML += `
                <tr>
                    <td style="padding: 8px 4px; border-bottom: 1px dashed #ddd;">${index + 1}</td>
                    <td style="padding: 8px 4px; border-bottom: 1px dashed #ddd;">${item.name}</td>
                    <td style="padding: 8px 4px; text-align: center; border-bottom: 1px dashed #ddd;">${item.quantity}</td>
                    <td style="padding: 8px 4px; text-align: right; border-bottom: 1px dashed #ddd;">${this.formatCurrency(item.price)}</td>
                    <td style="padding: 8px 4px; text-align: right; border-bottom: 1px dashed #ddd;"><strong>${this.formatCurrency(itemTotal)}</strong></td>
                </tr>
            `;
        });

        const logoHTML = this.config.logo ? 
            `<img src="${this.config.logo}" alt="Logo" style="max-width: 120px; max-height: 60px; margin-bottom: 10px;" />` 
            : '';

        const taxHTML = this.config.showTax ? `
            <tr>
                <td colspan="4" style="padding: 8px 4px; text-align: right; border-bottom: 1px solid #ddd;"><strong>Tax (${(this.config.taxRate * 100).toFixed(0)}%):</strong></td>
                <td style="padding: 8px 4px; text-align: right; border-bottom: 1px solid #ddd;"><strong>${this.formatCurrency(taxAmount)}</strong></td>
            </tr>
        ` : '';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt - ${receiptNo}</title>
    <style>
        @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
            @page { margin: 10mm; }
        }
        body {
            font-family: 'Courier New', monospace;
            max-width: 80mm;
            margin: 0 auto;
            padding: 10px;
            background: white;
        }
        .receipt {
            border: 2px solid #000;
            padding: 15px;
        }
        .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }
        .header h1 {
            margin: 5px 0;
            font-size: 24px;
        }
        .header p {
            margin: 3px 0;
            font-size: 12px;
        }
        .info-section {
            margin: 10px 0;
            font-size: 12px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 12px;
        }
        th {
            background: #f0f0f0;
            padding: 8px 4px;
            text-align: left;
            border-bottom: 2px solid #000;
        }
        .total-section {
            margin-top: 10px;
            border-top: 2px dashed #000;
            padding-top: 10px;
        }
        .grand-total {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
            text-align: right;
        }
        .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 12px;
        }
        .print-buttons {
            text-align: center;
            margin: 20px 0;
        }
        .btn {
            padding: 10px 20px;
            margin: 5px;
            font-size: 14px;
            cursor: pointer;
            border: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .btn-print {
            background: #28a745;
            color: white;
        }
        .btn-close {
            background: #6c757d;
            color: white;
        }
        .barcode {
            text-align: center;
            margin: 10px 0;
            font-family: 'Libre Barcode 128 Text', cursive;
            font-size: 48px;
            letter-spacing: 2px;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            ${logoHTML}
            <h1>${this.config.businessName}</h1>
            <p>${this.config.businessAddress}</p>
            <p>Phone: ${this.config.businessPhone}</p>
            <p>Email: ${this.config.businessEmail}</p>
        </div>

        <div class="info-section">
            <div class="info-row">
                <span><strong>Receipt No:</strong></span>
                <span>${receiptNo}</span>
            </div>
            <div class="info-row">
                <span><strong>Date:</strong></span>
                <span>${receiptDate} ${receiptTime}</span>
            </div>
            <div class="info-row">
                <span><strong>Customer:</strong></span>
                <span>${orderData.name}</span>
            </div>
            <div class="info-row">
                <span><strong>Phone:</strong></span>
                <span>${orderData.mobile}</span>
            </div>
            <div class="info-row">
                <span><strong>Delivery:</strong></span>
                <span>${orderData.deliveryOption.label}</span>
            </div>
            ${orderData.deliveryType !== 'pickup' ? `
            <div class="info-row">
                <span><strong>Address:</strong></span>
                <span style="text-align: right; max-width: 60%;">${orderData.address}</span>
            </div>
            ` : ''}
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 8%;">#</th>
                    <th style="width: 40%;">Item</th>
                    <th style="width: 12%; text-align: center;">Qty</th>
                    <th style="width: 20%; text-align: right;">Price</th>
                    <th style="width: 20%; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <div class="total-section">
            <table style="margin: 0;">
                <tr>
                    <td colspan="4" style="padding: 8px 4px; text-align: right; border-bottom: 1px solid #ddd;"><strong>Subtotal:</strong></td>
                    <td style="padding: 8px 4px; text-align: right; border-bottom: 1px solid #ddd;"><strong>${this.formatCurrency(subtotal)}</strong></td>
                </tr>
                ${deliveryCharge > 0 ? `
                <tr>
                    <td colspan="4" style="padding: 8px 4px; text-align: right; border-bottom: 1px solid #ddd;"><strong>Delivery Charge:</strong></td>
                    <td style="padding: 8px 4px; text-align: right; border-bottom: 1px solid #ddd;"><strong>${this.formatCurrency(deliveryCharge)}</strong></td>
                </tr>
                ` : ''}
                ${taxHTML}
                <tr>
                    <td colspan="4" style="padding: 12px 4px; text-align: right; border-top: 2px solid #000;"><strong style="font-size: 16px;">TOTAL:</strong></td>
                    <td style="padding: 12px 4px; text-align: right; border-top: 2px solid #000;"><strong style="font-size: 16px;">${this.formatCurrency(total)}</strong></td>
                </tr>
            </table>
        </div>

        <div class="barcode">
            *${receiptNo}*
        </div>

        <div class="footer">
            <p><strong>${this.config.footerMessage}</strong></p>
            <p style="margin-top: 10px; font-size: 10px;">This is a computer generated receipt</p>
        </div>
    </div>

    <div class="print-buttons no-print">
        <button class="btn btn-print" onclick="window.print()">🖨️ Print Receipt</button>
        <button class="btn btn-close" onclick="window.close()">✖️ Close</button>
    </div>

    <script>
        // Auto-print if configured
        if (${this.config.printAutomatically}) {
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 500);
            };
        }
    </script>
</body>
</html>
        `;
    }

    generate(orderData) {
        try {
            // Call before print callback
            if (!this.config.onBeforePrint(orderData)) {
                return false;
            }

            // Generate receipt HTML
            const receiptHTML = this.generateReceiptHTML(orderData);
            
            // Open in new window
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            
            if (!printWindow) {
                throw new Error('Pop-up blocked! Please allow pop-ups for this site.');
            }
            
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            
            // Call success callback
            this.config.onSuccess(orderData);
            
            return true;
        } catch (error) {
            console.error('Receipt generation error:', error);
            this.config.onError(error.message);
            return false;
        }
    }

    // Alternative: Download as PDF (requires browser print to PDF)
    downloadPDF(orderData) {
        this.generate(orderData);
    }

    // Alternative: Get receipt HTML without opening window
    getReceiptHTML(orderData) {
        return this.generateReceiptHTML(orderData);
    }
}

// ============================================
// USAGE EXAMPLE - REPLACE YOUR processOrder() FUNCTION
// ============================================

// Initialize POS Receipt System (Using Global Config)
const posReceipt = new POSReceiptSystem({
    businessName: SHOP_CONFIG.businessName,
    businessAddress: '123 Main Street, City, State', // Add this to your SHOP_CONFIG
    businessPhone: SHOP_CONFIG.businessPhone,
    businessEmail: SHOP_CONFIG.businessEmail,
    currency: SHOP_CONFIG.currency,
    currencyPosition: SHOP_CONFIG.currencyPosition,
    taxRate: 0.18, // 18% GST - set to 0 for no tax
    showTax: false, // Set to true to show tax breakdown
    printAutomatically: true, // Auto-print on receipt generation
    footerMessage: 'Thank you for shopping with us! Visit again!',
    
    // Callbacks
    onSuccess: function(orderData) {
        // Clear cart after successful receipt generation
        cart = [];
        updateCartUI();
        closeCheckoutModal();
        showNotification('success', 'Receipt generated successfully! 🧾');
    },
    onError: function(error) {
        showNotification('error', 'Error generating receipt: ' + error);
    },
    onBeforePrint: function(orderData) {
        showNotification('info', 'Generating receipt...');
        return true; // Return false to cancel
    }
});

// REPLACE YOUR processOrder() FUNCTION WITH THIS:
function processOrder() {
    const name = $('#customerName').val();
    const phone = $('#customerPhone').val();
    const address = $('#customerAddress').val();
    const delivery = $('input[name="delivery"]:checked').val();
    
    if (!name || !phone || !address) {
        showNotification('warning', 'Please fill all required fields');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('warning', 'Your cart is empty!');
        return;
    }
    
    // Calculate totals using global config
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Use config for delivery charge with free delivery logic
    let deliveryCharge = 0;
    if (delivery !== 'pickup') {
        deliveryCharge = subtotal >= SHOP_CONFIG.freeDeliveryAbove ? 0 : SHOP_CONFIG.deliveryCharge;
    }
    
    const total = subtotal + deliveryCharge;
    
    // Prepare order data
    const orderData = {
        name: name,
        mobile: phone,
        address: address,
        deliveryType: delivery,
        deliveryOption: {
            label: delivery === 'pickup' ? 'Store Pickup' : 'Home Delivery'
        },
        cart: cart.map(item => ({
            name: item.title,
            price: item.price,
            quantity: item.quantity,
            category: item.category || 'General'
        })),
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        total: total,
        orderId: 'ORD' + Date.now()
    };
    
    // Show free delivery message if applicable
    if (deliveryCharge === 0 && delivery !== 'pickup' && subtotal >= SHOP_CONFIG.freeDeliveryAbove) {
        showNotification('success', 'You got FREE delivery! 🎉');
    }
    
    // Generate POS Receipt instead of WhatsApp
    posReceipt.generate(orderData);
}
