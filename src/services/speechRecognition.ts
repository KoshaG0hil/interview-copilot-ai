type TranscriptCallback = (data: {
  text: string;
  isFinal: boolean;
  speaker: 'interviewer' | 'candidate';
}) => void;

export class LiveSpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscriptCallback: TranscriptCallback | null = null;
  private currentSpeaker: 'interviewer' | 'candidate' = 'interviewer';
  private restartTimeout: any = null;
  private isSupported: boolean = false;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        if (this.onTranscriptCallback) {
          if (finalTranscript.trim()) {
            this.onTranscriptCallback({
              text: finalTranscript.trim(),
              isFinal: true,
              speaker: this.currentSpeaker,
            });
          } else if (interimTranscript.trim()) {
            this.onTranscriptCallback({
              text: interimTranscript.trim(),
              isFinal: false,
              speaker: this.currentSpeaker,
            });
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.isListening = false;
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Auto restart to keep listening continuously in live interviews
          this.restartTimeout = setTimeout(() => {
            if (this.isListening) {
              try {
                this.recognition?.start();
              } catch (e) {
                console.warn('Speech recognition auto-restart failed:', e);
              }
            }
          }, 300);
        }
      };
    }
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }

  public setSpeaker(speaker: 'interviewer' | 'candidate') {
    this.currentSpeaker = speaker;
  }

  public start(callback: TranscriptCallback): boolean {
    if (!this.isSupported || !this.recognition) return false;
    this.onTranscriptCallback = callback;
    this.isListening = true;
    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Speech recognition start error:', e);
      return false;
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    try {
      this.recognition?.stop();
    } catch (e) {
      console.warn('Speech recognition stop error:', e);
    }
  }

  public getStatus(): boolean {
    return this.isListening;
  }
}

export const speechService = new LiveSpeechService();
