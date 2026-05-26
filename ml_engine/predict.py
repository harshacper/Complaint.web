import sys
import joblib
import json
import warnings
import os

# Suppress scikit-learn warnings for cleaner output
warnings.filterwarnings("ignore")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input text provided"}))
        sys.exit(1)
        
    text = sys.argv[1]
    
    try:
        # Determine paths relative to this script
        base_dir = os.path.dirname(os.path.abspath(__file__))
        svm_path = os.path.join(base_dir, 'models', 'svm_category_model.pkl')
        dt_path = os.path.join(base_dir, 'models', 'dt_urgency_model.pkl')
        lin_path = os.path.join(base_dir, 'models', 'lin_resolution_model.pkl')
        pri_path = os.path.join(base_dir, 'models', 'lin_priority_model.pkl')
        emo_path = os.path.join(base_dir, 'models', 'svm_emotion_model.pkl')
        
        # Load the trained models
        svm_model = joblib.load(svm_path)
        dt_model = joblib.load(dt_path)
        lin_model = joblib.load(lin_path)
        pri_model = joblib.load(pri_path)
        emo_model = joblib.load(emo_path)
        
        # Make predictions
        predicted_category = svm_model.predict([text])[0]
        predicted_urgency = dt_model.predict([text])[0]
        predicted_days = lin_model.predict([text])[0]
        predicted_priority = pri_model.predict([text])[0]
        predicted_emotion = emo_model.predict([text])[0]
        
        # Keep days reasonable (min 1 day, max 60 days)
        predicted_days = max(1.0, min(60.0, float(predicted_days)))
        
        # Keep priority score reasonable (min 1.0, max 10.0)
        predicted_priority = max(1.0, min(10.0, float(predicted_priority)))
        
        # Output as JSON so Node.js can parse it easily
        result = {
            "predictedCategory": predicted_category,
            "predictedUrgency": predicted_urgency,
            "estimatedDays": round(predicted_days),
            "priorityScore": round(predicted_priority, 1),
            "predictedEmotion": predicted_emotion
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
