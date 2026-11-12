import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, Trash2, CheckCircle, AlertCircle, 
  Sparkles, RefreshCw, Play, Square, Shield
} from 'lucide-react';

interface Props {
  targetTextPrompt?: string; // Text expected (e.g. verse or title)
  onVerificationComplete?: (transcript: string) => void;
}

// Window declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceVerificationPanel: React.FC<Props> = ({
  targetTextPrompt,
  onVerificationComplete
}) => {
  // Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPlayedOnce, setAudioPlayedOnce] = useState<boolean>(false);
  const [isDeletedFromMemory, setIsDeletedFromMemory] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  
  // Speech Recognition state
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Auto-delete setting
  const [autoDeleteAfterPlay, setAutoDeleteAfterPlay] = useState<boolean>(true);

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsSpeechSupported(false);
    }
    return () => {
      // Cleanup any active blob URL on unmount to free RAM
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      stopTracks();
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Start recording & speech recognition
  const startRecording = async () => {
    setSpeechError(null);
    setIsDeletedFromMemory(false);
    setAudioPlayedOnce(false);
    setSpeechTranscript('');
    setRecordingDuration(0);

    // Clean previous audio blob if any
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    // Verify mediaDevices availability
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSpeechError('التسجيل الصوتي غير متاح في متصفحك الحالي. يمكنك مواصلة التسميع الذاتي والمتابعة.');
      setIsRecording(false);
      return;
    }

    try {
      // 1. Audio Stream from Microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Select best supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create in-memory transient blob
        const mime = selectedMimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        // Generate ephemeral in-memory Object URL
        const ephemeralUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(ephemeralUrl);
        // Wipe raw chunks from buffer array to release heap memory
        audioChunksRef.current = [];
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);

      // Duration timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // 2. Real-time Speech-to-Text Recognition in Arabic
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognition.lang = 'ar-SA';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            let currentText = '';
            for (let i = 0; i < event.results.length; i++) {
              currentText += event.results[i][0].transcript + ' ';
            }
            const clean = currentText.trim();
            setSpeechTranscript(clean);
            if (onVerificationComplete) {
              onVerificationComplete(clean);
            }
          };

          recognition.onerror = (event: any) => {
            if (event.error !== 'no-speech') {
              console.warn('Speech recognition notice:', event.error);
            }
          };

          recognition.onend = () => {
            // Keep running while still recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              try {
                recognition.start();
              } catch (e) {
                // ignore re-start error
              }
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn('Speech recognition notice:', err);
        }
      }
    } catch (err: any) {
      setIsRecording(false);
      stopTracks();
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err?.message?.toLowerCase().includes('denied');
      if (isDenied) {
        setSpeechError('إذن استخدام الميكروفون مرفوض في المتصفح. يمكنك السماح به بالنقر على أيقونة القفل أو الميكروفون في شريط العنوان بالأعلى، أو يمكنك مواصلة التسميع الذاتي بكل سهولة.');
      } else {
        setSpeechError('تعذر تفعيل الميكروفون حالياً. يمكنك المتابعة في الترديد والتسميع الذاتي.');
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    stopTracks();
    setIsRecording(false);
  };

  // Handle Playback Ended: Immediate Purge from RAM
  const handleAudioEnded = () => {
    setAudioPlayedOnce(true);
    if (autoDeleteAfterPlay) {
      purgeFromMemory();
    }
  };

  // Immediate Purge from RAM
  const purgeFromMemory = () => {
    if (audioUrl) {
      // Release memory from browser RAM immediately
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setIsDeletedFromMemory(true);
    }
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>التسجيل والتعرف الصوتي على القراءة</span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                <Shield className="w-3 h-3" />
                <span>ذاكرة عشوائية RAM مؤقتة</span>
              </span>
            </h4>
            <p className="text-[11px] text-stone-500">
              تسجيل خفيف ومباشر في ذاكرة المتصفح المؤقتة يُحذف فور الاستماع للتثبت من صحة النطق.
            </p>
          </div>
        </div>

        {/* Auto delete toggle */}
        <label className="flex items-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-400 cursor-pointer select-none bg-stone-50 dark:bg-stone-800/60 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
          <input
            type="checkbox"
            checked={autoDeleteAfterPlay}
            onChange={(e) => setAutoDeleteAfterPlay(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>حذف تلقائي فور انتهاء الاستماع</span>
        </label>
      </div>

      {/* Recording Actions & Wave Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60">
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>بدء التسجيل والتسميع</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white font-semibold text-xs rounded-xl hover:bg-stone-900 transition-all active:scale-95 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>إيقاف التسجيل ({formatSecs(recordingDuration)})</span>
            </button>
          )}

          {isRecording && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>جارٍ التسجيل والتعرف على النطق...</span>
            </div>
          )}
        </div>

        {/* In-Memory Audio Player and Manual Wipe */}
        {audioUrl && !isDeletedFromMemory && (
          <div className="flex flex-wrap items-center gap-2">
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              controls
              onEnded={handleAudioEnded}
              className="h-8 max-w-[220px] text-xs"
            />
            <button
              type="button"
              onClick={purgeFromMemory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 border border-red-200 dark:border-red-900 rounded-lg transition-colors"
              title="حذف التسجيل الصوتي فوراً من الذاكرة المؤقتة"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>حذف من الذاكرة الآن</span>
            </button>
          </div>
        )}

        {isDeletedFromMemory && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>تم التثبت من القراءة وحُذف الصوت تماماً من الذاكرة العشوائية (RAM)</span>
          </div>
        )}
      </div>

      {/* Real-time Arabic Speech Recognition Transcript */}
      <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>النص المسموع (التعرف على الصوت باللغة العربية):</span>
          </span>
          {speechTranscript && (
            <button
              type="button"
              onClick={() => setSpeechTranscript('')}
              className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              مسح النص
            </button>
          )}
        </div>

        <div className="min-h-[50px] p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80 font-amiri text-base leading-relaxed text-stone-900 dark:text-stone-100 select-text">
          {speechTranscript ? (
            <p className="text-emerald-950 dark:text-emerald-200 font-semibold">
              « {speechTranscript} »
            </p>
          ) : isRecording ? (
            <p className="text-stone-400 text-xs italic font-sans">
              تحدث أو اتلُ الآيات الآن، وسيقوم النظام بالتعرف الصوتي المباشر على كلماتك...
            </p>
          ) : (
            <p className="text-stone-400 text-xs italic font-sans">
              اضغط على "بدء التسجيل والتسميع" لبدء الاستماع والتعرف الصوتي على تلاوتك.
            </p>
          )}
        </div>

        {targetTextPrompt && (
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <span>المقرر المقارن:</span>
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              {targetTextPrompt}
            </span>
          </div>
        )}

        {speechError && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">
                {speechError}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="px-2.5 py-1 text-[11px] text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              >
                تجاهل ومتابعة التسميع الذاتي
              </button>
              <button
                type="button"
                onClick={startRecording}
                className="px-3 py-1 text-[11px] font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-lg shadow-2xs"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
