import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaCar, FaArrowRight } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default function History() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/diagnose/history`)
      .then(res => setDiagnoses(res.data.diagnoses || []))
      .catch(() => setDiagnoses([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Diagnosis History</h1>
      {diagnoses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FaCar className="text-5xl text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No diagnoses yet.</p>
          <Link to="/" className="btn-primary mt-4 inline-flex">Run Your First Diagnosis</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {diagnoses.map((d, i) => (
            <Link
              key={i}
              to={`/report/${d.session_id}`}
              className="glass-card p-5 flex items-center justify-between hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <FaCar className="text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    {d.car_info?.year} {d.car_info?.brand} {d.car_info?.model}
                  </p>
                  <p className="text-slate-400 text-sm truncate max-w-[400px]">
                    {d.issue_description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-xs">{new Date(d.created_at).toLocaleDateString()}</span>
                <FaArrowRight className="text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
