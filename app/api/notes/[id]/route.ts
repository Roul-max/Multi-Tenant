import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized1' }, { status: 401 });
    }

    const payload = verifyToken(token);

    // Get note with tenant isolation
    const { data: note, error } = await supabaseAdmin
      .from('notes')
      .select(`
        id,
        title,
        content,
        created_at,
        updated_at,
        users!inner (
          id,
          email
        )
      `)
      .eq('id', params.id)
      .eq('tenant_id', payload.tenantId)
      .single();

    if (error || !note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error in GET /notes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized2' }, { status: 401 });
    }

    const payload = verifyToken(token);
    const { title, content } = await request.json();

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Update note with tenant isolation
    const { data: note, error } = await supabaseAdmin
      .from('notes')
      .update({
        title: title.trim(),
        content: content?.trim() || '',
      })
      .eq('id', params.id)
      .eq('tenant_id', payload.tenantId)
      .select()
      .single();

    if (error || !note) {
      return NextResponse.json(
        { error: 'Note not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error in PUT /notes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized3' }, { status: 401 });
    }

    const payload = verifyToken(token);

    // Delete note with tenant isolation
    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', payload.tenantId);

    if (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json(
        { error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /notes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}