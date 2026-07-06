import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import api from '../services/api';
import { DemoContext } from '../context/DemoContext';
import { Users, Award, Shield, Star, Award as RatingIcon, Activity, Check } from 'lucide-react';

const ManagerTeamLeads = () => {
  const { isDemoMode } = useContext(DemoContext);
  const [teamLeads, setTeamLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTL, setSelectedTL] = useState(null);
  const [ratingData, setRatingData] = useState({ rating: 5, comments: '' });
  const [submittingRating, setSubmittingRating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, projRes] = await Promise.all([
        api.get('/employees').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] }))
      ]);

      const allEmps = empRes.data || [];
      setEmployees(allEmps);
      setProjects(projRes.data || []);

      // Filter team leads
      const tls = allEmps.filter(e => 
        e.designation?.toLowerCase().includes('lead') || 
        e.designation?.toLowerCase().includes('manager')
      );
      setTeamLeads(tls);
    } catch (err) {
      toast.error('Failed to load team leads data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setTeamLeads([
        { _id: 'tl1', firstName: 'Arjun', lastName: 'Mehta', employeeId: 'TL001', designation: 'Team Lead', department: 'Engineering', ratings: { teamLeadRating: 4.2, managerRating: 4.5 } },
        { _id: 'tl2', firstName: 'Sneha', lastName: 'Gupta', employeeId: 'TL002', designation: 'Team Lead', department: 'Engineering', ratings: { teamLeadRating: 3.8, managerRating: 4.0 } }
      ]);
      setEmployees([
        { _id: 'emp1', firstName: 'Riya', lastName: 'Sharma', reportingManager: 'tl1', department: 'Engineering', designation: 'Developer', ratings: { teamLeadRating: 4.5, managerRating: 4.8 } },
        { _id: 'emp2', firstName: 'Karan', lastName: 'Patel', reportingManager: 'tl1', department: 'Engineering', designation: 'Developer', ratings: { teamLeadRating: 4.0, managerRating: 4.2 } },
        { _id: 'emp3', firstName: 'Priya', lastName: 'Singh', reportingManager: 'tl1', department: 'Engineering', designation: 'Developer', ratings: { teamLeadRating: 3.5, managerRating: 3.9 } },
        { _id: 'emp4', firstName: 'Amit', lastName: 'Verma', reportingManager: 'tl2', department: 'Engineering', designation: 'Developer', ratings: { teamLeadRating: 4.2, managerRating: 4.4 } },
        { _id: 'emp5', firstName: 'Neha', lastName: 'Joshi', reportingManager: 'tl2', department: 'Engineering', designation: 'Developer', ratings: { teamLeadRating: 3.9, managerRating: 4.1 } }
      ]);
      setProjects([
        { _id: 'p1', name: 'Employee Portal v2', assignedTeamLead: 'tl1', status: 'Ongoing' },
        { _id: 'p2', name: 'Payroll Automation', assignedTeamLead: 'tl2', status: 'Ongoing' }
      ]);
      setLoading(false);
    } else {
      loadData();
    }
  }, [isDemoMode]);

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTL) return;
    setSubmittingRating(true);
    try {
      if (isDemoMode) {
        setTeamLeads(prev => prev.map(t => 
          t._id === selectedTL._id 
            ? { ...t, ratings: { ...t.ratings, managerRating: ratingData.rating } }
            : t
        ));
        toast.success('Rating submitted successfully (Demo Mode)!');
      } else {
        await api.put(`/employees/${selectedTL._id}/rate`, { managerRating: ratingData.rating });
        toast.success('Rating submitted successfully!');
        loadData();
      }
      setSelectedTL(prev => ({
        ...prev,
        ratings: { ...prev?.ratings, managerRating: ratingData.rating }
      }));
    } catch (err) {
      toast.error('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-cyan-400">Loading Team Leads Info...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-indigo-500/10 via-[#151A30]/5 to-cyan-500/5 dark:from-[#1A1F3D] dark:to-slate-900 border border-indigo-500/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Supervised Team Leads 👔</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Appraise and overlook engineering and operational team leads, coordinate assignments, and review team performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamLeads.map(tl => {
              const teamSize = employees.filter(e => e.reportingManager === tl._id || e.reportingManager?._id === tl._id).length;
              const tlProj = projects.filter(p => p.assignedTeamLead === tl._id || p.assignedTeamLead?._id === tl._id || p.assignedTeamLead?.employeeId === tl.employeeId);
              
              return (
                <motion.div
                  key={tl._id}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedTL(tl)}
                  className={`glass-card border cursor-pointer p-5 rounded-2xl transition-all ${selectedTL?._id === tl._id ? 'border-cyan-400 bg-indigo-500/10' : 'border-indigo-500/10 hover:border-cyan-500/30'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">{tl.firstName} {tl.lastName}</h4>
                      <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider">{tl.employeeId}</p>
                    </div>
                    <span className="p-2 rounded-xl bg-slate-800/50"><Users className="h-4 w-4 text-cyan-400" /></span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-indigo-500/10 pt-3">
                    <div>
                      <p className="uppercase text-[8px] font-bold text-slate-400">Team Size</p>
                      <p className="text-slate-850 dark:text-white text-xs mt-0.5">{teamSize} Members</p>
                    </div>
                    <div>
                      <p className="uppercase text-[8px] font-bold text-slate-400">Appraisal</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-slate-850 dark:text-white text-xs">
                          {tl.ratings?.managerRating ? tl.ratings.managerRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {selectedTL && (
            <div className="glass-card border border-indigo-500/10 rounded-2xl p-6 space-y-4 bg-white/40 dark:bg-[#151A30]/40">
              <h3 className="text-sm font-black uppercase text-cyan-400 tracking-wider">Team Led by {selectedTL.firstName}</h3>
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-bold">Team Members List</p>
                <div className="divide-y divide-slate-100 dark:divide-indigo-500/10">
                  {employees
                    .filter(e => e.reportingManager === selectedTL._id || e.reportingManager?._id === selectedTL._id)
                    .map(emp => (
                      <div key={emp._id} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[10px] text-slate-400">{emp.designation}</p>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                          <span>TL Rating: {emp.ratings?.teamLeadRating || 'N/A'}</span>
                          <span className="text-slate-400">|</span>
                          <span>Manager: {emp.ratings?.managerRating || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card border border-indigo-500/10 rounded-2xl p-6 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5">
            <h3 className="text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-cyan-400">Leader Performance Appraisal</h3>
            {selectedTL ? (
              <form onSubmit={handleRateSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Manager Rating (1-5)</label>
                  <select
                    value={ratingData.rating}
                    onChange={e => setRatingData({ ...ratingData, rating: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-indigo-500/20 rounded-xl text-slate-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Review Comments</label>
                  <textarea
                    rows={4}
                    value={ratingData.comments}
                    onChange={e => setRatingData({ ...ratingData, comments: e.target.value })}
                    placeholder="Enter appraisal summary..."
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-indigo-500/20 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Appraisal'}
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-450 italic mt-4">Select a Team Lead to assign manager rating.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerTeamLeads;
