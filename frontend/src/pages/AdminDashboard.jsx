import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const fetchPendingCompanies = async () => {
    try {
      const res = await api.get('/auth/admin/pending-companies');
      setPendingCompanies(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch companies');
      setLoading(false);
    }
  };

  const verifyCompany = async (companyId) => {
    try {
      setError('');
      setMessage('');
      await api.post('/auth/admin/verify-company', { companyId });
      setMessage('Company verified successfully');
      setPendingCompanies(pendingCompanies.filter(c => c._id !== companyId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify company');
    }
  };

  const rejectCompany = async (companyId) => {
    try {
      setError('');
      setMessage('');
      await api.delete('/auth/admin/reject-company', { data: { companyId } });
      setMessage('Company rejected successfully');
      setPendingCompanies(pendingCompanies.filter(c => c._id !== companyId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject company');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Admin Dashboard</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-full mb-6 shadow-sm">{error}</div>}
      {message && <div className="bg-green-50 text-green-700 p-3 rounded-full mb-6 shadow-sm">{message}</div>}

      <div className="bg-white rounded-[2rem] shadow border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-4">Pending Company Approvals ({pendingCompanies.length})</h2>
        {pendingCompanies.length === 0 ? (
          <p className="text-gray-500">No pending companies at the moment.</p>
        ) : (
          <div className="space-y-4">
            {pendingCompanies.map(company => (
              <div key={company._id} className="flex justify-between items-center bg-gray-50 p-4 rounded-full border border-gray-100">
                <div>
                  <h3 className="font-bold text-lg">{company.name}</h3>
                  <p className="text-gray-600 font-medium">{company.email}</p>
                  <p className="text-xs text-gray-400 mt-1">ID: {company._id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => verifyCompany(company._id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectCompany(company._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-full font-bold hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
