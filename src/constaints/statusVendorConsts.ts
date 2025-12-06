export interface StatusOption {
value: number;
label: string;
badge?: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
{ value: 0, label: "Nháp", badge: "bg-gray-200 text-gray-800" },
{ value: 1, label: "Chờ duyệt", badge: "bg-yellow-200 text-yellow-800" },
{ value: 2, label: "Đã duyệt", badge: "bg-blue-200 text-blue-800" },
{ value: 3, label: "Từ chối", badge: "bg-red-200 text-red-800" },
{ value: 4, label: "Chờ tạo menu", badge: "bg-green-200 text-green-800" },
{ value: 5, label: "Còn nợ", badge: "bg-orange-200 text-orange-800" },
{ value: 6, label: "Yêu cầu đóng cửa", badge: "bg-red-300 text-red-900" },
{ value: 7, label: "Tạm ngưng", badge: "bg-purple-200 text-purple-800" },
{ value: 8, label: "Hoạt động", badge: "bg-emerald-200 text-emerald-800" },
];

export const getVendorStatusLabel = (status: number): string =>
STATUS_OPTIONS.find(opt => opt.value === status)?.label ?? "Không xác định";

export const getVendorStatusBadge = (status: number): string =>
STATUS_OPTIONS.find(opt => opt.value === status)?.badge ?? "bg-gray-200 text-gray-800";
