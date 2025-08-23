'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Star, User, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';
import { ReservationDialog } from './reservation-dialog';
import { ChatDialog } from './chat-dialog';
import { formatDistanceToNow } from 'date-fns';

type Donation = Database['public']['Tables']['donations']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  categories: Database['public']['Tables']['categories']['Row'];
};

interface DonationDetailsProps {
  donation: Donation;
}

export function DonationDetails({ donation }: DonationDetailsProps) {
  const [user, setUser] = useState<any>(null);
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    getUser();
    checkExistingReservation();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const checkExistingReservation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('donation_id', donation.id)
      .eq('recipient_id', user.id)
      .single();

    setReservation(data);
  };

  const getExpiryColor = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'bg-red-100 text-red-800';
    if (days <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStorageIcon = (storageType: string) => {
    switch (storageType) {
      case 'refrigerated': return '❄️';
      case 'frozen': return '🧊';
      default: return '🌡️';
    }
  };

  const canReserve = user && user.id !== donation.donor_id && !reservation && donation.status === 'available';
  const isOwner = user && user.id === donation.donor_id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{donation.categories.icon}</span>
                    <Badge variant="secondary">
                      {donation.categories.name}
                    </Badge>
                    <Badge className={getExpiryColor(donation.expiry_date)}>
                      Expires {formatDistanceToNow(new Date(donation.expiry_date), { addSuffix: true })}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">{donation.title}</CardTitle>
                </div>
                
                <Badge
                  variant="secondary"
                  className={
                    donation.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : donation.status === 'reserved'
                      ? 'bg-yellow-100 text-yellow-800'
                      : donation.status === 'picked_up'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {donation.status === 'available' && 'Available'}
                  {donation.status === 'reserved' && 'Delivery'}
                  {donation.status === 'picked_up' && 'Donated'}
                  {donation.status !== 'available' && donation.status !== 'reserved' && donation.status !== 'picked_up' && (
                    donation.status.charAt(0).toUpperCase() + donation.status.slice(1)
                  )}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Images */}
              {donation.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {donation.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${donation.title} - Image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{donation.description}</p>
              </div>

              {/* Details */}
              <div>
                <h3 className="font-semibold mb-3">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Quantity: {donation.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getStorageIcon(donation.storage_type)} {donation.storage_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {donation.condition === 'sealed' ? '📦 Sealed' : '📂 Opened'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pickup Window */}
              <div>
                <h3 className="font-semibold mb-3">Pickup Window</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Available for pickup:</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>From:</strong> {new Date(donation.pickup_window_start).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Until:</strong> {new Date(donation.pickup_window_end).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold mb-3">Pickup Location</h3>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <span className="text-sm text-gray-700">{donation.address_text}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Donor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shared by</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/users/${donation.profiles.id}`} className="flex items-center gap-3 mb-4 hover:underline">
                <Avatar>
                  <AvatarFallback>
                    {donation.profiles.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{donation.profiles.display_name}</p>
                  {donation.profiles.reputation_count > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-gray-600">
                        {donation.profiles.reputation_score.toFixed(1)} ({donation.profiles.reputation_count} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              
              {donation.profiles.neighborhood && (
                <p className="text-sm text-gray-600 mb-4">
                  📍 {donation.profiles.neighborhood}
                </p>
              )}

              <div className="space-y-2">
                {canReserve && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setShowReservationDialog(true)}
                  >
                    Reserve This Food
                  </Button>
                )}

                {reservation && (
                  <div className="space-y-2">
                    <Badge className="w-full justify-center py-2">
                      {reservation.status === 'pending' && 'Reservation Pending'}
                      {reservation.status === 'accepted' && 'Reservation Accepted'}
                      {reservation.status === 'declined' && 'Reservation Declined'}
                    </Badge>
                    
                    {(reservation.status === 'accepted' || isOwner) && (
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowChatDialog(true)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    )}
                  </div>
                )}

                {isOwner && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowChatDialog(true)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    View Messages
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Safety Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Safety Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Inspect food before pickup</li>
                <li>• Check expiry dates carefully</li>
                <li>• Ask about storage conditions</li>
                <li>• Trust your judgment</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {showReservationDialog && (
        <ReservationDialog
          donation={donation}
          onClose={() => setShowReservationDialog(false)}
          onSuccess={() => {
            setShowReservationDialog(false);
            checkExistingReservation();
          }}
        />
      )}

      {showChatDialog && (
        <ChatDialog
          donation={donation}
          onClose={() => setShowChatDialog(false)}
        />
      )}
    </div>
  );
}