import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const getDeviceFingerprint = async () => {
    try {
        // Initialize FingerprintJS
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        
        // Get fingerprint
        const fingerprint = result.visitorId;
        
        // Get IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        // Combine fingerprint with IP for a unique identifier
        return `${fingerprint}-${ipData.ip}`;
    } catch (error) {
        console.error('Error generating device fingerprint:', error);
        throw error;
    }
};