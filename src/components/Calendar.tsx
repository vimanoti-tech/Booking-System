import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CalendarProps {
  view: 'inquiry' | 'confirmed' | 'cleared';
}

export function Calendar({ view }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, [view, currentDate, user]);

  const fetchBookings = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          assigned_admin:profiles(name, admin_color)
        `)
        .eq('status', view);

      // Filter by admin for regular admins
      if (user?.role === 'admin') {
        query = query.eq('assigned_admin_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getBookingsForDay = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.event_date), date)
    );
  };

  const getStatusColor = (status: string, adminColor?: string) => {
    switch (status) {
      case 'inquiry':
        return adminColor || '#6B7280';
      case 'confirmed':
        return adminColor || '#10B981';
      case 'cleared':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 capitalize">
          {view} Calendar - {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map(day => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-24 p-2 border border-gray-200 rounded-lg
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isSameDay(day, new Date()) ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="text-xs p-1 rounded text-white truncate"
                    style={{
                      backgroundColor: getStatusColor(
                        booking.status, 
                        (booking as any).assigned_admin?.admin_color
                      )
                    }}
                    title={`${booking.client_name} - ${booking.time_slot}`}
                  >
                    {booking.client_name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}