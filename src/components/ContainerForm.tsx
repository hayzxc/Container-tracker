import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Camera as CapCamera } from "@capacitor/camera";
import { CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContainerFormProps {
  onSuccess: () => void;
}

interface Container {
  containerPhoto: string | null;
  commodityPhoto: string | null;
  ispmPhoto: string | null;
  location: { lat: number; lng: number } | null;
}

export const ContainerForm = ({ onSuccess }: ContainerFormProps) => {
  const [shippers, setShippers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedShipper, setSelectedShipper] = useState("");
  const [newShipperName, setNewShipperName] = useState("");
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShippers();
  }, []);

  const fetchShippers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("shippers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shippers:", error);
    } else {
      setShippers(data || []);
    }
  };

  const addContainer = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      const newContainer: Container = {
        containerPhoto: null,
        commodityPhoto: null,
        ispmPhoto: null,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      };
      setContainers([...containers, newContainer]);
      toast.success("Container baru ditambahkan");
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error("Gagal mendapatkan lokasi");
    }
  };

  const removeContainer = (index: number) => {
    setContainers(containers.filter((_, i) => i !== index));
  };

  const takePhoto = async (containerIndex: number, type: 'containerPhoto' | 'commodityPhoto' | 'ispmPhoto') => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        const updatedContainers = [...containers];
        updatedContainers[containerIndex][type] = image.base64String;
        setContainers(updatedContainers);
        toast.success("Foto berhasil diambil");
      }
    } catch (error: any) {
      console.error("Error taking photo:", error);
      toast.error("Gagal mengambil foto");
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

  const createShipper = async () => {
    if (!newShipperName.trim()) {
      toast.error("Masukkan nama shipper");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("shippers")
      .insert({ user_id: user.id, name: newShipperName })
      .select()
      .single();

    if (error) {
      console.error("Error creating shipper:", error);
      toast.error("Gagal membuat shipper");
    } else {
      setShippers([data, ...shippers]);
      setSelectedShipper(data.id);
      setNewShipperName("");
      toast.success("Shipper baru dibuat");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedShipper || containers.length === 0) {
      toast.error("Pilih shipper dan tambahkan minimal 1 container!");
      return;
    }

    // Check if all containers have all photos
    const incompleteContainer = containers.findIndex(
      c => !c.containerPhoto || !c.commodityPhoto || !c.ispmPhoto
    );
    if (incompleteContainer !== -1) {
      toast.error(`Container ${incompleteContainer + 1} belum lengkap foto-fotonya!`);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const timestamp = Date.now();

      // Upload and insert all containers
      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        const containerPhotoUrl = await uploadPhoto(container.containerPhoto!, user.id, `${user.id}/container_${timestamp}_${i}.jpg`);
        const commodityPhotoUrl = await uploadPhoto(container.commodityPhoto!, user.id, `${user.id}/commodity_${timestamp}_${i}.jpg`);
        const ispmPhotoUrl = await uploadPhoto(container.ispmPhoto!, user.id, `${user.id}/ispm_${timestamp}_${i}.jpg`);

        const { error } = await supabase.from("containers").insert({
          user_id: user.id,
          shipper_id: selectedShipper,
          container_photo_url: containerPhotoUrl,
          commodity_photo_url: commodityPhotoUrl,
          ispm_photo_url: ispmPhotoUrl,
          latitude: container.location?.lat || null,
          longitude: container.location?.lng || null,
        });

        if (error) throw error;
      }

      toast.success(`${containers.length} container berhasil disimpan!`);
      
      // Reset form
      setSelectedShipper("");
      setContainers([]);
      
      onSuccess();
    } catch (error: any) {
      console.error("Error saving data:", error);
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipper Selection */}
          <div className="space-y-2">
            <Label>Pilih Shipper</Label>
            <Select value={selectedShipper} onValueChange={setSelectedShipper}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih shipper" />
              </SelectTrigger>
              <SelectContent>
                {shippers.map((shipper) => (
                  <SelectItem key={shipper.id} value={shipper.id}>
                    {shipper.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create New Shipper */}
          <div className="space-y-2">
            <Label>Atau Buat Shipper Baru</Label>
            <div className="flex gap-2">
              <Input
                value={newShipperName}
                onChange={(e) => setNewShipperName(e.target.value)}
                placeholder="Nama shipper baru"
              />
              <Button type="button" onClick={createShipper} variant="outline">
                Buat
              </Button>
            </div>
          </div>

          {/* Container List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Container ({containers.length})</Label>
              <Button type="button" onClick={addContainer} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Container
              </Button>
            </div>

            {containers.map((container, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Container {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContainer(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Foto No. Container</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => takePhoto(index, 'containerPhoto')}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {container.containerPhoto ? "Ganti" : "Ambil Foto"}
                      </Button>
                      {container.containerPhoto && (
                        <img src={`data:image/jpeg;base64,${container.containerPhoto}`} alt="Container" className="w-full h-32 object-cover rounded-md" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Foto Komoditi</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => takePhoto(index, 'commodityPhoto')}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {container.commodityPhoto ? "Ganti" : "Ambil Foto"}
                      </Button>
                      {container.commodityPhoto && (
                        <img src={`data:image/jpeg;base64,${container.commodityPhoto}`} alt="Commodity" className="w-full h-32 object-cover rounded-md" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Foto ISPM</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => takePhoto(index, 'ispmPhoto')}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {container.ispmPhoto ? "Ganti" : "Ambil Foto"}
                      </Button>
                      {container.ispmPhoto && (
                        <img src={`data:image/jpeg;base64,${container.ispmPhoto}`} alt="ISPM" className="w-full h-32 object-cover rounded-md" />
                      )}
                    </div>
                  </div>

                  {container.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
                      <MapPin className="h-4 w-4" />
                      <span>Lokasi: {container.location.lat.toFixed(4)}, {container.location.lng.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={loading || containers.length === 0}>
            {loading ? "Menyimpan..." : `Simpan ${containers.length} Container`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
