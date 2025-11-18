import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User, MapPin, Phone, Mail, Edit2, Save, X, Calendar, Upload, LogOut } from "lucide-react";
import { format } from "date-fns";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
}

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string; 
}

export function ProfileDialog({ isOpen, onClose, userId }: ProfileDialogProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const loadUserData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
        const response = await api.get<ApiResponse<any>>(`/api/account/profile/${userId}`, {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        });

        if (!response?.code?.toLowerCase().includes("success") || !response?.data) {
            throw new Error(response?.message || "Không thể tải thông tin người dùng");
        }

        const mappedProfile: Profile = {
            user_id: response.data.userId,
            full_name: response.data.fullName,
            phone: response.data.phoneNumber,
            address: null,
            avatar_url: response.data.imagePath,
            email: response.data.email,
            date_of_birth: response.data.birthday,
            gender: response.data.gender === "True" ? "male" : "female", 
        };
        setProfile(mappedProfile);
        setEditForm(mappedProfile);
    } catch (error) {
        toast.error("Không thể tải thông tin của bạn!");
        onClose();
    } finally {
        setIsLoading(false);
    }
    }, [userId, onClose, toast]);

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen, loadUserData]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => prev ? { ...prev, avatar_url: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Không thể tải ảnh lên! Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editForm || !profile) return;
      const formData = new FormData();
      formData.append("FullName", editForm.full_name);
      formData.append("Gender", editForm.gender);
      formData.append("Birthday", editForm.date_of_birth || "");

      // ⬅ Only append if the user uploaded avatar
      if (avatarFile) {
          formData.append("ImageFile", avatarFile);   // required for MinIO upload
      }
    try {
        const response = await api.put<ApiResponse<any>>(
        `/api/account/update/${profile.user_id}`,
            formData,
        {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "multipart/form-data",
        }
        );

        if (!response?.code?.toLowerCase().includes("success") || !response?.data) {
        throw new Error(response?.message || "Cập nhật thất bại");
        }

        const updatedUser = response.data;
        const updatedProfile: Profile = {
        user_id: updatedUser.userId,
        full_name: updatedUser.fullName,
        phone: profile.phone, 
        address: editForm.address,
        avatar_url: editForm.avatar_url,
        email: profile.email, 
        date_of_birth: updatedUser.birthday,
        gender: updatedUser.gender === "True" ? "male" : "female",
        };

        setProfile(updatedProfile);
        setEditForm(updatedProfile);
        setIsEditing(false);

        toast.success("Cập nhật thông tin thành công!");

        onClose();
    } catch (error) {
         toast.error("Cập nhật thông tin thất bại! Vui lòng thử lại.");
    }
   };

  const handleCancelEdit = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Thông tin cá nhân</DialogTitle>
            {/* {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2">
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} size="sm" className="gap-2">
                  <Save className="w-4 h-4" />
                  Lưu
                </Button>
                <Button onClick={handleCancelEdit} size="sm" variant="outline" className="gap-2">
                  <X className="w-4 h-4" />
                  Hủy
                </Button>
              </div>
            )} */}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-primary/20">
                <AvatarImage src={isEditing ? editForm?.avatar_url || "" : profile?.avatar_url || ""} />
                <AvatarFallback className="text-4xl">
                  <User className="w-16 h-16" />
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-primary" />
                Họ và tên
              </Label>
              {isEditing ? (
                <Input
                  value={editForm?.full_name || ""}
                  onChange={(e) => setEditForm(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  placeholder="Nhập họ và tên"
                />
              ) : (
                <p className="text-base pl-6">{profile?.full_name || "Chưa cập nhật"}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="w-4 h-4 text-primary" />
                    Email
                </Label>
                <p className="text-base pl-6">{profile?.email || "Chưa cập nhật"}</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="w-4 h-4 text-primary" />
                    Số điện thoại
                </Label>
                <p className="text-base pl-6">{profile?.phone || "Chưa cập nhật"}</p>
            </div>

            {/* Address
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-primary" />
                Địa chỉ
              </Label>
              {isEditing ? (
                <Input
                  value={editForm?.address || ""}
                  onChange={(e) => setEditForm(prev => prev ? { ...prev, address: e.target.value } : null)}
                  placeholder="Nhập địa chỉ"
                />
              ) : (
                <p className="text-base pl-6">{profile?.address || "Chưa cập nhật"}</p>
              )}
            </div> */}

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                Ngày sinh
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editForm?.date_of_birth || ""}
                  onChange={(e) => setEditForm(prev => prev ? { ...prev, date_of_birth: e.target.value } : null)}
                />
              ) : (
                <p className="text-base pl-6">
                  {profile?.date_of_birth 
                    ? format(new Date(profile.date_of_birth), "dd/MM/yyyy")
                    : "Chưa cập nhật"}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-primary" />
                Giới tính
              </Label>
              {isEditing ? (
                <Select
                  value={editForm?.gender || ""}
                  onValueChange={(value) => setEditForm(prev => prev ? { ...prev, gender: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-base pl-6">
                  {profile?.gender === "male" ? "Nam" : 
                   profile?.gender === "female" ? "Nữ" : 
                   profile?.gender === "other" ? "Khác" : "Chưa cập nhật"}
                </p>
              )}
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="flex justify-end gap-2 mt-6 sticky bottom-0 bg-white pt-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2">
                <Edit2 className="w-4 h-4" /> Chỉnh sửa
              </Button>
            ) : (
              <>
                <Button onClick={handleUpdateProfile} size="sm" className="gap-2">
                  <Save className="w-4 h-4" /> Lưu
                </Button>
                <Button onClick={handleCancelEdit} size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                  <X className="w-4 h-4" /> Hủy
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}