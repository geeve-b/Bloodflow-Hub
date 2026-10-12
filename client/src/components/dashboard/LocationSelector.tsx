import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationSelectorProps {
  onLocationChange: (location: { country: string; state: string; district: string }) => void;
}

interface Place {
  name: string;
  isoCode?: string;
}

// The location dataset is large (the city list alone is ~8 MB), so each part is loaded
// on demand instead of being bundled into the dashboard.
const loadCountries = () => import("country-state-city/lib/country").then((m) => m.default);
const loadStates = () => import("country-state-city/lib/state").then((m) => m.default);
const loadCities = () => import("country-state-city/lib/city").then((m) => m.default);

export function LocationSelector({ onLocationChange }: LocationSelectorProps) {
  const [countries, setCountries] = useState<Place[]>([]);
  const [states, setStates] = useState<Place[]>([]);
  const [districts, setDistricts] = useState<Place[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadCountries().then((Country) => {
      if (!cancelled) setCountries(Country.getAllCountries());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedState("");
    setSelectedDistrict("");
    setStates([]);
    setDistricts([]);
    if (!selectedCountry) return;
    let cancelled = false;
    const countryCode = selectedCountry.split("|")[0];
    loadStates().then((State) => {
      if (!cancelled) setStates(State.getStatesOfCountry(countryCode) || []);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCountry]);

  useEffect(() => {
    setSelectedDistrict("");
    setDistricts([]);
    if (!selectedCountry || !selectedState) return;
    let cancelled = false;
    const countryCode = selectedCountry.split("|")[0];
    const stateCode = selectedState.split("|")[0];
    setDistrictsLoading(true);
    loadCities()
      .then((City) => {
        if (!cancelled) setDistricts(City.getCitiesOfState(countryCode, stateCode) || []);
      })
      .finally(() => {
        if (!cancelled) setDistrictsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedState, selectedCountry]);

  useEffect(() => {
    onLocationChange({
      country: selectedCountry.split("|")[1] || "",
      state: selectedState.split("|")[1] || "",
      district: selectedDistrict.split("|")[1] || "",
    });
  }, [selectedCountry, selectedState, selectedDistrict, onLocationChange]);

  // Some states have no city data; let the user type the district instead of getting stuck
  const typeDistrict = Boolean(selectedState) && !districtsLoading && districts.length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
        <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={countries.length === 0}>
          <SelectTrigger id="country">
            <SelectValue placeholder={countries.length ? "Select Country" : "Loading countries…"} />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {countries.map((country) => (
              <SelectItem key={country.isoCode} value={`${country.isoCode}|${country.name}`}>
                {country.name} ({country.isoCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State/Province <span className="text-red-500">*</span></Label>
        <Select
          value={selectedState}
          onValueChange={setSelectedState}
          disabled={!selectedCountry || states.length === 0}
        >
          <SelectTrigger id="state">
            <SelectValue placeholder={selectedCountry ? "Select State" : "Select Country First"} />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {states.map((state) => (
              <SelectItem key={state.isoCode} value={`${state.isoCode}|${state.name}`}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="district">District/City <span className="text-red-500">*</span></Label>
        {typeDistrict ? (
          <Input
            id="district"
            placeholder="Enter district or city"
            value={selectedDistrict.split("|")[1] || ""}
            onChange={(e) => setSelectedDistrict(e.target.value ? `custom|${e.target.value}` : "")}
          />
        ) : (
          <Select
            value={selectedDistrict}
            onValueChange={setSelectedDistrict}
            disabled={!selectedState || districtsLoading}
          >
            <SelectTrigger id="district">
              <SelectValue
                placeholder={
                  !selectedState ? "Select State First" : districtsLoading ? "Loading districts…" : "Select District"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {districts.map((district, index) => (
                <SelectItem key={`${district.name}-${index}`} value={`${district.isoCode || district.name}|${district.name}`}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
