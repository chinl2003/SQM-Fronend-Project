import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Store, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Camera, 
  FileText, 
  CreditCard, 
  Shield, 
  DollarSign,
  AlertTriangle,
  Upload,
  Trash2,
  Plus,
  Settings,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { api } from "@/lib/api";

const VendorSettings = () => {
  useEffect(() => {
  const loadRegistrationFee = async () => {
    try {
      setLoadingFee(true);

      const token = localStorage.getItem("accessToken") || "";
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.get("/api/systemSetting", headers);
      const data = res;

      if (data?.registrationFee !== undefined) {
        setRegistrationFee(data.registrationFee);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không tải được phí đăng ký quán");
    } finally {
      setLoadingFee(false);
    }
  };

  loadRegistrationFee();
}, []);
  const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [preOrderEnabled, setPreOrderEnabled] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<number | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [slots, setSlots] = useState([
    { id: 1, timeFrom: '09:00', timeTo: '12:00', maxQueue: 20 },
    { id: 2, timeFrom: '13:00', timeTo: '18:00', maxQueue: 30 }
  ]);
  const [categories, setCategories] = useState([
    { 
      id: 1, 
      name: 'Đồ ăn chính', 
      items: [
        { id: 1, name: 'Pizza Margherita', price: 120000, image: '', description: 'Pizza truyền thống với cà chua và phô mai', preparationTime: 15 },
        { id: 2, name: 'Pasta Carbonara', price: 95000, image: '', description: 'Mì Ý với sốt kem và thịt xông khói', preparationTime: 12 }
      ]
    },
    { 
      id: 2, 
      name: 'Đồ uống', 
      items: [
        { id: 3, name: 'Coca Cola', price: 15000, image: '', description: 'Nước ngọt có ga', preparationTime: 2 }
      ]
    }
  ]);
  
  const addSlot = () => {
    const newSlot = {
      id: slots.length + 1,
      timeFrom: '09:00',
      timeTo: '12:00',
      maxQueue: 20
    };
    setSlots([...slots, newSlot]);
  };

  const removeSlot = (id: number) => {
    setSlots(slots.filter(slot => slot.id !== id));
  };

  const addCategory = () => {
    const newCategory = {
      id: categories.length + 1,
      name: 'Danh mục mới',
      items: []
    };
    setCategories([...categories, newCategory]);
  };

  const addMenuItem = (categoryId: number) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        const newItem = {
          id: Math.max(...cat.items.map(item => item.id), 0) + 1,
          name: 'Món ăn mới',
          price: 0,
          image: '',
          description: '',
          preparationTime: 10
        };
        return { ...cat, items: [...cat.items, newItem] };
      }
      return cat;
    });
    setCategories(updatedCategories);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="registration" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="registration">Đăng ký</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="billing">Công nợ</TabsTrigger>
          <TabsTrigger value="preorder">Pre-order</TabsTrigger>
          <TabsTrigger value="account">Tài khoản</TabsTrigger>
        </TabsList>

        {/* Registration Tab */}
        <TabsContent value="registration" className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
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
                  <p className="text-lg font-bold text-green-600">{loadingFee
                    ? "Đang tải..."
                    : registrationFee !== null
                      ? `${registrationFee.toLocaleString("en-US")} VND`
                      : ""}</p>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Quy định thanh toán:</strong>
                      <br />
                      • Thời hạn: Theo công nợ từ hệ thống gửi mỗi tháng qua mail
                      <br />
                      • Chậm thanh toán: Quán của bạn sẽ bị khóa 
                      <br />
                      • Phí phạt mở lại: 50% phí đăng kí + số tiền nợ tháng
                      trước
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

              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Thanh toán và gửi yêu cầu đăng ký
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Quản lý Menu</h2>
            <Button onClick={addCategory} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm danh mục
            </Button>
          </div>

          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {category.name}
                  </CardTitle>
                  <Button 
                    onClick={() => addMenuItem(category.id)}
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm món
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {category.items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label>Tên món</Label>
                          <Input defaultValue={item.name} />
                        </div>
                        <div className="space-y-2">
                          <Label>Giá bán (VND)</Label>
                          <Input type="number" defaultValue={item.price} />
                        </div>
                        <div className="space-y-2">
                          <Label>Thời gian chế biến (phút) *</Label>
                          <Input type="number" defaultValue={item.preparationTime || 10} required min="1" />
                        </div>
                        <div className="space-y-2">
                          <Label>Hình ảnh</Label>
                          <Input type="file" accept="image/*" />
                        </div>
                        <div className="space-y-2">
                          <Label>Mô tả</Label>
                          <Textarea defaultValue={item.description} />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Quản lý công nợ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Tiền sắp phải thanh toán</p>
                  <p className="text-2xl font-bold text-red-600">200,000 VND</p>
                  <p className="text-xs text-muted-foreground">Hạn: 30/12/2024</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Tổng đã thanh toán</p>
                  <p className="text-2xl font-bold text-green-600">1,400,000 VND</p>
                  <p className="text-xs text-muted-foreground">7 tháng</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge variant="destructive">Có công nợ</Badge>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Thanh toán qua VNPay
              </Button>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4">Lịch sử giao dịch</h3>
                <div className="space-y-2">
                  {[
                    { date: '01/11/2024', amount: '200,000 VND', status: 'Thành công', method: 'VNPay' },
                    { date: '01/10/2024', amount: '200,000 VND', status: 'Thành công', method: 'VNPay' },
                    { date: '01/09/2024', amount: '200,000 VND', status: 'Thành công', method: 'VNPay' }
                  ].map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{transaction.date}</p>
                        <p className="text-sm text-muted-foreground">{transaction.method}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{transaction.amount}</p>
                        <Badge variant="secondary">{transaction.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pre-order Tab */}
        <TabsContent value="preorder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cài đặt Pre-order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Quản lý Slot thời gian</h3>
                  <Button onClick={addSlot} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm slot
                  </Button>
                </div>

                {slots.map((slot) => (
                  <div key={slot.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Từ giờ</Label>
                        <Input type="time" defaultValue={slot.timeFrom} />
                      </div>
                      <div className="space-y-2">
                        <Label>Đến giờ</Label>
                        <Input type="time" defaultValue={slot.timeTo} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tối đa hàng đợi</Label>
                        <Input type="number" defaultValue={slot.maxQueue} />
                      </div>
                      <Button 
                        onClick={() => removeSlot(slot.id)}
                        variant="destructive" 
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quản lý tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Yêu cầu xóa shop
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yêu cầu xóa shop</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deleteReason">Lý do xóa shop *</Label>
                      <Textarea 
                        id="deleteReason" 
                        placeholder="Vui lòng cho biết lý do bạn muốn xóa shop..."
                        required 
                      />
                    </div>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Yêu cầu xóa shop cần được gửi trước 1 tháng. Sau khi được duyệt, 
                        bạn sẽ nhận lại phí thuê slot ban đầu.
                      </AlertDescription>
                    </Alert>
                    <Button className="w-full" variant="destructive">
                      Gửi yêu cầu xóa shop
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Trạng thái đăng ký</h3>
                <div className="flex items-center gap-2">
                  {registrationStatus === 'pending' && (
                    <>
                      <Badge variant="secondary">Đang chờ duyệt</Badge>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                  {registrationStatus === 'approved' && (
                    <>
                      <Badge variant="default" className="bg-green-100 text-green-800">Đã duyệt</Badge>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </>
                  )}
                  {registrationStatus === 'rejected' && (
                    <>
                      <Badge variant="destructive">Bị từ chối</Badge>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorSettings;