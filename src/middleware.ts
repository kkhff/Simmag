import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";


export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers }
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    if (!user && (path.startsWith('/admin') || path.startsWith('/guru') || path.startsWith('/siswa'))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();

        if (userData?.role === 'Admin' && !path.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/admin', request.url));
        } else if (userData?.role === 'Guru' && !path.startsWith('/guru')) {
            return NextResponse.redirect(new URL('/guru', request.url));
        } else if (userData?.role === 'Siswa' && !path.startsWith('/siswa')) {
            return NextResponse.redirect(new URL('/siswa', request.url));
        }

    }
    return response;

}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};