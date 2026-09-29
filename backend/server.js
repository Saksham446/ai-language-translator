import express from "express";
import cors from "cors";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = 5001;

const execFileAsync = promisify(execFile);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const VOICES = {
  en: "en-US-EmmaMultilingualNeural",
  hi: "hi-IN-SwaraNeural",
  es: "es-ES-ElviraNeural",
  fr: "fr-FR-DeniseNeural",
  de: "de-DE-KatjaNeural",
  it: "it-IT-ElsaNeural",
  pt: "pt-PT-RaquelNeural",
  ru: "ru-RU-SvetlanaNeural",
  ja: "ja-JP-NanamiNeural",
  ko: "ko-KR-SunHiNeural",
  zh: "zh-CN-XiaoxiaoNeural",
  ar: "ar-SA-ZariyahNeural",
  bn: "bn-IN-TanishaaNeural",
};

const BACKEND_DIR = process.cwd();

const PYTHON = path.join(
  BACKEND_DIR,
  ".venv",
  "bin",
  "python"
);

const TTS_SCRIPT = path.join(
  BACKEND_DIR,
  "tts.py"
);

const PUNJABI_TTS_SCRIPT = path.join(
  BACKEND_DIR,
  "tts_punjabi.py"
);

const AUDIO_DIR = path.join(
  BACKEND_DIR,
  "generated_audio"
);

await fs.mkdir(AUDIO_DIR, { recursive: true });


// ========================================
// HOME / HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LinguaAI TTS Backend is running!"
  });
});


// ========================================
// TEXT TO SPEECH
// ========================================

app.post("/api/speak", async (req, res) => {
  let outputFile = null;

  try {
    const { text, language } = req.body;

    console.log("");
    console.log("================================");
    console.log("🔊 TTS REQUEST");
    console.log("Language:", language);
    console.log("Text:", text);

    // ------------------------------------
    // Validate text
    // ------------------------------------

    if (
      !text ||
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Text is required."
      });
    }


    // ------------------------------------
    // Validate language
    // ------------------------------------

    const supportedLanguages = [
      ...Object.keys(VOICES),
      "pa"
    ];

    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported language."
      });
    }


    // ------------------------------------
    // Generate unique output file
    // ------------------------------------

    const fileName =
      `speech-${crypto.randomUUID()}.mp3`;

    outputFile = path.join(
      AUDIO_DIR,
      fileName
    );


    // ====================================
    // PUNJABI
    // ====================================

    if (language === "pa") {
      console.log("🟡 Punjabi detected");
      console.log("🎙️ Using Google Translate TTS");
      console.log("🐍 Python:", PYTHON);
      console.log("📄 Script:", PUNJABI_TTS_SCRIPT);

      const {
        stdout,
        stderr
      } = await execFileAsync(
        PYTHON,
        [
          PUNJABI_TTS_SCRIPT,
          text.trim(),
          outputFile
        ],
        {
          timeout: 30000,
          maxBuffer: 1024 * 1024
        }
      );

      if (stdout) {
        console.log(
          "Python:",
          stdout.trim()
        );
      }

      if (stderr) {
        console.log(
          "Python stderr:",
          stderr.trim()
        );
      }

    }

    // ====================================
    // ALL OTHER LANGUAGES
    // ====================================

    else {
      const voice = VOICES[language];

      console.log(
        "Voice:",
        voice
      );

      console.log(
        "🐍 Python:",
        PYTHON
      );

      console.log(
        "🎙️ Using Microsoft Edge TTS..."
      );

      const {
        stdout,
        stderr
      } = await execFileAsync(
        PYTHON,
        [
          TTS_SCRIPT,
          text.trim(),
          voice,
          outputFile
        ],
        {
          timeout: 30000,
          maxBuffer: 1024 * 1024
        }
      );

      if (stdout) {
        console.log(
          "Python:",
          stdout.trim()
        );
      }

      if (stderr) {
        console.log(
          "Python stderr:",
          stderr.trim()
        );
      }
    }


    // ------------------------------------
    // Check generated audio
    // ------------------------------------

    const audioBuffer =
      await fs.readFile(outputFile);

    if (!audioBuffer.length) {
      throw new Error(
        "Generated audio file is empty."
      );
    }

    console.log(
      `✅ AUDIO GENERATED: ${audioBuffer.length} bytes`
    );


    // ------------------------------------
    // Send audio to frontend
    // ------------------------------------

    res.setHeader(
      "Content-Type",
      "audio/mpeg"
    );

    res.setHeader(
      "Content-Length",
      audioBuffer.length
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.send(audioBuffer);

  } catch (error) {

    console.error("");
    console.error("❌ TTS ERROR:");
    console.error(
      error?.message || error
    );

    return res.status(500).json({
      success: false,
      message:
        "Text-to-speech generation failed.",
      error:
        error?.message ||
        "Unknown TTS error"
    });

  } finally {

    // ------------------------------------
    // Delete temporary audio file
    // ------------------------------------

    if (outputFile) {
      try {
        await fs.unlink(outputFile);
      } catch {}
    }
  }
});


// ========================================
// START SERVER
// ========================================

app.listen(
  PORT,
  "127.0.0.1",
  () => {

    console.log("");
    console.log(
      "======================================"
    );

    console.log(
      "🚀 LinguaAI TTS Backend Started"
    );

    console.log(
      "======================================"
    );

    console.log(
      `🌐 http://127.0.0.1:${PORT}`
    );

    console.log(
      "🐍 Python Edge TTS: ENABLED"
    );

    console.log(
      "🟡 Punjabi TTS: gTTS ENABLED"
    );

    console.log(
      "🌐 CORS: ENABLED"
    );

    console.log(
      "======================================"
    );

    console.log("");
  }
);