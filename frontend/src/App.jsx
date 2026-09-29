import { useEffect, useRef, useState } from "react";
import "./App.css";

const BACKEND_URL = "http://127.0.0.1:5001";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "pa", name: "Punjabi" },
];

function App() {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("hi");

  const [loading, setLoading] = useState(false);
  const [speechLoading, setSpeechLoading] = useState(false);

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [speakingSource, setSpeakingSource] = useState(false);
  const [speakingTranslation, setSpeakingTranslation] =
    useState(false);

  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  // ==========================================
  // Cleanup audio URL
  // ==========================================

  const cleanupAudio = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  // ==========================================
  // Stop speech
  // ==========================================

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      audioRef.current = null;
    }

    cleanupAudio();

    setSpeakingSource(false);
    setSpeakingTranslation(false);
    setSpeechLoading(false);
  };

  // ==========================================
  // Component cleanup
  // ==========================================

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      cleanupAudio();
    };
  }, []);

  // ==========================================
  // Text To Speech
  // ==========================================

  const speakText = async (value, languageType) => {
    if (!value || !value.trim()) {
      return;
    }

    stopSpeech();

    setError("");
    setSpeechLoading(true);

    if (languageType === "source") {
      setSpeakingSource(true);
    } else {
      setSpeakingTranslation(true);
    }

    const language =
      languageType === "source"
        ? sourceLang
        : targetLang;

    try {
      console.log("================================");
      console.log("🔊 FRONTEND TTS REQUEST");
      console.log("Backend:", BACKEND_URL);
      console.log("Language:", language);
      console.log("Text:", value.trim());

      const response = await fetch(
        `${BACKEND_URL}/api/speak`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            text: value.trim(),
            language: language,
          }),
        }
      );

      console.log(
        "TTS response status:",
        response.status
      );

      if (!response.ok) {
        let message = "Text-to-speech failed.";

        try {
          const data = await response.json();

          if (data?.message) {
            message = data.message;
          }

          if (data?.error) {
            console.error(
              "Backend TTS error:",
              data.error
            );
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(message);
      }

      const audioBlob = await response.blob();

      console.log(
        "🔊 Audio received:",
        audioBlob.size,
        "bytes"
      );

      if (!audioBlob.size) {
        throw new Error(
          "No audio received from backend."
        );
      }

      // Make sure previous URL is removed
      cleanupAudio();

      const audioUrl =
        URL.createObjectURL(audioBlob);

      audioUrlRef.current = audioUrl;

      const audio = new Audio();

      audio.preload = "auto";
      audio.volume = 1;

      audioRef.current = audio;

      audio.onloadeddata = () => {
        console.log(
          "✅ Audio loaded successfully"
        );
      };

      audio.onplay = () => {
        console.log(
          "▶️ Audio playback started"
        );

        setSpeechLoading(false);
      };

      audio.onended = () => {
        console.log(
          "✅ Audio playback finished"
        );

        setSpeakingSource(false);
        setSpeakingTranslation(false);
        setSpeechLoading(false);

        audioRef.current = null;

        cleanupAudio();
      };

      audio.onerror = (event) => {
        console.error(
          "❌ Browser audio playback error:",
          event
        );

        setSpeakingSource(false);
        setSpeakingTranslation(false);
        setSpeechLoading(false);

        audioRef.current = null;

        cleanupAudio();

        setError(
          "Audio playback failed. Please try again."
        );
      };

      audio.src = audioUrl;

      audio.load();

      await audio.play();

    } catch (err) {
      console.error(
        "❌ TTS Error:",
        err
      );

      setSpeakingSource(false);
      setSpeakingTranslation(false);
      setSpeechLoading(false);

      if (
        err?.name ===
        "NotAllowedError"
      ) {
        setError(
          "Browser blocked audio playback. Click the speaker button again."
        );
      } else if (
        err?.name ===
        "AbortError"
      ) {
        setError(
          "Audio playback was stopped."
        );
      } else {
        setError(
          err?.message ||
          "Text-to-speech failed."
        );
      }
    }
  };

  // ==========================================
  // Translation
  // ==========================================

  const translateText = async () => {
    const input = text.trim();

    if (!input) {
      setError(
        "Please enter some text first."
      );

      setTranslatedText("");

      return;
    }

    stopSpeech();

    setError("");
    setCopied(false);

    if (sourceLang === targetLang) {
      setTranslatedText(input);
      return;
    }

    setLoading(true);
    setTranslatedText("");

    try {
      const url =
        "https://api.mymemory.translated.net/get" +
        `?q=${encodeURIComponent(input)}` +
        `&langpair=${sourceLang}|${targetLang}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Translation API unavailable"
        );
      }

      const data = await response.json();

      const result =
        data?.responseData?.translatedText?.trim();

      if (!result) {
        throw new Error(
          "Translation not available"
        );
      }

      setTranslatedText(result);

    } catch (err) {
      console.error(
        "Translation Error:",
        err
      );

      setError(
        "Translation failed. Please check your internet connection and try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Swap Languages
  // ==========================================

  const swapLanguages = () => {
    stopSpeech();

    const oldSource = sourceLang;
    const oldText = text;

    setSourceLang(targetLang);
    setTargetLang(oldSource);

    setText(translatedText);
    setTranslatedText(oldText);

    setError("");
  };

  // ==========================================
  // Clear
  // ==========================================

  const clearAll = () => {
    stopSpeech();

    setText("");
    setTranslatedText("");
    setError("");
    setCopied(false);
  };

  // ==========================================
  // Copy Translation
  // ==========================================

  const copyTranslation = async () => {
    if (!translatedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        translatedText
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);

    } catch (err) {
      console.error(err);

      setError(
        "Unable to copy translation."
      );
    }
  };

  // ==========================================
  // Keyboard Shortcut
  // ==========================================

  const handleKeyDown = (event) => {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key === "Enter"
    ) {
      translateText();
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="app">

      <header className="header">

        <div className="brand">

          <div className="brand-icon">
            AI
          </div>

          <div>
            <h1>
              LinguaAI
            </h1>

            <p>
              Smart Language Translator
            </p>
          </div>

        </div>

        <div className="online-status">
          <span className="status-dot"></span>
          Translation API Online
        </div>

      </header>

      <main className="container">

        <section className="hero">

          <div className="badge">
            ✦ AI TRANSLATION TOOL
          </div>

          <h2>
            Break language barriers
            <span> instantly.</span>
          </h2>

          <p>
            Translate text quickly across
            multiple languages with a simple,
            powerful interface.
          </p>

        </section>

        <section className="translator-card">

          <div className="language-bar">

            <div className="language-select">

              <label>
                FROM
              </label>

              <select
                value={sourceLang}
                onChange={(event) => {
                  setSourceLang(
                    event.target.value
                  );

                  setError("");
                }}
              >
                {languages.map(
                  (language) => (
                    <option
                      key={language.code}
                      value={language.code}
                    >
                      {language.name}
                    </option>
                  )
                )}
              </select>

            </div>

            <button
              className="swap-button"
              onClick={swapLanguages}
              disabled={
                loading ||
                speechLoading
              }
              title="Swap languages"
            >
              ⇄
            </button>

            <div className="language-select">

              <label>
                TO
              </label>

              <select
                value={targetLang}
                onChange={(event) => {
                  setTargetLang(
                    event.target.value
                  );

                  setError("");
                }}
              >
                {languages.map(
                  (language) => (
                    <option
                      key={language.code}
                      value={language.code}
                    >
                      {language.name}
                    </option>
                  )
                )}
              </select>

            </div>

          </div>

          <div className="translation-area">

            <div className="text-box">

              <div className="box-header">

                <span>
                  YOUR TEXT
                </span>

                <div className="result-actions">

                  <span>
                    {text.length}/5000
                  </span>

                  <button
                    onClick={() => {
                      if (
                        speakingSource
                      ) {
                        stopSpeech();
                      } else {
                        speakText(
                          text,
                          "source"
                        );
                      }
                    }}
                    disabled={!text}
                    title={
                      speakingSource
                        ? "Stop speech"
                        : "Listen to original text"
                    }
                  >
                    {speakingSource
                      ? "⏹"
                      : "🔊"}
                  </button>

                </div>

              </div>

              <textarea
                value={text}
                maxLength={5000}
                onChange={(event) => {
                  setText(
                    event.target.value
                  );

                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type or paste your text here..."
              />

              {text && (
                <button
                  className="clear-button"
                  onClick={clearAll}
                >
                  Clear
                </button>
              )}

            </div>

            <div className="text-box result-box">

              <div className="box-header">

                <span>
                  TRANSLATION
                </span>

                <div className="result-actions">

                  <button
                    onClick={copyTranslation}
                    disabled={!translatedText}
                    title="Copy translation"
                  >
                    {copied
                      ? "✓"
                      : "⧉"}
                  </button>

                  <button
                    onClick={() => {
                      if (
                        speakingTranslation
                      ) {
                        stopSpeech();
                      } else {
                        speakText(
                          translatedText,
                          "target"
                        );
                      }
                    }}
                    disabled={!translatedText}
                    title={
                      speakingTranslation
                        ? "Stop speech"
                        : "Listen to translation"
                    }
                  >
                    {speakingTranslation
                      ? "⏹"
                      : "🔊"}
                  </button>

                </div>

              </div>

              <div className="translated-content">

                {loading ? (

                  <div className="loading">

                    <div className="spinner"></div>

                    <span>
                      Translating...
                    </span>

                  </div>

                ) : translatedText ? (

                  translatedText

                ) : (

                  <span className="placeholder">
                    Your translation will appear here...
                  </span>

                )}

              </div>

            </div>

          </div>

          {error && (
            <div className="error-message">
              ⚠ {error}
            </div>
          )}

          <button
            className="translate-button"
            onClick={translateText}
            disabled={loading}
          >
            {loading
              ? "Translating..."
              : "✦ Translate"}
          </button>

          <div className="shortcut">
            Press{" "}
            <strong>
              ⌘ + Enter
            </strong>{" "}
            to translate
          </div>

        </section>

        <section className="features">

          <div className="feature">

            <div className="feature-icon">
              ⚡
            </div>

            <div>
              <h3>
                Fast Translation
              </h3>

              <p>
                Get translated results in seconds.
              </p>
            </div>

          </div>

          <div className="feature">

            <div className="feature-icon">
              🌐
            </div>

            <div>
              <h3>
                Multiple Languages
              </h3>

              <p>
                Translate across 14 languages.
              </p>
            </div>

          </div>

          <div className="feature">

            <div className="feature-icon">
              🔊
            </div>

            <div>
              <h3>
                Text to Speech
              </h3>

              <p>
                Listen to both original and translated text.
              </p>
            </div>

          </div>

        </section>

      </main>

      <footer>

        <p>
          LinguaAI • Language Translation Tool
        </p>

      </footer>

    </div>
  );
}

export default App;