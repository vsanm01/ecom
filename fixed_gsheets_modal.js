/**
 * Fixed Google Sheets Modal Library with Debug Logging
 * Version: 2.1.0 (Debug)
 */

(function(window) {
    'use strict';
    
    const GoogleSheetsModal = {
        scriptUrl: '',
        modalId: 'gsm-modal',
        initialized: false,
        debug: true, // Enable debug logging
        
        /**
         * Initialize the library with Google Apps Script URL
         */
        init: function(url) {
            this.scriptUrl = url;
            this.createModal();
            this.attachEventListeners();
            this.initialized = true;
            console.log('✅ Google Sheets Modal initialized with URL:', url);
        },
        
        /**
         * Set or update the script URL
         */
        setScriptUrl: function(url) {
            this.scriptUrl = url;
            console.log('✅ Script URL updated:', url);
        },
        
        /**
         * Create modal HTML structure
         */
        createModal: function() {
            if (document.getElementById(this.modalId)) {
                console.log('ℹ️ Modal already exists');
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
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            if (!document.getElementById('gsm-styles')) {
                this.addStyles();
            }
            
            console.log('✅ Modal HTML created');
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
                
                .gsm-modal-body ul {
                    margin: 10px 0;
                    padding-left: 25px;
                }
                
                .gsm-modal-body li {
                    margin: 8px 0;
                }
                
                .gsm-modal-body table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                
                .gsm-modal-body th {
                    background: #667eea;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                }
                
                .gsm-modal-body td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #eee;
                }
                
                .gsm-modal-body tr:hover {
                    background: #f9f9f9;
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
                
                .gsm-cell-group {
                    margin: 15px 0;
                    padding: 15px;
                    background: #f9f9f9;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                }
                
                .gsm-cell-label {
                    font-weight: 600;
                    color: #667eea;
                    margin-bottom: 5px;
                }
                
                .gsm-debug {
                    background: #e3f2fd;
                    border: 1px solid #2196f3;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 5px;
                    font-family: monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.id = 'gsm-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
            
            console.log('✅ Modal styles added');
        },
        
        /**
         * Attach event listeners
         */
        attachEventListeners: function() {
            window.addEventListener('click', (event) => {
                const modal = document.getElementById(this.modalId);
                if (event.target === modal) {
                    this.close();
                }
            });
            
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    this.close();
                }
            });
        },
        
        /**
         * Determine the type of range
         */
        detectRangeType: function(range) {
            if (range.includes(',')) {
                return 'multiple';
            }
            
            if (range.includes(':')) {
                const [start, end] = range.split(':');
                const startMatch = start.match(/([A-Z]+)(\d+)/);
                const endMatch = end.match(/([A-Z]+)(\d+)/);
                
                if (startMatch && endMatch) {
                    const [, startCol, startRow] = startMatch;
                    const [, endCol, endRow] = endMatch;
                    
                    if (startCol === endCol) return 'column';
                    if (startRow === endRow) return 'row';
                    return 'table';
                }
            }
            
            return 'single';
        },
        
        /**
         * Format data based on range type
         */
        formatData: function(data, rangeType, range) {
            console.log('📊 Formatting data:', {
                rangeType: rangeType,
                range: range,
                dataLength: data.length,
                firstItem: data[0]
            });
            
            if (!data || data.length === 0) {
                return '<p>No data found in the specified range</p>';
            }
            
            switch (rangeType) {
                case 'single':
                    return this.formatSingle(data);
                
                case 'column':
                    return this.formatColumn(data);
                
                case 'row':
                    return this.formatRow(data);
                
                case 'table':
                    return this.formatTable(data);
                
                case 'multiple':
                    return this.formatMultiple(data, range);
                
                default:
                    return '<p>Unable to format data</p>';
            }
        },
        
        /**
         * Format single cell
         */
        formatSingle: function(data) {
            console.log('🔍 Formatting single cell:', data[0]);
            
            if (!data[0]) {
                return '<p>No data found</p>';
            }
            
            // Get the first (and only) value from the object
            const values = Object.values(data[0]);
            const cellValue = values[0];
            
            console.log('📝 Cell value:', cellValue);
            
            if (cellValue === undefined || cellValue === null || cellValue === '') {
                return '<p>Cell is empty</p>';
            }
            
            const content = String(cellValue).replace(/\n/g, '<br>');
            return `<p>${content}</p>`;
        },
        
        /**
         * Format column range (vertical list)
         */
        formatColumn: function(data) {
            console.log('📋 Formatting column:', data.length, 'rows');
            
            let html = '<ul>';
            let itemCount = 0;
            
            data.forEach((row, index) => {
                const value = Object.values(row)[0];
                console.log(`  Row ${index}:`, value);
                
                if (value !== undefined && value !== null && value !== '') {
                    html += `<li>${String(value).replace(/\n/g, '<br>')}</li>`;
                    itemCount++;
                }
            });
            html += '</ul>';
            
            console.log(`✅ Formatted ${itemCount} items`);
            return itemCount > 0 ? html : '<p>No non-empty cells found</p>';
        },
        
        /**
         * Format row range (horizontal list)
         */
        formatRow: function(data) {
            console.log('📋 Formatting row:', data[0]);
            
            if (data.length === 0) return '<p>No data found</p>';
            
            let html = '<ul>';
            let itemCount = 0;
            const row = data[0];
            
            Object.values(row).forEach((value, index) => {
                console.log(`  Col ${index}:`, value);
                
                if (value !== undefined && value !== null && value !== '') {
                    html += `<li>${String(value).replace(/\n/g, '<br>')}</li>`;
                    itemCount++;
                }
            });
            html += '</ul>';
            
            console.log(`✅ Formatted ${itemCount} items`);
            return itemCount > 0 ? html : '<p>No non-empty cells found</p>';
        },
        
        /**
         * Format table range
         */
        formatTable: function(data) {
            console.log('📊 Formatting table:', data.length, 'rows');
            
            let html = '<table>';
            
            // First row as header
            const headers = data[0];
            html += '<thead><tr>';
            Object.values(headers).forEach(header => {
                html += `<th>${header || ''}</th>`;
            });
            html += '</tr></thead>';
            
            // Remaining rows as data
            html += '<tbody>';
            for (let i = 1; i < data.length; i++) {
                html += '<tr>';
                Object.values(data[i]).forEach(cell => {
                    const cellContent = cell !== undefined && cell !== null ? String(cell).replace(/\n/g, '<br>') : '';
                    html += `<td>${cellContent}</td>`;
                });
                html += '</tr>';
            }
            html += '</tbody></table>';
            
            console.log('✅ Table formatted');
            return html;
        },
        
        /**
         * Format multiple non-contiguous cells
         */
        formatMultiple: function(data, range) {
            console.log('📦 Formatting multiple cells:', range);
            
            const cells = range.split(',').map(c => c.trim());
            let html = '';
            
            data.forEach((row, index) => {
                const cellLabel = cells[index] || `Cell ${index + 1}`;
                const value = Object.values(row)[0];
                const content = value !== undefined && value !== null ? String(value).replace(/\n/g, '<br>') : 'Empty';
                
                console.log(`  ${cellLabel}:`, value);
                
                html += `
                    <div class="gsm-cell-group">
                        <div class="gsm-cell-label">${cellLabel}</div>
                        <div>${content}</div>
                    </div>
                `;
            });
            
            return html;
        },
        
        /**
         * Show modal with cell data
         */
        showCell: async function(title, sheetName, cellRange) {
            if (!this.initialized) {
                console.error('❌ Google Sheets Modal not initialized. Call GoogleSheetsModal.init(url) first.');
                return;
            }
            
            if (!this.scriptUrl) {
                console.error('❌ Script URL not set.');
                return;
            }
            
            console.log('🚀 Fetching data:', {
                title: title,
                sheet: sheetName,
                range: cellRange
            });
            
            const modal = document.getElementById(this.modalId);
            const modalTitle = document.getElementById(`${this.modalId}-title`);
            const modalBody = document.getElementById(`${this.modalId}-body`);
            
            modalTitle.textContent = title;
            modalBody.innerHTML = '<p class="gsm-loading">Loading...</p>';
            modal.style.display = 'block';
            
            try {
                // Detect range type
                const rangeType = this.detectRangeType(cellRange);
                console.log('📍 Range type:', rangeType);
                
                // Build URL
                const url = `${this.scriptUrl}?sheet=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(cellRange)}&type=modal`;
                console.log('🌐 Fetching URL:', url);
                
                // Fetch data
                const response = await fetch(url);
                console.log('📥 Response status:', response.status);
                
                const data = await response.json();
                console.log('📦 Raw data received:', data);
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Show debug info if enabled
                let debugInfo = '';
                if (this.debug) {
                    debugInfo = `
                        <div class="gsm-debug">
                            <strong>Debug Info:</strong><br>
                            Range Type: ${rangeType}<br>
                            Data Items: ${data.length}<br>
                            First Item: ${JSON.stringify(data[0], null, 2)}
                        </div>
                    `;
                }
                
                // Format and display data
                const formattedContent = this.formatData(data, rangeType, cellRange);
                modalBody.innerHTML = debugInfo + formattedContent;
                
                console.log('✅ Data displayed successfully');
                
            } catch (error) {
                console.error('❌ Error:', error);
                modalBody.innerHTML = `<div class="gsm-error">Error loading data: ${error.message}</div>`;
            }
        },
        
        /**
         * Show modal with custom content
         */
        showContent: function(title, content) {
            if (!this.initialized) {
                console.error('❌ Google Sheets Modal not initialized.');
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
                console.log('✅ Modal closed');
            }
        }
    };
    
    window.GoogleSheetsModal = GoogleSheetsModal;
    
})(window);