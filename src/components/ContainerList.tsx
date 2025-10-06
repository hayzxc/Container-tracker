import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Package, MapPin, Clock, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ContainerEntry {
  id: string;
  shipper: string;
  container_photo_url: string;
  commodity_photo_url: string;
  ispm_photo_url: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface ContainerListProps {
  refresh: boolean;
}

export const ContainerList = ({ refresh }: ContainerListProps) => {
  const [entries, setEntries] = useState<ContainerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("container_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [refresh]);

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-6 text-center text-muted-foreground">
          Memuat data...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Daftar Container ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada data container</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Shipper</TableHead>
                  <TableHead>No. Container</TableHead>
                  <TableHead>Komoditi</TableHead>
                  <TableHead>ISPM</TableHead>
                  <TableHead>Time/Loc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.shipper}</Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="flex items-center gap-1 text-primary hover:underline">
                            <Image className="h-4 w-4" />
                            Lihat Foto
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Foto No. Container</DialogTitle>
                          </DialogHeader>
                          <img
                            src={entry.container_photo_url}
                            alt="Container"
                            className="w-full h-auto rounded-lg"
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="flex items-center gap-1 text-primary hover:underline">
                            <Image className="h-4 w-4" />
                            Lihat Foto
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Foto Komoditi</DialogTitle>
                          </DialogHeader>
                          <img
                            src={entry.commodity_photo_url}
                            alt="Commodity"
                            className="w-full h-auto rounded-lg"
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="flex items-center gap-1 text-primary hover:underline">
                            <Image className="h-4 w-4" />
                            Lihat Foto
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Foto ISPM</DialogTitle>
                          </DialogHeader>
                          <img
                            src={entry.ispm_photo_url}
                            alt="ISPM"
                            className="w-full h-auto rounded-lg"
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(entry.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                        </div>
                        {entry.latitude && entry.longitude && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
