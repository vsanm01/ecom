/**
 * GoogleSheetsModal - Display Google Sheets content in modals
 * Fixed version for Sheet5/Sheet6 public modal endpoint
 */

const GoogleSheetsModal = {
    scriptUrl: null,
    
    /**
     * Initialize with your Google Apps Script URL
     * @param {string} url - Your Web App URL
     */
    init: function(url) {
        if (!url) {
            console.error('GoogleSheetsModal: Script URL is required');
            return;
        }
        this.scriptUrl = url;
        console.log('GoogleSheetsModal initialized with URL:', url);
    },
    
    /**
     * Show content from a specific cell in a modal
     * @param {string} title - Modal title
     * @param {string} sheet - Sheet name (Sheet5 or Sheet6)
     * @param {string} range - Cell range (e.g., 'B2' or 'B2:B10')
     */
    showCell: async function(title, sheet, range) {
        if (!this.scriptUrl) {
            console.error('GoogleSheetsModal: Not initialized. Call GoogleSheetsModal.init(url) first');
            return;
        }
        
        // Validate sheet name
        if (sheet !== 'Sheet5' && sheet !== 'Sheet6') {
            console.error('GoogleSheetsModal: Only Sheet5 and Sheet6 are supported');
            return;
        }
        
        try {
            // Build URL for public modal endpoint
            const url = `${this.scriptUrl}?sheet=${sheet}&type=modal&range=${range}`;
            
            console.log('Fetching modal content from:', url);
            
            // Show loading state
            this._showModal(title, '<div style="text-align: center; padding: 20px;">Loading...</div>');
            
            // Fetch data from public endpoint (no authentication needed)
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('Modal data received:', data);
            
            // Process and display data
            let content = '';
            
            if (data.error) {
                content = `<div style="color: #f44336; padding: 20px;">${data.error}</div>`;
            } else if (Array.isArray(data)) {
                // Handle array response
                if (data.length === 1 && data[0].col0 !== undefined) {
                    // Single cell value
                    content = this._formatContent(data[0].col0);
                } else {
                    // Multiple rows
                    content = data.map(row => {
                        const text = row.col0 || row[Object.keys(row)[0]] || '';
                        return `<div style="margin-bottom: 10px;">${this._formatContent(text)}</div>`;
                    }).join('');
                }
            } else if (typeof data === 'object') {
                // Handle object response
                const firstKey = Object.keys(data)[0];
                content = this._formatContent(data[firstKey]);
            } else {
                content = this._formatContent(data);
            }
            
            // Update modal with content
            this._showModal(title, content);
            
        } catch (error) {
            console.error('GoogleSheetsModal error:', error);
            this._showModal(title, `<div style="color: #f44336; padding: 20px;">Error loading content: ${error.message}</div>`);
        }
    },
    
    /**
     * Format content (preserve line breaks, links, etc.)
     * @private
     */
    _formatContent: function(text) {
        if (!text) return '';
        
        // Convert to string
        text = String(text);
        
        // Preserve line breaks
        text = text.replace(/\n/g, '<br>');
        
        // Convert URLs to links
        text = text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" style="color: #2196F3;">$1</a>'
        );
        
        return text;
    },
    
    /**
     * Show modal with content
     * @private
     */
    _showModal: function(title, content) {
        // Remove existing modal if any
        const existingModal = document.getElementById('google-sheets-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal HTML
        const modalHTML = `
            <div id="google-sheets-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s;
            ">
                <div style="
                    background: white;
                    border-radius: 8px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    animation: slideIn 0.3s;
                ">
                    <div style="
                        padding: 20px;
                        border-bottom: 1px solid #e0e0e0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: #f5f5f5;
                        border-radius: 8px 8px 0 0;
                    ">
                        <h2 style="margin: 0; font-size: 20px; color: #333;">${title}</h2>
                        <button onclick="GoogleSheetsModal.closeModal()" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: #666;
                            padding: 0;
                            width: 30px;
                            height: 30px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 50%;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='none'">
                            &times;
                        </button>
                    </div>
                    <div style="padding: 20px; color: #333; line-height: 1.6;">
                        ${content}
                    </div>
                </div>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close on overlay click
        document.getElementById('google-sheets-modal').addEventListener('click', function(e) {
            if (e.target.id === 'google-sheets-modal') {
                GoogleSheetsModal.closeModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                GoogleSheetsModal.closeModal();
            }
        });
    },
    
    /**
     * Close the modal
     */
    closeModal: function() {
        const modal = document.getElementById('google-sheets-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s';
            setTimeout(() => modal.remove(), 300);
        }
    }
};

// Export to window
window.GoogleSheetsModal = GoogleSheetsModal;

console.log('GoogleSheetsModal loaded successfully');
