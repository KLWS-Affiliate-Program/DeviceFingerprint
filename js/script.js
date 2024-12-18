        /**
         * Checks if the current URL contains the "URL" parameter.
         * @returns {string|null} - The value of the "URL" parameter or null if not present.
         */
        function getBaseUrlFromUrlParameter() {
            const params = new URLSearchParams(window.location.search);
            return params.get('URL');
        }

        /**
         * Renders information in a stylish console-like container.
         */
        function renderConsoleInfo() {
            const consoleContainer = document.createElement('div');
            consoleContainer.className = 'console';

            const info = {
                userAgent: navigator.userAgent,
                platform: navigator.platform || 'Unknown OS',
                screenResolution: `${screen.width}x${screen.height}`,
                deviceMemory: navigator.deviceMemory || 'Unknown',
                hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
                currentTime: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            for (const [key, value] of Object.entries(info)) {
                const p = document.createElement('p');
                p.textContent = `${key}: ${value}`;
                consoleContainer.appendChild(p);
            }

            document.body.innerHTML = ''; // Clear the page
            document.body.appendChild(consoleContainer); // Append console
        }

        /**
         * Initializes the script based on the "URL" parameter.
         */
        function initialize() {
            const baseUrl = getBaseUrlFromUrlParameter();

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
                        const expires = new Date(Date.now() + days * 86400000).toUTCString();
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

                            const response = await fetch("http://ipinfo.io/json/?fields=status,country,region,city,query", {
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

                        return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.toString()}`;
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
