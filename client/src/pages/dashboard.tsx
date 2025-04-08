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
      <div className="bg-gradient-to-b from-primary-100 to-primary-50/50 py-10 mb-8 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-300"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary-200/50 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-primary-300/40 blur-3xl"></div>
        
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-3 text-center">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-700 via-primary-600 to-primary-800">
                Market Data Dashboard
              </span>
            </h1>
            <p className="text-secondary-700 text-center text-lg mb-6">
              Real-time market insights to inform your trading decisions
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-2">
              <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-primary-200 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse"></div>
                <span className="text-secondary-700 text-sm">
                  Last updated: {isLoading ? "Loading..." : formatTimestamp(dataUpdatedAt)}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => refetch()} 
                className="flex items-center gap-2 border-primary-300 text-primary-700 hover:bg-primary-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Search input */}
        <div className="bg-white p-4 rounded-lg border border-primary-100 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-primary-400" />
              </div>
              <Input
                type="search"
                placeholder="Search by symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-primary-200 focus-visible:ring-primary-500"
              />
            </div>
            <Button
              variant={sortField === "s" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort('s')}
              className={`flex items-center text-sm ${sortField === 's' 
                ? 'bg-primary-600 hover:bg-primary-700' 
                : 'border-primary-200 text-primary-700 hover:bg-primary-50'}`}
            >
              Symbol
            </Button>
            <Button
              variant={sortField === "lp" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort('lp')}
              className={`flex items-center text-sm ${sortField === 'lp' 
                ? 'bg-primary-600 hover:bg-primary-700' 
                : 'border-primary-200 text-primary-700 hover:bg-primary-50'}`}
            >
              Price
            </Button>
            <Button
              variant={sortField === "c" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort('c')}
              className={`flex items-center text-sm ${sortField === 'c' 
                ? 'bg-primary-600 hover:bg-primary-700' 
                : 'border-primary-200 text-primary-700 hover:bg-primary-50'}`}
            >
              Change
            </Button>
          </div>
        </div>

        {/* Error state */}
        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Error fetching market data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{(error as Error)?.message || "Please try again later"}</p>
                </div>
                <div className="mt-4">
                  <Button 
                    size="sm" 
                    onClick={() => refetch()}
                    className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market data table */}
        <div className="bg-white border border-primary-100 rounded-lg shadow-md overflow-hidden">
          <Table>
            <TableCaption className="text-secondary-600">
              Showing {paginatedData.length} of {filteredData.length} stocks
            </TableCaption>
            <TableHeader className="bg-primary-50 border-b border-primary-100">
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-primary-100/70 text-primary-800"
                  onClick={() => handleSort("s")}
                >
                  Symbol
                  {sortField === "s" && (
                    sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-primary-100/70 text-right text-primary-800"
                  onClick={() => handleSort("lp")}
                >
                  Last Price
                  {sortField === "lp" && (
                    sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-primary-100/70 text-right text-primary-800"
                  onClick={() => handleSort("c")}
                >
                  Change %
                  {sortField === "c" && (
                    sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-primary-100/70 text-right text-primary-800"
                  onClick={() => handleSort("q")}
                >
                  Volume
                  {sortField === "q" && (
                    sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-primary-50">
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
                  <TableRow key={stock.s} className="hover:bg-primary-50/50 transition-colors">
                    <TableCell className="font-medium text-primary-900">{stock.s}</TableCell>
                    <TableCell className="text-right font-mono">{stock.lp.toFixed(2)}</TableCell>
                    <TableCell 
                      className={`text-right font-medium ${
                        stock.c > 0 
                          ? "text-green-600"
                          : stock.c < 0 
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        stock.c > 0 
                          ? "bg-green-50 border border-green-100"
                          : stock.c < 0 
                            ? "bg-red-50 border border-red-100"
                            : "bg-gray-50 border border-gray-100"
                      }`}>
                        {stock.c > 0 ? "+" : ""}{stock.c.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-secondary-700">{stock.q.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                // No data found
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-primary-100 p-3 mb-2">
                        <Search className="h-6 w-6 text-primary-500" />
                      </div>
                      <p className="text-secondary-600">No stocks found matching "{searchTerm}"</p>
                    </div>
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
                  className={`${page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} bg-white border border-primary-200 hover:bg-primary-50 text-primary-700`}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-md text-primary-800 font-medium">
                  Page {page} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  className={`${page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} bg-white border border-primary-200 hover:bg-primary-50 text-primary-700`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}