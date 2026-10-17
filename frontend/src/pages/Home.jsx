import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DiagnoseForm from '../components/DiagnoseForm';
import DiagnosisReport from '../components/DiagnosisReport';
import { FaWrench, FaRobot, FaVideo } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default function Home({ language = 'en' }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async ({ carBrand, carModel, carYear, issueText, obdCode, imageFile, videoFile }) => {
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('car_brand', carBrand);
      formData.append('car_model', carModel);
      formData.append('car_year', carYear);
      formData.append('issue_description', issueText);
      formData.append('language', language);
      if (obdCode) formData.append('obd_code', obdCode);
      if (imageFile) formData.append('image', imageFile);
      if (videoFile) formData.append('video', videoFile);

      const response = await axios.post(`${API_BASE}/diagnose/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });

      setResult(response.data);
      toast.success(language === 'hi' ? 'जांच पूरी हो गई!' : 'Diagnosis complete!');

      setTimeout(() => {
        document.getElementById('report-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      const msg = err.response?.data?.detail || (language === 'hi' ? 'जांच में त्रुटि हुई। कृपया पुनः प्रयास करें।' : 'Diagnosis failed. Check your API key and try again.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30
                        text-blue-400 text-sm px-4 py-2 rounded-full mb-4">
          <FaRobot size={14} />
          Powered by Gemini 3.8 Flash · Google Cloud
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          {language === 'hi' ? 'आपका स्मार्ट गैरेज' : 'Your AI Workshop'}<br />
          <span className="text-blue-400">{language === 'hi' ? 'को-पायलट' : 'Co-Pilot'}</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          {language === 'hi'
            ? 'अपनी गाड़ी चुनें, परेशानी बोलकर या लिखकर बताएं — सेकंडों में पाएं रूट कॉज़ एनालिसिस और रिपेयर के स्टेप्स।'
            : 'Select your vehicle, describe or film the issue — get instant root cause analysis and step-by-step fix instructions right in the workshop.'}
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {[
            { icon: <FaWrench size={12} />, text: language === 'hi' ? 'रूट कॉज़ एनालिसिस' : 'Root Cause Analysis' },
            { icon: <FaVideo size={12} />, text: language === 'hi' ? 'वीडियो डायग्नोसिस' : 'Video Analysis' },
            { icon: <FaRobot size={12} />, text: language === 'hi' ? 'एआई को-पायलट' : 'AI-Powered Diagnosis' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50
                                    px-3 py-1.5 rounded-full text-slate-300 text-sm">
              <span className="text-blue-400">{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <DiagnoseForm onSubmit={handleSubmit} loading={loading} language={language} />

      {/* Report */}
      {result && (
        <div id="report-section">
          <DiagnosisReport data={result} language={language} />
        </div>
      )}
    </div>
  );
}
