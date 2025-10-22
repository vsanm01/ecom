/**
 * Google Apps Script - E-Commerce API with CORS Support
 * Server-side implementation matching client-side GSRCDN Security Module
 * Deploy as: Web App -> Execute as: Me -> Who has access: Anyone
 */

// Configuration
const CONFIG = {
  SHEET_ID: 'YOUR_SHEET_ID', // Replace with your Google Sheet ID
  API_TOKEN: 'tok_25dc153a0d1a2f86fe34f394f6d6a3cb',
  HMAC_SECRET: 'df62617b8f084303f70ef7f1cf68952302b4960b7a1dfceddd5f2a851685937e',
  DEBUG: true
};

/**
 * Handle GET requests - MAIN ENTRY POINT
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Main request handler
 */
function handleRequest(e) {
  try {
    const params = e.parameter || {};
    
    if (CONFIG.DEBUG) {
      Logger.log('=== REQUEST START ===');
      Logger.log('Received params: ' + JSON.stringify(params));
    }
    
    // Validate token
    if (!params.token || params.token !== CONFIG.API_TOKEN) {
      if (CONFIG.DEBUG) Logger.log('ERROR: Invalid token');
      return createResponse({
        status: 'error',
        message: 'Invalid API token'
      });
    }
    
    // Validate signature
    const isValidSignature = validateSignature(params, CONFIG.HMAC_SECRET);
    if (!isValidSignature) {
      if (CONFIG.DEBUG) Logger.log('ERROR: Invalid signature');
      return createResponse({
        status: 'error',
        message: 'Invalid signature'
      });
    }
    
    // Validate timestamp (5 minute window)
    const timestamp = parseInt(params.timestamp);
    const now = Date.now();
    const timeDiff = Math.abs(now - timestamp);
    if (timeDiff > 300000) {
      if (CONFIG.DEBUG) Logger.log('ERROR: Request expired. Time diff: ' + timeDiff);
      return createResponse({
        status: 'error',
        message: 'Request expired'
      });
    }
    
    // Route action
    let result;
    switch(params.action) {
      case 'getData':
        result = getData(params);
        break;
      case 'createOrder':
        result = createOrder(params);
        break;
      case 'updateStock':
        result = updateStock(params);
        break;
      default:
        result = {
          status: 'error',
          message: 'Invalid action: ' + params.action
        };
    }
    
    if (CONFIG.DEBUG) {
      Logger.log('Response: ' + JSON.stringify(result));
      Logger.log('=== REQUEST END ===');
    }
    
    return createResponse(result);
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return createResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

/**
 * Create response with proper headers
 */
function createResponse(data) {
  const json = JSON.stringify(data);
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Compute HMAC SHA256 - Server Side
 * Matches client-side: CryptoJS.HmacSHA256(params, secret).toString()
 */
function computeHMAC(params, secret) {
  try {
    const signature = Utilities.computeHmacSha256Signature(
      params,
      secret
    );
    
    // Convert to hex string (same as CryptoJS output)
    const hexString = signature.map(function(byte) {
      const hex = (byte & 0xFF).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
    
    if (CONFIG.DEBUG) {
      Logger.log('computeHMAC input: ' + params);
      Logger.log('computeHMAC output: ' + hexString);
    }
    
    return hexString;
  } catch (error) {
    Logger.log('computeHMAC error: ' + error.toString());
    throw error;
  }
}

/**
 * Create signature from parameters - Server Side
 * Matches client-side createSignature function exactly
 */
function createSignature(params, secret) {
  try {
    // Sort keys alphabetically (same as client)
    const sortedKeys = Object.keys(params).sort();
    
    // Create signature string: key1=value1&key2=value2
    const signatureString = sortedKeys
      .map(function(key) {
        return key + '=' + params[key];
      })
      .join('&');
    
    if (CONFIG.DEBUG) {
      Logger.log('Signature string: ' + signatureString);
    }
    
    // Compute HMAC
    const signature = computeHMAC(signatureString, secret);
    
    if (CONFIG.DEBUG) {
      Logger.log('Computed signature: ' + signature);
    }
    
    return signature;
  } catch (error) {
    Logger.log('createSignature error: ' + error.toString());
    throw error;
  }
}

/**
 * Validate HMAC signature - Server Side
 * Matches client-side signature validation
 */
function validateSignature(params, secret) {
  try {
    const receivedSignature = params.signature;
    
    if (!receivedSignature) {
      if (CONFIG.DEBUG) Logger.log('No signature provided');
      return false;
    }
    
    // Create params object without signature (same as client)
    const paramsForSigning = {};
    Object.keys(params).forEach(function(key) {
      if (key !== 'signature') {
        paramsForSigning[key] = params[key];
      }
    });
    
    if (CONFIG.DEBUG) {
      Logger.log('Params for signing: ' + JSON.stringify(paramsForSigning));
      Logger.log('Received signature: ' + receivedSignature);
    }
    
    // Compute expected signature
    const computedSignature = createSignature(paramsForSigning, secret);
    
    if (CONFIG.DEBUG) {
      Logger.log('Computed signature: ' + computedSignature);
      Logger.log('Signatures match: ' + (computedSignature === receivedSignature));
    }
    
    return computedSignature === receivedSignature;
    
  } catch (error) {
    Logger.log('validateSignature error: ' + error.toString());
    return false;
  }
}

/**
 * Get data from sheet
 */
function getData(params) {
  try {
    const dataType = params.dataType || 'products';
    
    if (CONFIG.DEBUG) {
      Logger.log('getData called with dataType: ' + dataType);
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    
    let sheet;
    if (dataType === 'products') {
      sheet = ss.getSheetByName('Products');
    } else if (dataType === 'orders') {
      sheet = ss.getSheetByName('Orders');
    } else if (dataType === 'categories') {
      sheet = ss.getSheetByName('Categories');
    } else {
      return {
        status: 'error',
        message: 'Invalid data type: ' + dataType
      };
    }
    
    if (!sheet) {
      return {
        status: 'error',
        message: 'Sheet not found: ' + dataType
      };
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return {
        status: 'success',
        data: [],
        count: 0
      };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Convert to array of objects
    const result = rows.map(function(row) {
      const obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    });
    
    if (CONFIG.DEBUG) {
      Logger.log('Found ' + result.length + ' records');
    }
    
    return {
      status: 'success',
      data: result,
      count: result.length
    };
    
  } catch (error) {
    Logger.log('getData error: ' + error.toString());
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Create order
 */
function createOrder(params) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName('Orders');
    
    if (!sheet) {
      return {
        status: 'error',
        message: 'Orders sheet not found'
      };
    }
    
    const orderId = 'ORD' + Date.now();
    const timestamp = new Date();
    
    sheet.appendRow([
      orderId,
      params.customerName || '',
      params.customerPhone || '',
      params.customerAddress || '',
      params.items || '',
      params.total || 0,
      params.delivery || 'home',
      timestamp,
      'pending'
    ]);
    
    if (CONFIG.DEBUG) {
      Logger.log('Order created: ' + orderId);
    }
    
    return {
      status: 'success',
      orderId: orderId,
      message: 'Order created successfully'
    };
    
  } catch (error) {
    Logger.log('createOrder error: ' + error.toString());
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Update stock
 */
function updateStock(params) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName('Products');
    
    if (!sheet) {
      return {
        status: 'error',
        message: 'Products sheet not found'
      };
    }
    
    const productId = params.productId;
    const newStock = parseInt(params.stock);
    
    if (!productId || isNaN(newStock)) {
      return {
        status: 'error',
        message: 'Invalid parameters'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id') || headers.indexOf('Id');
    const stockIndex = headers.indexOf('stock') || headers.indexOf('Stock');
    
    if (idIndex === -1 || stockIndex === -1) {
      return {
        status: 'error',
        message: 'Required columns not found'
      };
    }
    
    // Find product row
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === productId) {
        sheet.getRange(i + 1, stockIndex + 1).setValue(newStock);
        
        if (CONFIG.DEBUG) {
          Logger.log('Stock updated for product: ' + productId + ' to ' + newStock);
        }
        
        return {
          status: 'success',
          message: 'Stock updated successfully',
          productId: productId,
          newStock: newStock
        };
      }
    }
    
    return {
      status: 'error',
      message: 'Product not found: ' + productId
    };
    
  } catch (error) {
    Logger.log('updateStock error: ' + error.toString());
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Test function to verify HMAC computation
 */
function testHMAC() {
  const testParams = {
    action: 'getData',
    dataType: 'products',
    timestamp: '1234567890',
    token: 'test_token'
  };
  
  const signature = createSignature(testParams, CONFIG.HMAC_SECRET);
  
  Logger.log('Test signature: ' + signature);
  Logger.log('Test complete');
}
