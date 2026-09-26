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
  const startSpeechToText = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. Use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript).join('');
      setIssueText(transcript);
    };
    recognition.start();
    toast.success('Speak your issue now...');

    setTimeout(() => { recognition.stop(); }, 15000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!carBrand || !carModel || !carYear || !issueText.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    onSubmit({ carBrand, carModel, carYear: parseInt(carYear), issueText, imageFile, videoFile });
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
            className="input-field min-h-[120px] resize-none pr-14"
            placeholder="Describe what's happening in plain English... e.g. 'Car won't start, clicking sound when turning key, dashboard battery light is on'"
            value={issueText}
            onChange={e => setIssueText(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={startSpeechToText}
            className={`absolute right-3 top-3 p-3 rounded-xl transition-all ${
              isRecording
                ? 'bg-red-500 text-white pulse-blue'
                : 'bg-slate-700 text-slate-300 hover:bg-blue-600 hover:text-white'
            }`}
            title="Click to speak your issue"
          >
            {isRecording ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
          </button>
        </div>
        {isRecording && (
          <p className="text-red-400 text-sm mt-2 animate-pulse">🔴 Listening... speak now (auto-stops in 15s)</p>
        )}
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
