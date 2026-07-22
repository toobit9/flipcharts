const crypto = require('crypto');

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function encodeBase64Url(value) {
    return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(encodedPayload) {
    return crypto
        .createHmac('sha256', process.env.ADMIN_PASSWORD || '')
        .update(encodedPayload)
        .digest('base64url');
}

function createAdminToken() {
    const payload = JSON.stringify({
        role: 'admin',
        exp: Date.now() + TOKEN_TTL_MS
    });
    const encodedPayload = encodeBase64Url(payload);
    const signature = signPayload(encodedPayload);
    return `${encodedPayload}.${signature}`;
}

function verifyAdminToken(token) {
    if (!process.env.ADMIN_PASSWORD || typeof token !== 'string') return false;

    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return false;

    const expectedSignature = signPayload(encodedPayload);
    const supplied = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
        return false;
    }

    try {
        const payload = JSON.parse(decodeBase64Url(encodedPayload));
        return payload.role === 'admin' && typeof payload.exp === 'number' && payload.exp > Date.now();
    } catch (error) {
        return false;
    }
}

function verifyAdminRequest(request) {
    const authorization = request.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    return verifyAdminToken(token);
}

module.exports = {
    createAdminToken,
    verifyAdminRequest
};
