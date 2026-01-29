// 枠番色の定義
export const bracketColors: Record<number, { bg: string; text: string; name: string }> = {
  1: { bg: '#FFFFFF', text: '#000000', name: '白' },
  2: { bg: '#000000', text: '#FFFFFF', name: '黒' },
  3: { bg: '#EF4444', text: '#FFFFFF', name: '赤' },
  4: { bg: '#3B82F6', text: '#FFFFFF', name: '青' },
  5: { bg: '#EAB308', text: '#000000', name: '黄' },
  6: { bg: '#22C55E', text: '#FFFFFF', name: '緑' },
  7: { bg: '#F97316', text: '#FFFFFF', name: '橙' },
  8: { bg: '#EC4899', text: '#FFFFFF', name: '桃' },
};

/**
 * 馬番から枠番を計算する
 * @param horseNumber 馬番（1から始まる）
 * @param totalHorses レースの出走頭数
 * @returns 枠番（1-8）
 */
export function calculateBracket(horseNumber: number, totalHorses: number): number {
  if (totalHorses <= 8) {
    // 8頭以下：馬番＝枠番
    return horseNumber;
  }

  if (totalHorses === 9) {
    // 9頭：8枠のみ2頭（馬番8,9が8枠）
    if (horseNumber <= 7) return horseNumber;
    return 8;
  }

  if (totalHorses === 10) {
    // 10頭：7枠と8枠が2頭ずつ
    if (horseNumber <= 6) return horseNumber;
    if (horseNumber <= 8) return 7;
    return 8;
  }

  if (totalHorses === 11) {
    // 11頭：6,7,8枠が2頭ずつ
    if (horseNumber <= 5) return horseNumber;
    if (horseNumber <= 7) return 6;
    if (horseNumber <= 9) return 7;
    return 8;
  }

  if (totalHorses === 12) {
    // 12頭：5,6,7,8枠が2頭ずつ
    if (horseNumber <= 4) return horseNumber;
    if (horseNumber <= 6) return 5;
    if (horseNumber <= 8) return 6;
    if (horseNumber <= 10) return 7;
    return 8;
  }

  if (totalHorses === 13) {
    // 13頭：4,5,6,7,8枠が2頭ずつ
    if (horseNumber <= 3) return horseNumber;
    if (horseNumber <= 5) return 4;
    if (horseNumber <= 7) return 5;
    if (horseNumber <= 9) return 6;
    if (horseNumber <= 11) return 7;
    return 8;
  }

  if (totalHorses === 14) {
    // 14頭：3,4,5,6,7,8枠が2頭ずつ
    if (horseNumber <= 2) return horseNumber;
    if (horseNumber <= 4) return 3;
    if (horseNumber <= 6) return 4;
    if (horseNumber <= 8) return 5;
    if (horseNumber <= 10) return 6;
    if (horseNumber <= 12) return 7;
    return 8;
  }

  if (totalHorses === 15) {
    // 15頭：2,3,4,5,6,7,8枠が2頭ずつ
    if (horseNumber === 1) return 1;
    if (horseNumber <= 3) return 2;
    if (horseNumber <= 5) return 3;
    if (horseNumber <= 7) return 4;
    if (horseNumber <= 9) return 5;
    if (horseNumber <= 11) return 6;
    if (horseNumber <= 13) return 7;
    return 8;
  }

  if (totalHorses === 16) {
    // 16頭：全枠2頭ずつ
    return Math.ceil(horseNumber / 2);
  }

  if (totalHorses === 17) {
    // 17頭：1-7枠は2頭、8枠は3頭
    if (horseNumber <= 14) return Math.ceil(horseNumber / 2);
    return 8;
  }

  if (totalHorses >= 18) {
    // 18頭：1-6枠は2頭、7,8枠は3頭
    if (horseNumber <= 12) return Math.ceil(horseNumber / 2);
    if (horseNumber <= 15) return 7;
    return 8;
  }

  return 1;
}

/**
 * 馬番から枠番色を取得
 */
export function getBracketColor(horseNumber: number, totalHorses: number) {
  const bracket = calculateBracket(horseNumber, totalHorses);
  return bracketColors[bracket] || bracketColors[1];
}
