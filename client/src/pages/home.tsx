import { OrderForm } from "@/components/order-form";
import { OrdersTable } from "@/components/orders-table";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="font-sans text-secondary-800">
      <div className="bg-gradient-to-b from-primary-50 to-white py-12 mb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800">
                Trading Order System
              </span>
            </h1>
            <p className="text-secondary-600 max-w-2xl mx-auto text-lg">
              Submit and manage your trading orders quickly and securely with our professional order management system.
            </p>
            <div className="flex justify-center mt-4">
              <div className="inline-flex items-center text-primary-600 bg-primary-50 px-3 py-1 rounded-full text-sm">
                <span className="mr-1 font-medium">New</span>
                <span>TMS integration now available</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">
        {/* Order Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">Submit New Order</h2>
          <OrderForm />
        </div>

        {/* Recent Orders Section */}
        <OrdersTable />
      </div>
    </div>
  );
}
