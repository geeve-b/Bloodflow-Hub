import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Country, State, City } from "country-state-city";

interface LocationSelectorProps {
  onLocationChange: (location: { country: string; state: string; district: string }) => void;
  defaultCountry?: string;
  defaultState?: string;
  defaultDistrict?: string;
}

export function LocationSelector({
  onLocationChange,
  defaultCountry = "",
  defaultState = "",
  defaultDistrict = "",
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string>(defaultCountry);
  const [selectedState, setSelectedState] = useState<string>(defaultState);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(defaultDistrict);

  // Load countries on mount
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryCode = selectedCountry.split("|")[0]; // Extract country code
      const countryStates = State.getStatesOfCountry(countryCode);
      setStates(countryStates || []);
      setSelectedState("");
      setSelectedDistrict("");
      setDistricts([]);
    }
  }, [selectedCountry]);

  // Load districts when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const countryCode = selectedCountry.split("|")[0];
      const stateCode = selectedState.split("|")[0];
      const stateCities = City.getCitiesOfState(countryCode, stateCode);
      setDistricts(stateCities || []);
      setSelectedDistrict("");
    }
  }, [selectedState, selectedCountry]);

  // Notify parent component when location changes
  useEffect(() => {
    const countryName = selectedCountry.split("|")[1] || "";
    const stateName = selectedState.split("|")[1] || "";
    const districtName = selectedDistrict.split("|")[1] || "";

    onLocationChange({
      country: countryName,
      state: stateName,
      district: districtName,
    });
  }, [selectedCountry, selectedState, selectedDistrict, onLocationChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger id="country">
            <SelectValue placeholder="Select Country" />
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
        <Select
          value={selectedDistrict}
          onValueChange={setSelectedDistrict}
          disabled={!selectedState || districts.length === 0}
        >
          <SelectTrigger id="district">
            <SelectValue placeholder={selectedState ? "Select District" : "Select State First"} />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {districts.map((district) => (
              <SelectItem key={district.name} value={`${district.isoCode || district.name}|${district.name}`}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
