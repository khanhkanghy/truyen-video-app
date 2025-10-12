import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Lấy danh sách series
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, series: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      series: data || [] 
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, series: [], error: error.message },
      { status: 500 }
    );
  }
}

// POST: Tạo series mới
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, genre } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tên bộ truyện' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('series')
      .insert([{ 
        title, 
        description: description || '', 
        genre: genre || 'Tổng hợp',
        status: 'active',
        total_chapters: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      series: data 
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}