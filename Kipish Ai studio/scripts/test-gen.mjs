import fetch from 'node-fetch';

const apiKey = process.env.VITE_GEMINI_API_KEY || 'AIzaSyBfhvwy-mW4ze4HQrLhTPBcsqidB5SWAD4';
const modelName = 'gemini-2.5-flash-image';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

console.log(`Testing generation with ${modelName}...`);

const payload = {
    contents: [{
        parts: [{ text: "Draw a cute robot cat in a futuristic city" }]
    }],
    generationConfig: {
        aspectRatio: "3:4"
    }
};

try {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Response status:', response.status);

    if (data.error) {
        console.error('API Error:', JSON.stringify(data.error, null, 2));
    } else {
        console.log('Success!');
        const candidate = data.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.inlineData) {
            console.log('Received Inline Image Data!');
            console.log('MimeType:', candidate.content.parts[0].inlineData.mimeType);
            console.log('Data Length:', candidate.content.parts[0].inlineData.data.length);
        } else {
            console.log('Received response but no inline image:', JSON.stringify(data, null, 2));
        }
    }
} catch (error) {
    console.error('Fetch error:', error);
}
