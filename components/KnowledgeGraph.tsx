import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, KnowledgeNode, KnowledgeLink } from '../types';

interface Props {
  data: GraphData;
  onNodeClick: (node: KnowledgeNode) => void;
}

const KnowledgeGraph: React.FC<Props> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<KnowledgeNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.nodes.length === 0) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Simulation setup
    const simulation = d3.forceSimulation(data.nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.val + 5));

    // Draw Links
    const link = svg.append("g")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    // Draw Nodes
    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", (d) => d.val)
      .attr("fill", (d) => {
        const colors = ["#60a5fa", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"];
        return colors[d.group % colors.length];
      })
      .attr("cursor", "pointer")
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Labels
    const text = svg.append("g")
        .selectAll("text")
        .data(data.nodes)
        .join("text")
        .text((d) => d.id)
        .attr("font-size", "10px")
        .attr("fill", "#334155")
        .attr("text-anchor", "middle")
        .attr("dy", (d) => d.val + 12)
        .style("pointer-events", "none");


    // Events
    node.on("mouseover", (event, d) => {
        setHoveredNode(d);
        d3.select(event.currentTarget).attr("stroke", "#1e293b").attr("stroke-width", 3);
    })
    .on("mouseout", (event) => {
        setHoveredNode(null);
        d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 1.5);
    })
    .on("click", (event, d) => {
        onNodeClick(d);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
      
      text
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <svg ref={svgRef} className="w-full h-full"></svg>
        {hoveredNode && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-200 max-w-xs pointer-events-none">
                <h4 className="font-bold text-slate-800">{hoveredNode.id}</h4>
                <p className="text-sm text-slate-600 mt-1">{hoveredNode.desc}</p>
            </div>
        )}
    </div>
  );
};

export default KnowledgeGraph;
