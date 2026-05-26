from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
import joblib
import os

print("Training Machine Learning Models for Complainsy...")

# 1. Dataset for Category Prediction (SVM)
category_data = [
    ("huge pothole on the main road", "Road Damage"),
    ("street is broken and cracked", "Road Damage"),
    ("road completely damaged after rain", "Road Damage"),
    ("no water supply since morning", "Water Problem"),
    ("dirty water coming from tap", "Water Problem"),
    ("water pipe burst in the colony", "Water Problem"),
    ("power cut in our area for 5 hours", "Electricity Issue"),
    ("street lights are not working", "Electricity Issue"),
    ("sparking transformer on the corner", "Electricity Issue"),
    ("trash is overflowing on the street", "Garbage Problem"),
    ("garbage collection missed for weeks", "Garbage Problem"),
    ("someone hacked my bank account", "Internet Fraud"),
    ("i was scammed online payment", "Internet Fraud"),
    ("fake profile sending threats", "Cyber Crime"),
    ("cyber bullying on social media", "Cyber Crime"),
    ("suspicious person roaming at night", "Public Safety"),
    ("street fight and public nuisance", "Public Safety"),
    ("neighbors playing loud music at 2am", "Noise Pollution"),
    ("construction noise all night", "Noise Pollution"),
    ("stolen bike, need to file report", "Police Complaint"),
    ("robbery at the local store", "Police Complaint")
]

cat_texts = [item[0] for item in category_data]
cat_labels = [item[1] for item in category_data]

svm_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english')),
    ('clf', SVC(kernel='linear', probability=True))
])
svm_pipeline.fit(cat_texts, cat_labels)
print("SVM Category Model Trained successfully.")


# 2. Dataset for Urgency Prediction (Decision Tree)
urgency_data = [
    ("the road has a small crack", "Low"),
    ("garbage collection was missed", "Low"),
    ("need a new street light", "Medium"),
    ("water is a bit muddy", "Medium"),
    ("terrible! absolutely unacceptable behavior!", "High"),
    ("i am very angry and frustrated with this", "High"),
    ("this is completely unacceptable", "High"),
    ("emergency! accident on the highway", "Critical"),
    ("danger! live electrical wire on the road", "Critical"),
    ("someone is hurt, need police immediately", "Critical")
]

urg_texts = [item[0] for item in urgency_data]
urg_labels = [item[1] for item in urgency_data]

dt_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english')),
    ('clf', DecisionTreeClassifier(max_depth=5))
])
dt_pipeline.fit(urg_texts, urg_labels)
print("Decision Tree Urgency Model Trained successfully.")


# 3. Dataset for Estimated Resolution Time Prediction (Linear Regression)
# Predicting continuous value: Days to Resolve
regression_data = [
    ("small crack on the road", 14.0),
    ("huge pothole main highway", 7.0),
    ("power cut since morning", 1.0),
    ("street light bulb needs replacement", 5.0),
    ("water pipe burst flooding", 2.0),
    ("garbage not collected for a week", 3.0),
    ("loud music party next door", 1.0),
    ("online banking fraud scam", 30.0),
    ("stolen vehicle", 45.0),
    ("critical accident hazard live wire", 1.0)
]

reg_texts = [item[0] for item in regression_data]
reg_targets = [item[1] for item in regression_data]

# We use Ridge (Linear Regression with L2 Regularization) for predicting a continuous number
lin_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english')),
    ('reg', Ridge(alpha=1.0))
])
lin_pipeline.fit(reg_texts, reg_targets)
print("Linear Regression (Resolution Time) Model Trained successfully.")


# 4. Dataset for Priority Score Prediction (Linear Regression - Ridge)
# Predicting continuous value: Priority Score from 1.0 to 10.0
priority_data = [
    ("small crack on the road", 2.0),
    ("garbage not collected for a week", 3.0),
    ("street light bulb needs replacement", 4.0),
    ("loud music party next door", 3.0),
    ("water is a bit muddy", 5.0),
    ("huge pothole main highway", 7.5),
    ("power cut since morning", 8.0),
    ("water pipe burst flooding", 8.5),
    ("online banking fraud scam", 6.0),
    ("stolen vehicle", 7.0),
    ("critical accident hazard live wire", 9.8),
    ("emergency! accident on the highway", 10.0),
    ("someone is hurt, need police immediately", 10.0),
    ("trash is overflowing on the street", 4.5)
]

pri_texts = [item[0] for item in priority_data]
pri_targets = [item[1] for item in priority_data]

pri_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english')),
    ('reg', Ridge(alpha=1.0))
])
pri_pipeline.fit(pri_texts, pri_targets)
print("Linear Regression (Priority Score) Model Trained successfully.")


# Save all models
os.makedirs('models', exist_ok=True)
joblib.dump(svm_pipeline, 'models/svm_category_model.pkl')
joblib.dump(dt_pipeline, 'models/dt_urgency_model.pkl')
joblib.dump(lin_pipeline, 'models/lin_resolution_model.pkl')
joblib.dump(pri_pipeline, 'models/lin_priority_model.pkl')

# 5. Dataset for Emotion/Sentiment Detection (Multi-class Classification)
# Predicting class: Frustrated, Concerned, Neutral
emotion_data = [
    ("huge pothole on the main road, very dangerous", "Concerned"),
    ("road completely damaged after rain, someone will get hurt", "Concerned"),
    ("no water supply since morning, this is terrible", "Frustrated"),
    ("power cut in our area for 5 hours, absolute nonsense", "Frustrated"),
    ("garbage collection missed for weeks, it smells awful", "Frustrated"),
    ("dirty water coming from tap, we will fall sick", "Concerned"),
    ("suspicious person roaming at night near the park", "Concerned"),
    ("need a new street light bulb replaced", "Neutral"),
    ("small crack on the pavement", "Neutral"),
    ("street lights are not working", "Neutral"),
    ("neighbors playing loud music at 2am, cannot sleep", "Frustrated"),
    ("construction noise all night, very annoying", "Frustrated"),
    ("emergency! accident on the highway", "Concerned"),
    ("danger! live electrical wire on the road", "Concerned"),
    ("trash is overflowing on the street", "Frustrated"),
    ("stolen vehicle, need police report", "Concerned"),
    ("i am reporting a broken street light", "Neutral")
]

emo_texts = [item[0] for item in emotion_data]
emo_labels = [item[1] for item in emotion_data]

emo_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english')),
    ('clf', SVC(kernel='linear', probability=True))
])
emo_pipeline.fit(emo_texts, emo_labels)
print("SVM Emotion Model Trained successfully.")

joblib.dump(emo_pipeline, 'models/svm_emotion_model.pkl')

print("All ML Models saved successfully in 'models/' directory.")
