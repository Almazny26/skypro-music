import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://webdev-music-003b5b991590.herokuapp.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'POST');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'DELETE');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'PUT');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const path = params.path.join('/');
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const apiUrl = `${API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

    // Получаем заголовки из запроса
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Передаем Authorization заголовок, если есть
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Передаем X-User-Id и X-User-Name, если есть
    const userId = request.headers.get('X-User-Id');
    const userName = request.headers.get('X-User-Name');
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    if (userName) {
      headers['X-User-Name'] = userName;
    }

    // Передаем cookies из запроса клиента
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Получаем тело запроса, если есть
    let body: string | undefined;
    if (method !== 'GET') {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }
    
    const response = await fetch(apiUrl, {
      method,
      headers,
      body,
      // На сервере credentials не нужен, cookies передаются через заголовок Cookie
    });

    const data = await response.text();
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // Формируем заголовки ответа
    const responseHeaders: HeadersInit = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-User-Name',
    };
    
    // Передаем Set-Cookie из ответа API клиенту
    const setCookie = response.headers.get('Set-Cookie');
    if (setCookie) {
      responseHeaders['Set-Cookie'] = setCookie;
    }
    
    // Возвращаем ответ с правильными заголовками
    return NextResponse.json(jsonData, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-User-Name',
    },
  });
}
