import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, Users, AlertCircle, X, 
  Eye, MapPin, ShoppingBag
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getQueueEntryStatus } from "@/constaints/queueEntryStatusConst";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

const QueueMonitoring = () => {

  interface QueueEntryCountResponse {
    data: {
      totalCount: number;
    };
    additionalData: any;
    message: string;
    statusCode: number;
    code: string;
  }

  interface CustomerQueueEntryCountResponse {
    data: {
      totalCount: number;
    };
    additionalData: any;
    message: string;
    statusCode: number;
    code: string;
  }

  interface VendorForMonthResponse
  {
      data: {
          totalRecords: number;
          pageNumber: number;
          pageSize: number;
          totalPages: number;
          hasPreviousPage: boolean;
          hasNextPage: boolean;
          data: Vendor[];
        };
  additionalData: any;
  message: string;
  statusCode: number;
  code: string;
  }

  interface Vendor
  {
    id: string;
    address: string;
    name: string;
    logoUrl: string;
    lastUpdatedAgo: string;
    act: number;
    totalCustomerCount: number;
    status: string,
    complaints: number,
  }

  const [queueToday, setQueueToday] = useState(0);
  const [queueCustomerToday, setQueueCustomerToday] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [vendor, setVendors] = useState<Vendor[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 5;

  const formatToLocalDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchQueueEntryCount = async (dateString: string) => {
    try {
      const res = await api.get<CustomerQueueEntryCountResponse>(
        `/api/User/customer-waiting-count?date=${encodeURIComponent(dateString)}`
      );
      const totalCustomerQueueToday = res.data?.totalCount ?? 0;
      setQueueCustomerToday(totalCustomerQueueToday);
    } catch (error) {
      console.error("Error fetching total customer queue entry:", error);
    }
  };

  const fetchCustomerQueueEntryCount = async (dateString: string) => {
    try {
      const res = await api.get<QueueEntryCountResponse>(
        `/api/QueueEntry/queue-entry-count?date=${encodeURIComponent(dateString)}`
      );
      const totalQueueToday = res.data?.totalCount ?? 0;
      setQueueToday(totalQueueToday);
    } catch (error) {
      console.error("Error fetching total queue entry:", error);
    }
  };

  const fetchVendorsQueue = async (dateString: string, page: number = 1) => {
    try {
      setLoading(true);
  
      const res = await api.get<VendorForMonthResponse>(
        `/api/vendor/vendor-queue?date=${encodeURIComponent(dateString)}&PageNumber=${page}&PageSize=${PAGE_SIZE}`
      );
  
      const response = res.data;
  
      setVendors(response.data ?? []);
      setTotalPages(response.totalPages ?? 1);
      setTotalRecords(response.totalRecords ?? 0);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    fetchQueueEntryCount(formatToLocalDateString(date));
    fetchCustomerQueueEntryCount(formatToLocalDateString(date));
    fetchVendorsQueue(formatToLocalDateString(selectedDate), pageNumber);
  };

  useEffect(() => {
    fetchQueueEntryCount(formatToLocalDateString(selectedDate));
    fetchCustomerQueueEntryCount(formatToLocalDateString(selectedDate));
    fetchVendorsQueue(formatToLocalDateString(selectedDate), pageNumber);
  }, [selectedDate, pageNumber]);

  const complaints = [
    {
      id: 1,
      customerName: "Nguyễn A",
      vendorName: "Bánh Mì Express",
      issue: "Chờ lâu nhưng không có thông báo",
      priority: "cao",
      time: "5 phút trước"
    },
    {
      id: 2,
      customerName: "Trần B",
      vendorName: "Coffee House",
      issue: "Đơn hàng bị bỏ qua",
      priority: "trung bình",
      time: "10 phút trước"
    }
  ];

  const handleForceClose = (queueId: string) => {
    console.log("Buộc đóng hàng đợi:", queueId);
  };

  const handleViewDetails = (queueId: string) => {
    console.log("Xem chi tiết hàng đợi:", queueId);
  };

  return (
    <AdminLayout title="Giám sát hàng đợi">
      <div className="space-y-6">

        <div className="mb-4 flex items-center gap-2">
        <label htmlFor="queueDate" className="font-medium">Chọn ngày:</label>
        <DatePicker
          id="queueDate"
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          className="border rounded px-2 py-1"
        />
        <Calendar className="w-5 h-5 text-gray-500" />
      </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{queueToday.toLocaleString()}</div>
                <p className="text-muted-foreground">Hàng đợi đang hoạt động</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{queueCustomerToday.toLocaleString()}</div>
                <p className="text-muted-foreground">Khách đang chờ</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-destructive">4</div>
                <p className="text-muted-foreground">Phàn nàn đang xử lý</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hàng đợi hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendor.map((vendor) => (
                <div key={vendor.id} className="border rounded-lg p-4">
                  <div className="grid lg:grid-cols-5 gap-4 items-center">
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{vendor.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {vendor.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cập nhật {vendor.lastUpdatedAgo}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold">{vendor.totalCustomerCount.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" />
                        Khách đang chờ
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold">{vendor.act}</div>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        Thời gian trung bình
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={
                            vendor.status === "normal" ? "default" : 
                            vendor.status === "overloaded" ? "destructive" : "secondary"
                          }
                        >
                          {vendor.status === "normal" ? "Bình thường" : "Quá tải"}
                        </Badge>
                        {vendor.complaints > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {vendor.complaints}
                          </Badge>
                        )}
                      </div>
                      
                      {/* <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(vendor.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleForceClose(vendor.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div> */}
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((prev) => prev - 1)}
                  >
                    Trang trước
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    Trang {pageNumber} / {totalPages}
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageNumber >= totalPages}
                    onClick={() => setPageNumber((prev) => prev + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        {/* Danh sách khiếu nại */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Phàn nàn gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{complaint.customerName}</h4>
                        <span className="text-sm text-muted-foreground">tại</span>
                        <span className="font-medium text-sm">{complaint.vendorName}</span>
                        <Badge 
                          variant={complaint.priority === "cao" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {complaint.priority === "cao" ? "Cao" : "Trung bình"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{complaint.issue}</p>
                      <p className="text-xs text-muted-foreground mt-1">{complaint.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Phân công
                      </Button>
                      <Button size="sm">
                        Xử lý
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </AdminLayout>
  );
};

export default QueueMonitoring;
