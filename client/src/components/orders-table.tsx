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
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-secondary-800">Recent Orders</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {/* Orders Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">Symbol</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">Quantity</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">Trigger(%)</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">TMS Order ID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">TMS Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
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
                <td colSpan={7} className="px-4 py-6 text-center text-error-500">
                  Error loading orders. Please try again.
                </td>
              </tr>
            ) : orders && orders.length > 0 ? (
              // Data state
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary-800">
                    {order.symbol}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-700">
                    {order.quantity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.order_type === 'Buy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.order_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-700">
                    {typeof order.trigger_price_percent === 'string'
                      ? parseFloat(order.trigger_price_percent).toFixed(2)
                      : order.trigger_price_percent.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600 font-mono text-xs">
                    {order.tms_order_id || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {order.tms_status ? (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.tms_status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800'
                          : order.tms_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
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
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No orders found. Submit your first order above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
