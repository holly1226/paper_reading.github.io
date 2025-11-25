
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Paper, ViewMode, GraphData, KnowledgeNode } from './types';
import { MOCK_PAPERS, INITIAL_GRAPH_DATA } from './constants';
import { parsePaperWithGemini, extractKnowledgeGraph } from './services/geminiService';
import { HashRouter } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Library, 
  BookOpen, 
  Network, 
  Upload, 
  User, 
  Search,
  Loader2,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import KnowledgeGraph from './components/KnowledgeGraph';
import PaperReader from './components/PaperReader';

const App = () => {
  // Application State
  const [view, setView] = useState<ViewMode>('dashboard');
  const [papers, setPapers] = useState<Paper[]>(MOCK_PAPERS);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData>(INITIAL_GRAPH_DATA);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Stats Data
  const statsData = [
    { name: '周一', reads: 2 },
    { name: '周二', reads: 5 },
    { name: '周三', reads: 1 },
    { name: '周四', reads: 4 },
    { name: '周五', reads: 3 },
    { name: '周六', reads: 6 },
    { name: '周日', reads: 4 },
  ];

  // Helper for delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Batch Upload Handler
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 50) {
        alert("单次上传限制为 50 篇论文。");
        return;
    }

    setIsUploading(true);
    let successCount = 0;

    // Convert FileList to Array
    const fileList = Array.from(files);

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress(`正在解析 (${i + 1}/${fileList.length}): ${file.name}`);
        
        try {
            // Read file content
            const textContent = await file.text(); // Assuming text/pdf content extraction is handled or mocked here
            
            // In a real scenario with PDF, use pdf.js to extract textContent from ArrayBuffer.
            // Since we can't easily include heavy pdf.js worker in this single file demo, 
            // we will assume the file.text() returns something usable or we treat it as a mock trigger.
            // If the file is binary (PDF), textContent will be garbage, so we'll simulate text for this demo if needed.
            let safeText = textContent;
            if (file.type === "application/pdf" || textContent.length < 50) {
                 safeText = `Title: ${file.name}\nAbstract: This is a placeholder for the parsed content of ${file.name}. The actual PDF parsing would happen here using pdf.js.`;
            }

            // Sequential processing to avoid Rate Limits (429)
            // Wait a bit before hitting API
            if (i > 0) await delay(3000); 

            const parsedMetadata = await parsePaperWithGemini(safeText);
            const graphUpdates = await extractKnowledgeGraph(safeText);

            const newPaper: Paper = {
                id: Date.now().toString() + Math.random(),
                uploadDate: new Date().toISOString(),
                readStatus: 'unread',
                rating: 0,
                notes: [],
                rawText: safeText,
                metadata: parsedMetadata
            };

            setPapers(prev => [newPaper, ...prev]);

            // Merge Graph Nodes
            if (graphUpdates.nodes.length > 0) {
                setGraphData(prev => ({
                    nodes: [...prev.nodes, ...graphUpdates.nodes.filter((n: any) => !prev.nodes.find(pn => pn.id === n.id))],
                    links: [...prev.links, ...graphUpdates.links]
                }));
            }
            successCount++;

        } catch (error: any) {
            console.error(`Failed to parse ${file.name}`, error);
            // If Rate Limit, wait longer
            if (error.message && error.message.includes("429")) {
                await delay(5000);
            }
        }
    }

    setUploadProgress("");
    setIsUploading(false);
    alert(`上传完成！成功解析 ${successCount} 篇论文。`);
    setView('library');
  };

  // Export Papers to Excel
  const exportPapersExcel = () => {
      const data = papers.map((p, index) => ({
          "序号": index + 1,
          "Title": p.metadata.title,
          "类型": p.metadata.type,
          "Year": p.metadata.year,
          "Conference/Journal": p.metadata.venue,
          "作者 / 机构": `${p.metadata.authors.join(', ')} / ${p.metadata.affiliations?.join(', ') || ''}`,
          "Keywords": p.metadata.keywords.join(', '),
          "Citation": p.metadata.citation_count,
          "摘要": p.metadata.abstract,
          "解决什么问题": p.metadata.problem_solved,
          "使用什么方法": p.metadata.method_used,
          "实现方法的方案": p.metadata.implementation,
          "结果 / 结论": p.metadata.results,
          "对领域的影响": p.metadata.impact,
          "特点比较": p.metadata.comparison,
          "Takeaway": p.metadata.takeaway,
          "链接": p.metadata.url || ""
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Papers");
      XLSX.writeFile(wb, "PaperDecipher_Library.xlsx");
  };

  // Export Knowledge Terms
  const exportTerms = () => {
      const data = graphData.nodes.map((n, index) => ({
          "序号": index + 1,
          "专业名词": n.id,
          "通俗解释 (大白话)": n.desc,
          "重要性": n.val
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Terms");
      XLSX.writeFile(wb, "PaperDecipher_Terms.xlsx");
  };

  const navigateToPaper = (id: string) => {
    setActivePaperId(id);
    setView('reader');
  };

  const handleNodeClick = (node: KnowledgeNode) => {
      const relatedPaper = papers.find(p => 
          p.metadata.keywords.includes(node.id) || 
          p.rawText.includes(node.id)
      );
      if (relatedPaper) {
          navigateToPaper(relatedPaper.id);
      } else {
          alert(`正在探索概念: ${node.id}\n解释: ${node.desc}`);
      }
  };

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-100 text-slate-900 font-sans">
        
        {/* Sidebar */}
        <aside className="w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-all duration-300">
          <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
             <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
             <span className="text-xl font-bold text-white hidden lg:block">PaperDecipher</span>
          </div>

          <nav className="flex-1 mt-6 px-4 space-y-2">
            <NavItem icon={<LayoutDashboard />} label="仪表盘" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
            <NavItem icon={<Library />} label="论文库" active={view === 'library'} onClick={() => setView('library')} />
            <NavItem icon={<BookOpen />} label="阅读器" active={view === 'reader'} onClick={() => setView('reader')} />
            <NavItem icon={<Network />} label="知识图谱" active={view === 'graph'} onClick={() => setView('graph')} />
          </nav>

          <div className="p-4 border-t border-slate-800 space-y-2">
             <button onClick={exportPapersExcel} className="w-full flex items-center gap-2 px-2 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded">
                <FileSpreadsheet size={14} /> 导出论文 (Excel)
             </button>
             <button onClick={exportTerms} className="w-full flex items-center gap-2 px-2 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded">
                <FileText size={14} /> 导出名词 (Excel/Word)
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-slate-800 capitalize">
                        {view === 'dashboard' && '仪表盘'}
                        {view === 'library' && '我的论文库'}
                        {view === 'reader' && '智能阅读器'}
                        {view === 'graph' && '个人知识图谱'}
                    </h1>
                    {isUploading && <span className="text-xs text-blue-600 animate-pulse">{uploadProgress}</span>}
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="搜索论文、关键词..." className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
                    </div>
                    <label className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium cursor-pointer transition-colors ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}>
                        {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        <span className="hidden sm:inline">{isUploading ? '解析中...' : '批量上传 (PDF/Doc)'}</span>
                        <input 
                            type="file" 
                            multiple 
                            className="hidden" 
                            accept=".txt,.pdf,.docx" 
                            onChange={handleUpload} 
                            disabled={isUploading} 
                        />
                    </label>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 relative">
                
                {/* VIEW: DASHBOARD */}
                {view === 'dashboard' && (
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard label="论文总数" value={papers.length} sub="生涯累计" color="bg-blue-50 text-blue-600" />
                            <StatCard label="知识节点" value={graphData.nodes.length} sub="大白话解读" color="bg-purple-50 text-purple-600" />
                            <StatCard label="学习时长" value="32 小时" sub="本周" color="bg-emerald-50 text-emerald-600" />
                        </div>

                        {/* Chart & Recent */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">阅读趋势</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                                            <Bar dataKey="reads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">最近上传</h3>
                                <div className="space-y-4">
                                    {papers.slice(0, 3).map(p => (
                                        <div key={p.id} onClick={() => navigateToPaper(p.id)} className="group cursor-pointer border-b border-slate-50 last:border-0 pb-2">
                                            <div className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 truncate">{p.metadata.title}</div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-xs text-slate-400">{new Date(p.uploadDate).toLocaleDateString()}</span>
                                                <span className="text-xs text-blue-500 bg-blue-50 px-1.5 rounded">{p.metadata.type.split(' ')[0]}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {papers.length === 0 && <p className="text-sm text-slate-400">暂无上传记录</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: LIBRARY */}
                {view === 'library' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-slate-500 text-sm">共 {papers.length} 篇论文</p>
                            <button onClick={exportPapersExcel} className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50">
                                <FileSpreadsheet size={16} /> 导出汇总表
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {papers.map(p => (
                                <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded uppercase font-bold tracking-wider truncate max-w-[70%]">{p.metadata.type}</span>
                                        <span className="text-xs text-slate-400">{p.metadata.year}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-tight">{p.metadata.title}</h3>
                                    <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">{p.metadata.problem_solved}</p>
                                    <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                                        {p.metadata.keywords.slice(0, 3).map(k => (
                                            <span key={k} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">#{k}</span>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => navigateToPaper(p.id)}
                                        className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <BookOpen size={16} /> 阅读论文
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* VIEW: READER */}
                {view === 'reader' && (
                    <PaperReader 
                        papers={papers} 
                        activePaperId={activePaperId} 
                        onSelectPaper={setActivePaperId} 
                    />
                )}

                {/* VIEW: KNOWLEDGE GRAPH */}
                {view === 'graph' && (
                    <div className="h-[calc(100vh-140px)] w-full relative">
                         <div className="absolute top-4 right-4 z-10 bg-white/90 p-2 rounded shadow border border-slate-200">
                             <h4 className="text-xs font-bold text-slate-500 mb-2">操作</h4>
                             <button onClick={exportTerms} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                 <FileSpreadsheet size={14} /> 导出名词解释
                             </button>
                         </div>
                        <KnowledgeGraph data={graphData} onNodeClick={handleNodeClick} />
                    </div>
                )}

            </div>
        </main>
      </div>
    </HashRouter>
  );
};

// Sub-components
const NavItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
        <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-white'}>{React.cloneElement(icon, { size: 20 })}</span>
        <span className="hidden lg:block text-sm font-medium">{label}</span>
    </button>
);

const StatCard = ({ label, value, sub, color }: { label: string, value: string | number, sub: string, color: string }) => (
    <div className={`p-6 rounded-xl border border-slate-100 shadow-sm bg-white`}>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>
        <p className={`text-xs inline-block px-2 py-0.5 rounded-full ${color}`}>{sub}</p>
    </div>
);

export default App;