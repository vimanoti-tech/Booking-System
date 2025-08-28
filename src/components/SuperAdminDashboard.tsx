import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, TrendingUp, DollarSign, FileCheck } from 'lucide-react';
import { Booking, Admin } from '../types';
import { supabase } from '../lib/supabase';
import { AdminDashboard } from './AdminDashboard';

interface AdminStats {
  admin_id: string;
  admin_name: string;
  admin_color: string;
  inquiries_assigned: number;
  confirmed_bookings: number;
  conversion_rate: number;
  avg_response_time: number;
}

export function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'manage'>('overview');
  const [adminStats, setAdminStats] = useState<AdminStats[]>([]);
  const [unassignedInquiries, setUnassignedInquiries] = useState<Booking[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch admin stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_admin_conversion_stats');

      if (statsError) throw statsError;

      // Fetch unassigned inquiries
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'inquiry')
        .is('assigned_admin_id', null);

      if (inquiriesError) throw inquiriesError;

      // Fetch all admins
      const { data: adminsData, error: adminsError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'super_admin']);

      if (adminsError) throw adminsError;

      setAdminStats(statsData || []);
      setUnassignedInquiries(inquiriesData || []);
      setAdmins(adminsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignInquiry = async (inquiryId: string, adminId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ assigned_admin_id: adminId, updated_at: new Date().toISOString() })
        .eq('id', inquiryId);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error assigning inquiry:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
          <p className="text-gray-600">Oversee operations and track performance metrics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`
              flex items-center px-6 py-3 rounded-lg font-medium transition-all
              ${activeTab === 'overview' 
                ? 'bg-white shadow-md text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }
            `}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`
              flex items-center px-6 py-3 rounded-lg font-medium transition-all
              ${activeTab === 'manage' 
                ? 'bg-white shadow-md text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }
            `}
          >
            <Users className="w-5 h-5 mr-2" />
            Manage Bookings
          </button>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Admins"
                value={admins.filter(a => a.role === 'admin').length}
                icon={Users}
                color="bg-blue-500"
              />
              <StatCard
                title="Unassigned Inquiries"
                value={unassignedInquiries.length}
                icon={Calendar}
                color="bg-orange-500"
              />
              <StatCard
                title="Average Conversion Rate"
                value={`${adminStats.reduce((sum, stat) => sum + stat.conversion_rate, 0) / (adminStats.length || 1)}%`}
                icon={TrendingUp}
                color="bg-green-500"
              />
              <StatCard
                title="Total Revenue"
                value="$45,230"
                icon={DollarSign}
                color="bg-purple-500"
              />
            </div>

            {/* Admin Performance Table */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Admin</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Inquiries Assigned</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Confirmed</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Conversion Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Avg Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminStats.map(stat => (
                      <tr key={stat.admin_id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: stat.admin_color }}
                            ></div>
                            {stat.admin_name}
                          </div>
                        </td>
                        <td className="py-3 px-4">{stat.inquiries_assigned}</td>
                        <td className="py-3 px-4">{stat.confirmed_bookings}</td>
                        <td className="py-3 px-4">
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${stat.conversion_rate >= 75 ? 'bg-green-100 text-green-800' :
                              stat.conversion_rate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'}
                          `}>
                            {stat.conversion_rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4">{stat.avg_response_time}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Unassigned Inquiries */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Unassigned Inquiries</h2>
              <div className="space-y-4">
                {unassignedInquiries.map(inquiry => (
                  <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{inquiry.client_name}</h3>
                        <p className="text-sm text-gray-600">{inquiry.email}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(inquiry.event_date).toLocaleDateString()} - {inquiry.time_slot}
                        </p>
                      </div>
                      <select
                        onChange={(e) => assignInquiry(inquiry.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        defaultValue=""
                      >
                        <option value="" disabled>Assign to Admin</option>
                        {admins.filter(admin => admin.role === 'admin').map(admin => (
                          <option key={admin.id} value={admin.id}>
                            {admin.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {unassignedInquiries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No unassigned inquiries
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <AdminDashboard />
        )}
      </div>
    </div>
  );
}