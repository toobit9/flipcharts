module.exports = async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store');

    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        response.status(405).json({ error: 'Use POST.' });
        return;
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
        response.status(500).json({ error: 'Admin password is not configured yet.' });
        return;
    }

    const suppliedPassword = request.body && request.body.password;
    if (typeof suppliedPassword !== 'string' || suppliedPassword.length === 0) {
        response.status(400).json({ error: 'Enter the admin password.' });
        return;
    }

    if (suppliedPassword !== expectedPassword) {
        response.status(401).json({ error: 'That password did not work.' });
        return;
    }

    response.status(200).json({ ok: true });
};
