import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import api from '../services/api';

export const useWorkflowStore = create((set, get) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false,
  isSaving: false,
  isDirty: false,
  error: null,

  setWorkflow: (workflow) => {
    set({
      workflow,
      nodes: workflow?.nodes || [],
      edges: workflow?.edges || [],
      selectedNodeId: null,
      isDirty: false,
    });
  },

  loadWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/workflows/${id}`);
      const wf = res.data.data;
      set({
        workflow: wf,
        nodes: wf.nodes || [],
        edges: wf.edges || [],
        selectedNodeId: null,
        isLoading: false,
        isDirty: false,
      });
      return wf;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load workflow';
      set({ isLoading: false, error: msg });
      return null;
    }
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true,
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    }));
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        },
        state.edges
      ),
      isDirty: true,
    }));
  },

  addNode: (nodeType, position, initialData = {}) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newNode = {
      id,
      type: nodeType,
      position: position || { x: 300, y: 200 },
      data: {
        label: initialData.label || 'New Node',
        ...initialData,
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      isDirty: true,
    }));
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  updateNodeData: (nodeId, dataUpdate) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              ...dataUpdate,
            },
          };
        }
        return n;
      }),
      isDirty: true,
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      isDirty: true,
    }));
  },

  updateWorkflowMeta: (meta) => {
    set((state) => ({
      workflow: state.workflow ? { ...state.workflow, ...meta } : null,
      isDirty: true,
    }));
  },

  saveWorkflow: async () => {
    const { workflow, nodes, edges } = get();
    if (!workflow?._id) return;

    set({ isSaving: true });
    try {
      const payload = {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        tags: workflow.tags,
        triggerConfig: workflow.triggerConfig,
        nodes,
        edges,
      };

      const res = await api.put(`/workflows/${workflow._id}`, payload);
      set({
        workflow: res.data.data,
        isSaving: false,
        isDirty: false,
      });
      return { success: true, workflow: res.data.data };
    } catch (err) {
      set({ isSaving: false });
      return { success: false, error: err.response?.data?.message || 'Failed to save' };
    }
  },

  triggerExecution: async () => {
    const { workflow } = get();
    if (!workflow?._id) return null;

    try {
      const res = await api.post(`/workflows/${workflow._id}/execute`);
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },
}));
