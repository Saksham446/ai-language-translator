# 🌐 LinguaAI – AI Language Translation Tool

LinguaAI is an AI-powered language translation web application that allows users to translate text between multiple languages through a simple and modern interface.

The application also provides Text-to-Speech (TTS) functionality, allowing users to listen to both the original text and translated text.

## ✨ Features

- 🌍 Translate text between 14 languages
- ⚡ Fast text translation
- 🔄 Swap source and target languages
- 📋 Copy translated text
- 🔊 Text-to-Speech for original and translated text
- 🟡 Punjabi Text-to-Speech support
- ⌨️ Keyboard shortcut: ⌘ + Enter to translate
- 📱 Clean and responsive user interface
- ⚠️ Error handling for translation and speech generation

## 🌎 Supported Languages

| Language | Code |
|----------|------|
| English | en |
| Hindi | hi |
| Spanish | es |
| French | fr |
| German | de |
| Italian | it |
| Portuguese | pt |
| Russian | ru |
| Japanese | ja |
| Korean | ko |
| Chinese | zh |
| Arabic | ar |
| Bengali | bn |
| Punjabi | pa |

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML
- CSS

### Backend
- Node.js
- Express.js
- CORS

### APIs & AI Services
- MyMemory Translation API
- Microsoft Edge TTS
- Google Text-to-Speech (gTTS) for Punjabi

## 🏗️ Project Structure

```text
ai-language-translator/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── server.js
│   ├── tts.py
│   ├── tts_punjabi.py
│   └── package.json
│
├── .gitignore
└── README.md
