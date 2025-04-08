import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export function OrdersTable() {
  const { toast } = useToast();

  // Fetch orders from the API
  const { data: orders, isLoading, isError } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Refresh orders
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({
      title: "Success",
      description: "Orders refreshed!",
      variant: "default",
    });
  };

  return (
    <div className="mt-12 pt-8 border-t border-primary-100">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="w-1 h-6 bg-primary-500 rounded-full mr-3"></div>
          <h2 className="text-xl font-semibold text-secondary-800">Recent Orders</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-sm text-primary-700 border-primary-200 hover:bg-primary-50 font-medium flex items-center"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {/* Orders Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-primary-100">
        <table className="min-w-full divide-y divide-primary-100">
          <thead className="bg-primary-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">Symbol</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">Quantity</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">Trigger(%)</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">TMS Order ID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">TMS Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-50">
            {isLoading ? (
              // Loading state
              Array.from({ length: 3 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-14" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-10" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                </tr>
              ))
            ) : isError ? (
              // Error state
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-red-600 bg-red-50">
                  Error loading orders. Please try again.
                </td>
              </tr>
            ) : orders && orders.length > 0 ? (
              // Data state
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-primary-50/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-900">
                    {order.symbol}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-700">
                    {order.quantity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${
                      order.order_type === 'Buy' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {order.order_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-700">
                    {(typeof order.trigger_price_percent === 'string'
                      ? parseFloat(order.trigger_price_percent)
                      : order.trigger_price_percent !== null 
                        ? order.trigger_price_percent 
                        : 0).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600 font-mono text-xs">
                    {order.tms_order_id 
                      ? <span className="bg-primary-50 px-2 py-1 rounded border border-primary-100">{order.tms_order_id}</span>
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {order.tms_status ? (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${
                        order.tms_status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : order.tms_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {order.tms_status}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(order.submitted_at), 'yyyy-MM-dd')}
                  </td>
                </tr>
              ))
            ) : (
              // Empty state
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary-100 p-3 mb-2">
                      <RefreshCw className="h-6 w-6 text-primary-500" />
                    </div>
                    <p className="text-secondary-600">No orders found. Submit your first order above.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
