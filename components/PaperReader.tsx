
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Paper, ExplanationLevel } from '../types';
import { explainTermWithGemini } from '../services/geminiService';
import { BookOpen, Highlighter, MessageSquare, List, Sparkles, Brain, Download } from 'lucide-react';

interface Props {
  papers: Paper[];
  activePaperId: string | null;
  onSelectPaper: (id: string) => void;
}

const PaperReader: React.FC<Props> = ({ papers, activePaperId, onSelectPaper }) => {
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>(ExplanationLevel.BEGINNER);
  const [targetText, setTargetText] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'meta' | 'explain'>('meta');
  const [hoveredParaIndex, setHoveredParaIndex] = useState<number | null>(null);

  const explanationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePaper = papers.find(p => p.id === activePaperId);

  // Split text into paragraphs for interactive hover
  const paragraphs = activePaper?.rawText 
    ? activePaper.rawText.split(/\n\s*\n/).filter(p => p.trim().length > 0) 
    : [];

  const handleExplain = async (text: string, manual = false) => {
    // Debounce or prevent too many requests if hovering rapidly
    if (text === targetText && !manual) return;
    
    setTargetText(text);
    setIsExplaining(true);
    setExplanation("✨ 正在尝试用大白话解释...");
    
    // Switch to explain panel if not already
    if (manual) setRightPanelMode('explain');

    try {
      // Small delay to prevent jitter
      if (explanationTimeoutRef.current) clearTimeout(explanationTimeoutRef.current);
      
      explanationTimeoutRef.current = setTimeout(async () => {
          const result = await explainTermWithGemini(text, activePaper?.rawText || "", explanationLevel);
          setExplanation(result);
          setIsExplaining(false);
      }, 600); // 600ms delay before calling API
      
    } catch (e) {
      setExplanation("无法生成解释。");
      setIsExplaining(false);
    }
  };

  // Handle manual selection
  const handleTextMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString().trim();
      setRightPanelMode('explain');
      if (explanationTimeoutRef.current) clearTimeout(explanationTimeoutRef.current);
      handleExplain(text, true);
    }
  };

  // Auto re-explain if level changes
  useEffect(() => {
    if (targetText && rightPanelMode === 'explain') {
        handleExplain(targetText, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explanationLevel]);


  if (!activePaper) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        请选择一篇论文开始阅读
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white rounded-xl shadow-lg border border-slate-200">
      
      {/* LEFT: Paper List */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-slate-200 font-semibold text-slate-700 flex items-center gap-2">
            <List size={18} /> 论文列表
        </div>
        <div className="overflow-y-auto flex-1">
          {papers.map(p => (
            <div 
              key={p.id}
              onClick={() => onSelectPaper(p.id)}
              className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-white transition-colors ${activePaperId === p.id ? 'bg-white border-l-4 border-l-blue-500 shadow-sm' : ''}`}
            >
              <h4 className="text-sm font-medium text-slate-800 line-clamp-2">{p.metadata.title}</h4>
              <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                 <span className="truncate max-w-[80px]">{p.metadata.venue}</span>
                 <span>{p.metadata.year}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Reader */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
            <h2 className="text-lg font-bold truncate text-slate-800 pr-4">{activePaper.metadata.title}</h2>
            <div className="flex gap-2 text-slate-400">
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                    悬停段落自动解读
                </span>
            </div>
        </div>
        <div 
            className="flex-1 overflow-y-auto p-8 font-serif leading-loose text-lg text-slate-800 max-w-4xl mx-auto selection:bg-blue-100 selection:text-blue-900"
            onMouseUp={handleTextMouseUp}
        >
            {paragraphs.length > 0 ? paragraphs.map((para, idx) => (
                <p 
                    key={idx} 
                    className={`mb-6 p-2 rounded transition-colors duration-200 cursor-text 
                        ${hoveredParaIndex === idx ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                    onMouseEnter={() => {
                        setHoveredParaIndex(idx);
                        // Auto explain on hover if pane is open or we want aggressive assistance
                        if (rightPanelMode === 'explain') {
                             handleExplain(para);
                        }
                    }}
                    onMouseLeave={() => setHoveredParaIndex(null)}
                    onClick={() => {
                        setRightPanelMode('explain');
                        handleExplain(para, true);
                    }}
                >
                    {para}
                </p>
            )) : <p className="text-slate-400 italic">暂无文本内容，请上传有效文件。</p>}
        </div>
      </div>

      {/* RIGHT: AI Assistant Panel */}
      <div className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col shrink-0">
        
        {/* Toggle Header */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setRightPanelMode('meta')}
                className={`flex-1 py-3 text-sm font-medium ${rightPanelMode === 'meta' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                深度解析
            </button>
            <button 
                onClick={() => setRightPanelMode('explain')}
                className={`flex-1 py-3 text-sm font-medium ${rightPanelMode === 'explain' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                智能翻译
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            {rightPanelMode === 'meta' ? (
                <div className="space-y-6">
                    <MetaCard title="解决什么问题？" content={activePaper.metadata.problem_solved} icon={<Brain size={16} className="text-purple-500" />} />
                    <MetaCard title="用了什么方法？" content={activePaper.metadata.method_used} icon={<Sparkles size={16} className="text-amber-500" />} />
                    <MetaCard title="核心结论 (Takeaway)" content={activePaper.metadata.takeaway} icon={<Highlighter size={16} className="text-emerald-500" />} />
                    
                    <div className="pt-4 border-t border-slate-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">关键词</h3>
                        <div className="flex flex-wrap gap-2">
                            {activePaper.metadata.keywords.map(k => (
                                <span key={k} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-full">{k}</span>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    {/* Level Selector */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">解释深度</label>
                        <select 
                            value={explanationLevel}
                            onChange={(e) => setExplanationLevel(e.target.value as ExplanationLevel)}
                            className="w-full text-sm p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.values(ExplanationLevel).map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    {targetText ? (
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-y-auto">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">原文内容</h3>
                            <blockquote className="text-slate-600 text-xs italic border-l-2 border-blue-400 pl-3 mb-4 max-h-32 overflow-hidden text-ellipsis">
                                "{targetText}"
                            </blockquote>

                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Sparkles size={14} className="text-blue-500" /> 
                                {isExplaining ? 'AI 正在思考...' : '大白话解读'}
                            </h3>
                            <div className={`text-slate-800 text-sm leading-relaxed ${isExplaining ? 'animate-pulse opacity-70' : ''}`}>
                                {explanation}
                            </div>
                         </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-4">
                            <MessageSquare size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">鼠标悬停或选中段落，<br/>AI 即刻为您生成通俗解读。</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const MetaCard = ({ title, content, icon }: { title: string, content: string, icon: any }) => (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
            {icon} {title}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">{content}</p>
    </div>
);

export default PaperReader;
