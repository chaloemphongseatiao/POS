import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    res.json(await authService.login(username, password));
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
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    next(err);
  }
}
