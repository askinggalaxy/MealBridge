'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function DonationFilters() {
  const [distance, setDistance] = useState([5]);
  const [category, setCategory] = useState('all');
  const [sealedOnly, setSealedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  return (
    <div className="space-y-6">
      {/* Distance Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Distance: {distance[0]}km
        </Label>
        <Slider
          value={distance}
          onValueChange={setDistance}
          max={25}
          min={1}
          step={1}
          className="w-full"
        />
      </div>

      {/* Category Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="bread">🍞 Bread</SelectItem>
            <SelectItem value="dairy">🥛 Dairy</SelectItem>
            <SelectItem value="produce">🥬 Produce</SelectItem>
            <SelectItem value="canned">🥫 Canned</SelectItem>
            <SelectItem value="cooked">🍽️ Cooked</SelectItem>
            <SelectItem value="baby_food">🍼 Baby Food</SelectItem>
            <SelectItem value="beverages">🥤 Beverages</SelectItem>
            <SelectItem value="desserts">🍰 Desserts</SelectItem>
            <SelectItem value="other">🍱 Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Sort By</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="expiry">Expiring Soon</SelectItem>
            <SelectItem value="distance">Closest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sealed Only Filter */}
      <div className="flex items-center space-x-2">
        <Switch
          id="sealed-only"
          checked={sealedOnly}
          onCheckedChange={setSealedOnly}
        />
        <Label htmlFor="sealed-only" className="text-sm">
          Sealed items only
        </Label>
      </div>

      <Button className="w-full" onClick={() => {
        // Apply filters - this would trigger a re-fetch with filters
        console.log('Applying filters:', { distance: distance[0], category, sealedOnly, sortBy });
      }}>
        Apply Filters
      </Button>
    </div>
  );
}