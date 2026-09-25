import {useEffect,useMemo,useState} from 'react';
import {AlertTriangle,Check,ChevronDown,Download,FileCode2,HelpCircle,Info,Layers3,Lock,Plus,Search,ShieldCheck,Sparkles,Upload,X} from 'lucide-react';
import {evaluateCompatibility,RELEASE_LICENSE_OPTIONS,Verdict} from './licenseCompatibility';

type Dep={id:number;name:string;version:string;license:string;source:string;note:string};
const initial:Dep[]=[
  {id:1,name:'react',version:'18.3.1',license:'MIT',source:'npm',note:'宽松许可，可商用'},
  {id:2,name:'lodash',version:'4.17.21',license:'MIT',source:'npm',note:'宽松许可，可商用'},
  {id:3,name:'chart.js',version:'4.4.4',license:'MIT',source:'npm',note:'宽松许可，可商用'},
  {id:4,name:'highlight.js',version:'11.10.0',license:'BSD-3-Clause',source:'npm',note:'再发布需保留版权声明'},
  {id:5,name:'legacy-parser',version:'2.1.0',license:'GPL-3.0',source:'手动',note:'可能与闭源分发冲突'},
];
const colors:Record<string,string>={MIT:'#35b995','BSD-3-Clause':'#6d9ee8','GPL-3.0':'#ec8c75','Apache-2.0':'#b18ee4','LGPL-2.1':'#e0b34c'};
const verdictMeta:Record<Verdict,{label:string;cls:string;icon:typeof Check}>={
  compatible:{label:'兼容',cls:'ok',icon:Check},
  manual:{label:'需人工确认',cls:'warn',icon:HelpCircle},
  conflict:{label:'冲突',cls:'risk',icon:AlertTriangle},
};

export default function App(){
  const [deps,setDeps]=useState<Dep[]>(()=>{try{return JSON.parse(localStorage.getItem('license-lens')||'')||initial}catch{return initial}});
  const [releaseLicense,setReleaseLicense]=useState(()=>localStorage.getItem('license-lens-release')||'MIT');
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('全部');
  const [selected,setSelected]=useState(1);
  const [showAdd,setShowAdd]=useState(false);
  const [name,setName]=useState('');
  const [license,setLicense]=useState('MIT');

  useEffect(()=>localStorage.setItem('license-lens',JSON.stringify(deps)),[deps]);
  useEffect(()=>localStorage.setItem('license-lens-release',releaseLicense),[releaseLicense]);

  // 每个依赖相对当前发布许可证的兼容结论；切换发布许可证时自动重算
  const verdicts=useMemo(()=>{
    const m=new Map<number,{verdict:Verdict;reason:string}>();
    deps.forEach(d=>m.set(d.id,evaluateCompatibility(d.license,releaseLicense)));
    return m;
  },[deps,releaseLicense]);
  const verdictOf=(d:Dep)=>verdicts.get(d.id)!;
  const conflicts=deps.filter(d=>verdictOf(d).verdict==='conflict');
  const manuals=deps.filter(d=>verdictOf(d).verdict==='manual');
  const compatibles=deps.filter(d=>verdictOf(d).verdict==='compatible');
  const exportBlocked=conflicts.length>0;

  const filtered=useMemo(()=>deps.filter(d=>(filter==='全部'||verdictOf(d).verdict===filter)&&`${d.name}${d.license}`.toLowerCase().includes(query.toLowerCase())),[deps,filter,query,verdicts]);
  const current=deps.find(d=>d.id===selected);

  const add=()=>{
    if(!name.trim())return;
    const id=Date.now();
    setDeps(ds=>[...ds,{id,name:name.trim(),version:'1.0.0',license,source:'手动',note:license==='MIT'?'宽松许可，可商用':'请核对分发义务'}]);
    setSelected(id);setName('');setShowAdd(false);
  };

  const exportMd=()=>{
    if(exportBlocked)return;
    const text=`# License Lens 报告\n\n发布许可证：${releaseLicense}\n\n| 依赖 | 版本 | 许可证 | 兼容结论 |\n|---|---|---|---|\n${deps.map(d=>`| ${d.name} | ${d.version} | ${d.license} | ${verdictMeta[verdictOf(d).verdict].label} |`).join('\n')}`;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));
    a.download='license-report.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return <div className="shell">
    <aside>
      <div className="brand"><div className="brand-icon"><ShieldCheck size={18}/></div><div><b>License Lens</b><small>dependency clarity</small></div></div>
      <div className="nav-title">WORKSPACE</div>
      <button className="nav active"><Layers3 size={16}/>依赖总览</button>
      <button className="nav"><FileCode2 size={16}/>许可证清单 <span>{deps.length}</span></button>
      <button className="nav"><AlertTriangle size={16}/>待处理风险 <span className="red">{conflicts.length}</span></button>
      <div className="aside-bottom">
        <div className="mini-card"><Sparkles size={16}/><div><b>扫描已更新</b><small>刚刚完成 {deps.length} 个依赖的分析</small></div></div>
        <div className="user"><div className="avatar">ZL</div><span>Zen Li</span><ChevronDown size={14}/></div>
      </div>
    </aside>
    <main>
      <header>
        <div>
          <div className="crumb">WORKSPACE / <b>PROJECT SCAN</b></div>
          <h1>许可证兼容性分析</h1>
          <p>选择发布许可证，检查每个依赖能否一起发布。</p>
        </div>
        <div className="head-actions">
          <button className="outline" onClick={exportMd} disabled={exportBlocked} title={exportBlocked?'存在冲突依赖，报告导出已锁定':'导出 Markdown 报告'}>
            {exportBlocked?<Lock size={15}/>:<Download size={15}/>}导出报告
          </button>
          <button className="primary" onClick={()=>setShowAdd(true)}><Plus size={16}/>添加依赖</button>
        </div>
      </header>

      <section className="release-bar">
        <div className="release-label"><Upload size={16}/><div><b>发布许可证</b><small>项目将以该许可证对外发布</small></div></div>
        <select value={releaseLicense} onChange={e=>setReleaseLicense(e.target.value)}>
          {RELEASE_LICENSE_OPTIONS.map(l=><option key={l} value={l}>{l}</option>)}
        </select>
        <span className="release-hint">切换发布许可证后，所有依赖的兼容结论将重新计算</span>
      </section>

      {exportBlocked&&<div className="conflict-banner">
        <AlertTriangle size={16}/>
        <div>
          <b>发现 {conflicts.length} 个冲突依赖，报告导出已锁定</b>
          <p>{conflicts.map(d=>`${d.license}（${d.name}）与发布许可证 ${releaseLicense} 放不到同一个分发包里`).join('；')}。请替换依赖或调整发布许可证后重试。</p>
        </div>
      </div>}
      {!exportBlocked&&manuals.length>0&&<div className="manual-banner">
        <HelpCircle size={16}/>
        <div><b>{manuals.length} 个依赖需要人工确认</b><p>{manuals.map(d=>d.name).join('、')} 与 {releaseLicense} 的兼容关系无法自动判定，建议发布前人工核对。</p></div>
      </div>}

      <section className="hero">
        <div>
          <span className="tag">PROJECT · AURORA-WEB</span>
          <h2>发布前，再确认一次。</h2>
          <p>按发布许可证 <b>{releaseLicense}</b> 扫描了 <b>{deps.length} 个依赖</b>，<b className="warning">{conflicts.length} 个冲突</b>、<b className="warning">{manuals.length} 个待人工确认</b>。</p>
        </div>
        <div className="scan-score">
          <div className="score-ring"><strong>{deps.length?Math.round(compatibles.length/deps.length*100):0}<small>%</small></strong></div>
          <div><span>兼容评分</span><b>{exportBlocked?'存在冲突':manuals.length?'需要复核':'良好'}</b><small>上次扫描 2 分钟前</small></div>
        </div>
      </section>

      <section className="summary">
        <div><span>全部依赖</span><b>{deps.length}</b><small>发布许可证 {releaseLicense}</small></div>
        <div><span>兼容</span><b className="teal">{compatibles.length}</b><small>可随 {releaseLicense} 一起发布</small></div>
        <div><span>需人工确认</span><b className="orange">{manuals.length}</b><small>关系不明，发布前核对</small></div>
        <div><span>冲突</span><b className="red">{conflicts.length}</b><small>挡住导出，需先处理</small></div>
      </section>

      <section className="workspace">
        <div className="table-pane">
          <div className="pane-head">
            <div><h2>依赖清单</h2><p>兼容结论随发布许可证实时更新</p></div>
            <div className="tools">
              <div className="search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索依赖"/></div>
              <select value={filter} onChange={e=>setFilter(e.target.value)}>
                <option value="全部">全部结论</option>
                <option value="compatible">兼容</option>
                <option value="manual">需人工确认</option>
                <option value="conflict">冲突</option>
              </select>
            </div>
          </div>
          <div className="table">
            <div className="tr th"><span>依赖名称</span><span>版本</span><span>许可证</span><span>兼容结论</span></div>
            {filtered.map(d=>{
              const v=verdictOf(d);const meta=verdictMeta[v.verdict];const Icon=meta.icon;
              return <button className={d.id===selected?'tr selected':'tr'} key={d.id} onClick={()=>setSelected(d.id)}>
                <span className="dep-name"><span className="pkg-dot"/> {d.name}</span>
                <span className="muted">{d.version}</span>
                <span><i className="license" style={{color:colors[d.license]||'#888',background:(colors[d.license]||'#888')+'18'}}>{d.license}</i></span>
                <span className={'status '+meta.cls}><Icon size={13}/> {meta.label}</span>
              </button>;
            })}
          </div>
        </div>

        {current&&(()=>{const v=verdictOf(current);const meta=verdictMeta[v.verdict];const Icon=meta.icon;
          return <div className="detail">
            <div className="detail-head">
              <div className="detail-icon" style={{background:(colors[current.license]||'#888')+'1c',color:colors[current.license]}}><FileCode2 size={20}/></div>
              <div><span>SELECTED DEPENDENCY</span><h2>{current.name}</h2></div>
              <button className="close" onClick={()=>setSelected(0)}><X size={16}/></button>
            </div>
            <div className="detail-grid">
              <div><label>版本</label><b>{current.version}</b></div>
              <div><label>来源</label><b>{current.source}</b></div>
              <div><label>许可证</label><b>{current.license}</b></div>
            </div>
            <div className={'finding '+meta.cls}>
              <div className="finding-icon"><Icon size={16}/></div>
              <div>
                <b>{v.verdict==='compatible'?`与发布许可证 ${releaseLicense} 兼容`:v.verdict==='manual'?'需要人工确认':`与发布许可证 ${releaseLicense} 冲突`}</b>
                <p>{v.reason}{v.verdict==='conflict'&&' 该依赖会挡住报告导出，请替换依赖或调整发布许可证。'}</p>
              </div>
            </div>
            <div className="full-license">
              <div><Info size={15}/><span>许可证摘要</span></div>
              <p>{current.license} 允许在满足其条款的前提下使用和分发代码。详细义务请参考项目仓库中的 LICENSE 文件。</p>
              <button>查看原文 <ChevronDown size={14}/></button>
            </div>
          </div>;
        })()}
      </section>
    </main>

    {showAdd&&<div className="backdrop" onClick={()=>setShowAdd(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><h2>添加依赖</h2><button onClick={()=>setShowAdd(false)}>×</button></div>
        <label>依赖名称<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="例如 date-fns"/></label>
        <label>许可证<select value={license} onChange={e=>setLicense(e.target.value)}>
          <option>MIT</option><option>BSD-3-Clause</option><option>Apache-2.0</option><option>LGPL-2.1</option><option>GPL-3.0</option><option>其它/未知</option>
        </select></label>
        <button className="primary full" onClick={add}>加入扫描</button>
      </div>
    </div>}
  </div>;
}
