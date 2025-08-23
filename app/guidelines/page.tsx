import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation menu/header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Sharing Guidelines</h1>
            <p className="text-gray-600">
              Keep our community safe and healthy by following these important guidelines.
            </p>
          </div>

          <div className="grid gap-6">
            {/* Safe Foods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Recommended Foods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Sealed & Non-Perishable</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Unopened canned goods</li>
                      <li>• Sealed packaged foods</li>
                      <li>• Unopened beverages</li>
                      <li>• Dry goods (rice, pasta, cereal)</li>
                      <li>• Sealed condiments and sauces</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Fresh Items (with care)</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Fresh fruits and vegetables</li>
                      <li>• Unopened dairy products</li>
                      <li>• Sealed bread and baked goods</li>
                      <li>• Properly stored frozen items</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Caution Foods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="w-5 h-5" />
                  Share with Extra Care
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These items can be shared but require special attention to safety and labeling.
                  </AlertDescription>
                </Alert>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Cooked Foods (Same Day Only)</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Prepared meals (cooked today)</li>
                      <li>• Baked goods (homemade)</li>
                      <li>• Cooked vegetables or grains</li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-2">
                      ⚠️ Must include preparation date and storage details
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Dairy & Refrigerated</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Check expiry dates carefully</li>
                      <li>• Ensure cold chain maintained</li>
                      <li>• Note any temperature breaks</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prohibited Foods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="w-5 h-5" />
                  Do Not Share
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    These items pose health risks and should never be shared through our platform.
                  </AlertDescription>
                </Alert>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">High-Risk Items</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Raw or undercooked meat/seafood</li>
                      <li>• Unpasteurized dairy products</li>
                      <li>• Items with unknown ingredients</li>
                      <li>• Foods stored at unsafe temperatures</li>
                      <li>• Items past expiry date</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Special Considerations</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Items containing allergens (label clearly)</li>
                      <li>• Alcohol (check local regulations)</li>
                      <li>• Pet food (specify clearly)</li>
                      <li>• Foods requiring special preparation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pickup Etiquette */}
            <Card>
              <CardHeader>
                <CardTitle>Pickup Etiquette</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">For Donors</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Be available during pickup window</li>
                      <li>• Respond to reservation requests promptly</li>
                      <li>• Provide clear pickup instructions</li>
                      <li>• Update if food becomes unavailable</li>
                      <li>• Be courteous and understanding</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">For Recipients</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Arrive on time for pickup</li>
                      <li>• Bring appropriate containers</li>
                      <li>• Cancel if you can't make it</li>
                      <li>• Ask questions about storage/preparation</li>
                      <li>• Leave honest feedback after pickup</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Safety & Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Building Trust</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Complete your profile with accurate information</li>
                      <li>• Start with small, simple donations to build reputation</li>
                      <li>• Communicate clearly and honestly</li>
                      <li>• Follow through on commitments</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Personal Safety</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Meet in safe, public locations when possible</li>
                      <li>• Trust your instincts about food quality</li>
                      <li>• Report any suspicious or unsafe behavior</li>
                      <li>• Keep pickup locations secure but accessible</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}