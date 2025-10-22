import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
export default function Home() {
  return (
    <div className="flex">
      <Sidebar />
      <Header
        title="Inventory"
        subtitle="Manage your vaccine inventory here."
      />

      <main className="p-6">
        <h1>Main Content</h1>
      </main>
    </div>
  );
}
