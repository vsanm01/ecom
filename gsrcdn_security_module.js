function computeHMAC(params, secret) {
    return CryptoJS.HmacSHA256(params, secret).toString();
}

function createSignature(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys.map(key => key + '=' + params[key]).join('&');
    return computeHMAC(signatureString, secret);
}

async function makeSecureRequest(params) {
    try {
        params.token = GSRCDN_CONFIG.apiToken;
        params.timestamp = Date.now().toString();
        params.referrer = window.location.origin;
        params.origin = window.location.origin;
        params.signature = createSignature(params, GSRCDN_CONFIG.hmacSecret);

        const url = new URL(GSRCDN_CONFIG.scriptUrl);
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'success') {
            return data;
        } else {
            throw new Error(data.message || 'Request failed');
        }
    } catch (error) {
        console.error('Secure request error:', error);
        throw error;
    }
}
