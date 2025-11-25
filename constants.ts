
import { Paper, GraphData } from './types';

export const MOCK_PAPERS: Paper[] = [
  {
    id: '1',
    uploadDate: new Date().toISOString(),
    readStatus: 'read',
    rating: 5,
    notes: [],
    rawText: `Abstract
    The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.`,
    metadata: {
      title: "Attention Is All You Need",
      type: "方法论 (Methodology)",
      year: 2017,
      venue: "NeurIPS",
      authors: ["Vaswani, A.", "Shazeer, N.", "Parmar, N."],
      affiliations: ["Google Brain", "Google Research"],
      url: "https://arxiv.org/abs/1706.03762",
      keywords: ["Transformer", "Attention", "NLP"],
      citation_count: 85000,
      abstract: "主流的序列转换模型基于复杂的循环神经网络或卷积神经网络...",
      problem_solved: "机器翻译长句子时效果不好，因为旧模型（RNN）只能一个词一个词按顺序读，效率低且容易忘掉前面的内容。",
      method_used: "发明了一种叫 'Transformer' 的新架构，完全抛弃了循环结构，利用 '注意力机制' 一次性看懂整句话。",
      implementation: "编码器-解码器结构，核心是多头注意力机制（Multi-Head Attention）。",
      results: "翻译质量达到当时的最先进水平（SOTA），且训练速度大大加快。",
      impact: "彻底改变了 NLP 领域，是后来 GPT、BERT 等所有大语言模型的基石。",
      comparison: "并行计算能力远超 RNN，处理长距离依赖关系更强。",
      takeaway: "注意力机制（Attention）非常强大，完全可以取代循环神经网络。"
    }
  },
  {
    id: '2',
    uploadDate: new Date().toISOString(),
    readStatus: 'reading',
    rating: 4,
    notes: [],
    rawText: `We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.`,
    metadata: {
      title: "BERT: Pre-training of Deep Bidirectional Transformers",
      type: "实证研究 (Empirical)",
      year: 2018,
      venue: "NAACL",
      authors: ["Devlin, J.", "Chang, M.", "Lee, K."],
      affiliations: ["Google AI Language"],
      url: "https://arxiv.org/abs/1810.04805",
      keywords: ["BERT", "Pre-training", "Bidirectional"],
      citation_count: 60000,
      abstract: "我们介绍了一种新的语言表示模型 BERT...",
      problem_solved: "以前的模型（如 GPT-1）只能单向（从左到右）阅读文本，无法真正理解上下文的语境。",
      method_used: "像做完形填空一样，遮住句子里的某些词（Masked LM），强迫模型根据前后文把词猜出来。",
      implementation: "深层双向 Transformer 编码器。",
      results: "横扫了 11 项 NLP 任务，全部刷新记录。",
      impact: "确立了 '预训练 + 微调' 的行业标准范式。",
      comparison: "不同于 GPT 的单向阅读，BERT 是真正的双向深度理解。",
      takeaway: "双向上下文对于理解语言的细微差别至关重要。"
    }
  }
];

export const INITIAL_GRAPH_DATA: GraphData = {
  nodes: [
    { id: "Transformer", group: 1, val: 20, desc: "一种完全基于注意力机制的神经网络架构，大模型的鼻祖。" },
    { id: "Attention Mechanism", group: 1, val: 15, desc: "让模型在处理数据时能“聚焦”于重要部分的一种机制。" },
    { id: "RNN", group: 2, val: 10, desc: "旧式的文本处理方法，像人读文章一样逐词阅读，速度慢。" },
    { id: "BERT", group: 3, val: 18, desc: "谷歌提出的双向语言模型，擅长理解上下文。" },
    { id: "Pre-training", group: 3, val: 12, desc: "预训练：先让模型读海量书籍学通识，再学专业技能。" },
    { id: "NLP", group: 1, val: 25, desc: "自然语言处理：让计算机听懂人类语言的技术。" }
  ],
  links: [
    { source: "Transformer", target: "Attention Mechanism", value: 5 },
    { source: "Transformer", target: "RNN", value: 2 },
    { source: "BERT", target: "Transformer", value: 8 },
    { source: "BERT", target: "Pre-training", value: 4 },
    { source: "Transformer", target: "NLP", value: 10 },
    { source: "BERT", target: "NLP", value: 8 }
  ]
};