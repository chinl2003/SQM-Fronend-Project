const API_URL = import.meta.env.VITE_API_URL;
console.log("API_URL:", API_URL); 
export async function login(phone: string, password: string) {
  const res = await fetch(`${API_URL}/api/account/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  return res.json();
}

/**
 * Đăng ký user mới
 */
export async function signup(data: {
  fullName: string;
  email: string;
  username: string;
  password: string;
  phoneNumber: string;
  gender: boolean;
  address?: string;
  birthday?: Date;
  imageFile?: File | null;
}) {
  const formData = new FormData();
  formData.append("FullName", data.fullName);
  formData.append("Email", data.email);
  formData.append("Username", data.username);
  formData.append("Password", data.password);
  formData.append("PhoneNumber", data.phoneNumber);
  formData.append("Gender", data.gender ? "true" : "false");
  if (data.address) formData.append("Address", data.address);
  if (data.birthday instanceof Date && !isNaN(data.birthday.getTime())) {
    formData.append("Birthday", data.birthday.toISOString());
  }
  if (data.imageFile) formData.append("Image", data.imageFile);

  const res = await fetch(`${API_URL}/api/account/register?api-version=1.0`, {
    method: "POST",
    body: formData,
  });
  console.log("Response status:", res);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Đăng ký thất bại");
  return json;
}
