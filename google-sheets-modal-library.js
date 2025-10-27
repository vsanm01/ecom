/**
 * Google Sheets Modal Library
 * A reusable library to display Google Sheets cell data in modals
 * Version: 1.0.0
 * 
 * Usage:
 * 1. Include this script in your HTML
 * 2. Initialize: GoogleSheetsModal.init('YOUR_SCRIPT_URL');
 * 3. Show modal: GoogleSheetsModal.showCell('Title', 'SheetName', 'CellRange');
 */

(function(window) {
    'use strict';
    
    const GoogleSheetsModal = {
        scriptUrl: '',
        modalId: 'gsm-modal',
        initialized: false,
        
        /**
         * Initialize the library with Google Apps Script URL
         * @param {string} url - Google Apps Script Web App URL
         */
        init: function(url) {
            this.scriptUrl = url;
            this.createModal();
            this.attachEventListeners();
            this.initialized = true;
            console.log('Google Sheets Modal Library initialized');
        },
        
        /**
         * Set or update the script URL
         * @param {string} url - Google Apps Script Web App URL
         */
        setScriptUrl: function(url) {
            this.scriptUrl = url;
        },
        
        /**
         * Create modal HTML structure
         */
        createModal: function() {
            // Check if modal already exists
            if (document.getElementById(this.modalId)) {
                return;
            }
            
            const modalHTML = `
                <div id="${this.modalId}" class="gsm-modal">
                    <div class="gsm-modal-content">
                        <div class="gsm-modal-header">
                            <h2 id="${this.modalId}-title">Information</h2>
                            <button class="gsm-close-btn" onclick="GoogleSheetsModal.close()">×</button>
                        </div>
                        <div class="gsm-modal-body" id="${this.modalId}-body">
                            Loading...
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add CSS if not already added
            if (!document.getElementById('gsm-styles')) {
                this.addStyles();
            }
        },
        
        /**
         * Add CSS styles for the modal
         */
        addStyles: function() {
            const styles = `
                .gsm-modal {
                    display: none;
                    position: fixed;
                    z-index: 10000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    animation: gsm-fadeIn 0.3s;
                }
                
                @keyframes gsm-fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .gsm-modal-content {
                    background-color: white;
                    margin: 5% auto;
                    padding: 30px;
                    border-radius: 15px;
                    width: 80%;
                    max-width: 700px;
                    max-height: 70vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    animation: gsm-slideDown 0.3s;
                }
                
                @keyframes gsm-slideDown {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .gsm-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #eee;
                }
                
                .gsm-modal-header h2 {
                    color: #667eea;
                    margin: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .gsm-close-btn {
                    background: #f44336;
                    color: white;
                    border: none;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                    line-height: 1;
                    padding: 0;
                }
                
                .gsm-close-btn:hover {
                    background: #d32f2f;
                    transform: rotate(90deg);
                }
                
                .gsm-modal-body {
                    color: #555;
                    line-height: 1.8;
                    font-size: 15px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .gsm-modal-body p {
                    margin: 10px 0;
                }
                
                .gsm-loading {
                    text-align: center;
                    padding: 20px;
                }
                
                .gsm-error {
                    color: #c33;
                    background: #fee;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #c33;
                }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.id = 'gsm-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        },
        
        /**
         * Attach event listeners
         */
        attachEventListeners: function() {
            // Close modal when clicking outside
            window.addEventListener('click', (event) => {
                const modal = document.getElementById(this.modalId);
                if (event.target === modal) {
                    this.close();
                }
            });
            
            // Close modal on ESC key
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    this.close();
                }
            });
        },
        
        /**
         * Show modal with cell data
         * @param {string} title - Modal title
         * @param {string} sheetName - Sheet name
         * @param {string} cellRange - Cell range (e.g., 'B37')
         */
        showCell: async function(title, sheetName, cellRange) {
            if (!this.initialized) {
                console.error('Google Sheets Modal not initialized. Call GoogleSheetsModal.init(url) first.');
                return;
            }
            
            if (!this.scriptUrl) {
                console.error('Script URL not set. Call GoogleSheetsModal.setScriptUrl(url) first.');
                return;
            }
            
            // Show modal with loading state
            const modal = document.getElementById(this.modalId);
            const modalTitle = document.getElementById(`${this.modalId}-title`);
            const modalBody = document.getElementById(`${this.modalId}-body`);
            
            modalTitle.textContent = title;
            modalBody.innerHTML = '<p class="gsm-loading">Loading...</p>';
            modal.style.display = 'block';
            
            try {
                // Fetch specific cell data
                const url = `${this.scriptUrl}?sheet=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(cellRange)}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Display the cell content
                let content = '';
                if (data && data.length > 0 && data[0]) {
                    const cellValue = Object.values(data[0])[0];
                    content = cellValue ? String(cellValue).replace(/\n/g, '<br>') : 'No content found';
                } else {
                    content = 'No data found in the specified cell';
                }
                
                modalBody.innerHTML = `<p>${content}</p>`;
                
            } catch (error) {
                modalBody.innerHTML = `<div class="gsm-error">Error loading data: ${error.message}</div>`;
                console.error('Error:', error);
            }
        },
        
        /**
         * Show modal with custom content
         * @param {string} title - Modal title
         * @param {string} content - HTML content
         */
        showContent: function(title, content) {
            if (!this.initialized) {
                console.error('Google Sheets Modal not initialized. Call GoogleSheetsModal.init(url) first.');
                return;
            }
            
            const modal = document.getElementById(this.modalId);
            const modalTitle = document.getElementById(`${this.modalId}-title`);
            const modalBody = document.getElementById(`${this.modalId}-body`);
            
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            modal.style.display = 'block';
        },
        
        /**
         * Close the modal
         */
        close: function() {
            const modal = document.getElementById(this.modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        }
    };
    
    // Expose to window
    window.GoogleSheetsModal = GoogleSheetsModal;
    
})(window);


// Example Usage:
/*

// 1. Include this script in your HTML
<script src="path/to/google-sheets-modal.js"></script>

// 2. Initialize with your Google Apps Script URL
<script>
    GoogleSheetsModal.init('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
</script>

// 3. Use in your buttons
<button onclick="GoogleSheetsModal.showCell('FAQ', 'Sheet3', 'B37')">FAQ</button>
<button onclick="GoogleSheetsModal.showCell('ReadMe', 'Sheet3', 'B54')">ReadMe</button>

// Or in JavaScript
document.getElementById('faqBtn').addEventListener('click', function() {
    GoogleSheetsModal.showCell('FAQ', 'Sheet3', 'B37');
});

// Show custom content
GoogleSheetsModal.showContent('Title', '<p>Custom HTML content here</p>');

// Update script URL anytime
GoogleSheetsModal.setScriptUrl('https://script.google.com/macros/s/NEW_ID/exec');

*/