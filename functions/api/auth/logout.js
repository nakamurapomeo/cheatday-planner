import { clearAuthCookie } from '../../lib/jwt.js';

export async function onRequestPost(context) {
    return new Response(
        JSON.stringify({ success: true }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': clearAuthCookie()
            }
        }
    );
}
