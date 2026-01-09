import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData, BloodStock } from "@/context/DataContext";
import { useState, useEffect } from "react";
import { Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function BloodInventoryTable() {
  const { inventory, updateInventory, refreshInventory } = useData();
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const isManager = user?.role === "hospital" || user?.role === "admin";

  // Listen for blood inventory updates
  useEffect(() => {
    const handleInventoryUpdate = () => {
      refreshInventory();
    };

    window.addEventListener('bloodInventoryUpdated', handleInventoryUpdate);
    return () => window.removeEventListener('bloodInventoryUpdated', handleInventoryUpdate);
  }, [refreshInventory]);

  const handleEdit = (item: BloodStock) => {
    setEditingId(item.id);
    setEditValue(item.units);
  };

  const handleSave = (id: string) => {
    updateInventory(id, editValue);
    setEditingId(null);
  };

  const getStatusBadge = (units: number) => {
    if (units === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (units < 5) return <Badge className="bg-orange-500 hover:bg-orange-600">Low Stock</Badge>;
    return <Badge className="bg-emerald-500 hover:bg-emerald-600">Available</Badge>;
  };

  return (
    <div className="rounded-md border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Blood Group</TableHead>
            <TableHead>Hospital</TableHead>
            <TableHead>Units Available</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Last Updated</TableHead>
            {isManager && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-bold text-lg text-primary">{item.bloodGroup}</TableCell>
              <TableCell>{item.hospitalName}</TableCell>
              <TableCell>
                {isManager && editingId === item.id ? (
                  <Input
                    type="number"
                    className="w-20 h-8"
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                    min={0}
                  />
                ) : (
                  <span className="font-medium">{item.units} Units</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(item.units)}</TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {new Date(item.lastUpdated).toLocaleDateString()}
              </TableCell>
              {isManager && (
                <TableCell>
                  {editingId === item.id ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleSave(item.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
