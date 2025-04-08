import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderFormValues } from "@shared/schema";

interface PreviewModalProps {
  open: boolean;
  formData: OrderFormValues;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PreviewModal({ open, formData, onConfirm, onCancel }: PreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-secondary-800">Confirm Your Order</DialogTitle>
        </DialogHeader>
        <div className="p-4 bg-primary-50 rounded-md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-700">Symbol</p>
                <p className="font-medium text-secondary-800">{formData.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-700">Quantity</p>
                <p className="font-medium text-secondary-800">{formData.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-700">Order Type</p>
                <p className="font-medium text-secondary-800">{formData.order_type}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-700">Trigger Price</p>
                <p className="font-medium text-secondary-800">{formData.trigger_price_percent}%</p>
              </div>
            </div>
            <div className="mt-2 pt-4 border-t border-gray-200">
              <p className="text-sm text-secondary-700">Please review your order details before submission.</p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
