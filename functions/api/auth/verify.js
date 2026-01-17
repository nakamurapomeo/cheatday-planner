import { verifyJWT, parseCookies } from '../../lib/jwt.js';

export async function onRequestGet(context) {
    const { request, env } = context;

    const cookieHeader = request.headers.get('Cookie');
    const cookies = parseCookies(cookieHeader);
    const token = cookies.auth_token;

    if (!token) {
        return new Response(
            JSON.stringify({ authenticated: false }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    return new Response(
        JSON.stringify({ authenticated: !!payload }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
