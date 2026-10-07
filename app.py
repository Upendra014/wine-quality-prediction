from flask import Flask, request, jsonify, render_template
import joblib

app = Flask(__name__)

model = joblib.load("wine_quality_model.pkl")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    features = [
        data["fixed_acidity"],
        data["volatile_acidity"],
        data["citric_acid"],
        data["residual_sugar"],
        data["chlorides"],
        data["free_sulfur_dioxide"],
        data["total_sulfur_dioxide"],
        data["density"],
        data["pH"],
        data["sulphates"],
        data["alcohol"]
    ]

    prediction = model.predict([features])[0]

    return jsonify({
        "predicted_quality": float(prediction)
    })


if __name__ == "__main__":
    app.run(debug=True)