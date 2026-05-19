export function hashHue(str) {
  let h = 216;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export function branchColorFromKey(branchKey, depth = 2) {
  if (!branchKey || branchKey.startsWith('__')) return '#94a3b8';
  const hue = hashHue(branchKey);
  const saturation = Math.min(65, 35 + Math.min(depth, 5) * 5);
  const lightness = Math.max(68, 96 - depth * 4.5);
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function kinshipBadgeColor(role) {
  const map = {
    'Eu': '#d90429',
    'Pai/Mãe': '#0077b6',
    'Avô/Avó': '#0096c7',
    'Bisavô/Bisavó': '#48cae4',
    'Filho(a)': '#2a9d8f',
    'Neto(a)': '#52b788',
    'Fundo': 'transparent',
  };
  return map[role] || '#64748b';
}
