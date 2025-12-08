import fetch from 'node-fetch';

const apiKey = process.env.VITE_GEMINI_API_KEY || 'AIzaSyBfhvwy-mW4ze4HQrLhTPBcsqidB5SWAD4';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log('Checking available models...');

try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.models) {
        console.log('\n--- Available Models ---');
        const imageModels = data.models.filter(m =>
            m.name.includes('image') ||
            m.name.includes('vision') ||
            (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('predict')) ||
            (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('image_generation'))
        );

        imageModels.forEach(m => {
            console.log(`\nName: ${m.name}`);
            console.log(`DisplayName: ${m.displayName}`);
            console.log(`Methods: ${m.supportedGenerationMethods}`);
        });

        if (imageModels.length === 0) {
            console.log('No specific image generation models found in the list. Listing mostly everything:');
            data.models.slice(0, 10).forEach(m => console.log(m.name));
        }
    } else {
        console.error('Error listing models:', data);
    }
} catch (error) {
    console.error('Failed to fetch models:', error);
}
