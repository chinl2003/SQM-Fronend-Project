// src/components/vendor/VendorReportModal.tsx
import {
  Clock,
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
  ChevronDown,
  X,
  Lightbulb,
} from "lucide-react";
import { StatCard } from "./dashboard/StatCard";
import { WaitTimeChart } from "./dashboard/WaitTimeChart";
import { DelayedDishesChart } from "./dashboard/DelayedDishesChart";
import { ETAAccuracyGauge } from "./dashboard/ETAAccuracyGauge";
import { RecommendationsCard } from "./dashboard/RecommendationsCard";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type VendorReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
};

export default function VendorReportModal({
  open,
  onOpenChange,
  vendorId,
}: VendorReportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-6xl w-full p-0 overflow-hidden 
          bg-white rounded-2xl
          shadow-[0_4px_24px_rgba(0,0,0,0.06)]
        "
      >
        {/* HEADER */}
        <DialogHeader
          className="
            px-6 py-4 border-b border-[#F2E4D9] 
            bg-white flex flex-row items-center justify-between
          "
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A1A] flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <div>
              <DialogTitle className="text-[17px] font-bold text-[#1F130A]">
                Vendor Dashboard
              </DialogTitle>
              <p className="text-xs text-[#957056]">Quán Phở Hương Việt</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full hover:bg-orange-100"
          >
            <X className="w-5 h-5 text-[#5A402B]" />
          </Button>
        </DialogHeader>

        {/* SCROLL BODY */}
        <ScrollArea className="max-h-[78vh] px-6 py-5">
          {/* PAGE TITLE */}
          <h2 className="text-2xl font-bold text-[#1F130A]">
            Báo cáo hiệu suất
          </h2>
          <p className="text-sm text-[#9C6A3C] mt-1 mb-6">
            Phân tích thời gian chờ và độ chính xác ETA
          </p>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-4">
              <StatCard
                title="Tổng đơn hàng"
                value="1,438"
                subtitle="7 ngày gần nhất"
                icon={Package}
                trend={{ value: 12.5, isPositive: true }}
                variant="default"
              />
            </div>
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-4">
              <StatCard
                title="Thời gian chờ TB"
                value="18 phút"
                subtitle="Giảm 3 phút so với tuần trước"
                icon={Clock}
                trend={{ value: 14, isPositive: true }}
                variant="success"
              />
            </div>
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-4">
              <StatCard
                title="Độ chính xác ETA"
                value="85.7%"
                subtitle="Mục tiêu: 90%"
                icon={TrendingUp}
                trend={{ value: 2.3, isPositive: true }}
                variant="warning"
              />
            </div>
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-4">
              <StatCard
                title="Đơn trễ >5 phút"
                value="48"
                subtitle="3.3% tổng đơn"
                icon={AlertTriangle}
                trend={{ value: 8, isPositive: false }}
                variant="destructive"
              />
            </div>
          </div>

          {/* GRAPHS ROW 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Wait time */}
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-5">
              <WaitTimeChart />
            </div>

            {/* Delayed dishes */}
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-5">
              <DelayedDishesChart />
            </div>
          </div>

          {/* ETA & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-5">
              <ETAAccuracyGauge accuracy={85.7} />
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-[#F2E4D9] shadow p-5">
              <RecommendationsCard />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}