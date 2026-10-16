import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import { QueueProvider } from "../../context/QueueContext";

// Business pages use the signed-in user's own shop (chosen by the backend from the token).
export default function BusinessLayout() {
  return (
    <QueueProvider mode="business">
      <main className="mx-auto w-full max-w-3xl px-4 pb-36 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6">
        <Outlet />
      </main>
      <BottomNav role="business" />
    </QueueProvider>
  );
}
