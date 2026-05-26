const { spawnSync } = require('child_process');
const path = require('path');

/**
 * Keyword-based heuristic predictor for serverless fallbacks (e.g. Vercel)
 */
const heuristicAnalysis = (text) => {
    const t = text.toLowerCase();
    
    // 1. Category Heuristics
    let category = 'Other';
    if (t.includes('road') || t.includes('pothole') || t.includes('crack') || t.includes('highway') || t.includes('pavement')) {
        category = 'Road Damage';
    } else if (t.includes('water') || t.includes('pipe') || t.includes('tap') || t.includes('supply') || t.includes('flooding') || t.includes('muddy')) {
        category = 'Water Problem';
    } else if (t.includes('power') || t.includes('electr') || t.includes('light') || t.includes('transformer') || t.includes('sparking') || t.includes('bulb')) {
        category = 'Electricity Issue';
    } else if (t.includes('garbage') || t.includes('trash') || t.includes('waste') || t.includes('smell') || t.includes('overflowing') || t.includes('cleanliness')) {
        category = 'Garbage Problem';
    } else if (t.includes('scam') || t.includes('bank') || t.includes('hack') || t.includes('payment') || t.includes('card') || t.includes('online')) {
        category = 'Internet Fraud';
    } else if (t.includes('threat') || t.includes('bully') || t.includes('fake') || t.includes('cyber') || t.includes('social')) {
        category = 'Cyber Crime';
    } else if (t.includes('suspicious') || t.includes('roaming') || t.includes('fight') || t.includes('nuisance') || t.includes('safety') || t.includes('danger') || t.includes('hazard')) {
        category = 'Public Safety';
    } else if (t.includes('music') || t.includes('noise') || t.includes('loud') || t.includes('annoy') || t.includes('party')) {
        category = 'Noise Pollution';
    } else if (t.includes('stolen') || t.includes('bike') || t.includes('robbery') || t.includes('theft') || t.includes('police') || t.includes('vehicle')) {
        category = 'Police Complaint';
    }

    // 2. Urgency Heuristics
    let urgency = 'Medium';
    if (t.includes('emergency') || t.includes('accident') || t.includes('live wire') || t.includes('hurt') || t.includes('immediate') || t.includes('fire') || t.includes('danger')) {
        urgency = 'Critical';
    } else if (t.includes('angry') || t.includes('frustrat') || t.includes('terrible') || t.includes('unacceptable') || t.includes('broken') || t.includes('overflowing')) {
        urgency = 'High';
    } else if (t.includes('crack') || t.includes('small') || t.includes('need') || t.includes('missed') || t.includes('bulb')) {
        urgency = 'Low';
    }

    // 3. Days & Priority Score based on Urgency
    let days = 7;
    let priority = 5.0;
    if (urgency === 'Critical') {
        days = 1;
        priority = 9.5;
    } else if (urgency === 'High') {
        days = 4;
        priority = 7.5;
    } else if (urgency === 'Medium') {
        days = 7;
        priority = 5.0;
    } else {
        days = 12;
        priority = 3.0;
    }

    // 4. Emotion Heuristics
    let emotion = 'Neutral';
    if (t.includes('angry') || t.includes('frustrat') || t.includes('nonsense') || t.includes('terrible') || t.includes('smell') || t.includes('noise') || t.includes('annoy') || t.includes('unacceptable')) {
        emotion = 'Frustrated';
    } else if (t.includes('dangerous') || t.includes('hurt') || t.includes('accident') || t.includes('danger') || t.includes('sick') || t.includes('wire') || t.includes('scam') || t.includes('hack') || t.includes('stolen') || t.includes('fear')) {
        emotion = 'Concerned';
    }

    return {
        predictedCategory: category,
        predictedUrgency: urgency,
        estimatedDays: days,
        priorityScore: priority,
        predictedEmotion: emotion
    };
};

/**
 * Automatically predicts the category and emergency level based on the description text.
 * Uses a Python backend running Scikit-Learn (SVM & Decision Tree).
 * @param {string} description 
 * @returns {object} { predictedCategory, predictedUrgency }
 */
const analyzeComplaint = (description) => {
    try {
        // Path to our python predictor script
        const scriptPath = path.join(__dirname, '../../ml_engine/predict.py');
        
        // Execute the python script synchronously with the description as argument
        const pythonProcess = spawnSync('python', [scriptPath, description], { encoding: 'utf-8' });
        
        if (pythonProcess.error) {
            console.error("Failed to start Python process, using heuristic fallback:", pythonProcess.error);
            return heuristicAnalysis(description);
        }

        const output = pythonProcess.stdout.trim();
        const errorOutput = pythonProcess.stderr.trim();
        
        if (errorOutput) {
            console.warn("Python stderr:", errorOutput);
        }
        
        // Parse the JSON output from python script
        const result = JSON.parse(output);
        
        if (result.error) {
            console.error("Python ML Error, using heuristic fallback:", result.error);
            return heuristicAnalysis(description);
        }
        
        return {
            predictedCategory: result.predictedCategory || 'Other',
            predictedUrgency: result.predictedUrgency || 'Medium',
            estimatedDays: result.estimatedDays || 7,
            priorityScore: result.priorityScore || 5.0,
            predictedEmotion: result.predictedEmotion || 'Neutral'
        };
    } catch (error) {
        console.error("ML Classification Error (falling back to heuristic analysis):", error);
        return heuristicAnalysis(description);
    }
};

module.exports = {
    analyzeComplaint
};
