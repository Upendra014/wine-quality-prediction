const form = document.getElementById("predictionForm");
const predictBtn = document.getElementById("predictBtn");
const sampleBtn = document.getElementById("sampleBtn");
const resetBtn = document.getElementById("resetBtn");

const emptyState = document.getElementById("emptyState");
const resultContent = document.getElementById("resultContent");
const resultStatus = document.getElementById("resultStatus");

const score = document.getElementById("score");
const ringValue = document.getElementById("ringValue");
const qualityLabel = document.getElementById("qualityLabel");
const resultDescription = document.getElementById("resultDescription");


/* -----------------------------
   SAMPLE WINE DATA
----------------------------- */

const sample = {
    fixed_acidity: 7.4,
    volatile_acidity: 0.7,
    citric_acid: 0.0,
    residual_sugar: 1.9,
    chlorides: 0.076,
    free_sulfur_dioxide: 11,
    total_sulfur_dioxide: 34,
    density: 0.9978,
    pH: 3.51,
    sulphates: 0.56,
    alcohol: 9.4
};


/* -----------------------------
   LOAD SAMPLE
----------------------------- */

function fillSample() {

    Object.entries(sample).forEach(([key, value]) => {

        const input = form.elements[key];

        if (input) {
            input.value = value;
        }

    });
}


sampleBtn.addEventListener("click", () => {

    fillSample();

    sampleBtn.innerHTML = "<span>✓</span> Sample loaded";

    setTimeout(() => {
        sampleBtn.innerHTML = "<span>✦</span> Load sample";
    }, 1400);

});


/* -----------------------------
   QUALITY DESCRIPTION
----------------------------- */

function getQualityText(value) {

    if (value >= 7) {

        return {
            label: "Exceptional profile",
            text: "The model estimates a high-quality wine profile based on the supplied physicochemical measurements."
        };

    }

    if (value >= 6) {

        return {
            label: "Strong profile",
            text: "The predicted score suggests a solid wine profile with favorable measured characteristics."
        };

    }

    if (value >= 5) {

        return {
            label: "Balanced profile",
            text: "The model places this wine around the middle of the quality scale."
        };

    }

    return {

        label: "Developing profile",

        text: "The model predicts a lower quality score for the supplied combination of measurements."

    };

}


/* -----------------------------
   ANIMATE SCORE
----------------------------- */

function animateScore(target) {

    const duration = 1000;

    const startTime = performance.now();

    const maxScore = 10;

    const ringLength = 465;

    const safeTarget = Math.max(
        0,
        Math.min(maxScore, Number(target))
    );


    function update(currentTime) {

        const elapsed = currentTime - startTime;

        const progress = Math.min(
            elapsed / duration,
            1
        );


        // Smooth animation
        const easedProgress =
            1 - Math.pow(1 - progress, 3);


        const currentScore =
            safeTarget * easedProgress;


        // Update number
        score.textContent =
            currentScore.toFixed(1);


        // Update circular progress
        const percentage =
            currentScore / maxScore;


        ringValue.style.strokeDashoffset =
            ringLength - (ringLength * percentage);


        if (progress < 1) {

            requestAnimationFrame(update);

        } else {

            // Make sure final value is exact
            score.textContent =
                safeTarget.toFixed(1);

        }

    }


    requestAnimationFrame(update);

}


/* -----------------------------
   PREDICTION
----------------------------- */

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    // Button loading state
    predictBtn.disabled = true;

    predictBtn.querySelector(".btn-text").textContent =
        "Analyzing…";

    resultStatus.textContent =
        "PROCESSING";


    // Collect form values
    const data = {};


    const formData =
        new FormData(form);


    formData.forEach((value, key) => {

        data[key] = Number(value);

    });


    console.log("Sending data:", data);


    try {

        /* -----------------------------
           SEND REQUEST TO FLASK
        ----------------------------- */

        const response = await fetch(
            "/predict",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        console.log(
            "Flask response status:",
            response.status
        );


        /* -----------------------------
           CHECK SERVER RESPONSE
        ----------------------------- */

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Server error:",
                errorText
            );

            throw new Error(
                "Prediction request failed."
            );

        }


        const result =
            await response.json();


        console.log(
            "Prediction result:",
            result
        );


        /* -----------------------------
           GET PREDICTION
        ----------------------------- */

        const prediction =
            Number(result.predicted_quality);


        console.log(
            "Predicted quality:",
            prediction
        );


        if (!Number.isFinite(prediction)) {

            throw new Error(
                "Invalid prediction returned by Flask."
            );

        }


        /* -----------------------------
           SHOW RESULT
        ----------------------------- */

        emptyState.classList.add("hidden");

        resultContent.classList.remove("hidden");

        resultStatus.textContent =
            "PREDICTION READY";


        /* -----------------------------
           QUALITY INFORMATION
        ----------------------------- */

        const quality =
            getQualityText(prediction);


        qualityLabel.textContent =
            quality.label;


        resultDescription.textContent =
            quality.text;


        /* -----------------------------
           UPDATE SCORE
        ----------------------------- */

        animateScore(prediction);


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );


        resultStatus.textContent =
            "ERROR";


        emptyState.classList.remove("hidden");

        resultContent.classList.add("hidden");


        const heading =
            emptyState.querySelector("h3");


        const description =
            emptyState.querySelector("p");


        heading.innerHTML =
            "Prediction<br>couldn't run.";


        description.textContent =
            "Check that Flask is running and all 11 values are valid.";


        emptyState.classList.add("shake");


        setTimeout(() => {

            emptyState.classList.remove("shake");

        }, 400);

    } finally {

        predictBtn.disabled = false;

        predictBtn.querySelector(".btn-text").textContent =
            "Predict quality";

    }

});


/* -----------------------------
   RESET
----------------------------- */

resetBtn.addEventListener("click", () => {

    resultContent.classList.add("hidden");

    emptyState.classList.remove("hidden");

    resultStatus.textContent =
        "READY";


    score.textContent =
        "0.0";


    ringValue.style.strokeDashoffset =
        465;


    qualityLabel.textContent =
        "Estimated quality";


    resultDescription.textContent =
        "";


    form.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

});