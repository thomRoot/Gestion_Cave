// mistralAnalyzer.js - Test
const mistralConfig = require("./mistralConfig");
const googleVision = require("./googleVision");
const mistralAI = require("./mistralAI");

async function analyzeLabelTextWithMistral(labelText) {
    const prompt = "Analyse: " + labelText;
    try {
        const response = await mistralAI.callMistral(prompt);
        if (!response) return null;
        return response;
    } catch (error) {
        return null;
    }
}

module.exports = { analyzeLabelTextWithMistral };