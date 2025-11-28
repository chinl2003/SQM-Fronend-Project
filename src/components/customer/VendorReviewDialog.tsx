import { useState, FormEvent, ChangeEvent } from "react";
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

type VendorReviewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  vendorImage?: string;
  orderCode?: string;
  onSubmit?: (payload: { rating: number; comment: string; images: File[] }) => Promise<void> | void;
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
  onSubmit,
}: VendorReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const effectiveRating = hoverRating || rating;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    setFiles((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1)[0];
      if (removed) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  const resetState = () => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-3 border-b bg-gradient-to-r from-[#00A94E] to-[#00C853] text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                {vendorImage ? (
                  <img src={vendorImage} alt={vendorName} className="w-full h-full object-cover" />
                ) : (
                  <Star className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold">
                  Đánh giá quán {vendorName}
                </DialogTitle>
                <DialogDescription className="text-xs text-white/80">
                  Chia sẻ trải nghiệm của bạn
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
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                    >
                      <Star
                        className={`w-7 h-7 transition-all ${
                          active ? "fill-yellow-400 text-yellow-400 scale-110" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment" className="text-sm font-medium">
                Nội dung đánh giá
              </Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Món ăn, tốc độ phục vụ, trải nghiệm..."
                rows={4}
                className="resize-none text-sm"
              />
              <div className="text-xs text-muted-foreground text-right">
                {comment.length}/500
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Hình ảnh</Label>

              <label className="border-2 border-dashed border-gray-400 rounded-xl w-full flex flex-col items-center justify-center gap-2 py-6 cursor-pointer hover:border-[#00C853] hover:bg-green-50 transition">
                {files.length === 0 && (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">Tải hình ảnh lên</span>
                    <span className="text-xs text-gray-400">Nhấn để chọn hoặc kéo thả</span>
                  </>
                )}

                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                {files.length > 0 && (
                  <div className="w-full grid grid-cols-3 gap-2 px-3">
                    {files.map((f, idx) => (
                      <div key={idx} className="relative rounded-md overflow-hidden">
                        <img
                          src={f.preview}
                          className="w-full h-24 object-cover rounded-md"
                          alt={`preview-${idx}`}
                        />
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
              Để sau
            </Button>
            <Button type="submit" disabled={!rating || submitting}>
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}