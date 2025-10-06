import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { Camera as CapCamera } from "@capacitor/camera";
import { CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContainerFormProps {
  onSuccess: () => void;
}

export const ContainerForm = ({ onSuccess }: ContainerFormProps) => {
  const [shipper, setShipper] = useState("");
  const [containerPhoto, setContainerPhoto] = useState<string | null>(null);
  const [commodityPhoto, setCommodityPhoto] = useState<string | null>(null);
  const [ispmPhoto, setIspmPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async (type: "container" | "commodity" | "ispm") => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        if (type === "container") setContainerPhoto(image.base64String);
        else if (type === "commodity") setCommodityPhoto(image.base64String);
        else setIspmPhoto(image.base64String);
        
        toast.success(`Foto ${type === "container" ? "No. Container" : type === "commodity" ? "Komoditi" : "ISPM"} berhasil diambil!`);
      }
    } catch (error: any) {
      toast.error("Gagal mengambil foto: " + error.message);
    }
  };

  const uploadPhoto = async (photo: string, userId: string, fileName: string) => {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("ispm-photos")
      .upload(fileName, 
        Uint8Array.from(atob(photo), c => c.charCodeAt(0)),
        { contentType: "image/jpeg" }
      );

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("ispm-photos")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!containerPhoto || !commodityPhoto || !ispmPhoto) {
      toast.error("Mohon ambil semua foto terlebih dahulu");
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

      const timestamp = Date.now();

      // Upload all photos
      const containerPhotoUrl = await uploadPhoto(containerPhoto, user.id, `${user.id}/container_${timestamp}.jpg`);
      const commodityPhotoUrl = await uploadPhoto(commodityPhoto, user.id, `${user.id}/commodity_${timestamp}.jpg`);
      const ispmPhotoUrl = await uploadPhoto(ispmPhoto, user.id, `${user.id}/ispm_${timestamp}.jpg`);

      // Save to database
      const { error: dbError } = await supabase
        .from("container_entries")
        .insert({
          user_id: user.id,
          shipper: shipper,
          container_photo_url: containerPhotoUrl,
          commodity_photo_url: commodityPhotoUrl,
          ispm_photo_url: ispmPhotoUrl,
          latitude,
          longitude,
        });

      if (dbError) throw dbError;

      toast.success("Data berhasil disimpan!");
      setShipper("");
      setContainerPhoto(null);
      setCommodityPhoto(null);
      setIspmPhoto(null);
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
            <Label htmlFor="shipper">Shipper</Label>
            <Input
              id="shipper"
              value={shipper}
              onChange={(e) => setShipper(e.target.value)}
              placeholder="Masukkan nama shipper"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Foto No. Container</Label>
            <Button
              type="button"
              onClick={() => takePhoto("container")}
              variant="outline"
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              {containerPhoto ? "Ambil Ulang Foto Container" : "Ambil Foto Container"}
            </Button>
            {containerPhoto && (
              <div className="mt-2">
                <img
                  src={`data:image/jpeg;base64,${containerPhoto}`}
                  alt="Container Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Foto Komoditi</Label>
            <Button
              type="button"
              onClick={() => takePhoto("commodity")}
              variant="outline"
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              {commodityPhoto ? "Ambil Ulang Foto Komoditi" : "Ambil Foto Komoditi"}
            </Button>
            {commodityPhoto && (
              <div className="mt-2">
                <img
                  src={`data:image/jpeg;base64,${commodityPhoto}`}
                  alt="Commodity Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Foto ISPM</Label>
            <Button
              type="button"
              onClick={() => takePhoto("ispm")}
              variant="outline"
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              {ispmPhoto ? "Ambil Ulang Foto ISPM" : "Ambil Foto ISPM"}
            </Button>
            {ispmPhoto && (
              <div className="mt-2">
                <img
                  src={`data:image/jpeg;base64,${ispmPhoto}`}
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
