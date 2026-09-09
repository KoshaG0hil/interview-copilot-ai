import { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer, shell, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

let mainWindow: BrowserWindow | null = null;
let currentMode: 'hub' | 'hud' = 'hub';

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function getDbPath(): string {
  const userDir = app.getPath('userData');
  return path.join(userDir, 'interview-copilot-db.json');
}

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 450,
    minHeight: 250,
    frame: true,
    transparent: false,
    hasShadow: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    title: 'Interview Copilot AI - Knowledge Hub',
    backgroundColor: '#090d16',
  });

  // Auto-grant microphone, screen capture, and audio permissions for live interview listening
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true);
  });
  mainWindow.webContents.session.setPermissionCheckHandler(() => {
    return true;
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupGlobalShortcuts();
}

function switchToHudMode() {
  if (!mainWindow) return;
  currentMode = 'hud';
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Position at top-center under the webcam for optimal eye contact
  const hudWidth = 720;
  const hudHeight = 450;
  const hudX = Math.round((width - hudWidth) / 2);
  const hudY = 24; // Directly below camera

  mainWindow.setMinimumSize(400, 200);
  mainWindow.setBounds({ x: hudX, y: hudY, width: hudWidth, height: hudHeight });
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces?.(true);
  mainWindow.setOpacity(0.92);
  mainWindow.setTitle('Interview Copilot - Stealth HUD');

  // Enable OS screen-capture invisibility (Zoom, Meet, Teams will not capture this window)
  try {
    mainWindow.setContentProtection(true);
  } catch (err) {
    console.warn('Could not set content protection:', err);
  }
}

function switchToHubMode() {
  if (!mainWindow) return;
  currentMode = 'hub';
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const hubWidth = Math.min(1240, width - 80);
  const hubHeight = Math.min(840, height - 60);
  const hubX = Math.round((width - hubWidth) / 2);
  const hubY = Math.round((height - hubHeight) / 2);

  mainWindow.setMinimumSize(900, 600);
  mainWindow.setBounds({ x: hubX, y: hubY, width: hubWidth, height: hubHeight });
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setOpacity(1.0);
  mainWindow.setTitle('Interview Copilot AI - Knowledge Hub');
}

function setupGlobalShortcuts() {
  // Shortcut 1: Toggle HUD / Hub mode (Ctrl+\)
  globalShortcut.register('CommandOrControl+\\', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        const nextMode = currentMode === 'hub' ? 'hud' : 'hub';
        if (nextMode === 'hud') switchToHudMode();
        else switchToHubMode();
        mainWindow.webContents.send('shortcut-trigger', `toggle-mode-${nextMode}`);
      } else {
        mainWindow.show();
      }
    }
  });

  // Shortcut 2: Emergency Hide / Reveal (Ctrl+Shift+H)
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });

  // Shortcut 3: Instant Answer Trigger (Ctrl+Shift+Space)
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    mainWindow?.webContents.send('shortcut-trigger', 'trigger-answer');
  });

  // Shortcut 4: Capture Screen for coding problem / question (Ctrl+Shift+S)
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('shortcut-trigger', 'trigger-screen-capture');
  });

  // Shortcut 5: Clear / Reset Transcript (Ctrl+Shift+C)
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    mainWindow?.webContents.send('shortcut-trigger', 'clear-transcript');
  });
}

// Persistent Storage Handlers (Files stay until user deletes them)
ipcMain.handle('load-persistent-data', async () => {
  try {
    const dbFile = getDbPath();
    if (fs.existsSync(dbFile)) {
      const raw = fs.readFileSync(dbFile, 'utf-8');
      return JSON.parse(raw);
    }
    return null;
  } catch (err) {
    console.error('Failed to load persistent data from disk:', err);
    return null;
  }
});

ipcMain.handle('save-persistent-data', async (_event, data: any) => {
  try {
    const dbFile = getDbPath();
    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save persistent data to disk:', err);
    return false;
  }
});

ipcMain.handle('get-data-path', async () => {
  return getDbPath();
});

// IPC Handlers
ipcMain.handle('set-content-protection', async (_event, enable: boolean) => {
  if (mainWindow) {
    try {
      mainWindow.setContentProtection(enable);
      return true;
    } catch (e) {
      console.error('Failed to set content protection', e);
      return false;
    }
  }
  return false;
});

ipcMain.handle('set-opacity', async (_event, opacity: number) => {
  if (mainWindow) {
    const clamped = Math.max(0.15, Math.min(1.0, opacity));
    mainWindow.setOpacity(clamped);
  }
});

ipcMain.handle('set-always-on-top', async (_event, enable: boolean) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(enable, enable ? 'screen-saver' : 'normal');
  }
});

ipcMain.handle('set-ignore-mouse', async (_event, { ignore, forward }: { ignore: boolean; forward?: boolean }) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: !!forward });
  }
});

ipcMain.handle('toggle-window-mode', async (_event, mode: 'hub' | 'hud') => {
  if (mode === 'hud') {
    switchToHudMode();
  } else {
    switchToHubMode();
  }
});

ipcMain.handle('close-window', async () => {
  mainWindow?.close();
});

ipcMain.handle('minimize-window', async () => {
  mainWindow?.minimize();
});

ipcMain.handle('open-external', async (_event, url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    shell.openExternal(url);
  }
});

ipcMain.handle('capture-screen', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 },
    });
    if (sources.length > 0) {
      return sources[0].thumbnail.toDataURL();
    }
    return null;
  } catch (error) {
    console.error('Error capturing screen:', error);
    return null;
  }
});

// IPC Handler to fetch web content / Job Descriptions from URLs (bypasses browser CORS)
ipcMain.handle('fetch-url', async (_event, url: string) => {
  try {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return { success: false, error: 'Invalid URL. URL must start with http:// or https://' };
    }
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return { success: false, error: `Server responded with HTTP ${response.status}: ${response.statusText}` };
    }

    const html = await response.text();

    // Clean HTML to extract readable job description text
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();

    return { success: true, content: text.slice(0, 30000) };
  } catch (err: any) {
    console.error('Fetch URL error in main process:', err);
    return { success: false, error: err?.message || 'Failed to fetch job URL' };
  }
});

function normalizeModelName(model?: string): string {
  if (!model) return 'gemini-3.6-flash';
  const m = model.trim().toLowerCase();
  if (m.includes('3.7-flash') || m.includes('3.7')) {
    return 'gemini-3.7-flash';
  }
  if (m.includes('3.6-flash') || m.includes('3.6') || m.includes('2.0') || m.includes('2.5') || m.includes('1.5') || m.includes('flash')) {
    return 'gemini-3.6-flash';
  }
  return 'gemini-3.6-flash';
}

// Native Gemini API Integration with Google Search Grounding & Auto-Fallback
ipcMain.handle('generate-gemini-content', async (_event, payload: any) => {
  try {
    const rawKey = payload.apiKey || process.env.GEMINI_API_KEY;
    const key = (typeof rawKey === 'string') ? rawKey.trim() : '';
    if (!key) {
      return { success: false, error: 'No Gemini API Key provided. Please configure it in Settings.' };
    }

    const ai = new GoogleGenAI({ apiKey: key });
    let modelName = normalizeModelName(payload.model);

    const config: any = {};
    if (payload.systemInstruction) {
      config.systemInstruction = payload.systemInstruction;
    }
    if (payload.enableSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    let contents: any = payload.prompt;
    if (payload.imageBase64) {
      const match = payload.imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/png';
      const base64Data = match ? match[2] : payload.imageBase64;
      contents = [
        { text: payload.prompt },
        { inlineData: { mimeType, data: base64Data } },
      ];
    }

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      });
    } catch (modelErr: any) {
      console.warn(`Gemini call with ${modelName} failed, attempting fallback to gemini-3.7-flash:`, modelErr?.message);
      const fallbackModel = modelName === 'gemini-3.6-flash' ? 'gemini-3.7-flash' : 'gemini-3.6-flash';
      response = await ai.models.generateContent({
        model: fallbackModel,
        contents,
        config,
      });
    }

    const groundingSources: { title: string; url: string }[] = [];
    const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      }
    }

    return {
      success: true,
      text: response.text || '',
      groundingSources,
    };
  } catch (error: any) {
    console.error('Gemini API Error in Main:', error);
    return {
      success: false,
      error: error?.message || 'Failed to generate response from Gemini. Please verify your API key.',
    };
  }
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
