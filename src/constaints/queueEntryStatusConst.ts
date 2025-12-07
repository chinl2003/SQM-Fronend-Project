export interface StatusOption {
value: number;
label: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
{ value: 0, label: "Chờ xác nhận"},
{ value: 1, label: "Đang chờ" },
{ value: 2, label: "Đang phục vụ" },
{ value: 3, label: "Đã hoàn tất" },
{ value: 4, label: "Đã hủy" },
{ value: 5, label: "Đã xác nhận" },
];

export const getQueueEntryStatus = (status: number): string =>
STATUS_OPTIONS.find(opt => opt.value === status)?.label ?? "Không xác định";
