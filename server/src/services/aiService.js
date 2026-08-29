const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const logger = require('../utils/logger');

// Deterministic rule templates for offline / zero-dependency generation
function generateDeterministicGraph(prompt) {
  const p = (prompt || '').toLowerCase();

  // Template 1: Google Sheet to Email + Slack
  if (p.includes('sheet') || p.includes('lead') || p.includes('row')) {
    return {
      name: 'Lead Capture & Team Notification',
      description: `Generated from prompt: "${prompt}"`,
      tags: ['leads', 'google-sheets', 'slack', 'gmail'],
      triggerConfig: { type: 'manual' },
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 250, y: 50 },
          data: { label: 'New Lead Trigger', triggerType: 'manual' },
        },
        {
          id: 'action-sheets-1',
          type: 'actionNode',
          position: { x: 250, y: 180 },
          data: {
            label: 'Append to Leads Sheet',
            provider: 'google-sheets',
            action: 'append_row',
            spreadsheetId: 'default_leads_sheet',
            range: 'Sheet1!A:E',
          },
        },
        {
          id: 'ai-summary-1',
          type: 'aiNode',
          position: { x: 250, y: 310 },
          data: {
            label: 'AI Lead Qualification',
            prompt: 'Analyze lead data and classify tier (Tier 1 / Tier 2)',
            model: 'gemini-1.5-flash',
          },
        },
        {
          id: 'action-slack-1',
          type: 'actionNode',
          position: { x: 100, y: 440 },
          data: {
            label: 'Alert Sales Channel',
            provider: 'slack',
            action: 'post_message',
            channel: '#sales-leads',
            message: '🚀 New qualified lead captured: {{ai-summary-1.output.summary}}',
          },
        },
        {
          id: 'action-gmail-1',
          type: 'actionNode',
          position: { x: 400, y: 440 },
          data: {
            label: 'Send Welcome Email',
            provider: 'gmail',
            action: 'send_email',
            to: '{{trigger-1.output.email}}',
            subject: 'Welcome to Agentflow AI',
            body: 'Hello! Thank you for connecting with us.',
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'action-sheets-1', animated: true },
        { id: 'e2-3', source: 'action-sheets-1', target: 'ai-summary-1', animated: true },
        { id: 'e3-4', source: 'ai-summary-1', target: 'action-slack-1', animated: true },
        { id: 'e3-5', source: 'ai-summary-1', target: 'action-gmail-1', animated: true },
      ],
    };
  }

  // Template 2: Discord / Slack Alert
  if (p.includes('discord') || p.includes('slack') || p.includes('alert') || p.includes('notify')) {
    return {
      name: 'System Alert & Community Broadcast',
      description: `Generated from prompt: "${prompt}"`,
      tags: ['alerts', 'discord', 'slack'],
      triggerConfig: { type: 'manual' },
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 250, y: 50 },
          data: { label: 'Incident Trigger', triggerType: 'manual' },
        },
        {
          id: 'ai-node-1',
          type: 'aiNode',
          position: { x: 250, y: 180 },
          data: {
            label: 'Format Incident Summary',
            prompt: 'Draft concise ops bulletin from error payload',
            model: 'gemini-1.5-flash',
          },
        },
        {
          id: 'action-discord-1',
          type: 'actionNode',
          position: { x: 100, y: 310 },
          data: {
            label: 'Discord Channel Alert',
            provider: 'discord',
            action: 'send_message',
            channelId: 'ops-alerts',
            content: '⚠️ Operations Alert: {{ai-node-1.output.text}}',
          },
        },
        {
          id: 'action-slack-1',
          type: 'actionNode',
          position: { x: 400, y: 310 },
          data: {
            label: 'Slack Ops Notification',
            provider: 'slack',
            action: 'post_message',
            channel: '#ops-war-room',
            message: '🚨 Priority Alert: {{ai-node-1.output.text}}',
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'ai-node-1', animated: true },
        { id: 'e2-3', source: 'ai-node-1', target: 'action-discord-1', animated: true },
        { id: 'e2-4', source: 'ai-node-1', target: 'action-slack-1', animated: true },
      ],
    };
  }

  // Template 3: Email Invoicing / Customer Support
  return {
    name: 'Customer Request & Email Automation',
    description: `Generated from prompt: "${prompt}"`,
    tags: ['support', 'gmail', 'ai-agent'],
    triggerConfig: { type: 'manual' },
    nodes: [
      {
        id: 'trigger-1',
        type: 'triggerNode',
        position: { x: 250, y: 50 },
        data: { label: 'Incoming Request', triggerType: 'manual' },
      },
      {
        id: 'ai-node-1',
        type: 'aiNode',
        position: { x: 250, y: 180 },
        data: {
          label: 'AI Intent Analyzer',
          prompt: 'Categorize request and generate appropriate resolution response',
          model: 'gemini-1.5-flash',
        },
      },
      {
        id: 'action-gmail-1',
        type: 'actionNode',
        position: { x: 250, y: 310 },
        data: {
          label: 'Send Email Reply',
          provider: 'gmail',
          action: 'send_email',
          to: '{{trigger-1.output.sender}}',
          subject: 'Resolution: Support Ticket',
          body: '{{ai-node-1.output.response}}',
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'ai-node-1', animated: true },
      { id: 'e2-3', source: 'ai-node-1', target: 'action-gmail-1', animated: true },
    ],
  };
}

const SYSTEM_PROMPT = `
You are the Agentflow AI Graph Synthesizer. You convert natural language descriptions of operational tasks into valid, executable React Flow JSON workflow graphs.

You MUST respond with valid JSON ONLY in this format:
{
  "name": "Workflow Name",
  "description": "Short explanation",
  "tags": ["tag1", "tag2"],
  "nodes": [
    {
      "id": "trigger-1",
      "type": "triggerNode",
      "position": { "x": 250, "y": 50 },
      "data": { "label": "Start", "triggerType": "manual" }
    },
    {
      "id": "action-1",
      "type": "actionNode",
      "position": { "x": 250, "y": 180 },
      "data": {
        "label": "Send Email",
        "provider": "gmail", // one of: "gmail", "slack", "discord", "google-sheets", "custom"
        "action": "send_email",
        "to": "user@example.com",
        "subject": "Hello",
        "body": "Message"
      }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "trigger-1", "target": "action-1", "animated": true }
  ]
}

Available node types:
1. "triggerNode" (data: { label, triggerType: 'manual'|'schedule'|'webhook' })
2. "actionNode" (data: { label, provider: 'gmail'|'slack'|'discord'|'google-sheets', action, ...provider specific fields })
3. "aiNode" (data: { label, prompt, model: 'gemini-1.5-flash' })
4. "conditionNode" (data: { label, condition })

Lay out nodes logically with sensible Y offsets (e.g. y: 50, 180, 310, 440) and horizontal offsets for parallel branches. Output pure JSON without markdown code fences.
`;

const aiService = {
  generateWorkflowFromPrompt: async (prompt) => {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required');
    }

    // 1. Try OpenRouter if configured
    if (config.OPENROUTER_API_KEY) {
      try {
        logger.info('Generating workflow with OpenRouter API...');
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          },
          {
            headers: {
              Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 20000,
          }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.nodes && parsed.edges) {
            logger.info('Successfully generated workflow via OpenRouter');
            return { ...parsed, provider: 'openrouter' };
          }
        }
      } catch (err) {
        logger.warn('OpenRouter generation failed, falling back to Gemini SDK...', { error: err.message });
      }
    }

    // 2. Try Gemini SDK if configured
    if (config.GEMINI_API_KEY) {
      try {
        logger.info('Generating workflow with Google Gemini SDK...');
        const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUser Request: ${prompt}`);
        let text = result.response.text();
        // Clean markdown backticks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(text);
        if (parsed.nodes && parsed.edges) {
          logger.info('Successfully generated workflow via Gemini SDK');
          return { ...parsed, provider: 'gemini' };
        }
      } catch (err) {
        logger.warn('Gemini SDK generation failed, falling back to Rule Builder...', { error: err.message });
      }
    }

    // 3. Fallback to deterministic rule builder
    logger.info('Generating workflow via Deterministic Rule Builder (Tier 3 fallback)');
    const ruleGraph = generateDeterministicGraph(prompt);
    return { ...ruleGraph, provider: 'rule-engine' };
  },
};

module.exports = aiService;
