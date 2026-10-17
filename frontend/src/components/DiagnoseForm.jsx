import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaMicrophone, FaMicrophoneSlash, FaImage, FaVideo, FaTimes } from 'react-icons/fa';
import { MdUpload } from 'react-icons/md';
import toast from 'react-hot-toast';

const CAR_DATA = {
  Toyota: ['Camry', 'Corolla', 'Fortuner', 'Innova', 'Yaris', 'Hilux', 'Land Cruiser', 'RAV4'],
  Honda: ['City', 'Civic', 'CR-V', 'Accord', 'Jazz', 'WR-V', 'Amaze'],
  Hyundai: ['i20', 'Creta', 'Venue', 'Verna', 'Tucson', 'Elantra', 'i10'],
  Maruti: ['Swift', 'Baleno', 'Dzire', 'Brezza', 'Ertiga', 'Alto', 'WagonR', 'Ciaz'],
  Ford: ['EcoSport', 'Endeavour', 'Figo', 'Aspire', 'Mustang'],
  Stellantis: ['Jeep Compass', 'Jeep Meridian', 'Fiat Punto', 'Dodge Charger'],
  Nissan: ['Magnite', 'Terrano', 'Kicks', 'GT-R', 'Patrol'],
  Volkswagen: ['Polo', 'Vento', 'Taigun', 'Tiguan', 'Passat'],
  BMW: ['3 Series', '5 Series', 'X1', 'X3', 'X5', '7 Series'],
  Mercedes: ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class', 'A-Class'],
  Tata: ['Nexon', 'Harrier', 'Safari', 'Punch', 'Tiago', 'Altroz'],
  Mahindra: ['Scorpio', 'XUV700', 'Thar', 'Bolero', 'XUV300'],
};

const YEARS = Array.from({ length: 25 }, (_, i) => 2025 - i);

export default function DiagnoseForm({ onSubmit, loading }) {
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [issueText, setIssueText] = useState('');
  const [obdCode, setObdCode] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const onImageDrop = useCallback(files => {
    if (files[0]) setImageFile(files[0]);
  }, []);

  const onVideoDrop = useCallback(files => {
    if (files[0]) {
      if (files[0].size > 100 * 1024 * 1024) {
        toast.error('Video must be under 100MB');
        return;
      }
      setVideoFile(files[0]);
    }
  }, []);

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDrag } = useDropzone({
    onDrop: onImageDrop, accept: { 'image/*': [] }, maxFiles: 1
  });

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDrag } = useDropzone({
    onDrop: onVideoDrop, accept: { 'video/*': [] }, maxFiles: 1
  });

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        // Transcribe using browser's speech recognition
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('Recording started — describe the issue');
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  // Browser Speech Recognition
  const toggleSpeechToText = () => {
    if (isRecording) {
      if (window.activeFormRecognition) {
        try { window.activeFormRecognition.stop(); } catch(e) {}
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. Use Chrome or Edge.');
      return;
    }
    
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // Keep track of what was already in the box before we started speaking
      let baseText = document.getElementById('issue-textarea')?.value || issueText || '';
      baseText = baseText.trim() ? baseText + ' ' : '';

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript + ' ';
          }
        }
        
        if (newTranscript) {
          baseText += newTranscript;
          setIssueText(baseText);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          toast.error('Microphone blocked! Please allow access.');
        } else if (event.error !== 'no-speech') {
          console.error(event.error);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        window.activeFormRecognition = null;
      };
      
      recognition.start();
      window.activeFormRecognition = recognition;
      toast.success('Microphone active! Tap mic icon again to stop.');
      
    } catch (err) {
      console.error(err);
      toast.error('Could not start microphone. Check permissions.');
      setIsRecording(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!carBrand || !carModel || !carYear || !issueText.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    onSubmit({ carBrand, carModel, carYear: parseInt(carYear), issueText, obdCode, imageFile, videoFile });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Car Selection */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          Select Your Vehicle
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Brand *</label>
            <select
              className="input-field"
              value={carBrand}
              onChange={e => { setCarBrand(e.target.value); setCarModel(''); }}
              required
            >
              <option value="">Select Brand</option>
              {Object.keys(CAR_DATA).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Model *</label>
            <select
              className="input-field"
              value={carModel}
              onChange={e => setCarModel(e.target.value)}
              disabled={!carBrand}
              required
            >
              <option value="">Select Model</option>
              {carBrand && CAR_DATA[carBrand]?.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Year *</label>
            <select
              className="input-field"
              value={carYear}
              onChange={e => setCarYear(e.target.value)}
              required
            >
              <option value="">Select Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Issue Description */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
          Describe the Issue
        </h2>
        <div className="relative">
          <textarea
            id="issue-textarea"
            className="input-field min-h-[120px] resize-none pr-14"
            placeholder="Describe what's happening in plain English... e.g. 'Car won't start, clicking sound when turning key, dashboard battery light is on'"
            value={issueText}
            onChange={e => setIssueText(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={toggleSpeechToText}
            className={`absolute right-3 top-3 p-3 rounded-xl transition-all ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-slate-700 text-slate-300 hover:bg-blue-600 hover:text-white'
            }`}
            title="Click to speak your issue"
          >
            {isRecording ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
          </button>
        </div>
        {isRecording && (
          <p className="text-red-400 text-sm mt-2 animate-pulse">🔴 Listening... Tap mic again to stop</p>
        )}

        {/* OBD-II Fault Code (Optional) */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="text-blue-400 font-bold">⚡</span> OBD-II Diagnostic Fault Code
            </span>
            <span className="text-slate-500 font-normal lowercase">(optional DTC code from scan tool)</span>
          </label>
          <div className="flex gap-2 mb-2.5">
            <input
              type="text"
              className="input-field py-2 px-3 text-sm font-mono tracking-wider uppercase"
              placeholder="e.g. P0300, P0420, P0171, P0455..."
              value={obdCode}
              onChange={e => setObdCode(e.target.value.toUpperCase())}
            />
            {obdCode && (
              <button
                type="button"
                onClick={() => setObdCode('')}
                className="px-3 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1">Common DTCs:</span>
            {[
              { code: 'P0300', desc: 'Random Misfire' },
              { code: 'P0420', desc: 'Catalyst Efficiency' },
              { code: 'P0171', desc: 'System Too Lean' },
              { code: 'P0455', desc: 'EVAP Large Leak' },
              { code: 'P0128', desc: 'Coolant Thermostat' }
            ].map(item => (
              <button
                key={item.code}
                type="button"
                onClick={() => setObdCode(item.code)}
                title={item.desc}
                className={`text-xs px-2.5 py-1 rounded-md font-mono transition-all ${
                  obdCode === item.code
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/70'
                }`}
              >
                {item.code} <span className="text-[10px] text-slate-400">({item.desc})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Media Upload */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
          Upload Evidence <span className="text-slate-400 text-sm font-normal">(Optional but recommended)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Upload */}
          <div>
            {!imageFile ? (
              <div
                {...getImageRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                  ${isImageDrag ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'}`}
              >
                <input {...getImageInputProps()} />
                <FaImage className="mx-auto text-3xl text-slate-500 mb-2" />
                <p className="text-slate-400 text-sm">Drop a photo or click to upload</p>
                <p className="text-slate-500 text-xs mt-1">Dashboard lights, engine bay, fault display</p>
              </div>
            ) : (
              <div className="border border-green-500/30 bg-green-500/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaImage className="text-green-400" />
                  <div>
                    <p className="text-sm text-white truncate max-w-[150px]">{imageFile.name}</p>
                    <p className="text-xs text-slate-400">{(imageFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button type="button" onClick={() => setImageFile(null)} className="text-slate-400 hover:text-red-400">
                  <FaTimes />
                </button>
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div>
            {!videoFile ? (
              <div
                {...getVideoRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                  ${isVideoDrag ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'}`}
              >
                <input {...getVideoInputProps()} />
                <FaVideo className="mx-auto text-3xl text-slate-500 mb-2" />
                <p className="text-slate-400 text-sm">Drop a video or click to upload</p>
                <p className="text-slate-500 text-xs mt-1">Film the fault happening live (max 100MB)</p>
              </div>
            ) : (
              <div className="border border-green-500/30 bg-green-500/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaVideo className="text-green-400" />
                  <div>
                    <p className="text-sm text-white truncate max-w-[150px]">{videoFile.name}</p>
                    <p className="text-xs text-slate-400">{(videoFile.size / (1024*1024)).toFixed(1)} MB</p>
                  </div>
                </div>
                <button type="button" onClick={() => setVideoFile(null)} className="text-slate-400 hover:text-red-400">
                  <FaTimes />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" className="btn-primary w-full py-4 text-base" disabled={loading}>
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            AI is analyzing your vehicle...
          </>
        ) : (
          <>
            <MdUpload size={20} />
            Run AI Diagnosis
          </>
        )}
      </button>
    </form>
  );
}
