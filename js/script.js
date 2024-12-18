/**
 * Comprehensive Device Fingerprinting and Information Gathering Script
 * 
 * This script performs two primary functions:
 * 1. Generate a unique device identifier and redirect with collected metadata
 * 2. Render detailed device and network information in a console-like interface
 */

(function() {
    // Utility function to safely extract URL parameters
    const extractBaseUrlAndParams = () => {
        const params = new URLSearchParams(window.location.search);
        // Decode and extract base URL, removing it from search parameters
        const baseUrl = params.get('URL') ? decodeURIComponent(params.get('URL')) : null;
        params.delete('URL');
        const extraParams = params.toString();
        return { baseUrl, extraParams };
    };

    // Enhanced device and network information collection
    const collectDeviceInfo = async () => {
        // Compile device and network details with improved detection and error handling
        const deviceInfo = {
            'User Agent': navigator.userAgent,
            'Operating System': navigator.platform || 'Unknown OS',
            'Device Type': /Mobile|Android|iP(hone|od|ad)|Windows Phone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            'Screen Resolution': `${screen.width}x${screen.height}`,
            'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'Device Memory (RAM)': `${navigator.deviceMemory}GB` || 'Unknown',
            'Network Type': navigator.connection?.effectiveType || 'Unknown',
            'CPU Cores': navigator.hardwareConcurrency || 'Unknown',
            'IP Address': 'Loading...',
            'Location': 'Loading...',
            'Coordinates': 'Loading...',
            'ORG': 'Loading...',
            'Battery Level': 'Loading...',
            'Charging': 'Loading...',
            'Canvas Fingerprint': 'Generating...'
        };

        return deviceInfo;
    };

    // Optimized canvas fingerprinting with improved entropy
    const generateCanvasFingerprint = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Add multiple rendering techniques to increase fingerprint uniqueness
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("Device Fingerprint", 10, 10);
        
        // Additional rendering for increased entropy
        ctx.beginPath();
        ctx.arc(50, 50, 30, 0, 2 * Math.PI);
        ctx.stroke();
        
        return canvas.toDataURL();
    };

    // Robust IP and geolocation data fetching with timeout and fallback
    const fetchIPData = async (timeout = 5000) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch("https://ipinfo.io/json/?fields=status,country,region,city,ip,org,loc", {
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response.ok ? await response.json() : {};
        } catch (error) {
            console.warn("IP geolocation fetch failed:", error);
            return {};
        }
    };

    // Battery status detection with comprehensive fallback
    const getBatteryStatus = async () => {
        if (!navigator.getBattery) {
            return { level: "Unavailable", charging: "Unavailable" };
        }

        try {
            const battery = await navigator.getBattery();
            return {
                level: `${Math.round(battery.level * 100)}%`,
                charging: battery.charging ? "Yes" : "No"
            };
        } catch (error) {
            console.error("Battery API error:", error);
            return { level: "Unavailable", charging: "Unavailable" };
        }
    };

    // Render console-like information display
    const renderConsoleInfo = async () => {
        const consoleContainer = document.querySelector('.console-container');
        const consoleElement = document.getElementById('console');
        const heading = document.querySelector('.heading');

        // Remove redundant loading messages
        document.querySelectorAll('div.message')
            .forEach(div => div.textContent.trim() === 'Verifying Device...' && div.remove());

        // Set background with fallback
        document.body.style.background = 'url("https://th.bing.com/th/id/R.d2d4f69486fb304590d9f6199044f69c?rik=xzAjhg77AISztw&pid=ImgRaw&r=0") no-repeat center';
        document.body.style.backgroundSize = 'cover';

        consoleContainer.style.display = 'flex';

        setTimeout(async () => {
            const deviceInfo = await collectDeviceInfo();
            const canvasFingerprint = await generateCanvasFingerprint();
            deviceInfo['Canvas Fingerprint'] = canvasFingerprint.slice(0, 20) + '...';
            
            heading.textContent = 'Scanning...';

            // Simulate typing effect with better performance
            for (const [key, value] of Object.entries(deviceInfo)) {
                const p = document.createElement('p');
                p.textContent = `${key}: ${value}`;
                consoleElement.appendChild(p);
                await new Promise(resolve => setTimeout(resolve, 150));
            }


            const [ipData, batteryDetails] = await Promise.all([
                fetchIPData(),
                getBatteryStatus()
            ]);

            // Update device info with fetched data
            const updatedInfo = {
                ...deviceInfo,
                'IP Address': ipData.ip || 'Unavailable',
                'Location': `${ipData.city || 'N/A'}, ${ipData.region || 'N/A'}, ${ipData.country || 'N/A'}`,
                'Coordinates': ipData.loc || 'N/A',
                'ORG': ipData.org || 'N/A',
                'Battery Level': batteryDetails.level,
                'Charging': batteryDetails.charging
            };

            // Clear and repopulate console with final data
            consoleElement.innerHTML = '<div class="heading">Scan Complete</div>';
            for (const [key, value] of Object.entries(updatedInfo)) {
                const p = document.createElement('p');
                p.textContent = `${key}: ${value}`;
                consoleElement.appendChild(p);
            }
        }, 4200);
    };

    // Device Fingerprinting and Unique ID Generation
    class DeviceFingerprint {
        // Secure cookie management with improved options
        static getCookie(name) {
            return document.cookie
                .split('; ')
                .find(row => row.startsWith(`${name}=`))
                ?.split('=')[1];
        }

        static setCookie(name, value, days = 365) {
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure;`;
        }

        // Enhanced stable data collection for unique ID generation
        static async collectStableData() {
            const canvasFingerprint = await generateCanvasFingerprint();

            return [
                navigator.userAgent,
                navigator.platform || "Unknown OS",
                `${screen.width}x${screen.height}`,
                navigator.deviceMemory || "Unknown",
                navigator.hardwareConcurrency || "Unknown",
                canvasFingerprint,
                new Date().toISOString(),
                Math.random()
            ].join("|");
        }

        // Cryptographically secure unique ID generation
        static async generateUniqueID() {
            const stableData = await this.collectStableData();
            const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableData));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // URL construction with comprehensive parameter handling
        static constructRedirectURL(uniqueID, ipData, baseUrl, extraParams) {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const params = new URLSearchParams({
                uniqueID,
                timezone,
                location: `${ipData.city || 'N/A'},${ipData.region || 'N/A'},${ipData.country || 'N/A'}`
            });
            
            const fullParams = extraParams ? `${extraParams}&${params.toString()}` : params.toString();

            return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${fullParams}`;
        }

        // Main initialization method
        static async init(baseUrl, extraParams) {
            let uniqueID = this.getCookie('uniqueID');

            if (!uniqueID) {
                uniqueID = await this.generateUniqueID();
                this.setCookie('uniqueID', uniqueID);
            }

            const ipData = await fetchIPData();
            const redirectUrl = this.constructRedirectURL(uniqueID, ipData, baseUrl, extraParams);

            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
        }
    }

    // Script initialization
    function initialize() {
        const { baseUrl, extraParams } = extractBaseUrlAndParams();

        if (baseUrl) {
            // Redirect flow
            DeviceFingerprint.init(baseUrl, extraParams);
        } else {
            // Console information display
            renderConsoleInfo();
        }
    }

    // Trigger script initialization
    initialize();
})();
