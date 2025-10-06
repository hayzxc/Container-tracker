import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin } from "lucide-react";
import { Camera as CapCamera } from "@capacitor/camera";
import { CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContainerFormProps {
  onSuccess: () => void;
}

export const ContainerForm = ({ onSuccess }: ContainerFormProps) => {
  const [containerNumber, setContainerNumber] = useState("");
  const [commodity, setCommodity] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        setPhoto(image.base64String);
        toast.success("Foto berhasil diambil!");
      }
    } catch (error: any) {
      toast.error("Gagal mengambil foto: " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      toast.error("Mohon ambil foto ISPM terlebih dahulu");
      return;
    }

    setLoading(true);

    try {
      // Get location
      let latitude = null;
      let longitude = null;
      try {
        const position = await Geolocation.getCurrentPosition();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (error) {
        console.log("Location not available");
      }

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Upload photo to storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ispm-photos")
        .upload(fileName, 
          Uint8Array.from(atob(photo), c => c.charCodeAt(0)),
          { contentType: "image/jpeg" }
        );

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("ispm-photos")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from("container_entries")
        .insert({
          user_id: user.id,
          container_number: containerNumber,
          commodity: commodity,
          ispm_photo_url: publicUrl,
          latitude,
          longitude,
        });

      if (dbError) throw dbError;

      toast.success("Data berhasil disimpan!");
      setContainerNumber("");
      setCommodity("");
      setPhoto(null);
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Tambah Entry Baru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="container">No. Container</Label>
            <Input
              id="container"
              value={containerNumber}
              onChange={(e) => setContainerNumber(e.target.value)}
              placeholder="Masukkan nomor container"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commodity">Komoditi</Label>
            <Input
              id="commodity"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              placeholder="Masukkan nama komoditi"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Foto ISPM</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={takePhoto}
                variant="outline"
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                {photo ? "Ambil Ulang" : "Ambil Foto"}
              </Button>
            </div>
            {photo && (
              <div className="mt-2">
                <img
                  src={`data:image/jpeg;base64,${photo}`}
                  alt="ISPM Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Data"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
