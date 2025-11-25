// src/components/vendor/tabs/ReviewsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReviewsTab() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Đánh giá từ khách hàng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((review) => (
            <div key={review} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">Khách hàng #{review}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">"Món ăn ngon, phục vụ nhanh. Rất hài lòng."</p>
                  <p className="text-xs text-muted-foreground">2 giờ trước</p>
                </div>
                <Button variant="outline" size="sm">Phản hồi</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
