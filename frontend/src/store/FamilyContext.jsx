import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  sheetId: '13PqSDZ4y3UePTXLc3sLHiGLcsNyLMSf28uwBzeeNAoA',
  sheetGid: '0',
  chartData: [],
  genealogyReport: null,
  familyCtx: { familyLabel: 'Família', founders: [], primaryFounderId: null },
  branches: [],
  selectedIdentity: null,
  focusedBranchKey: null,
  unifiedMode: false,
  loading: false,
  error: null,
  fromCache: false,
  savedAt: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SHEET':
      return { ...state, sheetId: action.id, sheetGid: action.gid, selectedIdentity: null, focusedBranchKey: null };
    case 'SET_LOADING':
      return { ...state, loading: action.value, error: null };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.message };
    case 'SET_DATA':
      return {
        ...state,
        loading: false,
        error: null,
        chartData: action.chartData,
        genealogyReport: action.genealogyReport,
        familyCtx: action.familyCtx,
        branches: action.branches,
        fromCache: action.fromCache,
        savedAt: action.savedAt,
      };
    case 'SET_IDENTITY':
      return { ...state, selectedIdentity: action.name, unifiedMode: !!action.name };
    case 'SET_BRANCH_FOCUS':
      return { ...state, focusedBranchKey: action.key };
    case 'EXIT_UNIFIED':
      return { ...state, selectedIdentity: null, unifiedMode: false };
    default:
      return state;
  }
}

const FamilyContext = createContext(null);
const FamilyDispatch = createContext(null);

export function FamilyProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <FamilyContext.Provider value={state}>
      <FamilyDispatch.Provider value={dispatch}>
        {children}
      </FamilyDispatch.Provider>
    </FamilyContext.Provider>
  );
}

export const useFamilyState = () => useContext(FamilyContext);
export const useFamilyDispatch = () => useContext(FamilyDispatch);
