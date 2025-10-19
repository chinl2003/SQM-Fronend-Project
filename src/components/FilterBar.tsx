import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Filter, MapPin, Star, TrendingUp, Clock, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
}
interface FilterState {
  sortBy: "nearest" | "rating" | "hottest" | "shortest_wait" | "pre_order";
  cuisineTypes: string[];
  priceRange: string[];
  availability: "all" | "open_now" | "pre_order_only";
}
const sortOptions = [{
  value: "nearest",
  label: "Nearest",
  icon: MapPin
}, {
  value: "rating",
  label: "Highest Rated",
  icon: Star
}, {
  value: "hottest",
  label: "Trending",
  icon: TrendingUp
}, {
  value: "shortest_wait",
  label: "Shortest Wait",
  icon: Clock
}, {
  value: "pre_order",
  label: "Pre-order Available",
  icon: CalendarClock
}] as const;
const cuisineTypes = ["Italian", "Chinese", "Indian", "Mexican", "Japanese", "Thai", "American", "Mediterranean", "Vietnamese", "Korean"];
const priceRanges = [{
  value: "€",
  label: "Budget-friendly (€)"
}, {
  value: "€€",
  label: "Moderate (€€)"
}, {
  value: "€€€",
  label: "Premium (€€€)"
}];
export function FilterBar({
  onFilterChange
}: FilterBarProps) {
  const [activeSort, setActiveSort] = useState<FilterState["sortBy"]>("nearest");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const handleSortChange = (sortBy: FilterState["sortBy"]) => {
    setActiveSort(sortBy);
    onFilterChange?.({
      sortBy,
      cuisineTypes: selectedCuisines,
      priceRange: selectedPrices,
      availability: "all"
    });
  };
  const toggleCuisine = (cuisine: string) => {
    const newCuisines = selectedCuisines.includes(cuisine) ? selectedCuisines.filter(c => c !== cuisine) : [...selectedCuisines, cuisine];
    setSelectedCuisines(newCuisines);
    onFilterChange?.({
      sortBy: activeSort,
      cuisineTypes: newCuisines,
      priceRange: selectedPrices,
      availability: "all"
    });
  };
  const togglePrice = (price: string) => {
    const newPrices = selectedPrices.includes(price) ? selectedPrices.filter(p => p !== price) : [...selectedPrices, price];
    setSelectedPrices(newPrices);
    onFilterChange?.({
      sortBy: activeSort,
      cuisineTypes: selectedCuisines,
      priceRange: newPrices,
      availability: "all"
    });
  };
  const clearFilters = () => {
    setActiveSort("nearest");
    setSelectedCuisines([]);
    setSelectedPrices([]);
    onFilterChange?.({
      sortBy: "nearest",
      cuisineTypes: [],
      priceRange: [],
      availability: "all"
    });
  };
  const activeFiltersCount = selectedCuisines.length + selectedPrices.length;
  return <div className="bg-card border-b sticky top-16 z-40 py-3">
      <div className="container mx-auto px-4">
        {/* Sort Options - Horizontal Scroll */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-2">
          {sortOptions.map(({
          value,
          label,
          icon: Icon
        }) => (
          <Button
            key={value}
            variant={activeSort === value ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange(value)}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Button>
        ))}
        </div>

        {/* Secondary Filters */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            {/* Cuisine Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <Filter className="h-4 w-4 mr-1" />
                  Cuisine
                  {selectedCuisines.length > 0 && <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {selectedCuisines.length}
                    </Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto">
                {cuisineTypes.map(cuisine => <DropdownMenuItem key={cuisine} onClick={() => toggleCuisine(cuisine)} className={cn("cursor-pointer", selectedCuisines.includes(cuisine) && "bg-accent text-accent-foreground")}>
                    {cuisine}
                    {selectedCuisines.includes(cuisine) && " ✓"}
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Price Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  Price
                  {selectedPrices.length > 0 && <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {selectedPrices.length}
                    </Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {priceRanges.map(({
                value,
                label
              }) => <DropdownMenuItem key={value} onClick={() => togglePrice(value)} className={cn("cursor-pointer", selectedPrices.includes(value) && "bg-accent text-accent-foreground")}>
                    {label}
                    {selectedPrices.includes(value) && " ✓"}
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              Clear ({activeFiltersCount})
            </Button>}
        </div>

        {/* Active Filter Tags */}
        {(selectedCuisines.length > 0 || selectedPrices.length > 0) && <div className="flex flex-wrap gap-2 mt-2">
            {selectedCuisines.map(cuisine => <Badge key={cuisine} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => toggleCuisine(cuisine)}>
                {cuisine} ×
              </Badge>)}
            {selectedPrices.map(price => <Badge key={price} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => togglePrice(price)}>
                {price} ×
              </Badge>)}
          </div>}
      </div>
    </div>;
}