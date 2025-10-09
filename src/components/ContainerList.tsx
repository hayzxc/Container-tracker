import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Package, MapPin, Clock, Image, ChevronDown, ChevronRight, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface Container {
  id: string;
  container_photo_url: string | null;
  commodity_photo_url: string | null;
  ispm_photo_url: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  verified: boolean | null;
  verified_at: string | null;
  verified_by: string | null;
}

interface ShipperWithContainers {
  id: string;
  name: string;
  created_at: string;
  containers: Container[];
}

interface ContainerListProps {
  refresh: boolean;
}

export const ContainerList = ({ refresh }: ContainerListProps) => {
  // State management for shippers and containers
  const [shippers, setShippers] = useState<ShipperWithContainers[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedShippers, setExpandedShippers] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    setIsAdmin(!!data);
  };

  const fetchEntries = async () => {
    try {
      const { data: shippersData, error: shippersError } = await supabase
        .from("shippers")
        .select("*")
        .order("created_at", { ascending: false });

      if (shippersError) throw shippersError;

      const shippersWithContainers = await Promise.all(
        (shippersData || []).map(async (shipper) => {
          const { data: containers, error: containersError } = await supabase
            .from("containers")
            .select("*")
            .eq("shipper_id", shipper.id)
            .order("created_at", { ascending: false });

          if (containersError) throw containersError;

          return {
            ...shipper,
            containers: containers || [],
          };
        })
      );

      setShippers(shippersWithContainers);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteContainer = async (containerId: string) => {
    if (!confirm("Yakin ingin menghapus container ini?")) return;

    const { error } = await supabase
      .from("containers")
      .delete()
      .eq("id", containerId);

    if (error) {
      console.error("Error deleting container:", error);
    } else {
      fetchEntries();
    }
  };

  const deleteShipper = async (shipperId: string) => {
    if (!confirm("Yakin ingin menghapus shipper dan semua containernya?")) return;

    // First delete all containers for this shipper
    const { error: containerError } = await supabase
      .from("containers")
      .delete()
      .eq("shipper_id", shipperId);

    if (containerError) {
      console.error("Error deleting containers:", containerError);
      return;
    }

    // Then delete the shipper
    const { error: shipperError } = await supabase
      .from("shippers")
      .delete()
      .eq("id", shipperId);

    if (shipperError) {
      console.error("Error deleting shipper:", shipperError);
    } else {
      fetchEntries();
    }
  };

  const verifyContainer = async (containerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("containers")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq("id", containerId);

    if (error) {
      console.error("Error verifying container:", error);
    } else {
      fetchEntries();
    }
  };

  const toggleShipper = (shipperId: string) => {
    const newExpanded = new Set(expandedShippers);
    if (newExpanded.has(shipperId)) {
      newExpanded.delete(shipperId);
    } else {
      newExpanded.add(shipperId);
    }
    setExpandedShippers(newExpanded);
  };

  useEffect(() => {
    checkAdminRole();
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

  const totalContainers = shippers.reduce((sum, s) => sum + s.containers.length, 0);

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Daftar Shipper & Container ({shippers.length} shipper, {totalContainers} container)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shippers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada data shipper</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shippers.map((shipper) => (
              <Collapsible
                key={shipper.id}
                open={expandedShippers.has(shipper.id)}
                onOpenChange={() => toggleShipper(shipper.id)}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {expandedShippers.has(shipper.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <Badge variant="default" className="text-base px-3 py-1">
                          {shipper.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {shipper.containers.length} container
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(shipper.created_at), "dd MMM yyyy", { locale: id })}
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteShipper(shipper.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t">
                      {shipper.containers.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <p>Belum ada container untuk shipper ini</p>
                        </div>
                      ) : (
                          <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">No</TableHead>
                              <TableHead>No. Container</TableHead>
                              <TableHead>Komoditi</TableHead>
                              <TableHead>ISPM</TableHead>
                              <TableHead>Time/Loc</TableHead>
                              <TableHead>Status</TableHead>
                              {isAdmin && <TableHead className="w-24">Aksi</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shipper.containers.map((container, index) => (
                              <TableRow key={container.id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
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
                                        src={container.container_photo_url || ""}
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
                                        src={container.commodity_photo_url || ""}
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
                                        src={container.ispm_photo_url}
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
                                      {format(new Date(container.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                                    </div>
                                    {container.latitude && container.longitude && (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {container.latitude.toFixed(4)}, {container.longitude.toFixed(4)}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {container.verified ? (
                                    <Badge variant="default" className="gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Terverifikasi
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="gap-1">
                                      <XCircle className="h-3 w-3" />
                                      Belum Diverifikasi
                                    </Badge>
                                  )}
                                </TableCell>
                                {isAdmin && (
                                  <TableCell>
                                    <div className="flex gap-2">
                                      {!container.verified && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => verifyContainer(container.id)}
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteContainer(container.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
