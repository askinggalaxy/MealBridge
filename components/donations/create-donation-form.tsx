'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { Database } from '@/lib/supabase/database.types';
import LocationPicker, { LatLng } from '@/components/donations/location-picker';

// NOTE: We prefer explicit typing and numeric lat/lng to avoid ambiguity.
// We keep address_text for human-readable address, but location_lat/lng are used for precise map positioning and distance calc.
const donationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category_id: z.string().min(1, 'Please select a category'),
  quantity: z.string().min(1, 'Please specify quantity'),
  expiry_date: z.string().min(1, 'Please set expiry date'),
  pickup_window_start: z.string().min(1, 'Please set pickup start time'),
  pickup_window_end: z.string().min(1, 'Please set pickup end time'),
  condition: z.enum(['sealed', 'open']),
  storage_type: z.enum(['ambient', 'refrigerated', 'frozen']),
  address_text: z.string().min(5, 'Please provide a pickup address'),
  // Explicit numeric latitude/longitude, required to ensure precise pickup location is saved.
  // In Zod v4, pass no options to number(); enforce bounds with chained validators.
  location_lat: z
    .number()
    .min(-90, { message: 'Latitude must be >= -90' })
    .max(90, { message: 'Latitude must be <= 90' }),
  location_lng: z
    .number()
    .min(-180, { message: 'Longitude must be >= -180' })
    .max(180, { message: 'Longitude must be <= 180' }),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms'),
});

type DonationFormData = z.infer<typeof donationSchema>;

type Category = Database['public']['Tables']['categories']['Row'];

export function CreateDonationForm() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      condition: 'sealed',
      storage_type: 'ambient',
      // We do not set defaults for lat/lng; these must be chosen by the user (or set via geocoding)
      // location_lat/location_lng will be populated when the user picks a point on the map.
      terms_accepted: false,
    },
  });

  // Reverse geocoder: translate lat/lng -> human-readable address (no mocking; uses OSM Nominatim)
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      // Nominatim returns display_name for a nice, readable address
      if (data && typeof data.display_name === 'string' && data.display_name.length > 0) {
        return data.display_name as string;
      }
    } catch (e) {
      console.error('Reverse geocoding failed:', e);
    }
    return null;
  };

  // Subscribe to RHF value changes so when user picks a point on the map, we auto-populate the address text box.
  useEffect(() => {
    const subscription = form.watch(async (_values, info) => {
      if (!info || !info.name) return;
      if (info.name !== 'location_lat' && info.name !== 'location_lng') return;

      const lat = form.getValues('location_lat');
      const lng = form.getValues('location_lng');
      if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) return;

      console.log('[CreateDonationForm] watched lat/lng changed', { lat, lng });
      const currentAddress = form.getValues('address_text');
      // Always update the visible address from the map selection, per request.
      console.log('[CreateDonationForm] reverse geocoding for', { lat, lng });
      const addr = await reverseGeocode(lat, lng);
      console.log('[CreateDonationForm] reverse geocode result', addr);
      if (addr) {
        form.setValue('address_text', addr, { shouldDirty: true, shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
    } else {
      setCategories(data);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('donation-images')
          .upload(fileName, image);

        if (error) {
          throw error;
        }

        const { data: urlData } = supabase.storage
          .from('donation-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      return [];
    } finally {
      setUploading(false);
    }

    return uploadedUrls;
  };

  // Real geocoding using OpenStreetMap Nominatim (no mocking). This can be used to pre-position the map
  // based on the text address, but final coordinates should come from the user's explicit map selection when possible.
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Using OpenStreetMap Nominatim for geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const onSubmit = async (data: DonationFormData) => {
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a donation');
        return;
      }

      // Upload images
      const imageUrls = await uploadImages();

      // We require precise coordinates. If the user somehow bypassed map selection, we try to geocode once.
      // However, the form schema already enforces lat/lng presence; this is a safety net.
      let finalCoords: { lat: number; lng: number } = { lat: data.location_lat, lng: data.location_lng };
      if (
        (typeof finalCoords.lat !== 'number' || Number.isNaN(finalCoords.lat)) ||
        (typeof finalCoords.lng !== 'number' || Number.isNaN(finalCoords.lng))
      ) {
        const coordinates = await geocodeAddress(data.address_text);
        if (!coordinates) {
          toast.error('Could not determine coordinates. Please select location on the map.');
          return;
        }
        finalCoords = coordinates;
      }

      // Create donation
      const donationData = {
        ...data,
        donor_id: user.id,
        // Use explicit numeric coordinates from the map (or geocoding fallback above)
        location_lat: finalCoords.lat,
        location_lng: finalCoords.lng,
        images: imageUrls,
        expiry_date: data.expiry_date,
        pickup_window_start: new Date(data.pickup_window_start).toISOString(),
        pickup_window_end: new Date(data.pickup_window_end).toISOString(),
      };

      // Remove terms_accepted from the data as it's not in the database
      const { terms_accepted, ...donationInsert } = donationData;

      const { error } = await supabase
        .from('donations')
        .insert([donationInsert]);

      if (error) {
        toast.error('Failed to create donation: ' + error.message);
      } else {
        toast.success('Food donation created successfully!');
        router.push('/donations/my');
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Food Donation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="title">Food Title *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="e.g., Fresh vegetables from garden"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe the food items, any preparation details, or special instructions..."
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => form.setValue('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category_id && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.category_id.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                {...form.register('quantity')}
                placeholder="e.g., 2 bags, 1 loaf, serves 4"
              />
              {form.formState.errors.quantity && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="expiry_date">Expiry Date *</Label>
              <Input
                id="expiry_date"
                type="date"
                {...form.register('expiry_date')}
                min={new Date().toISOString().split('T')[0]}
              />
              {form.formState.errors.expiry_date && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.expiry_date.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="condition">Item Condition *</Label>
              <Select onValueChange={(value: 'sealed' | 'open') => form.setValue('condition', value)} defaultValue="sealed">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sealed">Sealed/Unopened</SelectItem>
                  <SelectItem value="open">Opened/Prepared</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="storage_type">Storage Type *</Label>
              <Select onValueChange={(value: 'ambient' | 'refrigerated' | 'frozen') => form.setValue('storage_type', value)} defaultValue="ambient">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambient">🌡️ Room Temperature</SelectItem>
                  <SelectItem value="refrigerated">❄️ Refrigerated</SelectItem>
                  <SelectItem value="frozen">🧊 Frozen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pickup_window_start">Pickup Start *</Label>
              <Input
                id="pickup_window_start"
                type="datetime-local"
                {...form.register('pickup_window_start')}
                min={new Date().toISOString().slice(0, 16)}
              />
              {form.formState.errors.pickup_window_start && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.pickup_window_start.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="pickup_window_end">Pickup End *</Label>
              <Input
                id="pickup_window_end"
                type="datetime-local"
                {...form.register('pickup_window_end')}
                min={new Date().toISOString().slice(0, 16)}
              />
              {form.formState.errors.pickup_window_end && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.pickup_window_end.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address_text">Pickup Address *</Label>
              <Input
                id="address_text"
                // We keep human-readable address, but coordinates are authoritative for distance.
                {...form.register('address_text')}
                placeholder="Enter the pickup address"
              />
              {form.formState.errors.address_text && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.address_text.message}
                </p>
              )}
              {/*
                Map Location Picker: allows precise selection by dragging a marker.
                - It initializes from the current lat/lng if available, or geocodes the typed address.
                - It updates hidden numeric fields 'location_lat' and 'location_lng' in the form.
              */}
              <div className="mt-4">
                <LocationPicker
                  value={useMemo<LatLng | null>(() => {
                    const lat = form.getValues('location_lat');
                    const lng = form.getValues('location_lng');
                    return typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)
                      ? { lat, lng }
                      : null;
                  }, [form.watch('location_lat'), form.watch('location_lng')])}
                  onChange={(coord) => {
                    // Persist numeric coordinates into the form state with validation
                    form.setValue('location_lat', coord.lat, { shouldDirty: true, shouldValidate: true });
                    form.setValue('location_lng', coord.lng, { shouldDirty: true, shouldValidate: true });
                  }}
                  addressText={form.watch('address_text')}
                  onGeocodeError={(msg) => toast.warning(msg)}
                  className="mt-2"
                />

                {/* Hidden inputs registered as numbers to satisfy schema and RHF */}
                <input type="hidden" {...form.register('location_lat', { valueAsNumber: true })} />
                <input type="hidden" {...form.register('location_lng', { valueAsNumber: true })} />

                {(form.formState.errors as any).location_lat && (
                  <p className="text-sm text-red-600 mt-1">
                    {(form.formState.errors as any).location_lat.message as string}
                  </p>
                )}
                {(form.formState.errors as any).location_lng && (
                  <p className="text-sm text-red-600 mt-1">
                    {(form.formState.errors as any).location_lng.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Photos (up to 3)</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 3 && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload Photo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    multiple
                  />
                </label>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              onCheckedChange={(checked) => form.setValue('terms_accepted', checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm">
              I confirm this food is safe to share and I've read the{' '}
              <a href="/guidelines" className="text-green-600 hover:text-green-700 underline">
                sharing guidelines
              </a>
            </Label>
          </div>
          {form.formState.errors.terms_accepted && (
            <p className="text-sm text-red-600">
              {form.formState.errors.terms_accepted.message}
            </p>
          )}

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700" 
            disabled={loading || uploading}
          >
            {loading ? 'Creating...' : 'Share Food'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}