import { useState } from "react";
import "./App.css";

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const analyzeLeaf = async () => {
    if (!selectedFile) {
      alert("Please upload a leaf image first.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      setResult(data);
    } catch (error) {
      setResult({
        error: "Could not connect to AgriDoctor backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  const speakAdvisory = () => {
    if (!result) {
      return;
    }

    const advisoryText =
      language === "ta"
        ? result.advisory_tamil
        : result.advisory;

    if (!advisoryText) {
      alert("No advisory available.");
      return;
    }

    window.speechSynthesis.cancel();

    const availableVoices =
      window.speechSynthesis.getVoices();

    let selectedVoice = null;

    if (language === "ta") {
      selectedVoice = availableVoices.find(
        (voice) =>
          voice.name
            .toLowerCase()
            .includes("valluvar")
      );

      if (!selectedVoice) {
        selectedVoice = availableVoices.find(
          (voice) =>
            voice.lang
              .toLowerCase()
              .startsWith("ta")
        );
      }

      if (!selectedVoice) {
        alert(
          "Chrome cannot access the Valluvar Tamil voice."
        );
        return;
      }
    } else {
      selectedVoice = availableVoices.find(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith("en-in")
      );

      if (!selectedVoice) {
        selectedVoice = availableVoices.find(
          (voice) =>
            voice.lang
              .toLowerCase()
              .startsWith("en")
        );
      }
    }

    const speech =
      new SpeechSynthesisUtterance(
        advisoryText
      );

    speech.lang =
      language === "ta"
        ? "ta-IN"
        : "en-IN";

    speech.rate = 0.9;
    speech.pitch = 1;

    if (selectedVoice) {
      speech.voice = selectedVoice;
    }

    window.speechSynthesis.speak(speech);
  };

  const displayedAdvisory =
    language === "ta"
      ? result?.advisory_tamil
      : result?.advisory;

  return (
    <div className="app">

      <header className="header">
        <h1>🌱 AgriDoctor</h1>

        <p>
          Multilingual Crop Leaf Disease Identifier
          & Voice Advisory
        </p>
      </header>

      <main className="main-container">

        <div className="card">

          <h2>Upload Crop Leaf</h2>

          <p className="description">
            Upload a clear image of a crop leaf
            to identify possible diseases.
          </p>

          <label className="upload-box">

            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Selected crop leaf"
              />
            ) : (
              <>
                <span className="upload-icon">
                  📷
                </span>

                <span>
                  Click to upload leaf image
                </span>

                <small>
                  JPG, JPEG or PNG
                </small>
              </>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />

          </label>

          <button
            className="analyze-button"
            onClick={analyzeLeaf}
            disabled={loading}
          >
            {loading
              ? "🔄 Analyzing..."
              : "🔍 Analyze Leaf"}
          </button>

        </div>


        <div className="card result-card">

          <h2>Diagnosis Result</h2>

          {!result && (
            <div className="result-placeholder">

              <span>🌿</span>

              <p>
                Upload a leaf image and click Analyze.
              </p>

              <p>
                Your disease prediction will appear here.
              </p>

            </div>
          )}


          {result && !result.error && (
            <div className="result">

              <p>
                <strong>File:</strong>{" "}
                {result.filename}
              </p>

              <p>
                <strong>Disease:</strong>{" "}
                {result.disease}
              </p>

              <p>
                <strong>Confidence:</strong>{" "}
                {result.confidence}%
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {result.confidence_status}
              </p>

              <p className="success-message">
                ✅ Image analyzed successfully.
              </p>


              <div className="language-selector">

                <h3>
                  🌐 Select Language
                </h3>

                <button
                  className={
                    language === "en"
                      ? "language-button active"
                      : "language-button"
                  }
                  onClick={() =>
                    setLanguage("en")
                  }
                >
                  🇬🇧 English
                </button>

                <button
                  className={
                    language === "ta"
                      ? "language-button active"
                      : "language-button"
                  }
                  onClick={() =>
                    setLanguage("ta")
                  }
                >
                  🇮🇳 தமிழ்
                </button>

              </div>


              <div className="advisory">

                <h3>
                  🌱{" "}
                  {language === "ta"
                    ? "விவசாயி ஆலோசனை"
                    : "Farmer Advisory"}
                </h3>

                <p>
                  {displayedAdvisory}
                </p>

                <button
                  className="voice-button"
                  onClick={speakAdvisory}
                >
                  🔊{" "}
                  {language === "ta"
                    ? "தமிழில் கேட்க"
                    : "Listen in English"}
                </button>

              </div>

            </div>
          )}


          {result?.error && (
            <p className="error-message">
              ❌ {result.error}
            </p>
          )}

        </div>

      </main>


      <footer>
        <p>
          AgriDoctor • AI-powered crop health assistance
        </p>
      </footer>

    </div>
  );
}

export default App;