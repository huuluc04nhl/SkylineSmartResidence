import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://sdata.io.vn/wp-json/scrmai/v1';
const TOKEN = '01KWKATNQGB5TWXYDPJ671X3X1';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'apartments';
  const phone = searchParams.get('phone');

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/json',
    };

    let endpoint = '/rsapartments';
    let body: string | undefined = undefined;

    if (type === 'projects') {
      endpoint = '/rsprojects';
    } else if (type === 'blocks') {
      endpoint = '/rsblocks';
    } else {
      endpoint = '/rsapartments';
      if (phone && phone.trim()) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = new URLSearchParams({ phone: phone.trim() }).toString();
      }
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, message: `NKS API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
