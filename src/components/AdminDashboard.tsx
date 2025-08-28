import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, DollarSign, FileText } from 'lucide-react';
import { Booking } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarComponent } from './Calendar';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'inquiry' | 'confirmed' | 'cleared'>('inquiry');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, [activeTab, user]);

  const fetchBookings = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('status', activeTab);

      // Filter by admin for regular admins
      if (user?.role === 'admin') {
        query = query.eq('assigned_admin_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'cleared') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus} successfully!`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
    }
  };

  const uploadReceipts = async (bookingId: string, totalSpend: number) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          receipts_uploaded: true,
          total_spend: totalSpend,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Receipts uploaded successfully!');
      fetchBookings();
    } catch (error) {
      console.error('Error uploading receipts:', error);
      toast.error('Failed to upload receipts');
    }
  };

  const tabs = [
    { key: 'inquiry' as const, label: 'Inquiries', icon: Clock, color: 'text-orange-600' },
    { key: 'confirmed' as const, label: 'Confirmed', icon: CheckCircle, color: 'text-green-600' },
    { key: 'cleared' as const, label: 'Cleared', icon: DollarSign, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage bookings and track event progress</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center px-6 py-3 rounded-lg font-medium transition-all
                  ${activeTab === tab.key 
                    ? 'bg-white shadow-md text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mr-2 ${activeTab === tab.key ? tab.color : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Calendar View */}
          <div>
            <CalendarComponent view={activeTab} />
          </div>

          {/* Booking List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 capitalize">
              {activeTab} Bookings
            </h2>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bookings.map(booking => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.client_name}</h3>
                        <p className="text-sm text-gray-600">{booking.email}</p>
                      </div>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${booking.status === 'inquiry' ? 'bg-orange-100 text-orange-800' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'}
                      `}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div>Date: {new Date(booking.event_date).toLocaleDateString()}</div>
                      <div>Time: {booking.time_slot}</div>
                      <div>Facility: {booking.facility}</div>
                      <div>Package: {booking.package}</div>
                    </div>

                    {booking.special_requests && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Special Requests:</span> {booking.special_requests}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {booking.status === 'inquiry' && user?.role !== 'client' && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Confirm Booking
                        </button>
                      )}

                      {booking.status === 'confirmed' && user?.role !== 'client' && (
                        <>
                          <button
                            onClick={() => {
                              const totalSpend = prompt('Enter total spend amount:');
                              if (totalSpend) {
                                uploadReceipts(booking.id, parseFloat(totalSpend));
                              }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Upload Receipts
                          </button>
                          
                          {user.role === 'super_admin' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'cleared')}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                              Clear Event
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {bookings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No {activeTab} bookings found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}