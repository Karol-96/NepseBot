import { OrderForm } from "@/components/order-form";
import { OrdersTable } from "@/components/orders-table";

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans text-secondary-800">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-800 mb-2">Order Submission</h1>
          <p className="text-secondary-700">Enter your order details below</p>
        </header>

        {/* Order Form */}
        <OrderForm />

        {/* Recent Orders Section */}
        <OrdersTable />
      </div>
    </div>
  );
}
