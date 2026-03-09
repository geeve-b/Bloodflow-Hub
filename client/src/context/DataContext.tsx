import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Types
export interface BloodStock {
  id: string;
  bloodGroup: string;
  units: number;
  hospitalId: string;
  hospitalName: string;
  lastUpdated: string;
}

export interface DonorRequest {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsNeeded: number;
  hospitalName: string;
  country: string;
  state: string;
  district: string;
  address: string;
  status: "pending" | "fulfilled" | "approved" | "rejected";
  urgency: "critical" | "normal";
  requestDate: string;
}

export interface DonorProfile {
  id: string;
  name: string;
  bloodGroup: string;
  age: number;
  lastDonation: string;
  medicalConditions: string[];
  status: "pending" | "approved" | "rejected";
  email: string;
}

interface DataContextType {
  inventory: BloodStock[];
  requests: DonorRequest[];
  donors: DonorProfile[];
  updateInventory: (id: string, units: number) => void;
  addRequest: (req: Omit<DonorRequest, "id" | "status" | "requestDate">) => void;
  approveDonor: (id: string) => void;
  rejectDonor: (id: string) => void;
  refreshInventory: () => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_INVENTORY: BloodStock[] = [
  { id: "1", bloodGroup: "A+", units: 15, hospitalId: "h1", hospitalName: "City General", lastUpdated: "2024-05-20" },
  { id: "2", bloodGroup: "O+", units: 8, hospitalId: "h1", hospitalName: "City General", lastUpdated: "2024-05-19" },
  { id: "3", bloodGroup: "B-", units: 2, hospitalId: "h1", hospitalName: "City General", lastUpdated: "2024-05-18" },
  { id: "4", bloodGroup: "AB+", units: 5, hospitalId: "h1", hospitalName: "City General", lastUpdated: "2024-05-20" },
];

const INITIAL_REQUESTS: DonorRequest[] = [
  {
    id: "r1",
    patientName: "Alice Walker",
    bloodGroup: "B-",
    unitsNeeded: 2,
    hospitalName: "City General",
    region: "Downtown",
    address: "123 Main St, City General Hospital",
    status: "pending",
    urgency: "critical",
    requestDate: "2024-05-21",
  },
  {
    id: "r2",
    patientName: "Bob Jones",
    bloodGroup: "O-",
    unitsNeeded: 1,
    hospitalName: "St. Mary's",
    region: "Midtown",
    address: "456 Oak Ave, St. Mary's Medical Center",
    status: "fulfilled",
    urgency: "normal",
    requestDate: "2024-05-21",
  },
];

const INITIAL_DONORS: DonorProfile[] = [
  { id: "d1", name: "Jane Doe", bloodGroup: "A+", age: 28, lastDonation: "2023-11-15", medicalConditions: [], status: "approved", email: "jane@example.com" },
  { id: "d2", name: "Michael Scott", bloodGroup: "O-", age: 45, lastDonation: "2024-01-10", medicalConditions: ["Asthma"], status: "pending", email: "michael@example.com" },
];

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export function DataProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<BloodStock[]>(INITIAL_INVENTORY);
  const [requests, setRequests] = useState<DonorRequest[]>(INITIAL_REQUESTS);
  const [donors, setDonors] = useState<DonorProfile[]>(INITIAL_DONORS);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch blood inventory from API on mount
  useEffect(() => {
    refreshInventory();
  }, []);

  const refreshInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/blood-inventory`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Convert API data to BloodStock format
          const bloodStocks = data.map((item: any) => ({
            id: item._id || item.id,
            bloodGroup: item.bloodType,
            units: item.quantity,
            hospitalId: item.hospitalId,
            hospitalName: item.hospitalName || "Unknown Hospital",
            lastUpdated: new Date(item.updatedAt || item.createdAt).toISOString().split('T')[0],
          }));
          setInventory(bloodStocks);
        }
      }
    } catch (error) {
      console.error("Failed to fetch blood inventory:", error);
      // Keep using initial/existing inventory on error
    } finally {
      setIsLoading(false);
    }
  };

  const updateInventory = (id: string, units: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, units } : item));
  };

  const addRequest = (req: Omit<DonorRequest, "id" | "status" | "requestDate">) => {
    const newReq: DonorRequest = {
      ...req,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending",
      requestDate: new Date().toISOString().split('T')[0],
    };
    setRequests(prev => [newReq, ...prev]);
  };

  const approveDonor = (id: string) => {
    setDonors(prev => prev.map(d => d.id === id ? { ...d, status: "approved" } : d));
  };

  const rejectDonor = (id: string) => {
    setDonors(prev => prev.map(d => d.id === id ? { ...d, status: "rejected" } : d));
  };

  return (
    <DataContext.Provider value={{ inventory, requests, donors, updateInventory, addRequest, approveDonor, rejectDonor, refreshInventory, isLoading }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
