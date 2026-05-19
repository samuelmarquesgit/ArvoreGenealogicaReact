import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import { OrgChart } from 'd3-org-chart';
import { VIRTUAL_ROOT_ID, canNodeFocus } from '../../utils/treeUtils.js';
import './FamilyTree.css';

function buildNodeHtml(d, familyCtx) {
  const isRoot = d.data.id === VIRTUAL_ROOT_ID;
  const focusable = canNodeFocus(d.data, familyCtx);
  const bk = d.data._branchKey;

  const bg = d.data._cardBg || '#fff';
  const border = d.data._cardBorder || '#cbd5e1';
  const nc = d.data._nameColor || '#0f172a';
  const rc = d.data._roleColor || '#64748b';
  const ns = (d.data._nameSizePx || 13) + 'px';

  const dataFocusAttr = focusable ? ` data-branch-focus="${encodeURIComponent(String(bk))}"` : '';
  const focusCls = focusable ? ' node-card--focusable' : '';
  const focusHint = focusable
    ? `<div class="node-focus-hint" style="color:${rc}">Toque: só este ramo</div>`
    : '';

  const roleBadge = d.data._kinshipRole && d.data._kinshipRole !== 'Fundo'
    ? `<div class="role-badge" style="background:${d.data._branchColor || '#64748b'}">${d.data._kinshipRole}</div>`
    : '';

  const spouse = d.data.spouse
    ? `<div class="node-spouse" style="color:${d.data._spouseColor || '#92400e'}">❤️ ${d.data.spouse}</div>`
    : '';

  const parents = !isRoot && d.data.parentsLine
    ? `<div class="node-parents" style="color:${d.data._parentsColor || '#64748b'}">${d.data.parentsLine}</div>`
    : '';

  return `
    <div class="node-card${focusCls}" style="background:${bg};border-color:${border};"${dataFocusAttr}>
      ${roleBadge}
      <div class="node-role" style="color:${rc}">${d.data.type || ''}</div>
      <div class="node-name" style="color:${nc};font-size:${ns}">${d.data.name}</div>
      ${parents}
      ${spouse}
      ${focusHint}
    </div>
  `;
}

const FamilyTree = forwardRef(function FamilyTree({ data, familyCtx, focusedBranchKey, onBranchFocus }, ref) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useImperativeHandle(ref, () => ({
    fit: () => chartRef.current?.fit?.(),
    exportSvg: () => chartRef.current?.exportSvg?.(),
  }));

  const handleClick = useCallback((e) => {
    const target = e.target.closest('[data-branch-focus]');
    if (!target) return;
    const enc = target.getAttribute('data-branch-focus');
    if (enc) {
      e.stopPropagation();
      onBranchFocus?.(decodeURIComponent(enc));
    }
  }, [onBranchFocus]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !data || !data.length) return;
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [handleClick, data]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !data || !data.length) return;

    const zoomed = !!focusedBranchKey;
    const m = zoomed ? 1.45 : 1;

    const chart = new OrgChart()
      .container(container)
      .compact(false)
      .scaleExtent([0.05, 5])
      .data(data)
      .duration(zoomed ? 200 : 400)
      .nodeWidth(d => {
        const depth = d.data._depth ?? 0;
        return Math.max(158, Math.round((240 - depth * 14) * (zoomed ? 1.08 : 1)));
      })
      .nodeHeight(d => {
        const depth = d.data._depth ?? 0;
        return Math.max(68, Math.round((120 - depth * 9) * (zoomed ? 1.06 : 1)));
      })
      .childrenMargin(() => Math.round(56 * m))
      .compactMarginBetween(() => Math.round(40 * m))
      .compactMarginPair(() => Math.round(34 * m))
      .neighbourMargin(() => Math.round(22 * m))
      .linkUpdate(function (d) {
        const stroke = d?.data?._linkStroke ?? '#94a3b8';
        d3.select(this).attr('stroke', stroke).attr('stroke-width', 2).attr('opacity', 0.88);
      })
      .nodeContent(d => buildNodeHtml(d, familyCtx))
      .expandAll()
      .initialZoom(1.0)
      .render();

    chart.expandAll();
    chartRef.current = chart;

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [data, focusedBranchKey, familyCtx]);

  return <div ref={containerRef} className="chart-container" />;
});

export default FamilyTree;
