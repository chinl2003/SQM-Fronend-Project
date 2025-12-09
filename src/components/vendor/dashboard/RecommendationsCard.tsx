import {
  Lightbulb,
  Clock,
  Users,
  ChefHat,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  icon: React.ElementType;
  action: string;
}

const recommendations: Recommendation[] = [
  {
    id: 1,
    title: "Thêm Pre-order slot 11:30–12:00",
    description:
      "Giờ cao điểm có 62 đơn với thời gian chờ 25 phút. Pre-order có thể giảm 40% thời gian chờ.",
    impact: "high",
    icon: Clock,
    action: "Kích hoạt ngay",
  },
  {
    id: 2,
    title: "Tối ưu món Phở bò tái",
    description:
      "Tỷ lệ trễ 45%. Đề xuất: chuẩn bị sẵn nguyên liệu, tăng số lượng nồi nước dùng.",
    impact: "high",
    icon: ChefHat,
    action: "Xem chi tiết",
  },
  {
    id: 3,
    title: "Thêm nhân viên ca tối 18:00-20:00",
    description:
      "Cần thêm 1-2 nhân viên bếp để xử lý 70+ đơn hàng trong giờ cao điểm buổi tối.",
    impact: "medium",
    icon: Users,
    action: "Lên lịch",
  },
  {
    id: 4,
    title: "Điều chỉnh ETA cho Bún chả",
    description:
      "ETA hiện tại 15 phút, thực tế trung bình 23 phút. Đề xuất tăng ETA lên 25 phút.",
    impact: "medium",
    icon: TrendingUp,
    action: "Cập nhật",
  },
];

const impactStyles: Record<Recommendation["impact"], string> = {
  high:
    "bg-[#FFE5E2] text-[#E0523C]", // đỏ nhạt
  medium:
    "bg-[#FFF1CC] text-[#C57A00]", // vàng
  low:
    "bg-[#E3F7D9] text-[#2C7A1F]", // xanh (nếu sau này dùng)
};

const impactLabels: Record<Recommendation["impact"], string> = {
  high: "Ưu tiên cao",
  medium: "Ưu tiên TB",
  low: "Ưu tiên thấp",
};

export function RecommendationsCard() {
  return (
    <div className="space-y-4">
      {/* Header Đề xuất giống ảnh */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-[#FFF6EE] flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-[#FF7A1A]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1F130A]">
            Đề xuất cải thiện
          </h3>
          <p className="text-xs text-[#9C6A3C]">
            Dựa trên phân tích dữ liệu 7 ngày gần nhất
          </p>
        </div>
      </div>

      {/* Danh sách các đề xuất */}
      <div className="space-y-3">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <div
              key={rec.id}
              className="
                flex items-start gap-3 rounded-2xl
                bg-[#FFF6EE] border border-[#FFE0CC]
                shadow-sm px-4 py-3
                border-l-4 border-l-[#FF7A1A]
              "
            >
              {/* Icon bên trái */}
              <div className="mt-1">
                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#FF7A1A]" />
                </div>
              </div>

              {/* Nội dung */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-sm text-[#3A2617]">
                    {rec.title}
                  </h4>
                  <span
                    className={`
                      px-2 py-[2px] rounded-full text-[11px] font-medium
                      ${impactStyles[rec.impact]}
                    `}
                  >
                    {impactLabels[rec.impact]}
                  </span>
                </div>

                <p className="text-xs text-[#9C6A3C] mb-2">
                  {rec.description}
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  className="
                    h-7 px-0 text-xs font-medium
                    text-[#FF7A1A] hover:text-[#E56412]
                    hover:bg-[#FFE6D6]
                  "
                >
                  {rec.action}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}