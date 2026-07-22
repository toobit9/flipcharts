const { neon } = require('@neondatabase/serverless');

let sqlClient;

function isDatabaseConfigured() {
    return Boolean(process.env.DATABASE_URL);
}

function requireDatabase() {
    if (!isDatabaseConfigured()) {
        const error = new Error('Database is not configured yet.');
        error.statusCode = 503;
        throw error;
    }
}

function getSql() {
    requireDatabase();

    if (!sqlClient) {
        sqlClient = neon(process.env.DATABASE_URL);
    }

    return sqlClient;
}

async function ensureTables() {
    const sql = getSql();

    await sql.query(`
        CREATE TABLE IF NOT EXISTS song_requests (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await sql.query(`
        CREATE TABLE IF NOT EXISTS feedback_reports (
            id SERIAL PRIMARY KEY,
            kind TEXT NOT NULL DEFAULT 'feedback',
            message TEXT NOT NULL,
            contact TEXT,
            page TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
}

function parseBody(request) {
    if (!request.body) return {};
    if (typeof request.body === 'string') {
        try {
            return JSON.parse(request.body);
        } catch (error) {
            return {};
        }
    }
    return request.body;
}

function sendError(response, error) {
    response.status(error.statusCode || 500).json({
        error: error.message || 'Something went wrong.'
    });
}

module.exports = {
    ensureTables,
    getSql,
    parseBody,
    sendError
};
