// src/components/vendor/tabs/SettingsTab.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegistrationSection from "../RegistrationSection";
import SettingsMenu from "@/components/vendor/SettingsMenu";
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
        <TabsTrigger value="menu">Thực đơn</TabsTrigger>
        <TabsTrigger value="debt">Công nợ</TabsTrigger>
        <TabsTrigger value="preorder">Đặt trước</TabsTrigger>
        <TabsTrigger value="account">Tài khoản</TabsTrigger>
      </TabsList>

      <TabsContent value="registration">
        <RegistrationSection vendor={vendor} editable={isEditable} />
      </TabsContent>

      <TabsContent value="menu">
        {vendor ? <SettingsMenu vendorId={vendor.id} /> : <p>Chưa tải được quán.</p>}
      </TabsContent>

      <TabsContent value="debt"><SettingsDebt /></TabsContent>
      <TabsContent value="preorder"><SettingsPreOrder /></TabsContent>
      <TabsContent value="account"><SettingsAccount /></TabsContent>
    </Tabs>
  );
}
