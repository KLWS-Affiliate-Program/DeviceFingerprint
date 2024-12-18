/**
 * Parses the URL to extract the 'URL' parameter and any additional parameters.
 * @returns {Object} Contains `baseUrl` and `extraParams`.
 */
function extractBaseUrlAndParams() {
    const params = new URLSearchParams(window.location.search);
    const baseUrl = params.get('URL') ? decodeURIComponent(params.get('URL')) : null;
    params.delete('URL');
    return { baseUrl, extraParams: params.toString() };
}

/**
 * Removes verification messages, sets up background, and displays device information.
 */
async function renderConsoleInfo() {
    document.querySelectorAll('div.message').forEach(div => {
        if (div.textContent.trim() === 'Verifying Device...') div.remove();
    });

    document.body.style.cssText = 'background: url("https://th.bing.com/th/id/R.d2d4f69486fb304590d9f6199044f69c?rik=xzAjhg77AISztw&pid=ImgRaw&r=0") no-repeat center; background-size: cover;';
    const consoleContainer = document.querySelector('.console-container');
    consoleContainer.style.display = 'flex';

    setTimeout(async () => {
        const info = await gatherDeviceInfo();
        displayDeviceInfo(info, document.getElementById('console'));
    }, 4200);
}

/**
 * Gathers detailed device information using various web APIs.
 * @returns {Object} Device information.
 */
async function gatherDeviceInfo() {
    const canvasFingerprint = await generateCanvasFingerprint();
    const ipData = await fetchIPData();
    const batteryDetails = await getBatteryDetails();

    return {
        'User Agent': navigator.userAgent,
        'Operating System': navigator.platform || 'Unknown OS',
        'Device Type': /Mobile|Android|iP(hone|od|ad)|Windows Phone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        'Screen Resolution': `${screen.width}x${screen.height}`,
        'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        'IP Address': ipData.ip || 'Loading...',
        'Location': `${ipData.city || 'N/A'}, ${ipData.region || 'N/A'}, ${ipData.country || 'N/A'}`,
        'Coordinates': ipData.loc || 'Loading...',
        'ORG': ipData.org || 'Loading...',
        'Device Memory': navigator.deviceMemory || 'Unknown',
        'Network Type': navigator.connection?.effectiveType || 'Unknown',
        'Battery Level': batteryDetails.level,
        'Charging': batteryDetails.charging,
        'CPU Cores': navigator.hardwareConcurrency || 'Unknown',
        'Canvas Fingerprint': canvasFingerprint.slice(0, 20) + '...'
    };
}

/**
 * Displays device information with a simulated typing effect.
 * @param {Object} info - Device information.
 * @param {HTMLElement} consoleElement - Element to display information.
 */
function displayDeviceInfo(info, consoleElement) {
    consoleElement.innerHTML = ''; // Clear existing content
    Object.entries(info).forEach(([key, value], index) => {
        setTimeout(() => {
            const p = document.createElement('p');
            p.textContent = `${key}: ${value}`;
            consoleElement.appendChild(p);
        }, index * 150); // Simulate typing effect
    });
}

/**
 * Generates a canvas-based device fingerprint.
 * @returns {Promise<string>} Base64 encoded canvas fingerprint.
 */
async function generateCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device Fingerprint', 10, 10);
    return canvas.toDataURL();
}

/**
 * Fetches IP geolocation data with robust error handling.
 * @returns {Promise<Object>} IP geolocation data or empty object on failure.
 */
async function fetchIPData() {
    try {
        const response = await fetch("https://ipinfo.io/json/?fields=status,country,region,city,ip,org,loc");
        return response.ok ? await response.json() : {};
    } catch (error) {
        console.warn("IP geolocation fetch failed:", error);
        return {};
    }
}

/**
 * Fetches battery status using the Battery API.
 * @returns {Promise<Object>} Object containing battery level and charging status.
 */
async function getBatteryDetails() {
    if (!navigator.getBattery) return { level: 'Unavailable', charging: 'Unavailable' };

    try {
        const battery = await navigator.getBattery();
        return {
            level: `${Math.round(battery.level * 100)}%`,
            charging: battery.charging ? 'Yes' : 'No'
        };
    } catch (error) {
        console.error('Battery API error:', error);
        return { level: 'Error', charging: 'Error' };
    }
}

/**
 * Main initialization function based on URL parameters.
 */
function initialize() {
    const { baseUrl, extraParams } = extractBaseUrlAndParams();

    if (baseUrl) {
        DeviceFingerprint.init(baseUrl, extraParams);
    } else {
        renderConsoleInfo();
    }
}

class DeviceFingerprint {
    static getCookie(name) {
        const match = document.cookie.match(`(^| )${name}=([^;]+)`);
        return match ? decodeURIComponent(match[2]) : undefined;
    }

    static setCookie(name, value, days = 3650) { // Setting cookies to expire after 10 years
        const expires = new Date(Date.now() + days * 86400000).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
    }

    static async init(baseUrl, extraParams) {
        let uniqueID = this.getCookie('uniqueID') || await this.generateUniqueID();
        this.setCookie('uniqueID', uniqueID);

        const ipData = await fetchIPData();
        const redirectUrl = this.constructRedirectURL(uniqueID, ipData, baseUrl, extraParams);

        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);
    }

    static constructRedirectURL(uniqueID, ipData, baseUrl, extraParams) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const params = new URLSearchParams({
            uniqueID,
            timezone,
            location: `${ipData.city || 'N/A'},${ipData.region || 'N/A'},${ipData.country || 'N/A'}`
        });

        return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}` + (extraParams ? `${extraParams}&${params}` : params);
    }

    static async generateUniqueID() {
        const stableData = await this.collectStableData();
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stableData));
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static async collectStableData() {
        const canvasFingerprint = await generateCanvasFingerprint();
        return [
            navigator.userAgent,
            navigator.platform || 'Unknown OS',
            `${screen.width}x${screen.height}`,
            navigator.deviceMemory || 'Unknown',
            navigator.hardwareConcurrency || 'Unknown',
            canvasFingerprint,
            new Date().toISOString(),
            Math.random()
        ].join('|');
    }
}

// Trigger the initialization
initialize();
