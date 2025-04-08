import { OrderForm } from "@/components/order-form";
import { OrdersTable } from "@/components/orders-table";
import { TriggerOrdersTable } from "@/components/trigger-orders-table";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="font-sans text-secondary-800">
      <div className="bg-gradient-to-b from-primary-100 to-primary-50/50 py-12 mb-8 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-300"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary-200/50 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-primary-300/40 blur-3xl"></div>
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-700 via-primary-600 to-primary-800">
                Trading Order System
              </span>
            </h1>
            <p className="text-secondary-700 max-w-2xl mx-auto text-lg">
              Submit and manage your trading orders quickly and securely with our professional order management system.
            </p>
            <div className="flex justify-center mt-6">
              <div className="inline-flex items-center text-primary-700 bg-primary-100 border border-primary-200 px-4 py-2 rounded-full text-sm shadow-sm">
                <div className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse"></div>
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-primary-100">
          <div className="flex items-center mb-4">
            <div className="w-1 h-6 bg-primary-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-semibold text-secondary-800">Submit New Order</h2>
          </div>
          <OrderForm />
        </div>

        {/* Trigger Orders Section */}
        <div className="mb-8">
          <TriggerOrdersTable />
        </div>

        {/* Recent Orders Section */}
        <OrdersTable />
      </div>
    </div>
  );
}
