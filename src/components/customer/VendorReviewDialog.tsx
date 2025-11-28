import {
  useState,
  FormEvent,
  ChangeEvent,
  useEffect,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Image as ImageIcon, X } from "lucide-react";

type VendorReviewDialogMode = "create" | "view" | "update";

type VendorReviewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  vendorImage?: string;
  orderCode?: string;
  mode?: VendorReviewDialogMode;
  readOnly?: boolean;
  initialRating?: {
    rating: number;
    comment?: string;
    imageUrls?: string[];
  };
  onSubmit?: (payload: {
    rating: number;
    comment: string;
    images: File[];
  }) => Promise<void> | void;
};

type PreviewFile = {
  file: File;
  preview: string;
};

export default function VendorReviewDialog({
  isOpen,
  onClose,
  vendorName,
  vendorImage,
  orderCode,
  mode = "create",
  readOnly = false,
  initialRating,
  onSubmit,
}: VendorReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const effectiveRating = hoverRating || rating;

  // Fill dữ liệu khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (initialRating) {
        setRating(initialRating.rating || 0);
        setComment(initialRating.comment || "");
        setExistingImageUrls(initialRating.imageUrls || []);
      } else {
        setRating(0);
        setComment("");
        setExistingImageUrls([]);
      }
      setHoverRating(0);
      // KHÔNG reset files ở đây để không mất file đang chọn
    }
  }, [isOpen, initialRating]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const list = e.target.files;
    if (!list || !list.length) return;
    const newFiles: PreviewFile[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list.item(i);
      if (!f) continue;
      const preview = URL.createObjectURL(f);
      newFiles.push({ file: f, preview });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    if (readOnly) return;
    setFiles((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1)[0];
      if (removed) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  const handleRemoveExistingImage = (index: number) => {
    if (readOnly) return;
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const resetState = () => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setExistingImageUrls([]);
  };

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      handleClose();
      return;
    }
    if (!rating || submitting) return;

    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit({
          rating,
          comment: comment.trim(),
          images: files.map((f) => f.file),
        });
      }
      resetState();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle =
    mode === "update"
      ? `Cập nhật đánh giá quán ${vendorName}`
      : mode === "view"
      ? `Xem đánh giá quán ${vendorName}`
      : `Đánh giá quán ${vendorName}`;

  const headerDescription =
    mode === "view"
      ? "Đây là đánh giá bạn đã gửi trước đó."
      : "Chia sẻ trải nghiệm của bạn";

  const primaryButtonText =
    mode === "update" ? "Cập nhật đánh giá" : "Gửi đánh giá";

  const hasAnyImage = existingImageUrls.length > 0 || files.length > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (!open ? handleClose() : null)}
    >
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-3 border-b bg-gradient-to-r from-[#00A94E] to-[#00C853] text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                {vendorImage ? (
                  <img
                    src={vendorImage}
                    alt={vendorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Star className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold">
                  {headerTitle}
                </DialogTitle>
                <DialogDescription className="text-xs text-white/80">
                  {headerDescription}
                </DialogDescription>
              </div>
              {orderCode && (
                <div className="text-[11px] px-2 py-1 rounded-full bg-white/20">
                  Mã đơn: <span className="font-semibold">{orderCode}</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="px-6 py-4 space-y-5">
            {/* Sao */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mức độ hài lòng</Label>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  const active = value <= effectiveRating;
                  return (
                    <button
                      key={value}
                      type="button"
                      className="p-1"
                      onMouseEnter={() =>
                        !readOnly && setHoverRating(value)
                      }
                      onMouseLeave={() =>
                        !readOnly && setHoverRating(0)
                      }
                      onClick={() => !readOnly && setRating(value)}
                    >
                      <Star
                        className={`w-7 h-7 transition-all ${
                          active
                            ? "fill-yellow-400 text-yellow-400 scale-110"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="review-comment" className="text-sm font-medium">
                Nội dung đánh giá
              </Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) =>
                  !readOnly && setComment(e.target.value)
                }
                placeholder="Món ăn, tốc độ phục vụ, trải nghiệm..."
                rows={4}
                className="resize-none text-sm"
                readOnly={readOnly}
              />
              <div className="text-xs text-muted-foreground text-right">
                {comment.length}/500
              </div>
            </div>

            {/* Hình ảnh */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Hình ảnh</Label>

              <label
                className={`border-2 border-dashed rounded-xl w-full flex flex-col items-center justify-center gap-2 py-4 px-3 ${
                  readOnly
                    ? "border-gray-300 bg-muted/40 cursor-default"
                    : "border-gray-400 cursor-pointer hover:border-[#00C853] hover:bg-green-50 transition"
                }`}
              >
                {/* Input file (ẩn nếu readOnly) */}
                {!readOnly && (
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                )}

                {/* Nếu không có ảnh nào */}
                {!hasAnyImage && (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">
                      Tải hình ảnh lên
                    </span>
                    <span className="text-xs text-gray-400">
                      Nhấn để chọn hoặc kéo thả
                    </span>
                  </>
                )}

                {/* Nếu có ảnh → hiển thị tất cả trong cùng 1 grid */}
                {hasAnyImage && (
                  <div className="w-full grid grid-cols-3 gap-2">
                    {/* Ảnh đã gửi trước đó */}
                    {existingImageUrls.map((url, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="relative rounded-md overflow-hidden"
                      >
                        <img
                          src={url}
                          alt={`old-rating-img-${idx}`}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveExistingImage(idx);
                            }}
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Ảnh mới chọn */}
                    {files.map((f, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="relative rounded-md overflow-hidden"
                      >
                        <img
                          src={f.preview}
                          className="w-full h-24 object-cover rounded-md"
                          alt={`preview-${idx}`}
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(idx);
                            }}
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </label>
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t bg-muted/40">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              {readOnly ? "Đóng" : "Để sau"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={!rating || submitting}>
                {submitting ? "Đang gửi..." : primaryButtonText}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}