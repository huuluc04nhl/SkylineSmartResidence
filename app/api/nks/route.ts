import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://sdata.io.vn/wp-json/scrmai/v1';
const TOKEN = '01KWKATNQGB5TWXYDPJ671X3X1';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'apartments';
  const id = searchParams.get('id');
  const projectId = searchParams.get('project_id') || searchParams.get('rsproject');
  const blockId = searchParams.get('block_id') || searchParams.get('block');
  const floor = searchParams.get('floor');
  const phone = searchParams.get('phone');

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    let endpoint = '/rsapartments';
    let bodyObj: any = {};

    switch (type) {
      case 'projects':
        endpoint = '/rsprojects';
        break;
      case 'project':
        endpoint = '/rsproject';
        if (id) bodyObj.id = Number(id);
        break;
      case 'blocks':
        endpoint = '/rsblocks';
        if (projectId) bodyObj.rsproject = Number(projectId);
        break;
      case 'block':
        endpoint = '/rsblock';
        if (id) bodyObj.id = Number(id);
        break;
      case 'apartment':
        endpoint = '/rsapartment';
        if (id) bodyObj.id = Number(id);
        break;
      case 'apartments':
      default:
        endpoint = '/rsapartments';
        if (blockId) bodyObj.block = Number(blockId);
        if (floor) bodyObj.floor = Number(floor);
        if (phone && phone.trim()) {
          bodyObj.phone = phone.trim();
        }
        break;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyObj),
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const endpoint = body.endpoint || '/rsapartments';
    const payload = body.payload || {};

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
