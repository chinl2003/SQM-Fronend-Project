import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingBag, MapPin, Clock, Phone, Mail, FileText, 
  CreditCard, CheckCircle, XCircle, AlertTriangle,
  DollarSign, Calendar, Menu as MenuIcon, ImageIcon
} from "lucide-react";
import { useState } from "react";

interface VendorDetailProps {
  vendor: any;
  onClose: () => void;
  onApprove: (vendorId: number) => void;
  onReject: (vendorId: number) => void;
}

const VendorDetail = ({ vendor, onClose, onApprove, onReject }: VendorDetailProps) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  const MONTHLY_FEE = 500000; // 500,000 VND
  const SLOT_FEE = 500000;    // 500,000 VND (same as monthly fee)
  
  const vendorData = {
    // Basic Info
    basicInfo: {
      brandName: vendor.name,
      address: vendor.location,
      businessType: vendor.type,
      openingHours: "06:00 - 22:00",
      phone: "+84 901 234 567",
      email: "info@phohanoi.com",
      logo: "/placeholder-logo.jpg"
    },
    // Legal Info
    legalInfo: {
      businessLicense: "GPKDoi230001",
      foodSafetyLicense: "FS2024001",
      ownerIdCard: "079123456789",
      licenseImages: [
        "/license1.jpg", "/license2.jpg", "/id-card.jpg"
      ]
    },
    // Financial Info
    financialInfo: {
      bankAccount: "1234567890 - Vietcombank",
      ewallet: "0901234567 - MoMo",
      invoiceInfo: "Công ty TNHH Phở Hà Nội",
      taxCode: "0123456789"
    },
    // Payment Status
    paymentStatus: {
      slotFeePaid: vendor.status === "approved",
      slotFeeAmount: SLOT_FEE,
      monthlyFeeStatus: vendor.status === "approved" ? "paid" : "pending",
      monthlyFeeAmount: MONTHLY_FEE,
      nextPaymentDate: "2024-02-01",
      outstandingAmount: vendor.status === "suspended" ? 250000 : 0
    },
    // Menu (if available)
    menu: vendor.status === "menu_pending" ? [
      { name: "Phở Bò Tái", price: "55,000đ", prepTime: "8 phút", capacity: 20 },
      { name: "Phở Gà", price: "50,000đ", prepTime: "6 phút", capacity: 25 },
      { name: "Bún Bò Huế", price: "60,000đ", prepTime: "10 phút", capacity: 15 }
    ] : [],
    // Terms accepted
    termsAccepted: {
      tosAccepted: true,
      antiGamingCommitment: true,
      dataAnalyticsConsent: true,
      acceptedDate: "2024-01-15"
    }
  };

  const handleApprovalConfirm = () => {
    onApprove(vendor.id);
    setShowApprovalModal(false);
  };

  const getPaymentStatusBadge = () => {
    if (vendorData.paymentStatus.slotFeePaid && vendorData.paymentStatus.monthlyFeeStatus === "paid") {
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Đã thanh toán
      </Badge>;
    } else if (vendorData.paymentStatus.outstandingAmount > 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Nợ {vendorData.paymentStatus.outstandingAmount.toLocaleString('vi-VN')}đ
      </Badge>;
    } else {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Chờ thanh toán
      </Badge>;
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              Chi tiết Vendor - {vendorData.basicInfo.brandName}
            </DialogTitle>
            <DialogDescription>
              Thông tin đăng ký và trạng thái thanh toán của vendor
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            {/* Payment Status Overview */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Trạng thái Thanh toán
                  </span>
                  {getPaymentStatusBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Phí thuê slot:</span>
                    <span className="font-semibold">
                      {vendorData.paymentStatus.slotFeeAmount.toLocaleString('vi-VN')}đ
                      {vendorData.paymentStatus.slotFeePaid && 
                        <CheckCircle className="w-4 h-4 text-success inline ml-2" />
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí sàn tháng này:</span>
                    <span className="font-semibold">
                      {vendorData.paymentStatus.monthlyFeeAmount.toLocaleString('vi-VN')}đ
                      {vendorData.paymentStatus.monthlyFeeStatus === "paid" && 
                        <CheckCircle className="w-4 h-4 text-success inline ml-2" />
                      }
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ngày thanh toán tiếp theo:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {vendorData.paymentStatus.nextPaymentDate}
                    </span>
                  </div>
                  {vendorData.paymentStatus.outstandingAmount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Số tiền nợ:</span>
                      <span className="font-semibold">
                        {vendorData.paymentStatus.outstandingAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Thông tin Cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tên thương hiệu</label>
                    <p className="font-semibold">{vendorData.basicInfo.brandName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Địa chỉ hoạt động</label>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {vendorData.basicInfo.address}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Loại hình</label>
                      <p>{vendorData.basicInfo.businessType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Giờ hoạt động</label>
                      <p className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {vendorData.basicInfo.openingHours}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{vendorData.basicInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{vendorData.basicInfo.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Thông tin Pháp lý
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Giấy phép kinh doanh</label>
                    <p className="font-semibold">{vendorData.legalInfo.businessLicense}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Chứng nhận VSATTP</label>
                    <p className="font-semibold">{vendorData.legalInfo.foodSafetyLicense}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CMND/CCCD chủ quán</label>
                    <p className="font-semibold">{vendorData.legalInfo.ownerIdCard}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Hình ảnh giấy tờ</label>
                    <div className="flex gap-2">
                      {vendorData.legalInfo.licenseImages.map((img, index) => (
                        <div key={index} className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Thông tin Tài chính
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tài khoản ngân hàng</label>
                    <p className="font-semibold">{vendorData.financialInfo.bankAccount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ví điện tử</label>
                    <p className="font-semibold">{vendorData.financialInfo.ewallet}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Thông tin xuất hóa đơn</label>
                    <p>{vendorData.financialInfo.invoiceInfo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mã số thuế</label>
                    <p>{vendorData.financialInfo.taxCode}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Terms & Commitments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Điều khoản & Cam kết
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Chấp nhận Terms of Service</span>
                    {vendorData.termsAccepted.tosAccepted ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cam kết không gian lận</span>
                    {vendorData.termsAccepted.antiGamingCommitment ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Đồng ý cung cấp analytics</span>
                    {vendorData.termsAccepted.dataAnalyticsConsent ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    Ngày chấp nhận: {vendorData.termsAccepted.acceptedDate}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Menu Section (if available) */}
            {vendorData.menu.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MenuIcon className="w-5 h-5" />
                    Thông tin Menu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {vendorData.menu.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Thời gian chế biến: {item.prepTime} | Capacity: {item.capacity} suất
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            {vendor.status === "pending" && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => onReject(vendor.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Từ chối
                </Button>
                <Button onClick={() => setShowApprovalModal(true)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Xét duyệt
                </Button>
              </>
            )}
            {vendor.status === "approved" && (
              <Button>
                <MenuIcon className="w-4 h-4 mr-2" />
                Yêu cầu cập nhật Menu
              </Button>
            )}
            {vendor.status === "menu_pending" && (
              <Button>
                <CheckCircle className="w-4 h-4 mr-2" />
                Phê duyệt hoạt động
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận Xét duyệt</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xét duyệt vendor "{vendorData.basicInfo.brandName}" không?
              <br />
              Sau khi xét duyệt, vendor sẽ được yêu cầu cập nhật menu để hoạt động.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleApprovalConfirm}>
              Xác nhận Duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorDetail;