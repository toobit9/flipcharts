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
            const kind = cleanText(body.kind, 40) || 'feedback';
            const message = cleanText(body.message, 2000);
            const contact = cleanText(body.contact, 200);
            const page = cleanText(body.page, 500);

            if (!message) {
                response.status(400).json({ error: 'Feedback or bug details are required.' });
                return;
            }

            const rows = await sql.query(
                `
                INSERT INTO feedback_reports (kind, message, contact, page)
                VALUES ($1, $2, $3, $4)
                RETURNING id, kind, message, contact, page, created_at
                `,
                [kind, message, contact || null, page || null]
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
                SELECT id, kind, message, contact, page, created_at
                FROM feedback_reports
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
                response.status(400).json({ error: 'Valid feedback id is required.' });
                return;
            }

            await sql.query('DELETE FROM feedback_reports WHERE id = $1', [id]);
            response.status(200).json({ ok: true });
            return;
        }

        response.setHeader('Allow', 'GET, POST, DELETE');
        response.status(405).json({ error: 'Use GET, POST, or DELETE.' });
    } catch (error) {
        sendError(response, error);
    }
};
