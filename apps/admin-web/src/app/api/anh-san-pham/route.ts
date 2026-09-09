import { type NextRequest, NextResponse } from 'next/server';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', 'minio']);
const LOCAL_PORTS = new Set(['3000', '9000']);

function chuanHoaNguon(raw: string): URL {
  const source = new URL(raw);

  if (!['http:', 'https:'].includes(source.protocol)) {
    throw new Error('Giao thức ảnh không được hỗ trợ.');
  }

  if (!LOCAL_HOSTS.has(source.hostname)) {
    throw new Error('Nguồn ảnh không thuộc hạ tầng local AgriMarket.');
  }

  if (source.hostname === 'minio') {
    source.hostname = '127.0.0.1';
    if (!source.port) source.port = '9000';
  }

  if (source.hostname === 'localhost') {
    source.hostname = '127.0.0.1';
  }

  const port = source.port || (source.protocol === 'https:' ? '443' : '80');
  if (!LOCAL_PORTS.has(port)) {
    throw new Error('Cổng nguồn ảnh không được phép.');
  }

  return source;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('src')?.trim();

  if (!raw) {
    return NextResponse.json(
      { message: 'Thiếu nguồn ảnh.' },
      { status: 400 },
    );
  }

  let source: URL;
  try {
    source = chuanHoaNguon(raw);
  } catch {
    return NextResponse.json(
      { message: 'Nguồn ảnh không hợp lệ.' },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(source, {
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { message: `Nguồn ảnh trả ${upstream.status}.` },
        { status: upstream.status },
      );
    }

    const contentType = upstream.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return NextResponse.json(
        { message: 'Nguồn trả về không phải ảnh.' },
        { status: 415 },
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, max-age=0',
        'X-AgriMarket-Image-Proxy': 'admin-web',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Không thể tải ảnh từ nguồn.' },
      { status: 502 },
    );
  }
}
