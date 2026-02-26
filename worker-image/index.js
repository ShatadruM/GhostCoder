const API_KEY = "AIzaSyB7OgiBhQOLQTbF3TSVddeayR4wIHrVuz8";

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
        // Filter out the old/irrelevant models to just show the Gemini ones
        const geminiModels = data.models
            .filter(m => m.name.includes("gemini"))
            .map(m => m.name);
        
        console.log("✅ Models available to your key:");
        console.log(geminiModels);
    })
    .catch(err => console.error("Error fetching models:", err));