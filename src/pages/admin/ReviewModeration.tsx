import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/* ================= TYPES ================= */
interface RatingReplyResponseDto {
  id: string;
  senderName: string;
  content: string;
  createdTime: string;
}
interface RatingAdminResponse {
  id: string;
  customerName: string;
  vendorName: string;
  stars: string;
  comment: string;
  createdTime: string;
  status?: "pending" | "approved" | "flagged";
  replies?: RatingReplyResponseDto[];
}

interface ApiEnvelope<T> {
  data: T;
  message: string | null;
  statusCode: number;
  code: string;
}

interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords?: number;
}


/* ================= COMPONENT ================= */
const ReviewModeration = () => {
  const [reviews, setReviews] = useState<RatingAdminResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] =
    useState<RatingAdminResponse | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);


  useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      setLoading(true);

      const res = await api.get<
        ApiEnvelope<PaginatedResult<RatingAdminResponse>>
      >(`/api/rating/admin?PageNumber=${page}&PageSize=2`);

      if (!mounted) return;

      const paging = res.data;

      setReviews(
        (paging.data ?? []).map((r) => ({
          ...r,
          status:
            !r.replies || r.replies.length === 0
              ? "pending"
              : "approved",
        }))
      );

      setTotalPages(paging.totalPages || 1);
      setTotalRecords(paging.totalRecords || 0);
    } catch (err) {
      console.error(err);
      setReviews([]);
      setTotalPages(1);
    } finally {
      if (mounted) setLoading(false);
    }
  })();

  return () => {
    mounted = false;
  };
}, [page]);



  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));

  return (
    <AdminLayout title="Kiểm duyệt đánh giá">
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hàng chờ kiểm duyệt</CardTitle>
          </CardHeader>

          <CardContent>
            {loading && (
              <div className="text-sm text-muted-foreground">
                Đang tải đánh giá...
              </div>
            )}

            {!loading && reviews.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Không có đánh giá nào.
              </div>
            )}

            <div className="space-y-6">
              {reviews.map((review) => {
                const rating = Math.max(
                  1,
                  Math.min(5, Math.round(Number(review.stars)))
                );

                return (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="grid lg:grid-cols-4 gap-4">
                      {/* NỘI DUNG */}
                      <div className="lg:col-span-3">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {review.customerName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">
                                {review.customerName || "Khách hàng"}
                              </h4>
                              <span className="text-sm text-muted-foreground">
                                đã đánh giá
                              </span>
                              <span className="font-medium text-sm">
                                {review.vendorName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">{renderStars(rating)}</div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(
                                  review.createdTime
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-muted-foreground leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                        {review.replies && review.replies.length > 0 && (
                          <div className="mt-3 border-t pt-3 space-y-2">
                            {review.replies.map((rep) => (
                              <div
                                key={rep.id}
                                className="bg-muted/40 rounded-lg px-3 py-2 text-sm"
                              >
                                <div className="font-medium text-emerald-700">
                                  {rep.senderName || "Quán"}
                                </div>
                                <div>{rep.content}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(rep.createdTime).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>

                      {/* ACTION */}
                      <div className="flex flex-col gap-3">
                        <Badge variant="secondary">Chờ duyệt</Badge>

                        <div className="flex flex-col gap-2">
                          <Button size="sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Duyệt
                          </Button>
                          <Button size="sm" variant="destructive">
                            <XCircle className="w-4 h-4 mr-2" />
                            Từ chối
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReview(review);
                              setReplyContent("");
                              setReplyDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Phản hồi
                          </Button>

                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-muted-foreground">
                    Trang {page}/{totalPages} • Tổng {totalRecords}
                </p>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1 text-xs rounded border border-input hover:bg-muted disabled:opacity-50"
                        disabled={page  <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Trang trước
                    </button>
                    <button
                        className="px-3 py-1 text-xs rounded border border-input hover:bg-muted disabled:opacity-50"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                    >
                        Trang sau
                    </button>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phản hồi đánh giá (Admin)</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                <div className="font-medium">
                  {selectedReview.customerName} – {selectedReview.vendorName}
                </div>
                <p className="text-muted-foreground italic mt-1">
                  “{selectedReview.comment}”
                </p>
              </div>

              <Textarea
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Nhập phản hồi của Admin..."
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplyDialogOpen(false)}
              disabled={submittingReply}
            >
              Đóng
            </Button>
            <Button
              disabled={submittingReply}
              onClick={async () => {
                if (!selectedReview || !replyContent.trim()) return;

                try {
                  setSubmittingReply(true);
                  await api.post(
                    `/api/rating/${selectedReview.id}/reply`,
                    { content: replyContent }
                  );

                  setReplyDialogOpen(false);

                  // reload list
                  setPage((p) => p);
                } catch (err) {
                  console.error(err);
                } finally {
                  setSubmittingReply(false);
                }
              }}
            >
              {submittingReply ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
};

export default ReviewModeration;
