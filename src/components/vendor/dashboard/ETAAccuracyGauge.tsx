import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Target } from "lucide-react";

interface ETAAccuracyGaugeProps {
  accuracy: number;
}

export function ETAAccuracyGauge({ accuracy }: ETAAccuracyGaugeProps) {
  const data = [
    { name: "Accuracy", value: accuracy },
    { name: "Remaining", value: 100 - accuracy },
  ];

  const getAccuracyColor = () => {
    if (accuracy >= 85) return "hsl(142, 76%, 36%)";
    if (accuracy >= 70) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
  };

  const getAccuracyStatus = () => {
    if (accuracy >= 85) return { text: "Xuất sắc", class: "badge-success" };
    if (accuracy >= 70) return { text: "Cần cải thiện", class: "badge-warning" };
    return { text: "Cần xem xét", class: "badge-destructive" };
  };

  const status = getAccuracyStatus();

  return (
    <div className="chart-container animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Thời gian chờ của quán</h3>
          <p className="text-sm text-muted-foreground">So với thời gian dự kiến ban đầu</p>
        </div>
        <span className={status.class}>{status.text}</span>
      </div>
      
      <div className="relative h-[200px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={90}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell fill={getAccuracyColor()} />
              <Cell fill="hsl(40, 20%, 92%)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          <div className="flex items-center gap-1 mb-1">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <span className="text-4xl font-bold" style={{ color: getAccuracyColor() }}>
            {accuracy}%
          </span>
          <span className="text-sm text-muted-foreground">Độ chính xác</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">1,234</p>
          <p className="text-xs text-muted-foreground">Đơn đúng giờ</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning">156</p>
          <p className="text-xs text-muted-foreground">Trễ &lt;5 phút</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-destructive">48</p>
          <p className="text-xs text-muted-foreground">Trễ &gt;5 phút</p>
        </div>
      </div>
    </div>
  );
}
