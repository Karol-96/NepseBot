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
      tms_username: "",
      tms_password: "",
    },
  });

  // API mutation for submitting orders
  const orderMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.tms_message || "Order submitted successfully!",
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
                    className="w-full px-4 py-2 border border-primary-200 rounded-md shadow-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
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
                    className="w-full px-4 py-2 border border-primary-200 rounded-md shadow-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
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
                    <SelectTrigger className="w-full px-4 py-2 border border-primary-200 rounded-md shadow-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 bg-white">
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
                      className="w-full px-4 py-2 border border-primary-200 rounded-md shadow-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 pr-8"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary-500">
                      %
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-error-500 text-sm" />
              </FormItem>
            )}
          />
          
          {/* TMS Credentials Section */}
          <div className="mt-8 pt-6 border-t border-primary-100">
            <div className="flex items-center mb-4">
              <div className="w-1 h-5 bg-primary-400 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-primary-800">TMS Account Credentials</h3>
            </div>
            <div className="bg-primary-50 rounded-md p-4 mb-5 border border-primary-100">
              <p className="text-sm text-secondary-700 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Enter your Trading Management System (TMS) credentials to authenticate and place orders directly. 
                Your credentials are securely used for the current session only and are never stored permanently.
              </p>
            </div>
            
            {/* TMS Username */}
            <FormField
              control={form.control}
              name="tms_username"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-secondary-700">TMS Username</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter your TMS username"
                      className="w-full px-4 py-2 border border-primary-200 rounded-md shadow-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-error-500 text-sm" />
                </FormItem>
              )}
            />
            
            {/* TMS Password */}
            <FormField
              control={form.control}
              name="tms_password"
              render={({ field }) => (
                <FormItem className="space-y-2 mt-4">
                  <FormLabel className="text-sm font-medium text-secondary-700">TMS Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your TMS password"
                      className="w-full px-4 py-2 border border-primary-200 rounded-md shadow-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-error-500 text-sm" />
                </FormItem>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 py-2.5 px-4 border border-primary-300 text-primary-700 rounded-md shadow-sm hover:bg-primary-50 font-medium"
              onClick={onPreview}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Preview Order
            </Button>
            <Button
              type="submit"
              disabled={orderMutation.isPending}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-md shadow-sm hover:from-primary-700 hover:to-primary-600 font-medium"
            >
              {orderMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Submit Order
                </>
              )}
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
