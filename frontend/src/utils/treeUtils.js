export const VIRTUAL_ROOT_ID = 'FAMILIA_ROOT';

export function formatAgo(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 45) return 'agora há pouco';
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 36) return `há ${h} h`;
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function buildSheetEditUrl(id, gid) {
  return `https://docs.google.com/spreadsheets/d/${id}/edit?gid=${gid}#gid=${gid}`;
}

export function canNodeFocus(nodeData, familyCtx) {
  const bk = String(nodeData._branchKey || '');
  return (
    nodeData.id !== VIRTUAL_ROOT_ID &&
    bk &&
    bk !== '__raiz__' &&
    bk !== '__fundadores__' &&
    !bk.startsWith('__ciclo__') &&
    !bk.startsWith('__sem_dados__') &&
    !bk.startsWith('__desconhecido__') &&
    !(familyCtx?.founders || []).includes(nodeData.id)
  );
}
