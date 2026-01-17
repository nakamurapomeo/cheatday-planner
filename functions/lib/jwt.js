// JWT utilities for Cloudflare Workers
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Base64URL encode
function base64url(data) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Base64URL decode
function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// Create JWT
export async function createJWT(payload, secret, expiresIn = 86400) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const data = {
        ...payload,
        iat: now,
        exp: now + expiresIn,
    };

    const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
    const payloadB64 = base64url(encoder.encode(JSON.stringify(data)));
    const message = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const signatureB64 = base64url(signature);

    return `${message}.${signatureB64}`;
}

// Verify JWT
export async function verifyJWT(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [headerB64, payloadB64, signatureB64] = parts;
        const message = `${headerB64}.${payloadB64}`;

        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signature = base64urlDecode(signatureB64);
        const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message));

        if (!valid) return null;

        const payload = JSON.parse(decoder.decode(base64urlDecode(payloadB64)));

        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch (e) {
        return null;
    }
}

// Parse cookies from request
export function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) cookies[name] = rest.join('=');
    });

    return cookies;
}

// Create HttpOnly cookie
export function createAuthCookie(token, maxAge = 86400 * 7) {
    return `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

// Clear auth cookie
export function clearAuthCookie() {
    return `auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
