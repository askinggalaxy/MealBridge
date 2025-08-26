'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Star, User } from 'lucide-react';
import { Database } from '@/lib/supabase/database.types';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReportDialog } from './report-dialog';

type Donation = Database['public']['Tables']['donations']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  categories: Database['public']['Tables']['categories']['Row'];
};

interface DonationCardProps {
  donation: Donation;
}

export function DonationCard({ donation }: DonationCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showReport, setShowReport] = useState(false);

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

  // Helper to format date/time for the pickup window, following the requested style:
  // Example: "AUG 25, 8:45 PM" (no year, no seconds, MONTH in uppercase)
  const formatPickupMoment = (iso: string): string => {
    const d = new Date(iso);
    // Month+day part (e.g., "AUG 25") uppercased for emphasis
    const dayPart = format(d, 'MMM d').toUpperCase();
    // Time part without seconds (e.g., "8:45 PM")
    const timePart = format(d, 'h:mm a');
    return `${dayPart}, ${timePart}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{donation.categories.icon}</span>
              <Badge variant="secondary" className="text-xs">
                {donation.categories.name}
              </Badge>
              <Badge className={`text-xs ${getExpiryColor(donation.expiry_date)}`}>
                Expires {formatDistanceToNow(new Date(donation.expiry_date), { addSuffix: true })}
              </Badge>
              {/* Status badge for list cards: Reserved/Donated */}
              {donation.status !== 'available' && (
                <Badge
                  className={`text-xs ${
                    donation.status === 'reserved'
                      ? 'bg-yellow-100 text-yellow-800'
                      : donation.status === 'picked_up'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {donation.status === 'reserved' && 'Delivery'}
                  {donation.status === 'picked_up' && 'Donated'}
                  {donation.status !== 'reserved' && donation.status !== 'picked_up' && donation.status}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-1">{donation.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{donation.description}</p>
          </div>
          
          {donation.images.length > 0 && !imageError && (
            <div className="ml-4 flex-shrink-0">
              <img
                src={donation.images[0]}
                alt={donation.title}
                // Larger thumbnails for better visual impact in 2-col grid
                className="w-20 h-20 md:w-28 md:h-28 object-cover rounded-md"
                onError={() => setImageError(true)}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Avatar className="h-6 w-6">
              {donation.profiles.avatar_url && (
                <AvatarImage src={donation.profiles.avatar_url} alt={donation.profiles.display_name} />
              )}
              <AvatarFallback className="text-xs">
                {donation.profiles.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link href={`/users/${donation.profiles.id}`} className="hover:underline">
              {donation.profiles.display_name}
            </Link>
            {donation.profiles.reputation_count > 0 && (
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs">
                  {donation.profiles.reputation_score.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="truncate">
              {donation.address_text && donation.address_text.trim().length > 0
                ? donation.address_text
                : `${Number(donation.location_lat).toFixed(4)}, ${Number(donation.location_lng).toFixed(4)}`}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Qty: {donation.quantity}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            {/* Show condition-specific icon (match detail page): box for sealed, folder for opened */}
            <span>{donation.condition === 'sealed' ? '📦' : '📂'} {donation.condition}</span>
          </div>
        </div>

        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              <strong>Pickup:</strong>{' '}
              {formatPickupMoment(donation.pickup_window_start)}{' '}-
              {' '}{formatPickupMoment(donation.pickup_window_end)}
            </span>
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-3 flex items-center gap-2">
        <div className="flex-1">
          {donation.status === 'available' ? (
            <Link href={`/donations/${donation.id}`} className="w-full block">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                View Details & Reserve
              </Button>
            </Link>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              {donation.status === 'reserved' ? 'Reserved - Delivery in progress' : 'Donated'}
            </Button>
          )}
        </div>
        {/* Lightweight Report entry point. Auth is enforced in ReportDialog */}
        <Button variant="outline" size="sm" onClick={() => setShowReport(true)}>Report</Button>
        {showReport && (
          <ReportDialog donationId={donation.id} onClose={() => setShowReport(false)} />
        )}
      </CardFooter>
    </Card>
  );
}