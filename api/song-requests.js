const { verifyAdminRequest } = require('./_lib/admin-auth');
const { ensureTables, getSql, parseBody, sendError } = require('./_lib/db');

function cleanText(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

module.exports = async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store');

    try {
        await ensureTables();
        const sql = getSql();

        if (request.method === 'POST') {
            const body = parseBody(request);
            const title = cleanText(body.title, 160);
            const notes = cleanText(body.notes, 1000);

            if (!title) {
                response.status(400).json({ error: 'Song title is required.' });
                return;
            }

            const rows = await sql.query(
                `
                INSERT INTO song_requests (title, notes)
                VALUES ($1, $2)
                RETURNING id, title, notes, created_at
                `,
                [title, notes || null]
            );

            response.status(201).json({ item: rows[0] });
            return;
        }

        if (request.method === 'GET') {
            if (!verifyAdminRequest(request)) {
                response.status(401).json({ error: 'Admin access required.' });
                return;
            }

            const rows = await sql.query(`
                SELECT id, title, notes, created_at
                FROM song_requests
                ORDER BY created_at DESC
                LIMIT 100
            `);

            response.status(200).json({ items: rows });
            return;
        }

        response.setHeader('Allow', 'GET, POST');
        response.status(405).json({ error: 'Use GET or POST.' });
    } catch (error) {
        sendError(response, error);
    }
};
