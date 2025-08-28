import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin, Package, User, Mail, Phone, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const bookingSchema = z.object({
  client_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  event_date: z.string().min(1, 'Event date is required'),
  time_slot: z.string().min(1, 'Time slot is required'),
  facility: z.string().min(1, 'Facility selection is required'),
  package: z.string().min(1, 'Package selection is required'),
  special_requests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const timeSlots = [
  '9:00 AM - 12:00 PM',
  '12:00 PM - 3:00 PM',
  '3:00 PM - 6:00 PM',
  '6:00 PM - 9:00 PM',
  '9:00 PM - 12:00 AM'
];

const facilities = [
  'Conference Hall A',
  'Conference Hall B',
  'Banquet Room',
  'Outdoor Pavilion',
  'Meeting Room 1',
  'Meeting Room 2'
];

const packages = [
  'Basic Package - $500',
  'Standard Package - $1,000',
  'Premium Package - $2,000',
  'Deluxe Package - $3,500',
  'Custom Package - Contact for pricing'
];

export function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([{
          ...data,
          status: 'inquiry',
          receipts_uploaded: false,
          receipts_approved: false,
        }]);

      if (error) throw error;

      toast.success('Booking inquiry submitted successfully!');
      reset();
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit booking inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      {/* Admin Login Link */}
      <div className="fixed top-4 right-4 z-10">
        <Link
          to="/admin-login"
          className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg shadow-md transition-all"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Admin Login
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Book Your Event</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Submit your booking inquiry and our team will get back to you within 24 hours
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 mr-2" />
                  Full Name
                </label>
                <input
                  {...register('client_name')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
                {errors.client_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.client_name.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register('phone_number')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your phone number"
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone_number.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Event Date
                </label>
                <input
                  type="date"
                  {...register('event_date')}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {errors.event_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.event_date.message}</p>
                )}
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  Time Slot
                </label>
                <select
                  {...register('time_slot')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select time slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                {errors.time_slot && (
                  <p className="text-red-500 text-sm mt-1">{errors.time_slot.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  Facility
                </label>
                <select
                  {...register('facility')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select facility</option>
                  {facilities.map((facility) => (
                    <option key={facility} value={facility}>{facility}</option>
                  ))}
                </select>
                {errors.facility && (
                  <p className="text-red-500 text-sm mt-1">{errors.facility.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 mr-2" />
                  Package
                </label>
                <select
                  {...register('package')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select package</option>
                  {packages.map((pkg) => (
                    <option key={pkg} value={pkg}>{pkg}</option>
                  ))}
                </select>
                {errors.package && (
                  <p className="text-red-500 text-sm mt-1">{errors.package.message}</p>
                )}
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                {...register('special_requests')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Any special requirements or requests for your event..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Booking Inquiry'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}