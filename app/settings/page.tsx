import MobileNav from "@/components/mobileBar";
import SideBar from "@/components/sideBar";
import { AccountSettings } from "@stackframe/stack";

export default function Settings() {
  return (
    <div className="md:ml-64">
      <SideBar currentPage="/settings" />
      <AccountSettings fullPage />
      <MobileNav currentPage="/settings" />
    </div>
  );
}
