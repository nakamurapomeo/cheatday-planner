import { createJWT, createAuthCookie } from '../../lib/jwt.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { password } = await request.json();

        // Check password against environment variable
        if (!password || password !== env.AUTH_PASSWORD) {
            return new Response(
                JSON.stringify({ error: 'パスワードが正しくありません' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Create JWT
        const token = await createJWT(
            { authenticated: true },
            env.JWT_SECRET,
            86400 * 7 // 7 days
        );

        // Return success with HttpOnly cookie
        return new Response(
            JSON.stringify({ success: true }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': createAuthCookie(token, 86400 * 7)
                }
            }
        );
    } catch (e) {
        return new Response(
            JSON.stringify({ error: 'リクエストの処理に失敗しました' }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
