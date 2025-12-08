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
      <TabsList
        className="
          grid w-full grid-cols-3
          rounded-xl bg-muted/40 p-1 shadow-sm border border-border h-11
        "
      >
        <TabsTrigger
          value="registration"
          className="
            w-full rounded-lg text-sm transition-all
            data-[state=active]:bg-white
            data-[state=active]:font-semibold
            data-[state=active]:text-primary
            data-[state=active]:border
            data-[state=active]:border-primary
            data-[state=active]:shadow-sm
          "
        >
          Thông tin
        </TabsTrigger>

        <TabsTrigger
          value="preorder"
          className="
            w-full rounded-lg text-sm transition-all
            data-[state=active]:bg-white
            data-[state=active]:font-semibold
            data-[state=active]:text-primary
            data-[state=active]:border
            data-[state=active]:border-primary
            data-[state=active]:shadow-sm
          "
        >
          Đặt trước
        </TabsTrigger>

        <TabsTrigger
          value="account"
          className="
            w-full rounded-lg text-sm transition-all
            data-[state=active]:bg-white
            data-[state=active]:font-semibold
            data-[state=active]:text-primary
            data-[state=active]:border
            data-[state=active]:border-primary
            data-[state=active]:shadow-sm
          "
        >
          Quán của bạn
        </TabsTrigger>
      </TabsList>

      <TabsContent value="registration">
        <RegistrationSection vendor={vendor} editable={isEditable} />
      </TabsContent>

      <TabsContent value="preorder">
        {vendor?.id ? (
          <SettingsPreOrder vendorId={vendor.id} />
        ) : (
          <p>Chưa tải được quán.</p>
        )}
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