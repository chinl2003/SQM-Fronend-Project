// src/components/vendor/tabs/ReviewsTab.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  Image as ImageIcon,
  RefreshCw,
  MessageCircle,
  Store as StoreIcon,
  User as UserIcon,
} from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type RatingReplyApi = {
  id: string;
  ratingId: string;
  content: string;
  senderId?: string | null;
  senderName?: string | null;
  senderPhone?: string | null;
  role: number; // 0 = Customer, 1 = Vendor, 2 = Admin
  createdTime: string;
  editedTime?: string | null;
};

type VendorRatingApi = {
  id: string;
  vendorId?: string;
  orderId?: string;
  stars?: string | null;
  comment?: string | null;
  imageUrls?: string | null;
  createdTime?: string | null;

  orderCode?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;

  replies?: RatingReplyApi[];
};

type PaginatedResult<T> = {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords?: number;
};

type ReviewsTabProps = {
  vendorId?: string | null;
};

const PAGE_SIZE = 5;

const buildMediaUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_S3_URL || "").replace(/\/+$/, "");
  return `${base}/${(path || "").replace(/^\/+/, "")}`;
};

const parseStars = (stars?: string | null): number => {
  if (!stars) return 0;
  const points = parseInt(stars, 10);
  if (Number.isNaN(points)) return 0;
  const s = points;
  return Math.max(1, Math.min(5, s));
};

const parseImageUrls = (imageUrls?: string | null): string[] => {
  if (!imageUrls) return [];
  return imageUrls
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => buildMediaUrl(s));
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return `${time} · ${date}`;
};

const getInitials = (name?: string | null) => {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
};

const getReplyRoleLabel = (role: number) => {
  switch (role) {
    case 1:
      return "Quán phản hồi";
    case 2:
      return "Admin";
    case 0:
    default:
      return "Khách hàng";
  }
};

export default function ReviewsTab({ vendorId }: ReviewsTabProps) {
  const [ratings, setRatings] = useState<VendorRatingApi[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState<number | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // modal phản hồi
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replySuccessOpen, setReplySuccessOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<VendorRatingApi | null>(
    null
  );
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // trạng thái ẩn/hiện reply theo ratingId
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    setPage(1);
  }, [vendorId]);

  useEffect(() => {
    if (!vendorId) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await api.get<ApiResponse<PaginatedResult<VendorRatingApi>>>(
          `/api/rating/by-vendor/${vendorId}?PageNumber=${page}&PageSize=${PAGE_SIZE}`,
          headers
        );

        const envelope = res as ApiResponse<PaginatedResult<VendorRatingApi>>;
        const result = envelope.data as PaginatedResult<VendorRatingApi>;
        const list = result?.data ?? [];

        if (!mounted) return;

        setRatings(list);
        setTotalPages(result?.totalPages || 1);
        setTotalRecords(result?.totalRecords);

        // Khi reload, nếu muốn có thể reset trạng thái expand:
        // setExpandedReplies({});
      } catch (err: any) {
        console.error(err);
        if (mounted) {
          toast.error(err?.message || "Không thể tải danh sách đánh giá.");
          setRatings([]);
          setTotalPages(1);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [vendorId, page, reloadKey]);

  const avgStars = useMemo(() => {
    if (!ratings.length) return 0;
    const sum = ratings.reduce((acc, r) => acc + parseStars(r.stars), 0);
    return +(sum/ ratings.length).toFixed(1);
  }, [ratings]);

  const renderStars = (stars: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, idx) => {
          const diff = stars - idx;

          if (diff >= 1) {
            return (
              <Star
                key={idx}
                className="h-4 w-4 fill-yellow-400 text-yellow-400"
              />
            );
          }

          if (diff >= 0.5) {
            return (
              <div key={idx} className="relative h-4 w-4">
                <Star className="absolute h-4 w-4 text-gray-300" />
                <Star
                  className="absolute h-4 w-4 fill-yellow-400 text-yellow-400"
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              </div>
            );
          }

          return (
            <Star key={idx} className="h-4 w-4 text-gray-300" />
          );
        })}
      </div>
    );
  };


  const openReplyDialog = (rating: VendorRatingApi) => {
    setSelectedRating(rating);
    setReplyContent("");
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!selectedRating) return;
    if (!replyContent.trim()) {
      toast.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    try {
      setSubmittingReply(true);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      await api.post(
        `/api/rating/${selectedRating.id}/reply`,
        { content: replyContent.trim() },
        headers
      );

      setReplyDialogOpen(false);
      setReplySuccessOpen(true);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Gửi phản hồi thất bại. Vui lòng thử lại."
      );
    } finally {
      setSubmittingReply(false);
    }
  };

  const toggleReplies = (ratingId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [ratingId]: !prev[ratingId],
    }));
  };

  return (
    <>
      <Card className="shadow-md border border-emerald-50">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>Đánh giá từ khách hàng</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Xem cảm nhận thực tế từ khách hàng đã sử dụng dịch vụ của quán.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-2 rounded-lg bg-emerald-50 flex items-center gap-2">
              <span className="text-2xl font-semibold text-emerald-600">
                {avgStars || "—"}
              </span>
              <div className="flex flex-col leading-tight text-xs text-muted-foreground">
                <span>Điểm trung bình</span>
                <span className="flex items-center gap-1">
                  {renderStars(avgStars)}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <div>
                Tổng đánh giá (trang này):{" "}
                <span className="font-semibold text-foreground">
                  {ratings.length}
                </span>
              </div>
              {typeof totalRecords === "number" && (
                <div>
                  Tổng đánh giá (tất cả):{" "}
                  <span className="font-semibold text-foreground">
                    {totalRecords}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!vendorId && (
            <div className="text-sm text-muted-foreground">
              Không tìm thấy thông tin quán. Vui lòng kiểm tra lại.
            </div>
          )}

          {vendorId && loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
                <span>Đang tải danh sách đánh giá...</span>
              </div>

              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg p-4 animate-pulse bg-muted/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-2/3 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {vendorId && !loading && ratings.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Star className="h-10 w-10 mx-auto mb-3 text-yellow-300" />
              Hiện chưa có đánh giá nào cho quán.
            </div>
          )}

          {!loading && ratings.length > 0 && (
            <div className="space-y-4">
              {ratings.map((r) => {
                const stars = parseStars(r.stars);
                const imgs = parseImageUrls(r.imageUrls);
                const replies = r.replies ?? [];
                const isExpanded = expandedReplies[r.id] ?? false;

                return (
                  <div
                    key={r.id}
                    className="border border-emerald-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-emerald-50/30"
                  >
                    {/* Mã đơn hàng */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">
                          Mã đơn:
                        </span>
                        <span className="text-base font-bold text-foreground">
                          {r.orderCode || r.orderId || "—"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(r.createdTime)}
                      </span>
                    </div>

                    {/* Thông tin khách + sao */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {getInitials(r.customerName)}
                        </div>

                        <div>
                          <div className="mb-1 flex flex-wrap items-center gap-1">
                            <span className="text-base font-semibold text-foreground">
                              {r.customerName || "Khách hàng ẩn danh"}
                            </span>

                            {r.customerPhone && (
                              <>
                                <span className="text-base font-semibold text-foreground">
                                  -
                                </span>
                                <span className="text-base font-semibold text-foreground">
                                  {r.customerPhone}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {renderStars(stars)}
                            <span className="text-xs text-emerald-600 font-semibold">
                              {stars}/5
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nút phản hồi */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1"
                        onClick={() => openReplyDialog(r)}
                      >
                        <MessageCircle className="h-3 w-3" />
                        Phản hồi
                      </Button>
                    </div>

                    {/* Nội dung đánh giá */}
                    {r.comment && (
                      <p className="mt-3 text-sm text-foreground bg-white/80 rounded-lg px-3 py-2 border border-emerald-50">
                        {r.comment}
                      </p>
                    )}

                    {/* Hình ảnh đánh giá */}
                    {imgs.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <ImageIcon className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-semibold text-muted-foreground">
                            Hình ảnh từ khách hàng
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {imgs.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="relative group rounded-md overflow-hidden border border-emerald-100 bg-black/5"
                              onClick={() => window.open(url, "_blank")}
                            >
                              <img
                                src={url}
                                alt={`rating-img-${idx}`}
                                className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Toggle ẩn/hiện reply */}
                    {replies.length > 0 && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => toggleReplies(r.id)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1"
                        >
                          <MessageCircle className="h-3 w-3" />
                          {isExpanded
                            ? "Ẩn phản hồi"
                            : `Hiển thị ${replies.length} phản hồi`}
                        </button>
                      </div>
                    )}

                    {/* THREAD PHẢN HỒI – chỉ hiển thị khi expanded */}
                    {replies.length > 0 && isExpanded && (
                      <div className="mt-2 border-t border-emerald-100 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-700 uppercase">
                            Trao đổi về đánh giá
                          </span>
                        </div>

                        <div className="space-y-2">
                          {replies.map((rep) => {
                            const isVendor = rep.role === 1;
                            return (
                              <div
                                key={rep.id}
                                className={`flex gap-2 ${
                                  isVendor ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs sm:text-sm shadow-sm border ${
                                    isVendor
                                      ? "bg-emerald-50 border-emerald-100"
                                      : "bg-white border-gray-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    {isVendor ? (
                                      <StoreIcon className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <UserIcon className="h-3 w-3 text-gray-500" />
                                    )}
                                    <span
                                      className={`font-semibold ${
                                        isVendor
                                          ? "text-emerald-700"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {rep.senderName ||
                                        (isVendor ? "Quán" : "Người dùng")}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      • {getReplyRoleLabel(rep.role)}
                                    </span>
                                  </div>
                                  <p className="text-foreground">{rep.content}</p>
                                  <div className="mt-1 text-[10px] text-muted-foreground text-right">
                                    {formatDateTime(rep.createdTime)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-3 border-t mt-4">
                <div className="text-xs text-muted-foreground">
                  Trang{" "}
                  <span className="font-semibold text-foreground">{page}</span>{" "}
                  /{" "}
                  <span className="font-semibold text-foreground">
                    {totalPages || 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) =>
                        totalPages ? Math.min(totalPages, p + 1) : p
                      )
                    }
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal nhập phản hồi */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phản hồi đánh giá</DialogTitle>
          </DialogHeader>

          {selectedRating && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">
                  {selectedRating.customerName || "Khách hàng"} về đơn{" "}
                  <span className="font-bold">
                    {selectedRating.orderCode || selectedRating.orderId}
                  </span>
                </div>
                {selectedRating.comment && (
                  <div className="mt-1 italic">
                    “{selectedRating.comment}”
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Nội dung phản hồi <span className="text-red-500">*</span>
                </label>
                <Textarea
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Ví dụ: Cảm ơn bạn đã góp ý, quán sẽ cải thiện tốc độ phục vụ trong thời gian tới..."
                  className="text-sm"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {replyContent.length}/1000
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setReplyDialogOpen(false)}
              disabled={submittingReply}
            >
              Đóng
            </Button>
            <Button onClick={handleSubmitReply} disabled={submittingReply}>
              {submittingReply ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal gửi thành công */}
      <Dialog
        open={replySuccessOpen}
        onOpenChange={(open) => {
          setReplySuccessOpen(open);
          if (!open) {
            setReloadKey((k) => k + 1);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm text-center">
          <div className="flex flex-col items-center gap-3 py-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-lg">
              Gửi phản hồi thành công
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Cảm ơn bạn đã phản hồi. Khách hàng sẽ nhìn thấy phản hồi này trong
              chi tiết đánh giá.
            </p>
            <Button
              className="mt-1"
              onClick={() => {
                setReplySuccessOpen(false);
                setReloadKey((k) => k + 1);
              }}
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}