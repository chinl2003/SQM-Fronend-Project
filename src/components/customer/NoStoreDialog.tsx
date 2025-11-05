import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NoStoreDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
};

export function NoStoreDialog({ isOpen, onClose, onRegisterClick }: NoStoreDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bạn chưa có cửa hàng</DialogTitle>
          <DialogDescription>
            Bạn đang đăng nhập với vai trò <strong>Khách hàng</strong>. Vui lòng đăng ký cửa hàng để bắt đầu bán.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Để sau</Button>
          <Button onClick={onRegisterClick}>Đăng ký</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}