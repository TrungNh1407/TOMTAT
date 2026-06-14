import app from '../server.js';
export const maxDuration = 60;
export default function(req, res) {
    req.url = '/api/status';
    return app(req, res);
}
