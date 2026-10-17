import React, { useState, useEffect, useRef } from 'react';
import {
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
  FaWrench, FaShoppingCart, FaCommentDots, FaFilePdf,
  FaMicrophone, FaMicrophoneSlash, FaVolumeUp,
  FaBolt, FaClipboardList, FaPrint, FaTimes
} from 'react-icons/fa';
import { MdSend } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default function DiagnosisReport({ data, language = 'en' }) {
  const { session_id, car_info, issue, diagnosis } = data;
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Voice Assistant State
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const recognitionRef = useRef(null);
  const voiceModeRef = useRef(false);

  useEffect(() => {
    voiceModeRef.current = voiceModeActive;
  }, [voiceModeActive]);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const vList = window.speechSynthesis.getVoices();
        if (vList && vList.length > 0) {
          setAvailableVoices(vList);
        }
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Job Sheet & Interactive Steps State
  const [showJobSheet, setShowJobSheet] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});

  const toggleStep = (idx) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const safeStatus = diagnosis?.safe_to_drive || 'UNKNOWN';

  const safeClass = safeStatus.includes('YES')
    ? 'status-safe' : safeStatus.includes('CAUTION')
    ? 'status-caution' : 'status-danger';

  const safeIcon = safeStatus.includes('YES')
    ? <FaCheckCircle className="text-green-400" />
    : safeStatus.includes('CAUTION')
    ? <FaExclamationTriangle className="text-yellow-400" />
    : <FaTimesCircle className="text-red-400" />;

  // Instant acoustic feedback chime (subtle 100ms tone)
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
      setTimeout(() => {
        try { ctx.close(); } catch(e) {}
      }, 300);
    } catch(e) {}
  };

  // Select ultra-natural, realistic human voices (Google Neural / Edge Natural)
  const selectBestVoice = (lang) => {
    const voices = (availableVoices.length > 0 ? availableVoices : (window.speechSynthesis ? window.speechSynthesis.getVoices() : [])) || [];
    if (!voices || voices.length === 0) return null;

    if (lang === 'hi') {
      // 1. Edge Natural Online Hindi (Ultra-realistic)
      const naturalHi = voices.find(v => (v.lang.startsWith('hi') || v.lang === 'hi_IN') && (v.name.includes('Natural') || v.name.includes('Online')));
      if (naturalHi) return naturalHi;
      // 2. Google Hindi (Chrome Neural)
      const googleHi = voices.find(v => (v.lang.startsWith('hi') || v.lang === 'hi_IN') && v.name.includes('Google'));
      if (googleHi) return googleHi;
      // 3. Any available Hindi voice
      return voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.lang === 'hi_IN') || null;
    } else {
      // English
      // 1. Edge Online Natural (Jenny, Guy, Aria, Christopher) - studio quality AI
      const naturalEn = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural')));
      if (naturalEn) return naturalEn;
      // 2. Google US / UK English (Chrome neural web voice)
      const googleEn = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
      if (googleEn) return googleEn;
      // 3. Apple Samantha or Siri
      const appleEn = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Karen')));
      if (appleEn) return appleEn;
      // 4. Microsoft Jenny / Aria / Guy
      const msModern = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Guy')));
      if (msModern) return msModern;
      // 5. Microsoft Zira (female, much smoother than David)
      const zira = voices.find(v => v.lang.startsWith('en') && v.name.includes('Zira'));
      if (zira) return zira;
      // 6. Non-David fallback
      const nonDavid = voices.find(v => v.lang.startsWith('en') && !v.name.includes('David'));
      if (nonDavid) return nonDavid;

      return voices.find(v => v.lang.startsWith('en')) || null;
    }
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript.trim()) {
        setChatInput(finalTranscript);
        playChime(); // Instant audio cue!
        try { recognition.stop(); } catch(e) {}
        triggerSend(finalTranscript); // Immediate trigger without 200ms lag
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (window.isVoiceModeIntentionallyActive && !window.speechSynthesis.speaking) {
        setTimeout(() => {
          try { recognition.start(); } catch(e) {}
        }, 100);
      }
    };
    
    return recognition;
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported on this device');
      return;
    }
    
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      window.speechSynthesis.resume(); // Fix Chromium audio freeze

      // Clean out markdown, symbols, slashes, brackets, colons that cause audio clipping
      let cleanText = text
        .replace(/[*#_`~()\[\]{}:;\\/\"'—–-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      // Ensure feminine grammar in Hindi if masculine pronouns appear
      if (language === 'hi' || /[\u0900-\u097F]/.test(cleanText)) {
        cleanText = cleanText
          .replace(/कर रहा हूँ/g, 'कर रही हूँ')
          .replace(/बता रहा हूँ/g, 'बता रही हूँ')
          .replace(/सुन रहा हूँ/g, 'सुन रही हूँ')
          .replace(/सोच रहा हूँ/g, 'सोच रही हूँ');
      }

      // Route based on actual characters: Devanagari goes to Hindi voice, English goes to English voice
      const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
      const targetLang = hasDevanagari ? 'hi' : 'en';

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95; // Steady, calm tempo prevents audio jitter and packet loss on Windows
      utterance.pitch = 1.0;
      utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-US';

      // Pick top neural/natural voice matched to language
      const bestVoice = selectBestVoice(targetLang);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // AI finished speaking, restart listening if we're in voice mode
        if (window.isVoiceModeIntentionallyActive && recognitionRef.current) {
          setTimeout(() => {
            try { recognitionRef.current.start(); } catch(e) {}
          }, 350);
        }
      };

      utterance.onerror = (e) => {
        setIsSpeaking(false);
        console.warn('Speech synthesis error:', e);
        if (window.isVoiceModeIntentionallyActive && recognitionRef.current) {
          setTimeout(() => {
            try { recognitionRef.current.start(); } catch(err) {}
          }, 350);
        }
      };

      // 80ms gap allows Windows audio sink to initialize cleanly without buffer clipping
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch(e) {
          console.error('speak error:', e);
        }
      }, 80);

    } catch (err) {
      setIsSpeaking(false);
      console.error('speakText error:', err);
    }
  };


  const toggleVoiceMode = () => {
    if (voiceModeActive) {
      setVoiceModeActive(false);
      window.isVoiceModeIntentionallyActive = false;
      setIsListening(false);
      setIsSpeaking(false);
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      toast.success(language === 'hi' ? 'वॉइस असिस्टेंट बंद कर दिया गया' : 'Voice Assistant deactivated');
    } else {
      if (!recognitionRef.current) {
        recognitionRef.current = initSpeechRecognition();
      }
      if (!recognitionRef.current) {
        toast.error("Your browser doesn't support Voice Assistant");
        return;
      }
      setVoiceModeActive(true);
      window.isVoiceModeIntentionallyActive = true;
      setChatOpen(true);
      const welcomeMsg = language === 'hi'
        ? `वॉइस असिस्टेंट चालू हो गया है। मैं ${car_info.model} के बारे में आपके सभी सवालों के जवाब देने के लिए तैयार हूँ। आप कुछ भी पूछ सकती हैं।`
        : `Voice assistant activated. I'm ready to answer questions about the ${car_info.model}.`;
      speakText(welcomeMsg);
      toast.success(language === 'hi' ? 'वॉइस असिस्टेंट मोड चालू है' : 'Voice Assistant Mode ON');
    }
  };

  const triggerSend = async (messageText) => {
    if (!messageText.trim()) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: messageText }]);
    setChatLoading(true);

    const isVoice = voiceModeActive || voiceModeRef.current || window.isVoiceModeIntentionallyActive;

    try {
      const res = await axios.post(`${API_BASE}/chat/`, {
        session_id,
        message: messageText,
        language
      });
      const aiResponse = res.data.response;
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      
      if (isVoice) {
        speakText(aiResponse);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || '';
      if (errorMsg.includes('429') || errorMsg.includes('Quota exceeded') || errorMsg.includes('Rate limit')) {
        const rateLimitMsg = "We're asking questions too fast! The free Gemini API only allows 5 requests per minute. Please wait 15 seconds and ask again.";
        toast.error('Free Tier Limit Reached (Wait 15s)');
        setChatMessages(prev => [...prev, { role: 'ai', text: rateLimitMsg }]);
        if (isVoice) speakText("We are asking questions too fast. Please wait 15 seconds and ask again.");
      } else {
        toast.error('Chat failed. Please try again.');
        if (isVoice) speakText("Sorry, I encountered an error connecting to the server.");
      }
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('MechAI Diagnostic Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Vehicle: ${car_info.year} ${car_info.brand} ${car_info.model}`, 20, 35);
    doc.text(`Issue: ${issue}`, 20, 45);
    doc.text(`Safe to Drive: ${safeStatus}`, 20, 55);
    doc.text('', 20, 65);

    if (diagnosis?.summary) {
      doc.setFontSize(14);
      doc.text('Summary:', 20, 75);
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(diagnosis.summary, 170);
      doc.text(lines, 20, 85);
    }

    if (diagnosis?.root_causes?.length) {
      let y = 105;
      doc.setFontSize(14);
      doc.text('Root Causes:', 20, y);
      y += 10;
      diagnosis.root_causes.forEach(rc => {
        doc.setFontSize(11);
        doc.text(`${rc.rank}. ${rc.cause} (${rc.probability})`, 20, y);
        y += 7;
        const exp = doc.splitTextToSize(rc.explanation, 170);
        doc.text(exp, 25, y);
        y += exp.length * 7 + 3;
      });
    }

    doc.setFontSize(9);
    doc.text(`Generated by MechAI · TorqueIQ · Session: ${session_id}`, 20, 285);
    doc.save(`MechAI_Report_${session_id.slice(0,8)}.pdf`);
    toast.success('PDF downloaded!');
  };

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  return (
    <div className="space-y-5 mt-6">
      {/* Header Card */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {car_info.year} {car_info.brand} {car_info.model}
            </h2>
            <p className="text-slate-400 mt-1 text-sm">"{issue}"</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`severity-badge ${safeClass} flex items-center gap-2 px-4 py-2`}>
              {safeIcon}
              {safeStatus}
            </div>
            <button
              onClick={() => setShowJobSheet(true)}
              className="btn-secondary border border-blue-500/40 text-blue-300 hover:bg-blue-600/20"
              title="Generate printable workshop job sheet for customer"
            >
              <FaClipboardList className="text-blue-400" /> Customer Job Sheet
            </button>
            <button onClick={downloadPDF} className="btn-secondary">
              <FaFilePdf className="text-red-400" /> Download PDF
            </button>
          </div>
        </div>

        {/* OBD-II DTC Telemetry Decoded Card */}
        {diagnosis?.obd_code_analysis?.code && diagnosis.obd_code_analysis.code !== 'N/A' && (
          <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-wide">
                <FaBolt /> OBD-II Telemetry Decoded
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs rounded-full border border-emerald-500/30">
                DTC: {diagnosis.obd_code_analysis.code}
              </span>
            </div>
            {diagnosis.obd_code_analysis.technical_meaning && (
              <p className="text-white text-xs font-semibold mb-1">
                Definition: <span className="text-emerald-200 font-normal">{diagnosis.obd_code_analysis.technical_meaning}</span>
              </p>
            )}
            {diagnosis.obd_code_analysis.symptom_correlation && (
              <p className="text-slate-300 text-xs leading-relaxed">
                <strong className="text-slate-200">Shop Correlation: </strong>{diagnosis.obd_code_analysis.symptom_correlation}
              </p>
            )}
          </div>
        )}

        {/* Summary */}
        {diagnosis?.summary && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-blue-100 text-sm leading-relaxed">{diagnosis.summary}</p>
          </div>
        )}

        {/* Safety Warning */}
        {diagnosis?.safety_warning && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-2">
            <FaExclamationTriangle className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-200 text-sm">{diagnosis.safety_warning}</p>
          </div>
        )}
      </div>

      {/* Root Causes */}
      {diagnosis?.root_causes?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            🔍 Root Cause Analysis
          </h3>
          <div className="space-y-3">
            {diagnosis.root_causes.map((rc, i) => (
              <div key={i} className={`p-4 rounded-xl border ${
                i === 0 ? 'border-blue-500/40 bg-blue-500/10' : 'border-slate-700/50 bg-slate-800/40'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-blue-600' : 'bg-slate-600'}`}>{rc.rank}</span>
                    {rc.cause}
                  </span>
                  <span className={`text-sm font-semibold ${i === 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                    {rc.probability}
                  </span>
                </div>
                <p className="text-slate-300 text-sm pl-8">{rc.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fix Steps */}
      {diagnosis?.fix_steps?.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FaWrench className="text-blue-400" /> Step-by-Step Fix Instructions
            </h3>
            {diagnosis.labor_hours_estimate && (
              <span className="text-xs bg-slate-800 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30 font-medium">
                ⏱ Est. Labor: {diagnosis.labor_hours_estimate}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-3">Tap any step to mark it as completed:</p>
          <div className="space-y-3">
            {diagnosis.fix_steps.map((step, i) => {
              const isDone = !!completedSteps[i];
              return (
                <div
                  key={i}
                  onClick={() => toggleStep(i)}
                  className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/40 opacity-75'
                      : 'bg-slate-800/40 border-slate-700/50 hover:border-blue-500/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                    isDone ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {isDone ? '✓' : step.step}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium transition-colors ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                      {step.action}
                    </p>
                    <div className="flex gap-4 mt-1.5 flex-wrap">
                      {step.tool_needed && (
                        <span className="text-xs text-slate-400">🔧 {step.tool_needed}</span>
                      )}
                      {step.time_estimate && (
                        <span className="text-xs text-slate-400">⏱ {step.time_estimate}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Parts Needed */}
      {diagnosis?.parts_needed?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <FaShoppingCart className="text-blue-400" /> Parts You Need
          </h3>
          <div className="space-y-2">
            {diagnosis.parts_needed.map((part, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <span className="text-white">{part.part}</span>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-sm font-medium">{part.estimated_cost}</span>
                  <span className={`severity-badge text-xs ${
                    part.urgency === 'Immediate' ? 'status-danger' :
                    part.urgency === 'Soon' ? 'status-caution' : 'status-safe'
                  }`}>{part.urgency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalation */}
      {diagnosis?.escalate_to_expert && (
        <div className="glass-card p-4 border border-orange-500/30 bg-orange-500/10">
          <div className="flex gap-3">
            <FaExclamationTriangle className="text-orange-400 mt-0.5" />
            <div>
              <p className="text-orange-300 font-medium">Expert Required</p>
              <p className="text-orange-200/80 text-sm mt-1">{diagnosis.escalation_reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat / Voice Assistant Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-2 text-blue-400 font-medium hover:text-blue-300 transition-colors"
          >
            <FaCommentDots />
            {chatOpen ? 'Hide Chat' : 'Ask a follow-up question'}
          </button>
          
          <button 
            onClick={toggleVoiceMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
              voiceModeActive 
                ? 'bg-blue-600 text-white pulse-blue shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {voiceModeActive ? (
              <>
                {chatLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'hi' ? 'सोच रही हूँ...' : 'Thinking...'}</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <FaVolumeUp className="animate-bounce text-emerald-300" />
                    <span>{language === 'hi' ? 'बोल रही हूँ...' : 'Speaking...'}</span>
                  </>
                ) : isListening ? (
                  <>
                    <FaMicrophone className="animate-pulse text-red-400" />
                    <span>{language === 'hi' ? 'सुन रही हूँ...' : 'Listening...'}</span>
                  </>
                ) : (
                  <>
                    <FaVolumeUp className="text-blue-300" />
                    <span>{language === 'hi' ? 'तैयार' : 'Ready'}</span>
                  </>
                )}
              </>
            ) : (
              <>
                <FaMicrophone /> {language === 'hi' ? 'वॉइस असिस्टेंट' : 'Hands-Free Assistant'}
              </>
            )}
          </button>
        </div>

        {chatOpen && (
          <div className="mt-2">
            <div className="min-h-[120px] max-h-[300px] overflow-y-auto space-y-3 mb-4 p-3 bg-slate-900/50 rounded-xl">
              {chatMessages.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4 flex flex-col items-center gap-2">
                  <span>Type a question below, or turn on the Hands-Free Assistant.</span>
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}>{msg.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 px-4 py-2 rounded-xl text-sm text-slate-400 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 relative">
              <input
                className="input-field"
                placeholder={voiceModeActive ? (isListening ? "Listening..." : "Wait for AI to finish speaking...") : "e.g. How much will this cost to fix?"}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && triggerSend(chatInput)}
                disabled={voiceModeActive}
              />
              <button 
                onClick={() => triggerSend(chatInput)} 
                className={`px-4 rounded-xl flex items-center justify-center transition-colors ${
                  voiceModeActive ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
                disabled={chatLoading || voiceModeActive}
              >
                <MdSend size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Job Sheet / Workshop Repair Order Modal */}
      {showJobSheet && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 max-w-3xl w-full rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">🔧</span>
                  <h2 className="text-xl font-bold text-white tracking-wide">TorqueIQ Automotive</h2>
                </div>
                <p className="text-xs text-blue-400 font-mono mt-1">MechAI Automated Workshop Work Order & Job Estimate</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1.5"
                >
                  <FaPrint /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowJobSheet(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-800/60 rounded-xl text-xs border border-slate-700/60 font-mono">
              <div>
                <span className="text-slate-400 block">WORK ORDER #:</span>
                <span className="text-white font-bold">RO-{session_id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">DATE:</span>
                <span className="text-white font-bold">{new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">VEHICLE:</span>
                <span className="text-white font-bold">{car_info.year} {car_info.brand} {car_info.model}</span>
              </div>
              <div>
                <span className="text-slate-400 block">OBD-II DTC:</span>
                <span className="text-emerald-400 font-bold">{diagnosis?.obd_code_analysis?.code || 'NO SCAN CODE'}</span>
              </div>
            </div>

            {/* Customer Complaint */}
            <div className="p-3.5 bg-slate-800/30 rounded-xl border border-slate-700/50 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Customer Stated Issue:</span>
              <p className="text-slate-200 italic">"{issue}"</p>
            </div>

            {/* Primary Finding */}
            {diagnosis?.summary && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Technical Finding & Root Cause:</h4>
                <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-xl text-sm text-blue-100">
                  <p className="font-medium mb-2">{diagnosis.summary}</p>
                  {diagnosis?.root_causes?.length > 0 && (
                    <ul className="text-xs space-y-1 text-slate-300">
                      {diagnosis.root_causes.slice(0, 2).map((rc, i) => (
                        <li key={i}>• {rc.cause} ({rc.probability} probability) — {rc.explanation}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Parts & Materials Breakdown */}
            {diagnosis?.parts_needed?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Required Parts & Materials:</h4>
                <table className="w-full text-left text-xs border border-slate-700/60 rounded-xl overflow-hidden">
                  <thead className="bg-slate-800 text-slate-300">
                    <tr>
                      <th className="p-2.5">Part Description</th>
                      <th className="p-2.5">Urgency</th>
                      <th className="p-2.5 text-right">Est. Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {diagnosis.parts_needed.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-medium text-white">{p.part}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.urgency === 'Immediate' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                          }`}>{p.urgency}</span>
                        </td>
                        <td className="p-2.5 text-right text-emerald-400 font-mono font-semibold">{p.estimated_cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Labor & Total Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">ESTIMATED LABOR TIME:</span>
                <span className="text-white font-bold">{diagnosis?.labor_hours_estimate || '1.0 - 2.0 hours'}</span>
                <span className="text-xs text-slate-500 block mt-1">Driveability: <strong className="text-yellow-400">{safeStatus}</strong></span>
              </div>
              <div className="text-right flex flex-col justify-center">
                <span className="text-xs text-slate-400 block">WORKSHOP STATUS:</span>
                <span className="text-emerald-400 font-bold uppercase">Ready for Work Order Approval</span>
              </div>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-700 text-xs text-slate-400">
              <div>
                <div className="border-b border-dashed border-slate-600 h-8 mb-1"></div>
                <span>Certified Technician Signature</span>
              </div>
              <div>
                <div className="border-b border-dashed border-slate-600 h-8 mb-1"></div>
                <span>Customer Work Authorization</span>
              </div>
            </div>

            {/* Close action */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowJobSheet(false)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Close Job Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
