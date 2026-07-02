import MobileLayoutWrapper from "@/components/layout/MobileLayoutWrapper";
import OfflineSyncProvider from "@/components/providers/OfflineSyncProvider";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Tarik UUID user login langsung di sisi server (Aman & Cepat)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const authUserId = user?.id || "";

  return (
    // 2. Antena Auto-Sync tetap siaga membungkus dari luar
    <OfflineSyncProvider authUserId={authUserId}>
      {/* 3. Wrapper Client Component masuk ke sini untuk mengurusi Hamburger Menu */}
      <MobileLayoutWrapper>
        {children}
      </MobileLayoutWrapper>
    </OfflineSyncProvider>
  );
}