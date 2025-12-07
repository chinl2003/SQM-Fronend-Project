// src/components/vendor/tabs/MenuTab.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SettingsMenu from "@/components/vendor/SettingsMenu";
import { ApiVendor } from "@/types/api/vendor";

export default function MenuTab({ vendor }: { vendor: ApiVendor }) {
  return (
    <CardContent>
        {vendor ? (
          <SettingsMenu vendorId={vendor.id} />
        ) : (
          <p className="text-muted-foreground">Không thể tải dữ liệu thực đơn.</p>
        )}
      </CardContent>
  );
}