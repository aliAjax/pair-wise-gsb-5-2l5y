import {useEffect, useMemo, useState} from 'react';
import {AlertTriangle, Ban, Check, ChevronDown, Download, FileCode2, Info, Layers3, Plus, Search, ShieldCheck, Sparkles, X} from 'lucide-react';
import {CompatStatus, DEP_LICENSES, evaluate, RELEASE_LABELS, RELEASE_LICENSES, ReleaseLicense} from './compatibility';

type Dep = {id: number; name: string; version: string; license: string; source: string; note: string};
type EvaluatedDep = Dep & {compat: CompatStatus; reason: string};

const initial: Dep[] = [
  {id: 1, name: 'react', version: '18.3.1', license: 'MIT', source: 'npm', note: '宽松许可，可商用'},
  {id: 2, name: 'lodash', version: '4.17.21', license: 'MIT', source: 'npm', note: '宽松许可，可商用'},
  {id: 3, name: 'chart.js', version: '4.4.4', license: 'MIT', source: 'npm', note: '宽松许可，可商用'},
  {id: 4, name: 'highlight.js', version: '11.10.0', license: 'BSD-3-Clause', source: 'npm', note: '再发布需保留版权声明'},
  {id: 5, name: 'native-driver', version: '0.9.2', license: 'LGPL-3.0', source: 'npm', note: '需确认链接方式'},
  {id: 6, name: 'legacy-parser', version: '2.1.0', license: 'GPL-3.0', source: '手动', note: '可能与闭源分发冲突'},
];

const colors: Record<string, string> = {
  MIT: '#35b995',
  'BSD-3-Clause': '#6d9ee8',
  'Apache-2.0': '#b18ee4',
  'MPL-2.0': '#e8b06d',
  'LGPL-3.0': '#e0c95e',
  'GPL-3.0': '#ec8c75',
  'AGPL-3.0': '#e06a8a',
  '未知': '#9aa8ac',
};

// 兼容结论 → 展示样式（复用现有 ok/warn/risk 配色）
const STATUS_META: Record<CompatStatus, {label: string; className: string}> = {
  compatible: {label: '兼容', className: 'ok'},
  review: {label: '需确认', className: 'warn'},
  conflict: {label: '冲突', className: 'risk'},
};

export default function App() {
  const [deps, setDeps] = useState<Dep[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('license-lens') || '') || initial;
    } catch {
      return initial;
    }
  });
  const [release, setRelease] = useState<ReleaseLicense>(() => {
    const saved = localStorage.getItem('license-lens-release') || '';
    return (RELEASE_LICENSES as readonly string[]).includes(saved) ? (saved as ReleaseLicense) : 'MIT';
  });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('全部');
  const [selected, setSelected] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [license, setLicense] = useState('MIT');

  useEffect(() => localStorage.setItem('license-lens', JSON.stringify(deps)), [deps]);
  useEffect(() => localStorage.setItem('license-lens-release', release), [release]);

  // 换发布许可证 → 所有依赖的兼容结论重新计算
  const evaluated: EvaluatedDep[] = useMemo(
    () =>
      deps.map(d => {
        const r = evaluate(d.license, release);
        return {...d, compat: r.status, reason: r.reason};
      }),
    [deps, release],
  );

  const conflicts = evaluated.filter(d => d.compat === 'conflict');
  const reviews = evaluated.filter(d => d.compat === 'review');
  const current = evaluated.find(d => d.id === selected);
  const filtered = useMemo(
    () => evaluated.filter(d => (filter === '全部' || d.compat === filter) && `${d.name}${d.license}`.toLowerCase().includes(query.toLowerCase())),
    [evaluated, filter, query],
  );

  const add = () => {
    if (!name.trim()) return;
    const id = Date.now();
    setDeps(ds => [...ds, {id, name: name.trim(), version: '1.0.0', license, source: '手动', note: '请核对分发义务'}]);
    setSelected(id);
    setName('');
    setShowAdd(false);
  };

  const exportMd = () => {
    if (conflicts.length) return; // 冲突时按钮已禁用，这里双保险
    const text = `# License Lens 报告\n\n发布许可证：${RELEASE_LABELS[release]}\n\n| 依赖 | 版本 | 许可证 | 结论 | 说明 |\n|---|---|---|---|---|\n${evaluated
      .map(d => `| ${d.name} | ${d.version} | ${d.license} | ${STATUS_META[d.compat].label} | ${d.reason} |`)
      .join('\n')}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type: 'text/markdown'}));
    a.download = 'license-report.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <b>License Lens</b>
            <small>dependency clarity</small>
          </div>
        </div>
        <div className="nav-title">WORKSPACE</div>
        <button className="nav active">
          <Layers3 size={16} />
          依赖总览
        </button>
        <button className="nav">
          <FileCode2 size={16} />
          许可证清单 <span>{deps.length}</span>
        </button>
        <button className="nav">
          <AlertTriangle size={16} />
          待处理风险 <span className="red">{conflicts.length}</span>
        </button>
        <div className="aside-bottom">
          <div className="mini-card">
            <Sparkles size={16} />
            <div>
              <b>扫描已更新</b>
              <small>刚刚完成 {deps.length} 个依赖的分析</small>
            </div>
          </div>
          <div className="user">
            <div className="avatar">ZL</div>
            <span>Zen Li</span>
            <ChevronDown size={14} />
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <div className="crumb">
              WORKSPACE / <b>PROJECT SCAN</b>
            </div>
            <h1>许可证兼容性分析</h1>
            <p>选定发布许可证，检查每个依赖能否一起分发。</p>
          </div>
          <div className="head-actions">
            <label className="release-picker">
              发布许可证
              <select value={release} onChange={e => setRelease(e.target.value as ReleaseLicense)}>
                {RELEASE_LICENSES.map(l => (
                  <option key={l} value={l}>
                    {RELEASE_LABELS[l]}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="outline"
              onClick={exportMd}
              disabled={conflicts.length > 0}
              title={conflicts.length ? '存在冲突依赖，解决后才能导出' : undefined}>
              <Download size={15} />
              导出报告
            </button>
            <button className="primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} />
              添加依赖
            </button>
          </div>
        </header>
        {conflicts.length > 0 && (
          <section className="conflict-banner">
            <div className="conflict-title">
              <Ban size={15} />
              <b>存在 {conflicts.length} 个许可证冲突，已阻止导出报告</b>
            </div>
            <ul>
              {conflicts.map(d => (
                <li key={d.id}>
                  <b>{d.name}</b>：{d.reason}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="hero">
          <div>
            <span className="tag">PROJECT · AURORA-WEB · 发布为 {RELEASE_LABELS[release]}</span>
            <h2>发布前，再确认一次。</h2>
            <p>
              我们扫描了 <b>{deps.length} 个依赖</b>，发现 <b className="warning">{conflicts.length + reviews.length} 个项目</b>
              需要你的关注。
            </p>
          </div>
          <div className="scan-score">
            <div className="score-ring">
              <strong>
                {evaluated.length ? Math.round((evaluated.filter(d => d.compat === 'compatible').length / evaluated.length) * 100) : 0}
                <small>%</small>
              </strong>
            </div>
            <div>
              <span>兼容评分</span>
              <b>{conflicts.length ? '存在冲突' : reviews.length ? '待确认' : '良好'}</b>
              <small>上次扫描 2 分钟前</small>
            </div>
          </div>
        </section>
        <section className="summary">
          <div>
            <span>全部依赖</span>
            <b>{deps.length}</b>
            <small>+2 本次新增</small>
          </div>
          <div>
            <span>兼容</span>
            <b className="teal">{evaluated.filter(d => d.compat === 'compatible').length}</b>
            <small>可随 {RELEASE_LABELS[release]} 分发</small>
          </div>
          <div>
            <span>需人工确认</span>
            <b className="orange">{reviews.length}</b>
            <small>无法自动判定</small>
          </div>
          <div>
            <span>冲突</span>
            <b className="red">{conflicts.length}</b>
            <small>建议替换或隔离</small>
          </div>
        </section>
        <section className="workspace">
          <div className="table-pane">
            <div className="pane-head">
              <div>
                <h2>依赖清单</h2>
                <p>按发布许可证 {RELEASE_LABELS[release]} 判定</p>
              </div>
              <div className="tools">
                <div className="search">
                  <Search size={15} />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索依赖" />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="全部">全部状态</option>
                  <option value="compatible">兼容</option>
                  <option value="review">需确认</option>
                  <option value="conflict">冲突</option>
                </select>
              </div>
            </div>
            <div className="table">
              <div className="tr th">
                <span>依赖名称</span>
                <span>版本</span>
                <span>许可证</span>
                <span>状态</span>
              </div>
              {filtered.map(d => (
                <button className={d.id === selected ? 'tr selected' : 'tr'} key={d.id} onClick={() => setSelected(d.id)}>
                  <span className="dep-name">
                    <span className="pkg-dot" /> {d.name}
                  </span>
                  <span className="muted">{d.version}</span>
                  <span>
                    <i className="license" style={{color: colors[d.license] || '#888', background: (colors[d.license] || '#888') + '18'}}>
                      {d.license}
                    </i>
                  </span>
                  <span className={'status ' + STATUS_META[d.compat].className}>
                    {d.compat === 'compatible' ? <Check size={13} /> : <AlertTriangle size={13} />} {STATUS_META[d.compat].label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {current && (
            <div className="detail">
              <div className="detail-head">
                <div
                  className="detail-icon"
                  style={{background: (colors[current.license] || '#888') + '1c', color: colors[current.license]}}>
                  <FileCode2 size={20} />
                </div>
                <div>
                  <span>SELECTED DEPENDENCY</span>
                  <h2>{current.name}</h2>
                </div>
                <button className="close" onClick={() => setSelected(0)}>
                  <X size={16} />
                </button>
              </div>
              <div className="detail-grid">
                <div>
                  <label>版本</label>
                  <b>{current.version}</b>
                </div>
                <div>
                  <label>来源</label>
                  <b>{current.source}</b>
                </div>
                <div>
                  <label>许可证</label>
                  <b>{current.license}</b>
                </div>
              </div>
              <div className={'finding ' + STATUS_META[current.compat].className}>
                <div className="finding-icon">{current.compat === 'compatible' ? <Check size={16} /> : <AlertTriangle size={16} />}</div>
                <div>
                  <b>
                    {current.compat === 'compatible'
                      ? '与发布许可兼容'
                      : current.compat === 'review'
                        ? '需要人工确认'
                        : '与发布许可冲突'}
                  </b>
                  <p>{current.reason}。扫描结果基于 package 元数据，请在发布前查看完整许可证文本。</p>
                </div>
              </div>
              <div className="full-license">
                <div>
                  <Info size={15} />
                  <span>许可证摘要</span>
                </div>
                <p>{current.license} 允许在满足其条款的前提下使用和分发代码。详细义务请参考项目仓库中的 LICENSE 文件。</p>
                <button>
                  查看原文 <ChevronDown size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
      {showAdd && (
        <div className="backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>添加依赖</h2>
              <button onClick={() => setShowAdd(false)}>×</button>
            </div>
            <label>
              依赖名称
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="例如 date-fns" />
            </label>
            <label>
              许可证
              <select value={license} onChange={e => setLicense(e.target.value)}>
                {DEP_LICENSES.map(l => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <button className="primary full" onClick={add}>
              加入扫描
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
