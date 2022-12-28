using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GaHrmOnSiteApi.Models;

namespace GaHrmOnSiteApi.Controllers
{
    [AllowAnonymous]
    [Produces("application/json")]
    [Route("api/[controller]")]
    [ApiController]
    public class ShiftByEmployeeController : ControllerBase
    {
        private readonly HRMOnSiteContext _context;
        public ShiftByEmployeeController(HRMOnSiteContext dbContext)
        {
            _context = dbContext;
        }


        // แสดงข้อมูล เอกสารขออนุมัติ เปลี่ยนแปลงเวลากะทำงาน
        [HttpPost]
        [Route("[action]")]
        public async Task<ActionResult<StatusMessage<List<Shift_By_Employee_Header>>>> GetShiftByDocument([FromBody] SelectShiftBydocumentParams parameters)
        {
            StatusMessage<List<Shift_By_Employee_Header>> result = new StatusMessage<List<Shift_By_Employee_Header>>();
            try
            {
                var recordset = await _context.Shift_By_Employee_Headers.Where(x => x.Side_Code == parameters.Side_Code
                && x.Branch_Code == parameters.Branch_Code
                && x.Department_Code == parameters.Department_Code).ToListAsync();

                result.success = true;
                result.data = recordset;
            }
            catch (Exception ex)
            {
                result.success = false;
                result.message = ex.Message;
            }
            return result;
        }



        // เปิดเอกสารขออนุมัติ เปลี่ยนกะทำงาน
        [HttpPost]
        [Route("[action]")]
        public async Task<ActionResult<StatusMessage<dynamic>>> AddShifDocument([FromBody] Add_Shift_By_EmployeeParams parameters)
        {
            StatusMessage<dynamic> result = new StatusMessage<dynamic>();

            try
            {
                var CheckDocumentShift = await _context.Shift_By_Employee_Headers.AsNoTracking().Where(x => x.Document_Number == parameters.Document_Number).FirstOrDefaultAsync();
                if (!Equals(CheckDocumentShift, null))
                {
                    throw new Exception("ไม่มีข้อมูลรหัสเอกสารใบนี้");
                }


                var dataarrShift = new Shift_By_Employee_Header();
                dataarrShift.Document_Number = parameters.Document_Number;
                dataarrShift.Document_Date = DateTime.Now;
                // dataarrShift.Document_By = parameters.Document_By;
                // dataarrShift.OptionCheck = '1';
                // dataarrShift.Side_Code = parameters.Side_Code;
                // dataarrShift.Side_Name = parameters.Side_Name;
                // dataarrShift.Branch_Code = parameters.Branch_Code;
                // dataarrShift.Branch_Name = parameters.Branch_Name;
                // dataarrShift.Department_Code = parameters.Department_Code;
                // dataarrShift.Department_Name = parameters.Department_Name;
                // dataarrShift.Date_Start = parameters.Date_Start;
                // dataarrShift.Date_End = parameters.Date_End;
                // dataarrShift.Shift_Code_New = parameters.Shift_Code_New;
                // dataarrShift.Shift_Name_New = parameters.Shift_Name_New;
                // dataarrShift.In1 = parameters.In1;
                // dataarrShift.Out1 = parameters.Out1;
                // dataarrShift.In2 = parameters.In2;
                // dataarrShift.Out2 = parameters.Out2;
                // dataarrShift.Approve_Chk = parameters.Approve_Chk;
                // dataarrShift.Approve_Code_Site = parameters.Approve_Code_Site;
                // dataarrShift.Approve_Name_Site = parameters.Approve_Name_Site;

                _context.Shift_By_Employee_Headers.Add(dataarrShift);
                await _context.SaveChangesAsync();

                result.data = null;
                result.success = true;
                result.message = string.Empty;
            }
            catch (Exception ex)
            {
                result.data = null;
                result.message = ex.Message;
                result.success = false;
            }
            return result;
        }

    }

}