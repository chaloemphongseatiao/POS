---
version: alpha
name: POS WebApp
description: Design language for the Thai retail point-of-sale frontend.
colors:
  brand-50: "#eef2fc"
  brand-100: "#d5e0f7"
  brand-200: "#a9c0ee"
  brand-300: "#7098e3"
  brand-400: "#3b70d5"
  brand-500: "#1a52be"
  brand-600: "#0d42a3"
  brand-700: "#0A3D91"
  brand-800: "#08306f"
  brand-900: "#05204d"
  brand-950: "#02102a"
  background: "hsl(228 33% 96%)"
  foreground: "hsl(232 28% 18%)"
  card: "hsl(0 0% 100%)"
  card-foreground: "hsl(222 35% 12%)"
  border: "hsl(229 32% 91%)"
  input: "hsl(229 28% 86%)"
  primary: "hsl(232 61% 59%)"
  primary-foreground: "hsl(0 0% 100%)"
  secondary: "hsl(230 35% 94%)"
  secondary-foreground: "hsl(222 25% 22%)"
  muted: "hsl(230 28% 95%)"
  muted-foreground: "hsl(228 12% 45%)"
  accent: "hsl(232 43% 92%)"
  accent-foreground: "hsl(232 48% 38%)"
  destructive: "hsl(0 72% 48%)"
  destructive-foreground: "hsl(0 0% 100%)"
  ring: "hsl(232 61% 59%)"
rounded:
  lg: "1rem"
---

## Overview

POS WebApp เป็นหน้าร้านภาษาไทยสำหรับงานขาย สินค้า สต็อก ประวัติคำสั่งซื้อ รายงาน และการตั้งค่า โดยใช้พื้นหลังโทนอ่อนกับพื้นผิวโปร่งเบลอเพื่อแยกพื้นที่ทำงานที่มีข้อมูลหนาแน่น

## Colors

ใช้สี semantic สำหรับสถานะขององค์ประกอบ และใช้ชุด `brand` เมื่อต้องการระดับสี indigo ที่ละเอียดขึ้น สี `primary` ใช้กับ action หลัก สถานะ active และ focus ring ส่วน `destructive` ใช้กับ action หรือผลลัพธ์ที่เป็นอันตราย

พื้นผิวหลักใช้ `background` เป็นฐานและวาง card สีขาวโปร่งทับ พื้นหลังของ `body` มี radial gradients สี indigo, pink และ teal แบบคงที่ตลอด viewport

## Typography

ข้อความทั้งหมดใช้ `"IBM Plex Sans Thai"`, `"IBM Plex Sans"`, `"Sarabun"`, `system-ui`, `sans-serif` ตามลำดับ fallback ใช้น้ำหนัก `600` สำหรับชื่อหน้า ชื่อ card และ action หลัก

ตัวเลขในตารางใช้ tabular numerals ส่วน barcode ใช้ monospace เพื่อช่วยการสแกนแนวตั้ง

## Layout

หน้าหลักอยู่ใน container กว้างไม่เกิน `1600px` พร้อม padding ที่เพิ่มตาม viewport และระยะห่างแนวตั้งคงที่ระหว่าง section

ตั้งแต่ breakpoint `md` ใช้ sidebar แนวตั้งแบบ sticky กว้างคงที่ ด้าน mobile เปลี่ยนเป็น bottom navigation ที่ลอยเหนือ safe area

page header เรียงชื่อและคำอธิบายในแนวตั้งบนจอเล็ก และแยก title กับ actions คนละฝั่งเมื่อมีพื้นที่พอ ตารางต้องอยู่ใน horizontal overflow container เพื่อไม่บีบคอลัมน์ข้อมูล

## Elevation & Depth

surface, card, navigation และ dialog ใช้พื้นขาวโปร่ง ขอบขาวโปร่ง เงา indigo ความทึบต่ำ และ backdrop blur ร่วมกัน Dialog เพิ่มความทึบ ความเบลอ และระดับเงามากกว่า card เพื่อแสดงลำดับชั้น

## Shapes

ใช้รัศมี `lg` เป็นค่าหลักของ shared surface และ control ใช้ทรง pill สำหรับ badge และ control ที่เป็นวงกลมเท่านั้น

## Components

Button ใช้ `default` สำหรับ action หลัก, `destructive` สำหรับ action ลบ, `outline` สำหรับ action รองบน glass surface, `ghost` สำหรับ icon action และ `link` สำหรับ action แบบข้อความ ทุก variant ต้องคง focus ring และ disabled state จาก shared primitive

Input ใช้พื้นขาวโปร่งและขอบขาว โดยเพิ่มความทึบและ brand focus ring เมื่อ focus

Card และ `.surface` ใช้ glass treatment เดียวกัน ตารางใช้ header สีอ่อน ตัวเลขแบบ tabular และ hover ที่เพิ่มความทึบของแถว

Badge ใช้ pill shape และจับคู่สีตามความหมาย: brand สำหรับค่าเริ่มต้น, emerald สำหรับสำเร็จ, amber สำหรับเตือน และ red สำหรับผิดพลาดหรือหมด

Dialog ใช้ overlay สีเข้มโปร่งพร้อม blur เนื้อหาอยู่กึ่งกลาง viewport และวาง action footer แนวตั้งกลับลำดับบนจอเล็ก ก่อนเปลี่ยนเป็นแนวนอนชิดขวาบนจอใหญ่
