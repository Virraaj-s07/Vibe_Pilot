import express from 'express';
import dotenv from 'dotenv';
import { ANALYSIS_SYSTEM_PROMPT, BLUEPRINT_PROMPT, FLOW_PROMPT, ROADMAP_PROMPT } from './prompts.js';

dotenv.config();
const router = express.Router();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callAI(prompt) {
    const provider = (process.env.AI_PROVIDER || 'openrouter').trim().toLowerCase();
    console.log(`--- AI PROVIDER DETECTED: [${provider}] ---`);

    if (provider === 'groq') {
        return callGroq(prompt);
    } else {
        return callOpenRouter(prompt);
    }
}

async function callGroq(prompt) {
    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    const model = (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim();

    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not set in environment variables.');
    }

    console.log(`--- CALLING GROQ (Model: ${model}) ---`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0,
                seed: 42
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || 'Groq API error');

        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('Groq returned an empty response.');

        return JSON.parse(content);
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') throw new Error('AI request timed out (30s limit). Please try a simpler idea.');
        try { return extractJSON(e.message); } catch { throw e; }
    }
}

async function callOpenRouter(prompt) {
    const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const model = (process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet').trim();

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    }

    console.log(`--- CALLING OPENROUTER (Model: ${model}) ---`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://vibe-pilot.local',
                'X-Title': 'Vibe-Pilot',
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0,
                seed: 42
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            console.error('OPENROUTER API ERROR:', JSON.stringify(data, null, 2));
            throw new Error(data?.error?.message || 'OpenRouter API error');
        }

        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('OpenRouter returned an empty response.');
        }

        return JSON.parse(content);
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') throw new Error('AI request timed out (30s limit). OpenRouter is currently slow.');
        try { return extractJSON(e.message); } catch { throw e; }
    }
}


function extractJSON(text) {
    try {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON block found');
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('--- JSON PARSE ERROR ---');
        console.error('Error Details:', e.message);
        console.error('Raw content:', text);
        throw new Error(`AI generated invalid data structure. Please try again.`);
    }
}

router.post('/analyze', async (req, res) => {
    const idea = (req.body?.idea || '').trim();
    if (!idea) return res.status(400).json({ error: 'Idea is required.' });

    const systemPrompt = ANALYSIS_SYSTEM_PROMPT(idea);

    try {
        const analysis = await callAI(systemPrompt);
        res.json(analysis);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(502).json({ error: error.message });
    }
});

router.post('/blueprint', async (req, res) => {
    const idea = (req.body?.idea || '').trim();
    if (!idea) return res.status(400).json({ error: 'Idea is required.' });

    const prompt = BLUEPRINT_PROMPT(idea);

    try {
        const blueprint = await callAI(prompt);
        res.json(blueprint);
    } catch (error) {
        console.error('Blueprint API Error:', error.message);
        res.status(502).json({ error: error.message });
    }
});

router.post('/flow', async (req, res) => {
    const idea = (req.body?.idea || '').trim();
    if (!idea) return res.status(400).json({ error: 'Idea is required.' });
    const prompt = FLOW_PROMPT(idea);

    try {
        const flow = await callAI(prompt);
        res.json(flow);
    } catch (error) {
        res.status(502).json({ error: error.message });
    }
});

router.post('/roadmap', async (req, res) => {
    const idea = (req.body?.idea || '').trim();
    const prompt = ROADMAP_PROMPT(idea);

    try {
        const roadmap = await callAI(prompt);
        res.json(roadmap);
    } catch (error) {
        res.status(502).json({ error: error.message });
    }
});

export default router;
