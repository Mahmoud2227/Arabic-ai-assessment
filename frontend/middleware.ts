import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has('arabic_ai_token');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  if (!hasToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
