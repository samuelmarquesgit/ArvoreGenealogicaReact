import React, { useEffect, useRef, useState } from 'react';
import { FamilyProvider } from './store/FamilyContext.jsx';
import { useFamilyData } from './hooks/useFamilyData.js';
import FamilyTree from './components/FamilyTree/FamilyTree.jsx';
import Header from './components/ui/Header.jsx';
import LoadingSpinner from './components/ui/LoadingSpinner.jsx';
import ErrorMessage from './components/ui/ErrorMessage.jsx';
import AnalysisPanel from './components/AnalysisPanel/AnalysisPanel.jsx';

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return { id: params.get('id'), gid: params.get('gid'), who: params.get('who') };
}

function App() {
  const {
    chartData, genealogyReport, familyCtx, branches,
    sheetId, sheetGid, fromCache, savedAt,
    selectedIdentity, unifiedMode, focusedBranchKey,
    loading, error,
    load, refresh, setSheet, setIdentity, setBranchFocus, exitUnified,
  } = useFamilyData();

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const treeRef = useRef(null);

  useEffect(() => {
    const { id, gid, who } = readUrlParams();
    if (who) {
      setIdentity(who);
      load({ focusId: who });
    } else if (id) {
      setSheet(id, gid || '0');
      load({ id, gid: gid || '0' });
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartData.length) return;
    const url = new URL(window.location);
    if (unifiedMode && selectedIdentity) {
      url.searchParams.set('who', selectedIdentity);
      url.searchParams.delete('id');
      url.searchParams.delete('gid');
    } else {
      url.searchParams.delete('who');
      const DEFAULT_ID = '13PqSDZ4y3UePTXLc3sLHiGLcsNyLMSf28uwBzeeNAoA';
      if (sheetId !== DEFAULT_ID || sheetGid !== '0') {
        url.searchParams.set('id', sheetId);
        url.searchParams.set('gid', sheetGid);
      } else {
        url.searchParams.delete('id');
        url.searchParams.delete('gid');
      }
    }
    window.history.replaceState({}, '', url);
  }, [sheetId, sheetGid, selectedIdentity, unifiedMode, chartData.length]);

  useEffect(() => {
    if (familyCtx?.familyLabel) {
      document.title = `Árvore genealógica — ${familyCtx.familyLabel}`;
    }
  }, [familyCtx]);

  function handleSheetChange(id, gid) {
    setSheet(id, gid);
    exitUnified();
    load({ id, gid, force: true });
  }

  function handleSetIdentity(name) {
    setIdentity(name);
    load({ focusId: name });
  }

  function handleExitUnified() {
    exitUnified();
    load({ focusId: null });
  }

  function handleBranchFocus(key) {
    setBranchFocus(key);
    load({ branchKey: key });
  }

  function handleBranchReset() {
    setBranchFocus(null);
    if (unifiedMode) {
      handleExitUnified();
    } else {
      load({ branchKey: null });
    }
  }

  function handleRefresh() {
    refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header
        familyCtx={familyCtx}
        fromCache={fromCache}
        savedAt={savedAt}
        currentId={sheetId}
        currentGid={sheetGid}
        branches={branches}
        focusedBranchKey={focusedBranchKey}
        selectedIdentity={selectedIdentity}
        unifiedMode={unifiedMode}
        onSheetChange={handleSheetChange}
        onRefresh={handleRefresh}
        onFit={() => FamilyTree.fit?.()}
        onExport={() => FamilyTree.exportSvg?.()}
        onOpenAnalysis={() => setAnalysisOpen(true)}
        onSetIdentity={handleSetIdentity}
        onExitUnified={handleExitUnified}
        onBranchFocus={handleBranchFocus}
        onBranchReset={handleBranchReset}
      />

      {loading && <LoadingSpinner message={unifiedMode ? 'Unificando árvores…' : 'Carregando dados…'} />}

      {error && (
        <ErrorMessage
          message={error}
          onClose={() => load()}
        />
      )}

      {chartData.length > 0 && (
        <FamilyTree
          ref={treeRef}
          data={chartData}
          familyCtx={familyCtx}
          focusedBranchKey={focusedBranchKey}
          onBranchFocus={handleBranchFocus}
        />
      )}

      <AnalysisPanel
        report={genealogyReport}
        isOpen={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
      />
    </div>
  );
}

export default function AppWithProvider() {
  return (
    <FamilyProvider>
      <App />
    </FamilyProvider>
  );
}
