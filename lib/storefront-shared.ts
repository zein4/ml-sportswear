import { GARMENTS, SIZES } from '@/lib/catalog';
export type MeasureKey='chest'|'length'|'waist'|'hips';
export type Measurements=Partial<Record<MeasureKey,number>>;
export type SizeChart=Record<string,Record<string,Measurements>>;
export const MEASURE_LABELS:Record<MeasureKey,string>={chest:'Chest',length:'Length',waist:'Waist',hips:'Hips'};
export const MEASURES:MeasureKey[]=['chest','length','waist','hips'];
export function cleanChart(input:unknown):SizeChart|null {
  if (!input || typeof input!=='object' || Array.isArray(input)) return null;
  const obj=input as Record<string,unknown>;
  if(Object.keys(obj).some(k=>!GARMENTS.some(g=>g.id===k))) return null;
  const chart:SizeChart={};
  for(const g of GARMENTS) {
    const raw=obj[g.id]??{};
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
    const sizes=raw as Record<string,unknown>;
    if(Object.keys(sizes).some(k=>!SIZES.includes(k as typeof SIZES[number])))return null;
    chart[g.id]={};
    for(const size of SIZES) {
      const rawMeasure=sizes[size]??{};
      if(!rawMeasure||typeof rawMeasure!=='object'||Array.isArray(rawMeasure))return null;
      const measure=rawMeasure as Record<string,unknown>;
      if(Object.keys(measure).some(k=>!MEASURES.includes(k as MeasureKey)))return null;
      chart[g.id][size]={};
      for(const key of MEASURES) {
        const n=measure[key];
        if(n===undefined||n===null||n==='')continue;
        if(typeof n!=='number'||!Number.isFinite(n)||n<=0||n>300||Math.round(n*10)!==n*10)return null;
        chart[g.id][size][key]=n;
      }
    }
  }
  return chart;
}
