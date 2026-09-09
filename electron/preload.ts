import { contextBridge, ipcRenderer } from 'electron';

export interface GeminiRequestPayload {
  apiKey?: string;
  model?: string;
  systemInstruction?: string;
  prompt: string;
  enableSearchGrounding?: boolean;
  imageBase64?: string;
}

export interface GeminiResponsePayload {
  success: boolean;
  text?: string;
  groundingSources?: { title: string; url: string }[];
  error?: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  setContentProtection: (enable: boolean) => Promise<boolean>;
  setOpacity: (opacity: number) => Promise<void>;
  setAlwaysOnTop: (enable: boolean) => Promise<void>;
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => Promise<void>;
  toggleWindowMode: (mode: 'hub' | 'hud') => Promise<void>;
  closeWindow: () => Promise<void>;
  minimizeWindow: () => Promise<void>;
  captureScreen: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  generateGeminiContent: (payload: GeminiRequestPayload) => Promise<GeminiResponsePayload>;
  loadPersistentData: () => Promise<any | null>;
  savePersistentData: (data: any) => Promise<boolean>;
  getDataPath: () => Promise<string>;
  onGlobalShortcut: (callback: (action: string) => void) => () => void;
  onAudioTranscript: (callback: (data: { text: string; isFinal: boolean; source: 'mic' | 'system' }) => void) => () => void;
}

const electronAPI: ElectronAPI = {
  isElectron: true,
  setContentProtection: (enable: boolean) => ipcRenderer.invoke('set-content-protection', enable),
  setOpacity: (opacity: number) => ipcRenderer.invoke('set-opacity', opacity),
  setAlwaysOnTop: (enable: boolean) => ipcRenderer.invoke('set-always-on-top', enable),
  setIgnoreMouseEvents: (ignore: boolean, forward = false) => ipcRenderer.invoke('set-ignore-mouse', { ignore, forward }),
  toggleWindowMode: (mode: 'hub' | 'hud') => ipcRenderer.invoke('toggle-window-mode', mode),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  generateGeminiContent: (payload: GeminiRequestPayload) => ipcRenderer.invoke('generate-gemini-content', payload),
  loadPersistentData: () => ipcRenderer.invoke('load-persistent-data'),
  savePersistentData: (data: any) => ipcRenderer.invoke('save-persistent-data', data),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  onGlobalShortcut: (callback: (action: string) => void) => {
    const handler = (_event: any, action: string) => callback(action);
    ipcRenderer.on('shortcut-trigger', handler);
    return () => {
      ipcRenderer.removeListener('shortcut-trigger', handler);
    };
  },
  onAudioTranscript: (callback: (data: { text: string; isFinal: boolean; source: 'mic' | 'system' }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('audio-transcript', handler);
    return () => {
      ipcRenderer.removeListener('audio-transcript', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
