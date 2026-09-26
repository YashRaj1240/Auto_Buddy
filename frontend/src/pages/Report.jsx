import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import DiagnosisReport from '../components/DiagnosisReport';
import { FaArrowLeft } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default function Report() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/diagnose/${sessionId}`)
      .then(res => setData({
        session_id: sessionId,
        car_info: res.data.car_info,
        issue: res.data.issue_description,
        diagnosis: res.data.diagnosis
      }))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Report not found.</p>
      <Link to="/" className="btn-primary mt-4 inline-flex">Go Home</Link>
    </div>
  );

  return (
    <div>
      <Link to="/" className="btn-secondary mb-6 inline-flex">
        <FaArrowLeft size={14} /> Back to Diagnose
      </Link>
      <DiagnosisReport data={data} />
    </div>
  );
}
