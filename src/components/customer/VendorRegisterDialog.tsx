import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, Camera, Upload, Shield, FileText, DollarSign, AlertTriangle } from "lucide-react";

type VendorRegisterDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  // Bạn có thể thêm onSubmit, defaultValues... nếu cần
};

export function VendorRegisterDialog({ isOpen, onClose }: VendorRegisterDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Đăng ký cửa hàng</DialogTitle>
          <DialogDescription>Điền thông tin bên dưới để tạo cửa hàng của bạn.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="registration" className="w-full">
          <TabsList>
            <TabsTrigger value="registration">Đăng ký</TabsTrigger>
          </TabsList>

          <TabsContent value="registration" className="space-y-6">
            {/* Thông tin cơ bản */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Thông tin cơ bản về quán *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Tên quán / thương hiệu *</Label>
                    <Input id="brandName" placeholder="Nhập tên quán" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Loại hình kinh doanh *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại hình" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="street-food">Street Food</SelectItem>
                        <SelectItem value="drinks">Đồ uống</SelectItem>
                        <SelectItem value="bakery">Bánh</SelectItem>
                        <SelectItem value="fast-food">Fast Food</SelectItem>
                        <SelectItem value="others">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ hoạt động *</Label>
                  <Input id="address" placeholder="Nhập địa chỉ chi tiết" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openingHours">Giờ hoạt động *</Label>
                    <Input id="openingHours" placeholder="VD: 08:00 - 22:00" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input id="phone" placeholder="Nhập số điện thoại" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email liên hệ *</Label>
                    <Input id="email" type="email" placeholder="Nhập email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo">Hình ảnh/Logo quán *</Label>
                    <div className="flex items-center gap-2">
                      <Input id="logo" type="file" accept="image/*" required />
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pháp lý */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Thông tin pháp lý / xác thực *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessLicense">Giấy phép kinh doanh *</Label>
                  <div className="flex items-center gap-2">
                    <Input id="businessLicense" type="file" accept="image/*" required />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foodSafety">Giấy chứng nhận vệ sinh an toàn thực phẩm *</Label>
                  <div className="flex items-center gap-2">
                    <Input id="foodSafety" type="file" accept="image/*" required />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idCard">CMND/CCCD của chủ quán *</Label>
                  <div className="flex items-center gap-2">
                    <Input id="idCard" type="file" accept="image/*" required />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tài chính */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Thông tin tài chính / thanh toán *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Tài khoản ngân hàng / ví điện tử *</Label>
                  <Input id="bankAccount" placeholder="Nhập số tài khoản" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Tên ngân hàng *</Label>
                  <Input id="bankName" placeholder="Nhập tên ngân hàng" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Tên chủ tài khoản *</Label>
                  <Input id="accountHolder" placeholder="Nhập tên chủ tài khoản" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceInfo">Thông tin xuất hóa đơn</Label>
                  <Textarea id="invoiceInfo" placeholder="Nhập thông tin xuất hóa đơn (nếu có)" />
                </div>
              </CardContent>
            </Card>

            {/* Điều khoản */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Điều khoản & cam kết *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="terms" required />
                  <Label htmlFor="terms">Tôi chấp nhận Terms of Service & Policy *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="commitment1" required />
                  <Label htmlFor="commitment1">Cam kết không gian lận hàng chờ, không ghost order *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="commitment2" required />
                  <Label htmlFor="commitment2">Đồng ý cung cấp dữ liệu vận hành cho mục đích analytics *</Label>
                </div>
              </CardContent>
            </Card>

            {/* Chi phí & thanh toán */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <DollarSign className="h-5 w-5" />
                  Thông tin chi phí
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Phí đăng ký lần đầu:</Label>
                    <p className="text-lg font-bold text-green-600">500,000 VND</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phí hàng tháng:</Label>
                    <p className="text-lg font-bold text-blue-600">200,000 VND/tháng</p>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Quy định thanh toán:</strong><br />
                    • Thời hạn: Trước ngày 30 mỗi tháng<br />
                    • Chậm thanh toán: Shop bị khóa và không hoàn lại phí thuê slot<br />
                    • Phí phạt mở lại: 50% phí thuê slot + số tiền nợ tháng trước<br />
                    • Yêu cầu đóng shop: Phải tạo yêu cầu trước 1 tháng
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Phương thức thanh toán</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức thanh toán" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vnpay">VNPay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">Thanh toán và gửi yêu cầu đăng ký</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
