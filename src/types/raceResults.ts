// レース結果の型定義

export interface PayoutItem {
  払出: string;
  組み合わせ: string;
}

export interface Payouts {
  単勝: PayoutItem[];
  枠連: PayoutItem[];
  複勝: PayoutItem[];
  馬単: PayoutItem[];
  馬連: PayoutItem[];
  '3連単': PayoutItem[];
  '3連複': PayoutItem[];
  ワイド: PayoutItem[];
}

export interface FinishingHorse {
  着順: string;
  馬名: string;
  馬番: string;
}

export interface RaceResultData {
  day: number;
  date: string;
  year: number;
  払戻: Payouts;
  着順: FinishingHorse[];
  開催場所: string;
  レース番号: number;
}

export interface RaceResult {
  race_id: string;
  data: RaceResultData;
  created_at: string;
}
