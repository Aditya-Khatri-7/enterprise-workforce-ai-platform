import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DemoContext } from '../context/DemoContext';
import { AuthContext } from '../context/AuthContext';
import { Star, Award, Edit3 } from 'lucide-react';

const TeamLeadRatings = () => {
  const { isDemoMode } = useContext(DemoContext);
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const tlRef = user?.employeeRef?._id || user?.employeeRef;
      const res = await api.get('/employees');
      const allEmps = res.data || [];
      const myTeam = allEmps.filter(e => e.reportingManager === tlRef || e.reportingManager?._id === tlRef);
      setEmployees(myTeam);
    } catch (err) {
      toast.error('Failed to load team list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setEmployees([
        { _id: 'emp1', firstName: 'Riya', lastName: 'Sharma', employeeId: 'EMP101', designation: 'Developer', ratings: { teamLeadRating: 4.5, managerRating: 4.2 } },
        { _id: 'emp2', firstName: 'Karan', lastName: 'Patel', employeeId: 'EMP102', designation: 'Developer', ratings: { teamLeadRating: 4.0, managerRating: 3.8 } },
        { _id: 'emp3', firstName: 'Priya', lastName: 'Singh', employeeId: 'EMP103', designation: 'Developer', ratings: { teamLeadRating: 0, managerRating: 0 } }
      ]);
      setLoading(false);
    } else {
      loadTeam();
    }
  }, [isDemoMode]);

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSubmitting(true);
    try {
      if (isDemoMode) {
        setEmployees(prev => prev.map(emp => 
          emp._id === selectedEmp._id 
            ? { ...emp, ratings: { ...emp.ratings, teamLeadRating: ratingVal } } 
            : emp
        ));
        toast.success('Rating updated successfully (Demo Mode)!');
      } else {
        await api.put(`/employees/${selectedEmp._id}/rate`, { teamLeadRating: ratingVal });
        toast.success('Rating submitted successfully!');
        loadTeam();
      }
      setSelectedEmp(prev => ({
        ...prev,
        ratings: { ...prev?.ratings, teamLeadRating: ratingVal }
      }));
    } catch (err) {
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-indigo-400">Loading Team List...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-[#8B5CF6]/10 via-[#151A30]/5 to-indigo-500/5 dark:from-[#201025] dark:to-slate-900 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Team Performance Reviews 🏆</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Appraise daily execution, leadership contributions, and sprint metrics. Ratings combine with manager reviews for cumulative grading.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employees.map(emp => {
              const tlRating = emp.ratings?.teamLeadRating || 0;
              const mRating = emp.ratings?.managerRating || 0;
              const cumulative = tlRating && mRating ? (tlRating + mRating) / 2 : (tlRating || mRating || 0);

              return (
                <div
                  key={emp._id}
                  onClick={() => setSelectedEmp(emp)}
                  className={`glass-card border cursor-pointer p-5 rounded-2xl transition-all ${selectedEmp?._id === emp._id ? 'border-purple-400 bg-purple-500/5' : 'border-indigo-500/10 hover:border-purple-500/20'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-905 dark:text-white text-xs">{emp.firstName} {emp.lastName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{emp.employeeId} · {emp.designation}</p>
                    </div>
                    <span className="p-1.5 rounded-lg bg-slate-850"><Award className="h-3.5 w-3.5 text-purple-400" /></span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-1 text-[9px] font-semibold text-slate-400 border-t border-slate-100 dark:border-indigo-500/10 pt-3">
                    <div>
                      <p className="text-[7px] uppercase font-bold text-slate-500">Your Rating</p>
                      <p className="text-slate-800 dark:text-white text-xs mt-0.5">{tlRating ? `${tlRating.toFixed(1)} ★` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] uppercase font-bold text-slate-500">Manager</p>
                      <p className="text-slate-800 dark:text-white text-xs mt-0.5">{mRating ? `${mRating.toFixed(1)} ★` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] uppercase font-bold text-slate-500">Cumulative</p>
                      <p className="text-cyan-405 dark:text-cyan-400 text-xs mt-0.5 font-bold">{cumulative ? `${cumulative.toFixed(1)} ★` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card border border-indigo-500/10 rounded-2xl p-6 bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
            <h3 className="text-sm font-black uppercase tracking-wider text-purple-405 dark:text-purple-400">Rate Employee</h3>
            {selectedEmp ? (
              <form onSubmit={handleRateSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Team Lead Rating (1-5)</label>
                  <select
                    value={ratingVal}
                    onChange={e => setRatingVal(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-indigo-500/20 rounded-xl text-slate-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Performance Comments</label>
                  <textarea
                    rows={4}
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Enter review remarks..."
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-indigo-500/20 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-750 text-white cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Appraisal'}
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-455 italic mt-4">Select a team member to input performance ratings.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeadRatings;
