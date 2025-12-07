// src/components/vendor/tabs/SettingsTab.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegistrationSection from "../RegistrationSection";
import SettingsDebt from "@/components/vendor/SettingsDebt";
import SettingsPreOrder from "@/components/vendor/SettingsPreOrder";
import SettingsAccount from "@/components/vendor/SettingsAccount";

export default function SettingsTab({ vendor }: any) {
  const isEditable = ["draft", "pendingreview"].includes(
    (vendor?.status || "").toString().toLowerCase()
  );

  return (
    <Tabs defaultValue="registration" className="space-y-4">
      <TabsList className="flex w-full justify-start rounded-xl bg-muted/40 p-1 shadow-sm border border-border h-10">
        <TabsTrigger value="registration">Thông tin</TabsTrigger>
        {/* THAY Thực đơn bằng Pre-order */}
        <TabsTrigger value="preorder">Đặt trước</TabsTrigger>
        <TabsTrigger value="debt">Công nợ</TabsTrigger>
        <TabsTrigger value="account">Quán của bạn</TabsTrigger>
      </TabsList>

      <TabsContent value="registration">
        <RegistrationSection vendor={vendor} editable={isEditable} />
      </TabsContent>

      {/* TAB PRE-ORDER MỚI */}
      <TabsContent value="preorder">
        {vendor?.id ? (
          <SettingsPreOrder vendorId={vendor.id} />
        ) : (
          <p>Chưa tải được quán.</p>
        )}
      </TabsContent>

      <TabsContent value="debt">
        <SettingsDebt />
      </TabsContent>

      <TabsContent value="account">
        {vendor?.id ? (
          <SettingsAccount vendorId={vendor.id} />
        ) : (
          <p>Chưa tải được quán.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}