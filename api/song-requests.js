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
            const artStyle = cleanText(body.artStyle || body.art_style, 120);
            const notes = cleanText(body.notes, 1000);

            if (!title) {
                response.status(400).json({ error: 'Song title is required.' });
                return;
            }

            const rows = await sql.query(
                `
                INSERT INTO song_requests (title, art_style, notes)
                VALUES ($1, $2, $3)
                RETURNING id, title, art_style, notes, created_at
                `,
                [title, artStyle || 'You choose', notes || null]
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
                SELECT id, title, art_style, notes, created_at
                FROM song_requests
                ORDER BY created_at DESC
                LIMIT 100
            `);

            response.status(200).json({ items: rows });
            return;
        }

        if (request.method === 'DELETE') {
            if (!verifyAdminRequest(request)) {
                response.status(401).json({ error: 'Admin access required.' });
                return;
            }

            const id = Number(request.query && request.query.id);
            if (!Number.isInteger(id) || id < 1) {
                response.status(400).json({ error: 'Valid request id is required.' });
                return;
            }

            await sql.query('DELETE FROM song_requests WHERE id = $1', [id]);
            response.status(200).json({ ok: true });
            return;
        }

        response.setHeader('Allow', 'GET, POST, DELETE');
        response.status(405).json({ error: 'Use GET, POST, or DELETE.' });
    } catch (error) {
        sendError(response, error);
    }
};
