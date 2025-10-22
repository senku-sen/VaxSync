import Sidebar from "../../components/Sidebar";

export default function Home() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="p-6">
        <h1>Main Content</h1>
      </main>
    </div>
  );
}
