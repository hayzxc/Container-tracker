import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Package, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContainerEntry {
  id: string;
  container_number: string;
  commodity: string;
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
                      <Badge variant="outline">{entry.container_number}</Badge>
                    </TableCell>
                    <TableCell>{entry.commodity}</TableCell>
                    <TableCell>
                      <a
                        href={entry.ispm_photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Lihat Foto
                      </a>
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
