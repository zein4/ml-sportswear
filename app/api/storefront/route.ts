import { NextResponse } from 'next/server';
import { loadStorefront } from '@/lib/storefront';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 try {const settings=await loadStorefront();return NextResponse.json(settings,{headers:{'Cache-Control':'no-store'}});}
 catch {return NextResponse.json({sizeChart:{},gcash:{qrUrl:null,name:'',number:''},hasQR:false,unconfigured:true},{headers:{'Cache-Control':'no-store'}});}
}
