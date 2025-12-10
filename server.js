const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Groq } = require('groq-sdk');
require('dotenv').config();

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

const API_KEY = process.env.MUSICGPT_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY || API_KEY === 'your_api_key_here' || API_KEY.trim() === '') {
    console.error("CRITICAL ERROR: MUSICGPT_API_KEY is not set or is invalid in your .env file.");
} else {
    console.log("MusicGPT API Key loaded successfully.");
}

let groq;
if (GROQ_API_KEY) {
    groq = new Groq({ apiKey: GROQ_API_KEY });
    console.log("Groq API Key loaded successfully.");
} else {
    console.warn("WARNING: GROQ_API_KEY is not set in .env. Prompt generation features will fail.");
}

// Endpoint to generate prompt using Groq
app.post('/api/create-prompt', async (req, res) => {
    if (!groq) {
        return res.status(500).json({ success: false, message: "Groq API is not configured on the server." });
    }

    try {
        const formData = req.body;
        const systemPrompt = `You are an expert song prompt engineer. 
        Create a concise, descriptive prompt (max 300 characters) for an AI music generator based on the user's order details.
        Focus on style, mood, instrumentation, and key lyrical themes.
        
        Input Data:
        - Recipient: ${formData.recipientName} (${formData.relationship})
        - Occasion/Context: ${formData.who}
        - Emotion: ${formData.feelings}
        - Vibe: ${formData.vibe}
        - Holiday Style: ${formData.style}
        - Story/Memories: ${formData.story}
        - Keywords: ${formData.keywords}
        - Personalisation Level: ${formData.personalisation}
        - Include Name: ${formData.includeName}
        
        Output only the prompt string. No explanations.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: systemPrompt }],
            model: "llama-3.3-70b-versatile", // Using a versatile model available on Groq
            temperature: 0.7,
            max_tokens: 150,
        });

        const generatedPrompt = chatCompletion.choices[0]?.message?.content || "";
        
        // Truncate to ensure 300 char limit if AI overshot slightly
        const finalPrompt = generatedPrompt.length > 300 ? generatedPrompt.substring(0, 297) + "..." : generatedPrompt;

        res.json({ success: true, prompt: finalPrompt });

    } catch (error) {
        console.error("Error generating prompt with Groq:", error);
        res.status(500).json({ success: false, message: "Failed to generate prompt.", error: error.message });
    }
});

// Proxy endpoint for Generation
app.post('/api/generate', async (req, res) => {
    console.log(`[SERVER] Received /api/generate request. Body:`, req.body);
    try {
        const musicGptResponse = await fetch('https://api.musicgpt.com/api/public/v1/MusicAI', {
            method: 'POST',
            headers: {
                'Authorization': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await musicGptResponse.json();
        console.log(`[SERVER] MusicGPT /MusicAI response status: ${musicGptResponse.status}`);
        console.log(`[SERVER] MusicGPT /MusicAI response body:`, data);

        if (!musicGptResponse.ok) {
            // MusicGPT API returned an error status (e.g., 400, 401, 500, 429)
            // Some endpoints return 'message', others 'detail'
            const errorMessage = data.message || data.detail || `MusicGPT API error: ${musicGptResponse.statusText}`;
            console.error(`[SERVER] Error from MusicGPT API: ${errorMessage}`);
            return res.status(musicGptResponse.status).json({ success: false, message: errorMessage, details: data });
        }
        
        res.json(data);
    } catch (error) {
        console.error('[SERVER] Error processing /api/generate:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error during music generation proxy.', details: error });
    }
});

// Proxy endpoint for Checking Status
app.get('/api/status/:id', async (req, res) => {
    const { id } = req.params;
    const conversionType = req.query.conversionType || 'MUSIC_AI'; 
    // Default to 'task_id' if not specified, but allow client to override with 'conversion_id'
    const idType = req.query.idType || 'task_id';
    
    // Construct URL with the correct parameter name (task_id or conversion_id)
    let url = `https://api.musicgpt.com/api/public/v1/byId?conversionType=${conversionType}&${idType}=${id}`;

    console.log(`[SERVER] Received /api/status/${id} request. Query:`, req.query);
    console.log(`[SERVER] Fetching MusicGPT status using ${idType}: ${url}`);

    try {
        const musicGptResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': API_KEY
            }
        });

        const data = await musicGptResponse.json();
        console.log(`[SERVER] MusicGPT /byId response status: ${musicGptResponse.status}`);
        
        // Log a summary of the body to avoid spamming the console with huge objects if successful
        if (data.success) {
             console.log(`[SERVER] MusicGPT /byId response: Success. Status: ${data.conversion?.status}`);
        } else {
             console.log(`[SERVER] MusicGPT /byId response body:`, data);
        }

        if (!musicGptResponse.ok) {
            const errorMessage = data.message || data.detail || `MusicGPT API error: ${musicGptResponse.statusText}`;
            console.error(`[SERVER] Error from MusicGPT API status check: ${errorMessage}`);
            return res.status(musicGptResponse.status).json({ success: false, message: errorMessage, details: data });
        }

        res.json(data);
    } catch (error) {
        console.error('[SERVER] Error processing /api/status/:id:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error during status check proxy.', details: error });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/experiment.html to try the MusicGPT experiment.`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use.`);
        console.error(`Please stop the other process running on port ${PORT} or change the PORT in server.js`);
    } else {
        console.error('Server error:', e);
    }
    process.exit(1);
});