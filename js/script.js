        /**
         * Extracts the `URL` parameter from the current page's URL and identifies additional parameters.
         * @returns {Object} - Contains `baseUrl` and `extraParams`.
         */
        function extractBaseUrlAndParams() {
            const params = new URLSearchParams(window.location.search);
            const baseUrl = params.get('URL') ? decodeURIComponent(params.get('URL')) : null;
            params.delete('URL');
            const extraParams = params.toString();
            return { baseUrl, extraParams };
        }

        /**
         * Renders information in a stylish console-like container.
         */
        function renderConsoleInfo() {
            const consoleContainer = document.querySelector('.console-container');
            const consoleElement = document.getElementById('console');
            const heading = document.querySelector('.heading');
            document.querySelectorAll('div.message').forEach(div => {
              if (div.textContent.trim() === 'Verifying Device...') div.remove();
            });

            document.body.style.background = 'url("https://th.bing.com/th/id/R.d2d4f69486fb304590d9f6199044f69c?rik=xzAjhg77AISztw&pid=ImgRaw&r=0") no-repeat center';
            document.body.style.backgroundSize = 'cover';

            consoleContainer.style.display = 'flex';
            setTimeout(async () => {
                const info = {
                    'User Agent': navigator.userAgent,
                    'Operating System': navigator.platform || 'Unknown OS',
                    'Device Type': /Mobile|Android|iP(hone|od|ad)|Windows Phone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
                    'Screen Resolution': `${screen.width}x${screen.height}`,
                    'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
                    'IP Address': 'Loading...',
                    'Location': 'Loading...',
                    'Coordinates': 'Loading...',
                    'ORG': 'Loading...',
                    'Device Memory': navigator.deviceMemory || 'Unknown',
                    'Network Type': navigator.connection?.effectiveType || 'Unknown',
                    'Battery Level': 'Loading...',
                    'Charging': 'Loading...',
                    'CPU Cores': navigator.hardwareConcurrency || 'Unknown',
                    'Canvas Fingerprint': (await generateCanvasFingerprint()).slice(0, 20) + '...'
                };

                for (const [key, value] of Object.entries(info)) {
                    const p = document.createElement('p');
                    p.textContent = `${key}: ${value}`;
                    consoleElement.appendChild(p);
                    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate typing effect
                }

                heading.textContent = 'Scan Complete';
                const ipData = await fetchIPData();

                // Fetch Battery Status
                let batteryDetails = {};
                if (navigator.getBattery) {
                    try {
                        const battery = await navigator.getBattery();
                        batteryDetails = {
                            level: Math.round(battery.level * 100) + "%",
                            charging: battery.charging ? "Yes" : "No"
                        };
                    } catch (err) {
                        console.error("Battery API error:", err);
                    }
                } else {
                    batteryDetails = { level: "Unavailable", charging: "Unavailable" };
                }

                const updatedInfo = {
                    ...info,
                    'IP Address': ipData.ip || 'Unavailable',
                    'Location': `${ipData.city || 'N/A'}, ${ipData.region || 'N/A'}, ${ipData.country || 'N/A'}`,
                    'Coordinates': `${ipData.loc || 'N/A'}`,
                    'ORG': ipData.org || 'N/A',
                    'Battery Level': batteryDetails.level || 'N/A',
                    'Charging': batteryDetails.charging || 'N/A',
                };

                consoleElement.innerHTML = '<div class="heading">Scan Complete</div>';
                for (const [key, value] of Object.entries(updatedInfo)) {
                    const p = document.createElement('p');
                    p.textContent = `${key}: ${value}`;
                    consoleElement.appendChild(p);
                }
            }, 4200);
                
        async function generateCanvasFingerprint() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = "top";
            ctx.font = "14px Arial";
            ctx.fillText("Device Fingerprint", 10, 10);
            return canvas.toDataURL();
        }

        async function fetchIPData(timeout = 5000) {
            try {
                const response = await fetch("https://ipinfo.io/json/?fields=status,country,region,city,ip,org,loc"); // Replace with your token if required
                return response.ok ? await response.json() : {};
            } catch (error) {
                console.warn("IP geolocation fetch failed:", error);
                return {};
            }
        }
        }

        /**
         * Initializes the script based on the "URL" parameter.
         */
        function initialize() {
            const { baseUrl, extraParams } = extractBaseUrlAndParams();

            if (baseUrl) {
                // Execute original functionality
                class DeviceFingerprint {
                    static getCookie(name) {
                        return document.cookie
                            .split('; ')
                            .find(row => row.startsWith(`${name}=`))
                            ?.split('=')[1];
                    }

                    static setCookie(name, value, days = 365) {
                        const expires = new Date(Date.now() + days * 315360000000).toUTCString();
                        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
                    }

                    static async generateCanvasFingerprint() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        ctx.textBaseline = "top";
                        ctx.font = "14px Arial";
                        ctx.fillText("Device Fingerprint", 10, 10);
                        return canvas.toDataURL();
                    }

                    static async collectStableData() {
                        const [canvasFingerprint] = await Promise.all([
                            this.generateCanvasFingerprint()
                        ]);

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

                    static async generateUniqueID() {
                        const stableData = await this.collectStableData();
                        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableData));
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    }

                    static async fetchIPData(timeout = 5000) {
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), timeout);

                            const response = await fetch("https://ipinfo.io/json/?fields=status,country,region,city,query", {
                                signal: controller.signal
                            });

                            clearTimeout(timeoutId);
                            return response.ok ? await response.json() : {};
                        } catch (error) {
                            console.warn("IP geolocation fetch failed:", error);
                            return {};
                        }
                    }

                    static async init() {
                        let uniqueID = this.getCookie('uniqueID');

                        if (!uniqueID) {
                            uniqueID = await this.generateUniqueID();
                            this.setCookie('uniqueID', uniqueID);
                        }

                        const ipData = await this.fetchIPData();
                        const redirectUrl = this.constructRedirectURL(uniqueID, ipData, baseUrl);

                        setTimeout(() => {
                            window.location.href = redirectUrl;
                        }, 1500);
                    }

                    static constructRedirectURL(uniqueID, ipData, baseUrl) {
                        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                        const params = new URLSearchParams({
                            uniqueID,
                            timezone,
                            location: `${ipData.city || 'N/A'},${ipData.region || 'N/A'},${ipData.country || 'N/A'}`
                        });
                        
                        const fullParams = extraParams ? `${extraParams}&${params.toString()}` : params.toString();

                        return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${fullParams}`;
                    }
                }

                DeviceFingerprint.init();
            } else {
                // Render console info
                renderConsoleInfo();
            }
        }

        // Initialize the script
        initialize();
