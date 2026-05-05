import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // We can use the anon client for public read
import { assembleReportJson } from '@/lib/report-assembler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15 requires params to be awaited
    const { id } = await params;

    // 1. Check if the ID belongs to an archived snapshot first
    if (id !== 'live') {
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('report_snapshots')
        .select('report_json')
        .eq('id', id)
        .single();
        
      if (!snapshotError && snapshotData && snapshotData.report_json) {
        return NextResponse.json({ success: true, data: snapshotData.report_json });
      }
    }

    // 2. Fall back to assembling the live/relational report
    let query = supabase.from('reports').select('*');
    if (id === 'live') {
      query = query.eq('status', 'live');
    } else {
      query = query.eq('id', id);
    }
    
    const { data: reportData, error: reportError } = await query.single();

    if (reportError) {
      if (reportError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
      }
      throw reportError;
    }
    
    if (!reportData) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const reportId = reportData.id;

    const reconstructedJson = await assembleReportJson(supabase, reportData);

    return NextResponse.json({ success: true, data: reconstructedJson });
  } catch (error: any) {
    console.error('Fetch report error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
