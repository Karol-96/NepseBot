import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ChevronUp, ChevronDown, Search } from "lucide-react";

// Define type for stock data from API
interface StockData {
  s: string;    // Symbol
  lp: number;   // Last Price
  c: number;    // Percent Change
  q: number;    // Quantity/Volume
}

interface MarketDataResponse {
  mt: string;
  stock: {
    date: string;
    detail: StockData[];
  };
  // Other fields we don't need for now
}

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof StockData>("s");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 20;

  // Fetch market data
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery<MarketDataResponse>({
    queryKey: ["/api/market-data"],
    refetchInterval: 60000, // Refetch every minute
  });

  const handleSort = (field: keyof StockData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort data
  const filteredData = data?.stock?.detail
    ? data.stock.detail.filter(stock => 
        stock.s.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
    
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortField === "s") {
      return sortDirection === "asc"
        ? a.s.localeCompare(b.s)
        : b.s.localeCompare(a.s);
    }
    
    return sortDirection === "asc"
      ? a[sortField] - b[sortField]
      : b[sortField] - a[sortField];
  });

  // Paginate data
  const paginatedData = sortedData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="font-sans text-secondary-800">
      {/* Dashboard Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-10 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-3 text-center">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
                Market Data Dashboard
              </span>
            </h1>
            <p className="text-secondary-600 text-center text-lg mb-6">
              Real-time market insights to inform your trading decisions
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-2">
              <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-secondary-700 text-sm">
                  Last updated: {isLoading ? "Loading..." : formatTimestamp(dataUpdatedAt)}
                </span>
              </div>
              <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Search input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <Input
            type="search"
            placeholder="Search by symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {/* Error state */}
        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium">Error fetching market data</h3>
            <p>{(error as Error)?.message || "Please try again later"}</p>
          </div>
        )}

        {/* Market data table */}
        <div className="bg-white border rounded-lg shadow-md overflow-hidden">
          <Table>
            <TableCaption>
              Showing {paginatedData.length} of {filteredData.length} stocks
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("s")}
                >
                  Symbol
                  {sortField === "s" && (
                    sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort("lp")}
                >
                  Last Price
                  {sortField === "lp" && (
                    sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort("c")}
                >
                  Change %
                  {sortField === "c" && (
                    sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort("q")}
                >
                  Volume
                  {sortField === "q" && (
                    sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                // Actual data
                paginatedData.map((stock) => (
                  <TableRow key={stock.s}>
                    <TableCell className="font-medium">{stock.s}</TableCell>
                    <TableCell className="text-right">{stock.lp.toFixed(2)}</TableCell>
                    <TableCell 
                      className={`text-right font-medium ${
                        stock.c > 0 
                          ? "text-green-600"
                          : stock.c < 0 
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      {stock.c > 0 ? "+" : ""}{stock.c.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">{stock.q.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                // No data found
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                    No stocks found matching "{searchTerm}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4">
                  Page {page} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}