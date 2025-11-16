import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Star, ThumbsUp, ThumbsDown, Flag, 
  MessageSquare, CheckCircle, XCircle
} from "lucide-react";

const ReviewModeration = () => {
  const reviews = [
    {
      id: 1,
      customerName: "Nguyễn Văn A",
      vendorName: "Phở Hà Nội",
      rating: 5,
      review: "Thức ăn tuyệt vời và phục vụ nhanh! Hệ thống xếp hàng hoạt động rất tốt.",
      status: "pending",
      date: "2024-01-20",
      flagged: false,
      avatar: "NA"
    },
    {
      id: 2,
      customerName: "Trần Thị B",
      vendorName: "Coffee House",
      rating: 2,
      review: "Phục vụ rất tệ, chờ quá lâu dù có hệ thống xếp hàng. Nhân viên thô lỗ.",
      status: "flagged",
      date: "2024-01-19",
      flagged: true,
      avatar: "TB"
    },
    {
      id: 3,
      customerName: "Lê Minh C",
      vendorName: "Bánh Mì Express",
      rating: 4,
      review: "Chất lượng đồ ăn tốt nhưng hàng di chuyển hơi chậm vào giờ cao điểm.",
      status: "approved",
      date: "2024-01-18",
      flagged: false,
      avatar: "LC"
    }
  ];

  const handleApprove = (reviewId: number) => {
    console.log("Duyệt đánh giá:", reviewId);
  };

  const handleReject = (reviewId: number) => {
    console.log("Từ chối đánh giá:", reviewId);
  };

  const handleMarkSpam = (reviewId: number) => {
    console.log("Đánh dấu spam:", reviewId);
  };

  const handleReply = (reviewId: number) => {
    console.log("Phản hồi đánh giá:", reviewId);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <AdminLayout title="Kiểm duyệt đánh giá">
      <div className="space-y-6">
        {/* Thống kê đánh giá */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-warning">12</div>
                <p className="text-muted-foreground">Đánh giá chờ duyệt</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-destructive">3</div>
                <p className="text-muted-foreground">Đánh giá bị gắn cờ</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success">456</div>
                <p className="text-muted-foreground">Đã duyệt</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">4.6</div>
                <p className="text-muted-foreground">Điểm đánh giá trung bình</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danh sách đánh giá */}
        <Card>
          <CardHeader>
            <CardTitle>Hàng chờ kiểm duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="grid lg:grid-cols-4 gap-4">
                    {/* Nội dung đánh giá */}
                    <div className="lg:col-span-3">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {review.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{review.customerName}</h4>
                            <span className="text-sm text-muted-foreground">đã đánh giá</span>
                            <span className="font-medium text-sm">{review.vendorName}</span>
                            {review.flagged && (
                              <Flag className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {review.date}
                            </span>
                          </div>
                          
                          <p className="text-muted-foreground leading-relaxed">
                            {review.review}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trạng thái & hành động */}
                    <div className="flex flex-col gap-3">
                      <Badge 
                        variant={
                          review.status === "approved" ? "default" : 
                          review.status === "flagged" ? "destructive" : "secondary"
                        }
                      >
                        {review.status === "approved"
                          ? "Đã duyệt"
                          : review.status === "flagged"
                          ? "Bị gắn cờ"
                          : "Chờ duyệt"}
                      </Badge>
                      
                      <div className="flex flex-col gap-2">
                        {review.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(review.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(review.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Từ chối
                            </Button>
                          </>
                        )}
                        
                        {review.status === "flagged" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(review.id)}
                            >
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Cho phép
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleMarkSpam(review.id)}
                            >
                              <ThumbsDown className="w-4 h-4 mr-2" />
                              Đánh dấu spam
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReply(review.id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Phản hồi
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReviewModeration;
