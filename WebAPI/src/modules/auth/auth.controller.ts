import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
      return;
    }
    const result = await authService.login(username, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      return;
    }
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    next(err);
  }
}
