const express = require('express');
const router = express.Router();
const sheetsService = require('../services/sheetsService');
const familyService = require('../services/familyService');

/**
 * GET /api/sheets
 * Query: id (sheet ID), gid (tab ID), force (boolean)
 * Returns raw CSV text from Google Sheets (proxied to avoid CORS).
 */
router.get('/', async (req, res, next) => {
  try {
    const { id, gid, force } = req.query;
    const { text, fromCache, savedAt } = await sheetsService.fetchSheet(id, gid, { force: force === 'true' });
    res.json({ text, fromCache, savedAt });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/sheets/family
 * Query: id, gid, force, focusId (for kinship view), branchKey (for branch filter), unified (boolean)
 * Returns fully processed family tree data ready for D3-OrgChart.
 */
router.get('/family', async (req, res, next) => {
  try {
    const { id, gid, force, focusId, branchKey, unified } = req.query;
    const { text } = await sheetsService.fetchSheet(id, gid, { force: force === 'true' });
    const rawData = familyService.parseCsv(text);

    let chartData, genealogyReport, familyCtx, branches;

    if (unified === 'true' && focusId) {
      const { people } = familyService.processFamilyDataForKinship(rawData);
      chartData = familyService.buildKinshipData(focusId, people);
      genealogyReport = null;
      familyCtx = { familyLabel: `Mapa: ${focusId}`, founders: [], foundersSet: new Set(), primaryFounderId: null };
    } else {
      const processed = familyService.processFamilyData(rawData);
      chartData = processed.chartData;
      genealogyReport = processed.genealogyReport;
      familyCtx = processed.familyCtx;
    }

    if (branchKey && !focusId) {
      chartData = familyService.filterBranchSubset(chartData, branchKey);
    }

    branches = familyService.getBranchEntries(chartData);

    res.json({
      chartData,
      genealogyReport,
      familyCtx: {
        familyLabel: familyCtx.familyLabel,
        founders: familyCtx.founders,
        primaryFounderId: familyCtx.primaryFounderId,
      },
      branches,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/sheets/cache
 * Query: id, gid
 * Clears the server-side cache for the given sheet.
 */
router.delete('/cache', (req, res) => {
  const { id, gid } = req.query;
  sheetsService.clearCache(id, gid);
  res.json({ ok: true });
});

/**
 * POST /api/sheets/parse-url
 * Body: { url }
 * Returns { id, gid } extracted from a Google Sheets URL.
 */
router.post('/parse-url', (req, res) => {
  const { url } = req.body;
  const parsed = sheetsService.parseSheetUrl(url);
  if (!parsed) {
    return res.status(400).json({ error: 'URL da planilha inválida.' });
  }
  res.json(parsed);
});

module.exports = router;
