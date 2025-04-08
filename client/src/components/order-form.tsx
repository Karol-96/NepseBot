import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderFormValues, orderFormSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PreviewModal } from "@/components/preview-modal";

export function OrderForm() {
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);

  // Form definition with validation
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      symbol: "",
      quantity: undefined,
      order_type: undefined,
      trigger_price_percent: undefined,
    },
  });

  // API mutation for submitting orders
  const orderMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order submitted successfully!",
        variant: "default",
      });
      
      // Reset form after successful submission
      form.reset();
      
      // Invalidate queries to refresh the orders list
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Preview form data before submission
  const onPreview = () => {
    const formState = form.getValues();
    // Only open preview if form is valid
    if (form.formState.isValid) {
      setPreviewOpen(true);
    } else {
      // Trigger validation to show error messages
      form.trigger();
    }
  };

  // Submit the order after preview confirmation
  const onSubmit = (data: OrderFormValues) => {
    orderMutation.mutate(data);
    setPreviewOpen(false);
  };

  return (
    <>
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Symbol Input */}
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-secondary-700">Symbol</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., GMLI"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-error-500 text-sm" />
              </FormItem>
            )}
          />

          {/* Quantity Input */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-secondary-700">Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage className="text-error-500 text-sm" />
              </FormItem>
            )}
          />

          {/* Order Type Selection */}
          <FormField
            control={form.control}
            name="order_type"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-secondary-700">Order Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-error-500 text-sm" />
              </FormItem>
            )}
          />

          {/* Trigger Price Input */}
          <FormField
            control={form.control}
            name="trigger_price_percent"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-secondary-700">Trigger Price (%)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 8"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-8"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      %
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-error-500 text-sm" />
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 py-2 px-4 border border-primary-500 text-primary-600 rounded-md shadow-sm hover:bg-primary-50"
              onClick={onPreview}
            >
              Preview
            </Button>
            <Button
              type="submit"
              disabled={orderMutation.isPending}
              className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700"
            >
              {orderMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Preview Modal */}
      <PreviewModal
        open={previewOpen}
        formData={form.getValues()}
        onConfirm={() => form.handleSubmit(onSubmit)()}
        onCancel={() => setPreviewOpen(false)}
      />
    </>
  );
}
