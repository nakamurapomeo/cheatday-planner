import { verifyJWT, parseCookies, clearAuthCookie } from '../lib/jwt.js';

// Middleware to check authentication
async function checkAuth(request, env) {
    const cookieHeader = request.headers.get('Cookie');
    const cookies = parseCookies(cookieHeader);
    const token = cookies.auth_token;

    if (!token) return null;

    return await verifyJWT(token, env.JWT_SECRET);
}

// GET - Load data from KV
export async function onRequestGet(context) {
    const { request, env } = context;

    const payload = await checkAuth(request, env);
    if (!payload) {
        return new Response(
            JSON.stringify({ error: '認証が必要です' }),
            {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': clearAuthCookie()
                }
            }
        );
    }

    try {
        const data = await env.CHEATDAY_KV.get('plans', 'json');
        return new Response(
            JSON.stringify({ data: data || null }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (e) {
        return new Response(
            JSON.stringify({ error: 'データの取得に失敗しました', details: e.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// POST - Save data to KV
export async function onRequestPost(context) {
    const { request, env } = context;

    const payload = await checkAuth(request, env);
    if (!payload) {
        return new Response(
            JSON.stringify({ error: '認証が必要です' }),
            {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': clearAuthCookie()
                }
            }
        );
    }

    try {
        const body = await request.json();
        await env.CHEATDAY_KV.put('plans', JSON.stringify(body.data));

        return new Response(
            JSON.stringify({ success: true }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (e) {
        return new Response(
            JSON.stringify({ error: 'データの保存に失敗しました', details: e.message, stack: e.stack }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
