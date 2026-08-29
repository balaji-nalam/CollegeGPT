import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './CustomNodes/TriggerNode';
import ActionNode from './CustomNodes/ActionNode';
import ConditionNode from './CustomNodes/ConditionNode';
import AINode from './CustomNodes/AINode';
import { useWorkflowStore } from '../../store/workflowStore';

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  aiNode: AINode,
};

function FlowCanvas() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
  } = useWorkflowStore();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/agentflow-node');
      if (!rawData) return;

      try {
        const item = JSON.parse(rawData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        addNode(item.type, position, item.data);
      } catch (err) {
        console.error('Failed to parse dropped node data', err);
      }
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback(
    (_, node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div ref={reactFlowWrapper} className="h-full w-full bg-[#080c14] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#1e293b" />
        <Controls className="!bg-[#0d131f] !border-slate-800" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'triggerNode') return '#f59e0b';
            if (n.type === 'aiNode') return '#a855f7';
            if (n.type === 'conditionNode') return '#06b6d4';
            return '#6366f1';
          }}
          maskColor="rgba(8, 12, 20, 0.7)"
          className="!bg-[#0d131f] !border-slate-800"
        />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
