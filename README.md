# ⚡ Interview Copilot AI (Stealth Mode & Knowledge Base)

> **A personal, open-source AI live interview assistant inspired by Verve AI and Parakeet AI.**  
> Equips candidates with a personal Knowledge Base, live Google Search grounding, real-time speech transcription, screen snip coding analysis, and an anti-detection stealth teleprompter overlay.

---

## 🌟 Key Capabilities

### 1. 🧠 Personalized Knowledge Hub
- **Resume Ingestion**: Drag-and-drop your resume (`.pdf`, `.txt`, `.md`). The AI extracts your key accomplishments, core technical stack, years of experience, and summary bio.
- **STAR Story Bank**: Organize situational stories (**Situation, Task, Action, Result**) with quantifiable metrics (e.g. *68% latency cut, $45k/month cloud savings*) and technologies used.
- **Role & Company Grounding**: Paste the target Job Description (JD). With one click, the AI performs **Live Google Search Grounding** to fetch recent company news, core values, engineering tech stack, and interview vibe.

### 2. 🛡️ Live Stealth Teleprompter HUD
- **Anti-Detection Screen Share Protection**: Leverages OS-level window display affinity (`setContentProtection(true)`). When you share your screen in **Zoom, Google Meet, Microsoft Teams, or Discord**, the overlay is **completely invisible to the interviewer**.
- **Camera-Level Positioning**: Frameless, floating, and draggable right underneath your webcam, allowing you to glance at cues while maintaining natural eye contact.
- **Cue-Card Formatting**: Unlike standard chatbots that dump robotic paragraphs, answers are synthesized into **anchor talking points**, **high-impact bullet points**, and **glowing bold keywords** for 1-second glances.
- **Ghost Opacity & Transparency**: Adjust background opacity from 25% (ghost) to 100% (solid).

### 3. 🎙️ Real-Time Interview Assistance
- **Continuous Speech Recognition**: Automatically listens to the interview dialogue, transcribes questions, and allows 1-click answer generation.
- **Instant Screen Snip (Coding & Assessments)**: Hit `Ctrl + Shift + S` to capture your screen (e.g., LeetCode problem, system architecture diagram, or online test), and receive the optimal code solution, Big-O time/space complexity, and edge cases.
- **Four Tailored Response Modes**:
  1. **Behavioral (STAR)**: Grounded in your actual resume and story bank.
  2. **Technical / Code**: Optimal algorithm, clean code snippet, and complexity analysis.
  3. **System Design**: Architectural components, scaling strategies, and tradeoffs.
  4. **Quick Bullet**: Punchy, conversational 3-bullet answer to deliver in under 20 seconds.

---

## ⌨️ Global Stealth Hotkeys

Control the copilot even while focused inside Zoom, Teams, or your IDE:

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>\</kbd> | **Toggle Mode** | Switch instantly between Knowledge Hub and Stealth HUD |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>H</kbd> | **Emergency Hide** | Instantly hide or reveal the HUD window |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd> | **Quick Answer** | Synthesize answer for the latest interviewer question |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | **Snip Screen** | Grab screen screenshot to solve coding problems |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> | **Clear Audio** | Reset speech transcription stream |

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Google Gemini API Key** (Free tier available at [Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Clone & Install
```bash
# Clone repository
git clone https://github.com/KoshaG0hil/interview-copilot-ai.git
cd interview-copilot-ai

# Install dependencies
npm install
```

### 2. Configure API Key
Create a `.env` file (or set it inside the app's Settings modal):
```bash
cp .env.example .env
```
Add your Gemini key:
```env
GEMINI_API_KEY=AIzaSy...
```

### 3. Launch the Application

#### On Windows:
Double-click `start.bat` or run:
```bash
npm run electron:dev
```

#### On macOS / Linux:
```bash
chmod +x start.sh
./start.sh
```

*(You can also run just the web interface in browser via `npm run dev` at `http://localhost:5173`)*

---

## 🏗️ Architecture & Tech Stack

```
interview-copilot-ai/
├── electron/
│   ├── main.ts              # Frameless window manager, screen protection, global hotkeys, desktopCapturer
│   └── preload.ts           # Secure IPC bridge
├── src/
│   ├── components/
│   │   ├── hub/             # Knowledge Hub (Resume Manager, STAR Story Bank, Job Setup, Practice)
│   │   ├── hud/             # Live Stealth Teleprompter HUD (Cue-card view, live audio stream, quick toolbar)
│   │   └── common/          # Settings modal, hotkey cheat-sheet
│   ├── services/
│   │   ├── gemini.ts        # @google/genai SDK with native Google Search Grounding
│   │   ├── storage.ts       # Local candidate profile & story persistence
│   │   ├── resumeParser.ts  # PDF and text extraction
│   │   └── speechRecognition.ts # Continuous Speech-to-Text engine
│   └── App.tsx              # View router and state coordinator
```

- **Runtime**: Electron 34 + Node.js
- **Frontend**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS + Custom HUD Glassmorphism
- **AI Intelligence**: `@google/genai` (Gemini 2.5 Flash / Gemini 3.7 Flash) with native **Google Search Grounding**
- **Document Processing**: `pdfjs-dist` for client-side PDF parsing

---

## 💡 Best Practices for Live Interviews

1. **Positioning**: Move the Stealth HUD window directly below your physical webcam. When you glance at the bullet points, your eyes will look like you are making direct eye contact with the interviewer.
2. **Glance, Don't Read**: Look at the bold keyword anchor (e.g. `*decoupled into Kafka*`), internalize it for 1 second, and speak in your natural conversational voice. Never read bullet points word-for-word.
3. **Screen Share Verification**: Content protection is automatically activated in HUD mode. You can test sharing your full screen in a test Zoom or Google Meet room with a friend to see how the window is omitted from the stream.
4. **Use Practice Arena**: Run through 3-4 mock questions in the Practice Arena tab before your real interview call to calibrate your delivery rhythm.

---

## 📄 License & Disclaimer

**Personal Use Only**: This software is created for personal practice, preparation, and live guidance. Always adhere to your target employer's honor codes and interview conduct guidelines.
Distributed under the MIT License.
