import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Order, TRIGGER_STATUS } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TriggerOrdersTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);

  // Fetch trigger orders
  const { data: triggerOrders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['/api/trigger-orders'],
    retry: 1
  });

  // Mutation for cancelling an order
  const cancelMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest('POST', `/api/trigger-orders/${orderId}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: 'Order cancelled',
        description: 'The trigger order has been cancelled successfully.',
      });
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ['/api/trigger-orders'] });
      setCancelOrderId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to cancel order. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to cancel order:', error);
      setCancelOrderId(null);
    },
  });

  // Handle cancel button click
  const handleCancelClick = (orderId: number) => {
    setCancelOrderId(orderId);
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    if (cancelOrderId) {
      cancelMutation.mutate(cancelOrderId);
    }
  };

  // Handle cancel dialog close
  const handleCancelDialogClose = () => {
    setCancelOrderId(null);
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
    
    switch (status) {
      case TRIGGER_STATUS.PENDING:
        variant = 'outline';
        break;
      case TRIGGER_STATUS.MONITORING:
        variant = 'default';
        break;
      case TRIGGER_STATUS.TRIGGERED:
        variant = 'secondary';
        break;
      case TRIGGER_STATUS.EXECUTED:
        variant = 'secondary';
        break;
      case TRIGGER_STATUS.CANCELLED:
        variant = 'destructive';
        break;
      case TRIGGER_STATUS.FAILED:
        variant = 'destructive';
        break;
      default:
        variant = 'outline';
    }
    
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (isLoading) {
    return <div>Loading trigger orders...</div>;
  }

  if (error) {
    return <div>Error loading trigger orders. Please try again.</div>;
  }

  if (!triggerOrders || triggerOrders.length === 0) {
    return <div>No trigger orders found. Create a trigger order to see it here.</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Trigger Orders</h3>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Target Price</TableHead>
              <TableHead>Trigger %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {triggerOrders.map((order: Order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell className="font-medium">{order.symbol}</TableCell>
                <TableCell>{order.order_type}</TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>{parseFloat(order.base_price || '0').toFixed(2)}</TableCell>
                <TableCell>{parseFloat(order.target_price || '0').toFixed(2)}</TableCell>
                <TableCell>{order.trigger_price_percent}%</TableCell>
                <TableCell>{renderStatusBadge(order.trigger_status || 'UNKNOWN')}</TableCell>
                <TableCell>{new Date(order.submitted_at).toLocaleString()}</TableCell>
                <TableCell>
                  {(order.trigger_status === TRIGGER_STATUS.PENDING || 
                    order.trigger_status === TRIGGER_STATUS.MONITORING) && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleCancelClick(order.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelOrderId !== null} onOpenChange={handleCancelDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Trigger Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this trigger order? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}