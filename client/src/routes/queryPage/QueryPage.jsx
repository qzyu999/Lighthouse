import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './queryPage.css';

const API_URL = import.meta.env.VITE_API_URL || "";
const MAX_TABS = 8;

const QueryPage = forwardRef((props, ref) => {
  const [tabs, setTabs] = useState([{ id: 1, sql: '', results: null, error: null, loading: false }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [catalog, setCatalog] = useState(null);
  const [expandedDbs, setExpandedDbs] = useState({});
  const [expandedTables, setExpandedTables] = useState({});
  const nextTabId = useRef(2);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Expose addTab for cross-panel communication
  useImperativeHandle(ref, () => ({
    addTab(sql) {
      const id = nextTabId.current++;
      if (tabs.length >= MAX_TABS) {
        // Replace oldest non-active tab
        setTabs(prev => [...prev.slice(1), { id, sql: sql || '', results: null, error: null, loading: false }]);
      } else {
        setTabs(prev => [...prev, { id, sql: sql || '', results: null, error: null, loading: false }]);
      }
      setActiveTabId(id);
    }
  }));

  // Fetch catalog on mount
  useEffect(() => {
    fetch(`${API_URL}/api/query/catalog`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCatalog(data))
      .catch(() => {});
  }, []);

  const updateTab = (id, updates) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const executeQuery = async () => {
    if (!activeTab.sql.trim()) return;
    updateTab(activeTabId, { loading: true, error: null, results: null });

    try {
      const res = await fetch(`${API_URL}/api/query/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sql: activeTab.sql }),
      });
      const data = await res.json();
      if (data.metadata?.error) {
        updateTab(activeTabId, { error: data.metadata.error, loading: false });
      } else {
        updateTab(activeTabId, { results: data, loading: false });
      }
    } catch (err) {
      updateTab(activeTabId, { error: err.message, loading: false });
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  const addNewTab = () => {
    if (tabs.length >= MAX_TABS) return;
    const id = nextTabId.current++;
    setTabs(prev => [...prev, { id, sql: '', results: null, error: null, loading: false }]);
    setActiveTabId(id);
  };

  const closeTab = (id) => {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) setActiveTabId(remaining[remaining.length - 1].id);
  };

  const toggleDb = (dbName) => {
    setExpandedDbs(prev => ({ ...prev, [dbName]: !prev[dbName] }));
  };

  const toggleTable = (key) => {
    setExpandedTables(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const insertTableName = (dbName, tableName) => {
    const ref = `${dbName}.${tableName}`;
    const newSql = activeTab.sql ? `${activeTab.sql} ${ref}` : `SELECT * FROM ${ref} LIMIT 10;`;
    updateTab(activeTabId, { sql: newSql });
  };

  return (
    <div className="queryPage">
      <div className="query-catalog">
        <div className="catalog-header">Schema Browser</div>
        <div className="catalog-tree">
          {!catalog && <div className="catalog-empty">Loading catalog...</div>}
          {catalog && (!catalog.databases || catalog.databases.length === 0) && (
            <div className="catalog-empty">No tables available</div>
          )}
          {catalog?.databases?.map(db => (
            <div key={db.name} className="catalog-db">
              <button className="catalog-db-toggle" onClick={() => toggleDb(db.name)}>
                <span className="catalog-arrow">{expandedDbs[db.name] ? '▾' : '▸'}</span>
                <span className="catalog-db-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </span>
                <span className="catalog-db-name">{db.name}</span>
              </button>
              {expandedDbs[db.name] && (
                <div className="catalog-tables">
                  {(db.tables || []).map(table => {
                    const tableKey = `${db.name}.${table.name}`;
                    return (
                      <div key={tableKey} className="catalog-table">
                        <button
                          className="catalog-table-toggle"
                          onClick={() => toggleTable(tableKey)}
                          onDoubleClick={() => insertTableName(db.name, table.name)}
                          title="Double-click to insert"
                        >
                          <span className="catalog-arrow">{expandedTables[tableKey] ? '▾' : '▸'}</span>
                          <span className="catalog-table-icon">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/>
                            </svg>
                          </span>
                          <span className="catalog-table-name">{table.name}</span>
                        </button>
                        {expandedTables[tableKey] && (
                          <div className="catalog-columns">
                            {(table.columns || []).map(col => (
                              <div key={col.name} className="catalog-column">
                                <span className="catalog-col-icon">·</span>
                                <span className="catalog-col-name">{col.name}</span>
                                <span className="catalog-col-type">{col.type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="query-main">
        <div className="query-tabs">
          {tabs.map(tab => (
            <div key={tab.id} className={`query-tab ${tab.id === activeTabId ? 'active' : ''}`}>
              <button className="query-tab-btn" onClick={() => setActiveTabId(tab.id)}>
                Query {tab.id}
              </button>
              {tabs.length > 1 && (
                <button className="query-tab-close" onClick={() => closeTab(tab.id)}>×</button>
              )}
            </div>
          ))}
          {tabs.length < MAX_TABS && (
            <button className="query-tab-add" onClick={addNewTab} title="New tab">+</button>
          )}
        </div>
        <div className="query-editor">
          <div className="query-toolbar">
            <span className="query-title">SQL Query</span>
            <div className="query-actions">
              <button
                className="query-run-btn"
                onClick={executeQuery}
                disabled={activeTab.loading || !activeTab.sql.trim()}
              >
                {activeTab.loading ? 'Running...' : '▶ Run'}
              </button>
              <span className="query-hint">Ctrl+Enter</span>
            </div>
          </div>
          <textarea
            className="query-input"
            value={activeTab.sql}
            onChange={(e) => updateTab(activeTabId, { sql: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="SELECT * FROM your_table LIMIT 10;"
            spellCheck={false}
          />
        </div>

        <div className="query-results">
          {!activeTab.results && !activeTab.error && !activeTab.loading && (
            <div className="query-empty">
              <span>🔍</span>
              <p>Write a SQL query and press Run or Ctrl+Enter.</p>
              <p className="query-empty-hint">Double-click a table in the sidebar to insert it.</p>
            </div>
          )}
          {activeTab.loading && <div className="query-loading">Executing query...</div>}
          {activeTab.error && <div className="query-error">{activeTab.error}</div>}
          {activeTab.results && (
            <div className="query-table-wrapper">
              <div className="query-meta">
                {activeTab.results.metadata?.rowCount !== undefined && (
                  <span>{activeTab.results.metadata.rowCount} rows</span>
                )}
                {activeTab.results.metadata?.executionTimeMs !== undefined && (
                  <span>{activeTab.results.metadata.executionTimeMs}ms</span>
                )}
              </div>
              <div className="query-table-scroll">
                <table className="query-table">
                  <thead>
                    <tr>
                      {(activeTab.results.columns || []).map((col, i) => (
                        <th key={i}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab.results.rows || []).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell === null ? <span className="null-val">NULL</span> : String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default QueryPage;
